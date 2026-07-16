import PaymentModel from "../../schemas/payment/payment.schema";
import mongoose from "mongoose";

class PaymentRepository {
  async createPayment(paymentData: any) {
    const payment = new PaymentModel(paymentData);
    return await payment.save();
  }

  async getPayments(filters: any) {
    const { fromDate, toDate, patientIds, doctorIds, paymentMode, workDoneId } = filters;
    let query: any = {};

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (patientIds && patientIds.length > 0) {
      query.patient = { $in: patientIds };
    }

    if (paymentMode && paymentMode !== 'all') {
      query.paymentMethod = { $regex: new RegExp(`^${paymentMode}$`, 'i') };
    }

    if (workDoneId) {
      query.workDone = workDoneId;
    }

    // doctorIds filtering might require joining with WorkDone if doctor isn't in Payment schema,
    // but right now it's not strictly required unless filtering by doctor on the payment level.

    return await PaymentModel.find(query)
      .populate('patient')
      .populate('workDone')
      .populate('createdBy')
      .sort({ date: -1 });
  }

  async getPaymentById(id: string) {
    return await PaymentModel.findById(id);
  }

  async updatePayment(id: string, updateData: any) {
    return await PaymentModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deletePayment(id: string) {
    return await PaymentModel.findByIdAndDelete(id);
  }
}

export default new PaymentRepository();
