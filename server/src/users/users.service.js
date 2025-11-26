import bcrypt from 'bcrypt';
import { DatabaseManager } from '../../models/DatabaseManager.js';
import { User } from '../../models/User.js';

const db = new DatabaseManager();
const DEFAULT_ROLE_ID = 3; // customer

export async function loginUser(email, password) {
  try {
    const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Найденные строки:', rows);

    if (rows.length === 0) {
      return { success: false, error: 'Пользователь с таким email не найден' };
    }

    const user = User.fromRow(rows[0]);
    console.log('Хеш из БД:', user.password);
    console.log('Введённый пароль:', password);

    const match = await bcrypt.compare(password, user.password);
    console.log('Результат сравнения:', match);

    if (!match) {
      return { success: false, error: 'Неверный пароль' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id
      },
      token: 'user-token-' + user.id,
      message: 'Авторизация успешна'
    };
  } catch (err) {
    console.error('Ошибка в loginUser:', err);
    throw new Error('Ошибка сервера при входе');
  }
}

export async function registerUser(name, email, password) {
  try {
    // Валидация входных данных
    if (!name || !email || !password) {
      return { success: false, error: 'Все поля обязательны для заполнения' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Пароль должен содержать минимум 8 символов' };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: 'Некорректный формат email' };
    }

    // Проверка существования пользователя
    const existing = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }

    // Хеширование пароля и создание пользователя
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, DEFAULT_ROLE_ID]
    );

    // Получение созданного пользователя
    const [newUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    console.log('Пользователь успешно зарегистрирован:', newUser);

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role_id: newUser.role_id
      },
      token: 'user-token-' + newUser.id,
      message: 'Регистрация успешна'
    };
  } catch (err) {
    console.error('Ошибка в registerUser:', err);
    throw new Error('Ошибка сервера при регистрации');
  }
}

// Вспомогательная функция для валидации email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}