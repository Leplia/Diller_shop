import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { TestDrive } from '../../models/TestDrive.js';
import pool from '../../db.js';

export const testDrivesRouter = express.Router();
const db = new DatabaseManager();

/**
 * GET /api/test-drives
 * Получить все тест-драйвы (для менеджера)
 */
testDrivesRouter.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        td.id,
        td.user_id,
        td.car_id,
        td.scheduled_date,
        td.status,
        u.name as user_name,
        u.email as user_email,
        c.brand,
        c.model,
        c.year,
        c.price
      FROM test_drives td
      LEFT JOIN users u ON td.user_id = u.id
      LEFT JOIN cars c ON td.car_id = c.id
      ORDER BY td.scheduled_date DESC
    `;
    
    const rows = await db.query(query);
    
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при получении тест-драйвов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении тест-драйвов' });
  }
});

/**
 * POST /api/test-drives
 * Создать запись на тест-драйв
 */
testDrivesRouter.post('/', async (req, res) => {
  const { user_id, car_id, scheduled_date } = req.body;

  if (!user_id || !car_id || !scheduled_date) {
    return res.status(400).json({ error: 'Необходимо указать user_id, car_id и scheduled_date' });
  }

  try {
    // Создаем запись на тест-драйв
    const [result] = await pool.query(
      'INSERT INTO test_drives (user_id, car_id, scheduled_date, status) VALUES (?, ?, ?, ?)',
      [user_id, car_id, scheduled_date, 'pending']
    );

    // Получаем созданную запись
    const [testDriveRows] = await pool.query('SELECT * FROM test_drives WHERE id = ?', [result.insertId]);
    const testDrive = TestDrive.fromRow(testDriveRows[0]);

    res.status(201).json(testDrive);
  } catch (error) {
    console.error('Ошибка при создании записи на тест-драйв:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании записи на тест-драйв' });
  }
});

/**
 * PATCH /api/test-drives/:id/status
 * Обновить статус тест-драйва
 */
testDrivesRouter.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Необходимо указать статус' });
  }

  const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Недопустимый статус. Разрешены: ${allowedStatuses.join(', ')}` });
  }

  try {
    // Обновляем статус тест-драйва
    await pool.query('UPDATE test_drives SET status = ? WHERE id = ?', [status, id]);

    // Получаем обновленный тест-драйв
    const query = `
      SELECT 
        td.id,
        td.user_id,
        td.car_id,
        td.scheduled_date,
        td.status,
        u.name as user_name,
        u.email as user_email,
        c.brand,
        c.model,
        c.year,
        c.price
      FROM test_drives td
      LEFT JOIN users u ON td.user_id = u.id
      LEFT JOIN cars c ON td.car_id = c.id
      WHERE td.id = ?
    `;
    
    const [testDriveRows] = await pool.query(query, [id]);
    
    if (testDriveRows.length === 0) {
      return res.status(404).json({ error: 'Тест-драйв не найден' });
    }

    res.json(testDriveRows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении статуса тест-драйва:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении статуса тест-драйва' });
  }
});

