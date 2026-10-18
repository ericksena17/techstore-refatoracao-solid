class DiscountCalculator {
  /** @param {import('../contracts').DiscountRule[]} rules */
  constructor(rules) { this.rules = rules; }

  calculate(order, subtotal) {
    return this.rules.reduce((discount, rule) => discount + rule.calculate(order, subtotal), 0);
  }
}

module.exports = DiscountCalculator;
