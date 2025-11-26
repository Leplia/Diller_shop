export class VehicleType {
  constructor({ id, type_name }) {
    this.id = id;
    this.type_name = type_name;
  }

  static fromRow(row) {
    return new VehicleType(row);
  }
}
