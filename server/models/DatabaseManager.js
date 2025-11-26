import pool from '../db.js';
import { Car } from './Car.js';
import { User } from './User.js';

export class DatabaseManager {
  async query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async getAllCars() {
    const rows = await this.query('SELECT * FROM cars');
    return rows.map(Car.fromRow);
  }

  async getUserByEmail(email) {
    const rows = await this.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows.length ? User.fromRow(rows[0]) : null;
  }

  async addUser({ name, email, passwordHash, role_id }) {
    const result = await this.query(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role_id]
    );
    return result.insertId;
  }
  async beginTransaction() {
    await this.connection.beginTransaction();
  }

  /**
   * Подтвердить транзакцию
   */
  async commit() {
    await this.connection.commit();
  }

  /**
   * Откатить транзакцию
   */
  async rollback() {
    await this.connection.rollback();
  }
}
