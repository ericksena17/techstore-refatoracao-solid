class FreightCalculator {
  constructor(rates = {
    sudeste: { base: 20, perKg: 4 },
    sul: { base: 28, perKg: 5 },
    "centro-oeste": { base: 35, perKg: 6 },
    nordeste: { base: 45, perKg: 7 },
    norte: { base: 60, perKg: 9 }
  }, fallback = { base: 50, perKg: 8 }, freeCoupons = ["FRETEGRATIS"]) {
    this.rates = new Map(Object.entries(rates));
    this.fallback = fallback;
    this.freeCoupons = new Set(freeCoupons);
  }

  calculate(order) {
    const rate = this.rates.get(order.getDeliveryRegion()) ?? this.fallback;
    const freight = rate.base + order.getTotalWeight() * rate.perKg;
    return this.freeCoupons.has(order.getCouponCode()) ? 0 : freight;
  }
}

module.exports = FreightCalculator;
