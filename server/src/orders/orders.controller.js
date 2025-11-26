import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { Order } from '../../models/Order.js';
import pool from '../../db.js';

export const ordersRouter = express.Router();
const db = new DatabaseManager();

/**
 * POST /api/orders
 * Создать новый заказ
 */
ordersRouter.post('/', async (req, res) => {
  const { user_id, car_id } = req.body;

  if (!user_id || !car_id) {
    return res.status(400).json({ error: 'Необходимо указать user_id и car_id' });
  }

  try {
    // Получаем статус "pending" (обычно это id = 1)
    const [statusRows] = await pool.query('SELECT id FROM order_statuses WHERE status_name = ?', ['pending']);
    
    if (statusRows.length === 0) {
      return res.status(500).json({ error: 'Статус заказа не найден' });
    }

    const status_id = statusRows[0].id;

    // Создаем заказ
    const [result] = await pool.query(
      'INSERT INTO orders (user_id, car_id, status_id) VALUES (?, ?, ?)',
      [user_id, car_id, status_id]
    );

    // Получаем созданный заказ
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    const order = Order.fromRow(orderRows[0]);

    res.status(201).json(order);
  } catch (error) {
    console.error('Ошибка при создании заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании заказа' });
  }
});

