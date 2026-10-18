class BoletoPayment {
  process() { return { status: "waiting_payment", fee: 0, discount: 0 }; }
}

module.exports = BoletoPayment;
