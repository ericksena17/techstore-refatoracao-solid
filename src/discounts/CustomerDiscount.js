class CustomerDiscount {
  constructor(rates = { vip: 0.08, employee: 0.15 }) {
    this.rates = new Map(Object.entries(rates));
  }

  calculate(order, subtotal) {
    return subtotal * (this.rates.get(order.getCustomerType()) ?? 0);
  }
}

module.exports = CustomerDiscount;
