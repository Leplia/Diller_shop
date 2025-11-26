import express from 'express';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { FAQ } from '../../models/FAQ.js';
import pool from '../../db.js';

export const faqRouter = express.Router();
const db = new DatabaseManager();

/**
 * POST /api/faq
 * Создать новый вопрос
 */
faqRouter.post('/', async (req, res) => {
  const { theme, question, user_id } = req.body;

  if (!theme || !question) {
    return res.status(400).json({ error: 'Необходимо указать theme и question' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO faq (question, theme, status, user_id) VALUES (?, ?, ?, ?)',
      [question, theme, 'pending', user_id || null]
    );

    // Получаем созданный вопрос
    const [faqRows] = await pool.query('SELECT * FROM faq WHERE id = ?', [result.insertId]);
    const faq = FAQ.fromRow(faqRows[0]);

    res.status(201).json(faq);
  } catch (error) {
    console.error('Ошибка при создании вопроса:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании вопроса' });
  }
});

/**
 * GET /api/faq
 * Получить все вопросы (для менеджера)
 * Сортировка: сначала pending, затем по дате создания (старые выше)
 */
faqRouter.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        f.*,
        u.name as user_name,
        u.email as user_email
      FROM faq f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY 
        CASE WHEN f.status = 'pending' THEN 0 ELSE 1 END,
        f.created_at ASC
    `;
    
    const rows = await db.query(query);
    
    const faqs = rows.map(row => {
      const faq = FAQ.fromRow(row);
      return {
        ...faq,
        user_name: row.user_name,
        user_email: row.user_email
      };
    });
    
    res.json(faqs);
  } catch (error) {
    console.error('Ошибка при получении вопросов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении вопросов' });
  }
});

/**
 * GET /api/faq/user/:user_id
 * Получить вопросы конкретного пользователя
 */
faqRouter.get('/user/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        f.*,
        u.name as user_name,
        u.email as user_email
      FROM faq f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT 10
    `;
    
    const rows = await db.query(query, [user_id]);
    
    const faqs = rows.map(row => {
      const faq = FAQ.fromRow(row);
      return {
        ...faq,
        user_name: row.user_name,
        user_email: row.user_email
      };
    });
    
    res.json(faqs);
  } catch (error) {
    console.error('Ошибка при получении вопросов пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении вопросов пользователя' });
  }
});

/**
 * PATCH /api/faq/:id
 * Обновить ответ на вопрос (для менеджера)
 */
faqRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { answer, status } = req.body;

  if (!answer) {
    return res.status(400).json({ error: 'Необходимо указать answer' });
  }

  try {
    const updateStatus = status || 'answered';
    
    const [result] = await pool.query(
      'UPDATE faq SET answer = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [answer, updateStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }

    // Получаем обновленный вопрос
    const [faqRows] = await pool.query('SELECT * FROM faq WHERE id = ?', [id]);
    const faq = FAQ.fromRow(faqRows[0]);

    res.json(faq);
  } catch (error) {
    console.error('Ошибка при обновлении вопроса:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении вопроса' });
  }
});



