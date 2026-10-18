class Customer {
  constructor(id, name, email, phone, type, address) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.type = type;
    this.address = address;
  }

  hasValidEmail() { return Boolean(this.email && this.email.includes("@")); }
  getType() { return this.type; }
  getContact() { return { name: this.name, email: this.email }; }
  getDeliveryRegion() { return this.address.getRegion(); }
  getLocation() { return this.address.getLocation(); }
}

module.exports = Customer;
