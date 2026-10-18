class Order {
  constructor(id, customer, items, couponCode, paymentMethod, installments) {
    this.id = id;
    this.customer = customer;
    this.items = items;
    this.couponCode = couponCode;
    this.paymentMethod = paymentMethod;
    this.installments = installments;
    this.status = "created";
    this.createdAt = new Date();
  }

  getTotalItems() {
    return this.items.reduce((total, item) => total + item.getQuantity(), 0);
  }

  getSubtotal() {
    return this.items.reduce((total, item) => total + item.getSubtotal(), 0);
  }

  getTotalWeight() {
    return this.items.reduce((total, item) => total + item.getTotalWeight(), 0);
  }

  getId() { return this.id; }
  getItems() { return this.items; }
  hasCustomer() { return Boolean(this.customer); }
  hasValidCustomerEmail() { return this.customer.hasValidEmail(); }
  hasItems() { return Boolean(this.items && this.items.length > 0); }
  getCustomerType() { return this.customer.getType(); }
  getCustomerContact() { return this.customer.getContact(); }
  getCustomerLocation() { return this.customer.getLocation(); }
  getDeliveryRegion() { return this.customer.getDeliveryRegion(); }
  getCouponCode() { return this.couponCode; }
  getPaymentMethod() { return this.paymentMethod; }
  getInstallments() { return this.installments; }

  applyPaymentStatus(paymentStatus) {
    this.status = paymentStatus === "approved" ? "confirmed" : "waiting_payment";
  }

  isConfirmed() { return this.status === "confirmed"; }

  createSummary({ subtotal, discount, freight, paymentFee, total }) {
    const contact = this.getCustomerContact();
    const location = this.getCustomerLocation();
    return {
      id: this.id,
      customerName: contact.name,
      customerEmail: contact.email,
      city: location.city,
      state: location.state,
      items: this.items.map((item) => item.toSummary()),
      subtotal,
      discount: Number(discount.toFixed(2)),
      freight: Number(freight.toFixed(2)),
      paymentFee: Number(paymentFee.toFixed(2)),
      total,
      paymentMethod: this.paymentMethod,
      status: this.status,
      createdAt: this.createdAt
    };
  }
}

module.exports = Order;
