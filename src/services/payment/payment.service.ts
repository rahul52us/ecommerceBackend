import PaymentRepository from "../../repository/payment/payment";

class PaymentService {
  async createPayment(paymentData: any) {
    return await PaymentRepository.createPayment(paymentData);
  }

  async getPayments(filters: any) {
    return await PaymentRepository.getPayments(filters);
  }

  async getPaymentById(id: string) {
    return await PaymentRepository.getPaymentById(id);
  }

  async updatePayment(id: string, updateData: any) {
    return await PaymentRepository.updatePayment(id, updateData);
  }

  async deletePayment(id: string) {
    return await PaymentRepository.deletePayment(id);
  }
}

export default new PaymentService();
