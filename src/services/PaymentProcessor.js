class PaymentProcessor {
  /** @param {Object.<string, import('../contracts').PaymentMethod>} methods */
  constructor(methods) { this.methods = new Map(Object.entries(methods)); }

  process(order, subtotal) {
    const method = this.methods.get(order.getPaymentMethod());
    if (!method) throw new Error("Forma de pagamento invalida.");
    return method.process(subtotal, order.getInstallments());
  }
}

module.exports = PaymentProcessor;
