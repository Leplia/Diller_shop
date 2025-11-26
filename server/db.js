import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'dealer_car_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Проверка соединения
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Успешное подключение к базе данных');
    connection.release();
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
  }
}

testConnection();

export default pool;
