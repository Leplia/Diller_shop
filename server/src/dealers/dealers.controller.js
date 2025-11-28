import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { Dealer } from '../../models/Dealer.js';
import pool from '../../db.js';

export const dealersRouter = express.Router();
const db = new DatabaseManager();

/**
 * GET /api/dealers
 * Получить всех дилеров
 */
dealersRouter.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM dealers ORDER BY name');
    const dealers = rows.map(row => Dealer.fromRow(row));
    res.json(dealers);
  } catch (error) {
    console.error('Ошибка при получении дилеров:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении дилеров' });
  }
});

/**
 * POST /api/dealers
 * Создать нового дилера
 */
dealersRouter.post('/', async (req, res) => {
  const { name, address, phone, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Необходимо указать имя дилера' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO dealers (name, address, phone, email) VALUES (?, ?, ?, ?)',
      [name, address || null, phone || null, email || null]
    );

    const [dealerRows] = await pool.query('SELECT * FROM dealers WHERE id = ?', [result.insertId]);
    const dealer = Dealer.fromRow(dealerRows[0]);

    res.status(201).json(dealer);
  } catch (error) {
    console.error('Ошибка при создании дилера:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании дилера' });
  }
});

/**
 * DELETE /api/dealers/:id
 * Удалить дилера
 */
dealersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Проверяем, используется ли дилер в заказах
    const [carsRows] = await pool.query('SELECT COUNT(*) as count FROM cars WHERE dealer_id = ?', [id]);
    if (carsRows[0].count > 0) {
      return res.status(400).json({ error: 'Невозможно удалить дилера, так как он используется в каталоге автомобилей' });
    }

    const [result] = await pool.query('DELETE FROM dealers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Дилер не найден' });
    }

    res.json({ message: 'Дилер успешно удалён' });
  } catch (error) {
    console.error('Ошибка при удалении дилера:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении дилера' });
  }
});

