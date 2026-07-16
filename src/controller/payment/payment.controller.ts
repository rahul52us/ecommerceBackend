import PaymentService from "../../services/payment/payment.service";
import { createReceipt } from "../../repository/receipt/receipt.repository";

class PaymentController {
  async createPayment(req: any, res: any) {
    try {
      let receiptNumber = "N/A";
      
      // Generate a receipt immediately upon payment creation
      if (req.body.workDone && req.body.company) {
        const receiptResult = await createReceipt({
          patient: req.body.patient,
          workDone: req.body.workDone,
          company: req.body.company,
          generatedBy: req.userId,
          type: "payment"
        });
        receiptNumber = receiptResult?.data?.receiptNumber || "N/A";
      }

      const paymentData = {
        ...req.body,
        receiptNumber: receiptNumber,
        createdBy: req.userId,
      };
      
      const newPayment = await PaymentService.createPayment(paymentData);

      // Now we need to update the workDone's receivedAmount by fetching all payments
      const payments = await PaymentService.getPayments({ workDoneId: paymentData.workDone });
      const totalReceived = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

      // We should ideally call an internal WorkDone update here to update receivedAmount.
      // But since we decoupled paymentHistory, we can just update receivedAmount.
      const WorkDoneModel = require("../../schemas/workDone/workDone.schema").default;
      const AccountabilityModel = require("../../schemas/accountability/accountability.schema").default;
      
      const workDoneData = await WorkDoneModel.findByIdAndUpdate(paymentData.workDone, {
        $set: { receivedAmount: totalReceived, updateLastAccountbilityDate: new Date() }
      }, { new: true });

      const bill = (workDoneData?.amount || 0) - (workDoneData?.discount || 0);
      const statusStr = totalReceived >= bill ? "PAID" : "PENDING";

      await AccountabilityModel.findOneAndUpdate({ workDone: paymentData.workDone }, {
        $set: { 
          doctorShareAmount: totalReceived, 
          lastAccountabilityAmountUpdated: new Date(),
          payoutStatus: statusStr
        }
      });

      return res.status(201).json({
        success: true,
        message: "Payment added successfully",
        data: newPayment
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPayments(req: any, res: any) {
    try {
      const payments = await PaymentService.getPayments(req.query);
      return res.status(200).json({
        success: true,
        data: payments
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updatePayment(req: any, res: any) {
    try {
      const updatedPayment = await PaymentService.updatePayment(req.params.id, req.body);
      
      if (updatedPayment) {
        // Update total receivedAmount
        const payments = await PaymentService.getPayments({ workDoneId: updatedPayment.workDone });
        const totalReceived = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        
        const WorkDoneModel = require("../../schemas/workDone/workDone.schema").default;
        const AccountabilityModel = require("../../schemas/accountability/accountability.schema").default;
        
        const workDoneData = await WorkDoneModel.findByIdAndUpdate(updatedPayment.workDone, {
          $set: { receivedAmount: totalReceived, updateLastAccountbilityDate: new Date() }
        }, { new: true });

        const bill = (workDoneData?.amount || 0) - (workDoneData?.discount || 0);
        const statusStr = totalReceived >= bill ? "PAID" : "PENDING";

        await AccountabilityModel.findOneAndUpdate({ workDone: updatedPayment.workDone }, {
          $set: { 
            doctorShareAmount: totalReceived, 
            lastAccountabilityAmountUpdated: new Date(),
            payoutStatus: statusStr
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment updated successfully",
        data: updatedPayment
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deletePayment(req: any, res: any) {
    try {
      const paymentId = req.params.id;
      const paymentToDel = await PaymentService.getPaymentById(paymentId);
      if (!paymentToDel) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      const workDoneId = paymentToDel.workDone;
      await PaymentService.deletePayment(paymentId);

      // Update total receivedAmount
      const payments = await PaymentService.getPayments({ workDoneId: workDoneId });
      const totalReceived = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      
      const WorkDoneModel = require("../../schemas/workDone/workDone.schema").default;
      const AccountabilityModel = require("../../schemas/accountability/accountability.schema").default;
      
      const workDoneData = await WorkDoneModel.findByIdAndUpdate(workDoneId, {
        $set: { receivedAmount: totalReceived, updateLastAccountbilityDate: new Date() }
      }, { new: true });

      const bill = (workDoneData?.amount || 0) - (workDoneData?.discount || 0);
      const statusStr = totalReceived >= bill ? "PAID" : "PENDING";

      await AccountabilityModel.findOneAndUpdate({ workDone: workDoneId }, {
        $set: { 
          doctorShareAmount: totalReceived, 
          lastAccountabilityAmountUpdated: new Date(),
          payoutStatus: statusStr
        }
      });

      return res.status(200).json({
        success: true,
        message: "Payment deleted successfully"
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default new PaymentController();
