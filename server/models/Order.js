export class Order {
  constructor({ id, user_id, car_id, order_date, status_id }) {
    this.id = id;
    this.user_id = user_id;
    this.car_id = car_id;
    this.order_date = order_date;
    this.status_id = status_id;
  }

  static fromRow(row) {
    return new Order(row);
  }
}
