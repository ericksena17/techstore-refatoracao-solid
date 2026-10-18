class CreditCardPayment {
  process(subtotal, installments) {
    return { status: "approved", fee: installments > 1 ? subtotal * 0.025 : 0, discount: 0 };
  }
}

module.exports = CreditCardPayment;
