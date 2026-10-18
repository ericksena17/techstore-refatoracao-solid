class OrderItem {
  constructor(product, quantity) {
    this.product = product;
    this.quantity = quantity;
  }

  getSubtotal() {
    return this.product.price * this.quantity;
  }

  hasProduct() { return Boolean(this.product); }
  getProductId() { return this.product.id; }
  getQuantity() { return this.quantity; }
  getTotalWeight() { return this.product.weight * this.quantity; }

  toSummary() {
    return {
      productId: this.getProductId(),
      name: this.product.name,
      quantity: this.quantity,
      subtotal: this.getSubtotal()
    };
  }
}

module.exports = OrderItem;
