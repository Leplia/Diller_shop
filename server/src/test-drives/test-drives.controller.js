import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { TestDrive } from '../../models/TestDrive.js';
import pool from '../../db.js';

export const testDrivesRouter = express.Router();
const db = new DatabaseManager();

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

