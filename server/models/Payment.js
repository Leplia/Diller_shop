export class Payment {
  constructor({ id, order_id, amount, payment_date, method, status }) {
    this.id = id;
    this.order_id = order_id;
    this.amount = amount;
    this.payment_date = payment_date;
    this.method = method;
    this.status = status;
  }

  static fromRow(row) {
    return new Payment(row);
  }
}
