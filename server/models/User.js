export class User {
  constructor(id, name, email, password, role_id, is_blocked) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role_id = role_id;
    this.is_blocked = is_blocked;
  }

  static fromRow(row) {
    return new User(row.id, row.name, row.email, row.password, row.role_id, row.is_blocked);
  }

  isAdmin() {
    return this.role_id === 1;
  }

  toSafeJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role_id: this.role_id,
      is_blocked: this.is_blocked
    };
  }
}
