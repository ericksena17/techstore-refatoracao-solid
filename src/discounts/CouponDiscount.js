class CouponDiscount {
  constructor(rates = { TECH10: 0.1 }) { this.rates = new Map(Object.entries(rates)); }

  calculate(order, subtotal) {
    return subtotal * (this.rates.get(order.getCouponCode()) ?? 0);
  }
}

module.exports = CouponDiscount;
