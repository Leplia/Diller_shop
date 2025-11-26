export class Role {
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }

  static fromRow(row) {
    return new Role(row);
  }
}
