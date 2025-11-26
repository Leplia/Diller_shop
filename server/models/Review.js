export class Review {
  constructor({ id, user_id, car_id, rating, comment, created_at }) {
    this.id = id;
    this.user_id = user_id;
    this.car_id = car_id;
    this.rating = rating;
    this.comment = comment;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new Review(row);
  }
}
