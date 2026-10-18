class OrderRepository {
  constructor() {
    this.orders = [];
  }

  save(orderSummary) {
    this.orders.push(orderSummary);
    return orderSummary;
  }

  findAll() {
    return this.orders;
  }
}

module.exports = OrderRepository;
