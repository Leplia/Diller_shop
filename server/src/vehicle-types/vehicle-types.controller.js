import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { VehicleType } from '../../models/VehicleType.js';
import pool from '../../db.js';

export const vehicleTypesRouter = express.Router();
const db = new DatabaseManager();

/**
 * GET /api/vehicle-types
 * Получить все типы кузова
 */
vehicleTypesRouter.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM vehicle_types ORDER BY type_name');
    const types = rows.map(row => VehicleType.fromRow(row));
    res.json(types);
  } catch (error) {
    console.error('Ошибка при получении типов кузова:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении типов кузова' });
  }
});

/**
 * POST /api/vehicle-types
 * Создать новый тип кузова
 */
vehicleTypesRouter.post('/', async (req, res) => {
  const { type_name } = req.body;

  if (!type_name) {
    return res.status(400).json({ error: 'Необходимо указать название типа кузова' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO vehicle_types (type_name) VALUES (?)',
      [type_name]
    );

    const [typeRows] = await pool.query('SELECT * FROM vehicle_types WHERE id = ?', [result.insertId]);
    const type = VehicleType.fromRow(typeRows[0]);

    res.status(201).json(type);
  } catch (error) {
    console.error('Ошибка при создании типа кузова:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Тип кузова с таким названием уже существует' });
    }
    res.status(500).json({ error: 'Ошибка сервера при создании типа кузова' });
  }
});

/**
 * DELETE /api/vehicle-types/:id
 * Удалить тип кузова
 */
vehicleTypesRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Проверяем, используется ли тип в автомобилях
    const [carsRows] = await pool.query('SELECT COUNT(*) as count FROM cars WHERE type_id = ?', [id]);
    if (carsRows[0].count > 0) {
      return res.status(400).json({ error: 'Невозможно удалить тип кузова, так как он используется в каталоге автомобилей' });
    }

    const [result] = await pool.query('DELETE FROM vehicle_types WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Тип кузова не найден' });
    }

    res.json({ message: 'Тип кузова успешно удалён' });
  } catch (error) {
    console.error('Ошибка при удалении типа кузова:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении типа кузова' });
  }
});

