import express from 'express';
import pool from '../../db.js';
import { Payment } from '../../models/Payment.js';

export const paymentsRouter = express.Router();

const ALLOWED_METHODS = ['card', 'cash', 'bank_transfer'];

/**
 * POST /api/payments
 * Создать запись об оплате заказа
 */
paymentsRouter.post('/', async (req, res) => {
  const { order_id, method } = req.body;

  if (!order_id || !method) {
    return res.status(400).json({ error: 'Необходимо указать order_id и method' });
  }

  if (!ALLOWED_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Некорректный способ оплаты' });
  }

  try {
    const [orderRows] = await pool.query(
      `SELECT o.id, c.price
       FROM orders o
       JOIN cars c ON o.car_id = c.id
       WHERE o.id = ?`,
      [order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const amount = orderRows[0].price;

    const [result] = await pool.query(
      `INSERT INTO payments (order_id, amount, payment_date, method, status)
       VALUES (?, ?, NOW(), ?, ?)`,
      [order_id, amount, method, 'paid']
    );

    const [paymentRows] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    const payment = Payment.fromRow(paymentRows[0]);

    res.status(201).json(payment);
  } catch (error) {
    console.error('Ошибка при создании оплаты:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании оплаты' });
  }
});


