import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { Review } from '../../models/Review.js';
import pool from '../../db.js';

export const reviewsRouter = express.Router();
const db = new DatabaseManager();

/**
 * POST /api/reviews
 * Создать новый отзыв
 */
reviewsRouter.post('/', async (req, res) => {
  const { user_id, car_id, rating, comment } = req.body;

  if (!user_id || !car_id || !rating) {
    return res.status(400).json({ error: 'Необходимо указать user_id, car_id и rating' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, car_id, rating, comment) VALUES (?, ?, ?, ?)',
      [user_id, car_id, rating, comment || '']
    );

    // Получаем созданный отзыв
    const [reviewRows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    const review = Review.fromRow(reviewRows[0]);

    res.status(201).json(review);
  } catch (error) {
    console.error('Ошибка при создании отзыва:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании отзыва' });
  }
});

/**
 * GET /api/reviews/best
 * Получить лучшие отзывы (с рейтингом 4-5, отсортированные по дате)
 */
reviewsRouter.get('/best', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const query = `
      SELECT 
        r.*,
        u.name as user_name,
        c.brand,
        c.model
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN cars c ON r.car_id = c.id
      WHERE r.rating >= 4
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT ?
    `;
    
    const rows = await db.query(query, [limit]);
    
    const reviews = rows.map(row => {
      const review = Review.fromRow(row);
      return {
        ...review,
        user_name: row.user_name,
        car_brand: row.brand,
        car_model: row.model
      };
    });
    
    res.json(reviews);
  } catch (error) {
    console.error('Ошибка при получении лучших отзывов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении лучших отзывов' });
  }
});




