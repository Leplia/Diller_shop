export class TestDrive {
  constructor({ id, user_id, car_id, scheduled_date, status }) {
    this.id = id;
    this.user_id = user_id;
    this.car_id = car_id;
    this.scheduled_date = scheduled_date;
    this.status = status;
  }

  static fromRow(row) {
    return new TestDrive(row);
  }
}
