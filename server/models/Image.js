export class Image {
  constructor({ id, car_id, image_url, description }) {
    this.id = id;
    this.car_id = car_id;
    this.image_url = image_url;
    this.description = description;
  }

  static fromRow(row) {
    return new Image(row);
  }
}
