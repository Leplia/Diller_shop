export class Dealer {
  constructor({ id, name, address, phone, email }) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.email = email;
  }

  static fromRow(row) {
    return new Dealer(row);
  }
}
