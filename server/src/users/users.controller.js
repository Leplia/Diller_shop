import express from 'express';
import { loginUser, registerUser } from './users.service.js';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import pool from '../../db.js';

export const usersRouter = express.Router();
const db = new DatabaseManager();

usersRouter.post('/login', async (req, res) => {
  console.log('Запрос на /login:', req.body);
  const { email, password } = req.body;
  
  try {
    // Валидация обязательных полей
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const result = await loginUser(email, password);
    
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    res.json({ 
      user: result.user,
      message: result.message 
    });
  } catch (err) {
    console.error('Ошибка контроллера /login:', err);
    res.status(500).json({ error: err.message });
  }
});

usersRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  console.log('Запрос на /register:', { name, email, password: '***' });

  try {
    // Валидация обязательных полей
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    const result = await registerUser(name, email, password);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ 
      user: result.user, 
      message: result.message 
    });
  } catch (err) {
    console.error('Ошибка контроллера /register:', err);
    res.status(500).json({ error: err.message });
  }
});

// Дополнительный endpoint для проверки существования email
usersRouter.post('/check-email', async (req, res) => {
  const { email } = req.body;
  
  try {
    const existing = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    res.json({ exists: existing.length > 0 });
  } catch (err) {
    console.error('Ошибка при проверке email:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить всех пользователей (для панели системного администратора)
usersRouter.get('/', async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT id, name, email, role_id, COALESCE(is_blocked, 0) as is_blocked FROM users ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении списка пользователей:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении пользователей' });
  }
});

// Блокировка / разблокировка пользователя
usersRouter.patch('/:id/block', async (req, res) => {
  const { id } = req.params;
  const { block } = req.body;

  if (typeof block !== 'boolean') {
    return res.status(400).json({ error: 'Поле "block" должно быть true или false' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET is_blocked = ? WHERE id = ?',
      [block ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: block ? 'Пользователь заблокирован' : 'Пользователь разблокирован' });
  } catch (err) {
    console.error('Ошибка при изменении статуса блокировки пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при изменении блокировки пользователя' });
  }
});

// Изменение роли пользователя
usersRouter.patch('/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;

  if (![1, 2, 3].includes(Number(role_id))) {
    return res.status(400).json({ error: 'Некорректная роль' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET role_id = ? WHERE id = ?',
      [role_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Роль пользователя обновлена' });
  } catch (err) {
    console.error('Ошибка при изменении роли пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при изменении роли пользователя' });
  }
});

// Удаление пользователя
usersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Пользователь успешно удалён' });
  } catch (err) {
    console.error('Ошибка при удалении пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при удалении пользователя' });
  }
});

// Изменение имени пользователя
usersRouter.patch('/:id/name', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Имя не может быть пустым' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET name = ? WHERE id = ?',
      [name.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Получаем обновленного пользователя
    const [userRows] = await pool.query('SELECT id, name, email, role_id FROM users WHERE id = ?', [id]);
    res.json({ message: 'Имя успешно обновлено', user: userRows[0] });
  } catch (err) {
    console.error('Ошибка при изменении имени пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при изменении имени пользователя' });
  }
});

// Изменение пароля пользователя
usersRouter.patch('/:id/password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Необходимо указать текущий и новый пароль' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Новый пароль должен содержать минимум 8 символов' });
  }

  try {
    // Получаем текущего пользователя
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userRows[0];

    // Проверяем текущий пароль
    const bcrypt = (await import('bcrypt')).default;
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    // Хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [passwordHash, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Пароль успешно обновлён' });
  } catch (err) {
    console.error('Ошибка при изменении пароля пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при изменении пароля пользователя' });
  }
});