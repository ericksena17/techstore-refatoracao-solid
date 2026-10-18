class VolumeDiscount {
  constructor(threshold = 8000, amount = 250) {
    this.threshold = threshold;
    this.amount = amount;
  }

  calculate(order, subtotal) { return subtotal > this.threshold ? this.amount : 0; }
}

module.exports = VolumeDiscount;
