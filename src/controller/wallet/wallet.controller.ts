import { Request, Response } from "express";
import WalletTransaction from "../../schemas/wallet/WalletTransaction";
import User from "../../schemas/User/User";
import WorkDone from "../../schemas/workDone/workDone.schema";
import Payment from "../../schemas/payment/payment.schema";

export const transferAdvanceToWallet = async (req: Request, res: Response) => {
  try {
    const { workDoneId, amount } = req.body;
    // @ts-ignore
    const createdBy = req.userId;

    if (!workDoneId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid workDoneId and amount are required." });
    }

    const workDone = await WorkDone.findById(workDoneId).populate("patient");
    if (!workDone) {
      return res.status(404).json({ success: false, message: "Treatment not found." });
    }

    const bill = (workDone.amount || 0) - (workDone.discount || 0);
    const balanceDue = bill - (workDone.receivedAmount || 0);

    // Verify if workDone actually has an advance (negative balance)
    if (balanceDue >= 0 || Math.abs(balanceDue) < amount) {
      return res.status(400).json({ success: false, message: "Requested transfer amount exceeds available advance for this treatment." });
    }

    // 1. Create a negative payment to settle the overpaid treatment
    const patientId = (workDone.patient as any)._id || workDone.patient;

    const negativePayment = new Payment({
      patient: patientId,
      company: workDone.company,
      workDone: workDone._id,
      amount: -amount, // Negative amount removes the overpayment
      paymentMethod: "Transferred to Wallet",
      createdBy,
      date: new Date(),
    });
    await negativePayment.save();

    // 2. Adjust workDone paid amount
    const newTotalReceived = (workDone.receivedAmount || 0) - amount;
    workDone.receivedAmount = newTotalReceived;

    // Save workDone without triggering unnecessary hooks if possible, or just normal save
    await workDone.save();

    // 2.5 Update Accountability to match
    const AccountabilityModel = require("../../schemas/accountability/accountability.schema").default;
    const newStatusStr = newTotalReceived >= bill ? "PAID" : "PENDING";

    await AccountabilityModel.findOneAndUpdate({ workDone: workDone._id }, {
      $set: {
        doctorShareAmount: newTotalReceived,
        lastAccountabilityAmountUpdated: new Date(),
        payoutStatus: newStatusStr
      }
    });

    // 3. Add to Patient's Wallet Balance
    const patientUser = await User.findById(patientId);
    if (!patientUser) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    patientUser.walletBalance = (patientUser.walletBalance || 0) + amount;
    await patientUser.save();

    // 4. Record the Wallet Transaction
    const walletTxn = new WalletTransaction({
      patient: patientId,
      amount: amount,
      type: "Deposit",
      description: "Advance transferred from treatment",
      workDone: workDone._id,
      company: workDone.company,
      createdBy,
    });
    await walletTxn.save();

    res.status(200).json({
      success: true,
      message: "Advance successfully transferred to wallet.",
      walletBalance: patientUser.walletBalance,
      workDone
    });
  } catch (error: any) {
    console.error("Error transferring to wallet:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

export const getPatientWalletHistory = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const patientUser = await User.findById(patientId);
    if (!patientUser) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    const history = await WalletTransaction.find({ patient: patientId })
      .populate("workDone", "createdAt")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      walletBalance: patientUser.walletBalance || 0,
      history
    });
  } catch (error: any) {
    console.error("Error fetching wallet history:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

export const addManualCreditToWallet = async (req: any, res: any) => {
  try {
    const { patientId, amount, description, company } = req.body;
    // @ts-ignore
    const createdBy = req.userId;

    if (!patientId || !amount || amount <= 0 || !company) {
      return res.status(400).json({ success: false, message: "Valid patientId, company, and amount are required." });
    }

    const patientUser = await User.findById(patientId);
    if (!patientUser) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    // Add to Patient's Wallet Balance
    patientUser.walletBalance = (patientUser.walletBalance || 0) + amount;
    await patientUser.save();

    // Record the Wallet Transaction
    const walletTxn = new WalletTransaction({
      patient: patientId,
      company: company,
      amount: amount,
      type: "Deposit",
      description: description || "Manual Credit Added",
      createdBy,
    });
    await walletTxn.save();

    res.status(200).json({
      success: true,
      message: "Credit successfully added to wallet.",
      walletBalance: patientUser.walletBalance,
      transaction: walletTxn
    });
  } catch (error: any) {
    console.error("Error adding manual credit to wallet:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

export const deductManualCreditFromWallet = async (req: any, res: any) => {
  try {
    const { patientId, amount, description, company } = req.body;
    // @ts-ignore
    const createdBy = req.userId;

    if (!patientId || !amount || amount <= 0 || !company) {
      return res.status(400).json({ success: false, message: "Valid patientId, company, and amount are required." });
    }

    if (!description || description.trim() === "") {
      return res.status(400).json({ success: false, message: "Description is mandatory for deductions." });
    }

    const patientUser = await User.findById(patientId);
    if (!patientUser) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    if ((patientUser.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
    }

    // Deduct from Patient's Wallet Balance
    patientUser.walletBalance = (patientUser.walletBalance || 0) - amount;
    await patientUser.save();

    // Record the Wallet Transaction
    const walletTxn = new WalletTransaction({
      patient: patientId,
      company: company,
      amount: amount,
      type: "Withdrawal",
      description: description,
      createdBy,
    });
    await walletTxn.save();

    res.status(200).json({
      success: true,
      message: "Credit successfully deducted from wallet.",
      walletBalance: patientUser.walletBalance,
      transaction: walletTxn
    });
  } catch (error: any) {
    console.error("Error deducting manual credit from wallet:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};
