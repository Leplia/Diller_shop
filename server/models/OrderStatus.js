export class OrderStatus {
  constructor({ id, status_name }) {
    this.id = id;
    this.status_name = status_name;
  }

  static fromRow(row) {
    return new OrderStatus(row);
  }
}
