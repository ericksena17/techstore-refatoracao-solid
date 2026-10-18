class PixPayment {
  process(subtotal) { return { status: "approved", fee: 0, discount: subtotal * 0.03 }; }
}

module.exports = PixPayment;
