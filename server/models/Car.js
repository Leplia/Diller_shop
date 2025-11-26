export class Car {
  constructor({ id, brand, model, year, price, dealer_id, type_id }) {
    this.id = id;
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.price = price;
    this.dealer_id = dealer_id;
    this.type_id = type_id;
  }

  static fromRow(row) {
    return new Car(row);
  }
}
