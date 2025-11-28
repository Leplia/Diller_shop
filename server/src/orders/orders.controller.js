import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { Order } from '../../models/Order.js';
import pool from '../../db.js';

export const ordersRouter = express.Router();
const db = new DatabaseManager();

/**
 * GET /api/orders
 * Получить все заказы (для менеджера)
 */
ordersRouter.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id,
        o.order_date,
        o.user_id,
        o.car_id,
        os.status_name as status,
        u.name as user_name,
        u.email as user_email,
        c.brand,
        c.model,
        c.year,
        c.price,
        p.amount as payment_amount,
        p.method as payment_method,
        p.status as payment_status
      FROM orders o
      LEFT JOIN order_statuses os ON o.status_id = os.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN cars c ON o.car_id = c.id
      LEFT JOIN payments p ON o.id = p.order_id
      ORDER BY o.order_date DESC
    `;
    
    const rows = await db.query(query);
    
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении заказов' });
  }
});

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

/**
 * PATCH /api/orders/:id/status
 * Обновить статус заказа
 */
ordersRouter.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Необходимо указать статус' });
  }

  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Недопустимый статус. Разрешены: ${allowedStatuses.join(', ')}` });
  }

  try {
    // Получаем ID статуса
    const [statusRows] = await pool.query('SELECT id FROM order_statuses WHERE status_name = ?', [status]);
    
    if (statusRows.length === 0) {
      return res.status(400).json({ error: 'Статус не найден' });
    }

    const status_id = statusRows[0].id;

    // Обновляем статус заказа
    await pool.query('UPDATE orders SET status_id = ? WHERE id = ?', [status_id, id]);

    // Получаем обновленный заказ
    const query = `
      SELECT 
        o.id,
        o.order_date,
        o.user_id,
        o.car_id,
        os.status_name as status,
        u.name as user_name,
        u.email as user_email,
        c.brand,
        c.model,
        c.year,
        c.price,
        p.amount as payment_amount,
        p.method as payment_method,
        p.status as payment_status
      FROM orders o
      LEFT JOIN order_statuses os ON o.status_id = os.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN cars c ON o.car_id = c.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.id = ?
    `;
    
    const [orderRows] = await pool.query(query, [id]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(orderRows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении статуса заказа' });
  }
});

