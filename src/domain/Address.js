class Address {
  constructor(street, number, city, state, zipCode, region) {
    this.street = street;
    this.number = number;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.region = region;
  }

  getRegion() { return this.region; }
  getLocation() { return { city: this.city, state: this.state }; }
}

module.exports = Address;
