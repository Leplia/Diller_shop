import express from "express";
import { DatabaseManager } from "../../models/DatabaseManager.js";
import { Car } from "../../models/Car.js";
import { Image } from "../../models/Image.js";
import { VehicleType } from "../../models/VehicleType.js";
import { Dealer } from "../../models/Dealer.js";
import pool from "../../db.js";

export const carsRouter = express.Router();
const db = new DatabaseManager();

/**
 * GET /api/cars
 * Получить список всех автомобилей с изображениями и дополнительной информацией
 */
carsRouter.get("/", async (req, res) => {
  try {
    const {
      brand,
      model,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      type_id,
      dealer_id,
      sortBy = "id",
      order = "ASC",
      limit = 50,
      offset = 0,
    } = req.query;

    let query = `
      SELECT 
        c.*,
        vt.type_name,
        d.name as dealer_name,
        d.address as dealer_address,
        d.phone as dealer_phone,
        d.email as dealer_email,
        GROUP_CONCAT(CONCAT(i.image_url, '|||', IFNULL(i.description, '')) SEPARATOR ':::') as image_data
      FROM cars c
      LEFT JOIN vehicle_types vt ON c.type_id = vt.id
      LEFT JOIN dealers d ON c.dealer_id = d.id
      LEFT JOIN images i ON c.id = i.car_id
    `;

    const conditions = [];
    const params = [];

    // Фильтрация
    if (brand) {
      conditions.push("c.brand LIKE ?");
      params.push(`%${brand}%`);
    }
    if (model) {
      conditions.push("c.model LIKE ?");
      params.push(`%${model}%`);
    }
    if (minPrice) {
      conditions.push("c.price >= ?");
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push("c.price <= ?");
      params.push(parseFloat(maxPrice));
    }
    if (minYear) {
      conditions.push("c.year >= ?");
      params.push(parseInt(minYear));
    }
    if (maxYear) {
      conditions.push("c.year <= ?");
      params.push(parseInt(maxYear));
    }
    if (type_id) {
      conditions.push("c.type_id = ?");
      params.push(parseInt(type_id));
    }
    if (dealer_id) {
      conditions.push("c.dealer_id = ?");
      params.push(parseInt(dealer_id));
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Группировка и сортировка
    query += ` 
      GROUP BY c.id
      ORDER BY ${sortBy} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));

    const rows = await db.query(query, params);

    const cars = rows.map((row) => {
      const car = Car.fromRow(row);

      // Парсим изображения с описаниями
      let images = [];
      if (row.image_data) {
        const imagePairs = row.image_data.split(":::");
        images = imagePairs.map((pair) => {
          const [image_url, description] = pair.split("|||");
          return { image_url, description: description || "" };
        });
      }

      // Добавляем дополнительные поля
      return {
        ...car,
        vehicle_type: row.type_name,
        dealer: {
          name: row.dealer_name,
          address: row.dealer_address,
          phone: row.dealer_phone,
          email: row.dealer_email,
        },
        images: images,
      };
    });

    res.json(cars);
  } catch (error) {
    console.error("Ошибка при получении машин:", error);
    res.status(500).json({ error: "Ошибка сервера при получении машин" });
  }
});

/**
 * GET /api/cars/popular
 * Получить топ-6 популярных автомобилей по количеству заказов
 * Если заказанных машин меньше 6, добавляем лучшие повторно
 */
carsRouter.get("/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    console.log('=== НАЧАЛО ЗАПРОСА ПОПУЛЯРНЫХ АВТОМОБИЛЕЙ ===');
    console.log('🔄 Лимит:', limit);

    // Сначала получаем автомобили с заказами
    const queryWithOrders = `
      SELECT 
        c.*,
        vt.type_name,
        d.name as dealer_name,
        COUNT(o.id) as order_count,
        GROUP_CONCAT(CONCAT(i.image_url, '|||', IFNULL(i.description, '')) SEPARATOR ':::') as image_data
      FROM cars c
      LEFT JOIN vehicle_types vt ON c.type_id = vt.id
      LEFT JOIN dealers d ON c.dealer_id = d.id
      LEFT JOIN orders o ON c.id = o.car_id
      LEFT JOIN images i ON c.id = i.car_id
      GROUP BY c.id
      HAVING order_count > 0
      ORDER BY order_count DESC
    `;
    
    console.log('📊 Выполняем запрос для автомобилей с заказами...');
    const rowsWithOrders = await db.query(queryWithOrders);
    console.log('✅ Автомобилей с заказами найдено:', rowsWithOrders.length);
    
    // Если нет заказов, получаем все автомобили
    let allCarsQuery = `
      SELECT 
        c.*,
        vt.type_name,
        d.name as dealer_name,
        0 as order_count,
        GROUP_CONCAT(CONCAT(i.image_url, '|||', IFNULL(i.description, '')) SEPARATOR ':::') as image_data
      FROM cars c
      LEFT JOIN vehicle_types vt ON c.type_id = vt.id
      LEFT JOIN dealers d ON c.dealer_id = d.id
      LEFT JOIN images i ON c.id = i.car_id
      GROUP BY c.id
      ORDER BY c.price DESC
      LIMIT ?
    `;
    
    console.log('📋 Выполняем запрос для всех автомобилей...');
    const allCarsRows = await db.query(allCarsQuery, [limit]);
    console.log('✅ Всех автомобилей найдено:', allCarsRows.length);
    
    // Форматируем автомобили с заказами
    console.log('🔄 Форматируем автомобили с заказами...');
    const carsWithOrders = rowsWithOrders.map(row => {
      try {
        const car = Car.fromRow(row);
        let images = [];
        if (row.image_data) {
          images = row.image_data.split(':::').map(item => {
            const [image_url, description] = item.split('|||');
            return { image_url, description: description || '' };
          });
        }
        console.log(`   🚗 Автомобиль с заказами: ${car.brand} ${car.model}, заказов: ${row.order_count}`);
        return {
          ...car,
          vehicle_type: row.type_name,
          dealer: {
            name: row.dealer_name
          },
          images: images,
          order_count: row.order_count
        };
      } catch (error) {
        console.error('❌ Ошибка при форматировании автомобиля с заказами:', error);
        throw error;
      }
    });
    console.log('✅ Автомобили с заказами отформатированы:', carsWithOrders.length);
    
    // Форматируем все автомобили
    console.log('🔄 Форматируем все автомобили...');
    const allCars = allCarsRows.map(row => {
      try {
        const car = Car.fromRow(row);
        let images = [];
        if (row.image_data) {
          images = row.image_data.split(':::').map(item => {
            const [image_url, description] = item.split('|||');
            return { image_url, description: description || '' };
          });
        }
        console.log(`   🚗 Все автомобили: ${car.brand} ${car.model}, цена: ${row.price}`);
        return {
          ...car,
          vehicle_type: row.type_name,
          dealer: {
            name: row.dealer_name
          },
          images: images,
          order_count: 0
        };
      } catch (error) {
        console.error('❌ Ошибка при форматировании всех автомобилей:', error);
        throw error;
      }
    });
    console.log('✅ Все автомобили отформатированы:', allCars.length);
    
    // Если заказанных машин меньше лимита, добавляем лучшие повторно
    console.log('🔄 Объединяем результаты...');
    let result = [...carsWithOrders];
    console.log(`   Начальный результат: ${result.length} автомобилей`);
    
    if (result.length < limit && allCars.length > 0) {
      const needed = limit - result.length;
      console.log(`   🔄 Нужно добавить ${needed} автомобилей из всех`);
      // Берем лучшие из всех машин (по цене) и добавляем их, повторяя при необходимости
      for (let i = 0; i < needed; i++) {
        const carToAdd = allCars[i % allCars.length];
        result.push(carToAdd);
        console.log(`   ➕ Добавлен автомобиль: ${carToAdd.brand} ${carToAdd.model}`);
      }
    } else if (result.length > limit) {
      // Если заказанных машин больше лимита, берем только топ
      console.log(`   ✂️ Обрезаем результат с ${result.length} до ${limit} автомобилей`);
      result = result.slice(0, limit);
    }
    
    // Если вообще нет машин, возвращаем пустой массив
    if (result.length === 0 && allCars.length > 0) {
      console.log('🔄 Нет автомобилей с заказами, используем все автомобили');
      result = allCars.slice(0, limit);
    }
    
    console.log('📤 Финальный результат:', result.length, 'автомобилей');
    console.log('=== УСПЕШНОЕ ЗАВЕРШЕНИЕ ЗАПРОСА ===');
    
    res.json(result);
  } catch (error) {
    console.error('❌ ОШИБКА ПРИ ПОЛУЧЕНИИ ПОПУЛЯРНЫХ АВТОМОБИЛЕЙ:', error);
    console.error('Stack trace:', error.stack);
    console.log('=== ЗАВЕРШЕНИЕ С ОШИБКОЙ ===');
    res.status(500).json({ error: 'Ошибка сервера при получении популярных автомобилей' });
  }
});

/**
 * GET /api/cars/new
 * Получить новые автомобили (с самыми большими ID)
 */
carsRouter.get("/new", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const query = `
      SELECT 
        c.*,
        vt.type_name,
        d.name as dealer_name,
        GROUP_CONCAT(CONCAT(i.image_url, '|||', IFNULL(i.description, '')) SEPARATOR ':::') as image_data
      FROM cars c
      LEFT JOIN vehicle_types vt ON c.type_id = vt.id
      LEFT JOIN dealers d ON c.dealer_id = d.id
      LEFT JOIN images i ON c.id = i.car_id
      GROUP BY c.id
      ORDER BY c.id DESC
      LIMIT ?
    `;
    
    const rows = await db.query(query, [limit]);
    
    const cars = rows.map(row => {
      const car = Car.fromRow(row);
      let images = [];
      if (row.image_data) {
        images = row.image_data.split(':::').map(item => {
          const [image_url, description] = item.split('|||');
          return { image_url, description: description || '' };
        });
      }
      return {
        ...car,
        vehicle_type: row.type_name,
        dealer: {
          name: row.dealer_name
        },
        images: images
      };
    });
    
    res.json(cars);
  } catch (error) {
    console.error('Ошибка при получении новых автомобилей:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении новых автомобилей' });
  }
});

/**
 * GET /api/cars/:id
 * Получить автомобиль по ID
 */
carsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Получаем основную информацию об автомобиле
    const carQuery = `
      SELECT 
        c.*,
        vt.type_name,
        d.name as dealer_name,
        d.address as dealer_address,
        d.phone as dealer_phone,
        d.email as dealer_email
      FROM cars c
      LEFT JOIN vehicle_types vt ON c.type_id = vt.id
      LEFT JOIN dealers d ON c.dealer_id = d.id
      WHERE c.id = ?
    `;

    const carRows = await db.query(carQuery, [id]);

    if (carRows.length === 0) {
      return res.status(404).json({ error: "Автомобиль не найден" });
    }

    // Получаем изображения автомобиля
    const imagesQuery = "SELECT * FROM images WHERE car_id = ?";
    const imageRows = await db.query(imagesQuery, [id]);

    const car = Car.fromRow(carRows[0]);
    const response = {
      ...car,
      vehicle_type: carRows[0].type_name,
      dealer: {
        name: carRows[0].dealer_name,
        address: carRows[0].dealer_address,
        phone: carRows[0].dealer_phone,
        email: carRows[0].dealer_email,
      },
      images: imageRows.map((img) => Image.fromRow(img)),
    };

    res.json(response);
  } catch (error) {
    console.error("Ошибка при получении машины:", error);
    res.status(500).json({ error: "Ошибка сервера при получении машины" });
  }
});

/**
 * POST /api/cars
 * Добавить новый автомобиль
 */
carsRouter.post("/", async (req, res) => {
  const {
    brand,
    model,
    year,
    price,
    dealer_id,
    type_id,
    images = [],
  } = req.body;

  // Валидация
  if (!brand || !model || !year || !price || !dealer_id || !type_id) {
    return res
      .status(400)
      .json({ error: "Пожалуйста, заполните все обязательные поля" });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Добавляем автомобиль
      const car = new Car({ brand, model, year, price, dealer_id, type_id });
      const [result] = await connection.query(
        "INSERT INTO cars (brand, model, year, price, dealer_id, type_id) VALUES (?, ?, ?, ?, ?, ?)",
        [car.brand, car.model, car.year, car.price, car.dealer_id, car.type_id]
      );

      const carId = result.insertId;

      // Добавляем изображения
      if (images.length > 0) {
        for (const imageData of images) {
          await connection.query(
            "INSERT INTO images (car_id, image_url, description) VALUES (?, ?, ?)",
            [carId, imageData.image_url, imageData.description || ""]
          );
        }
      }

      await connection.commit();

      // Получаем созданный автомобиль с полной информацией
      const [newCarRows] = await connection.query(
        `
        SELECT 
          c.*,
          vt.type_name,
          d.name as dealer_name,
          GROUP_CONCAT(CONCAT(i.image_url, '|||', IFNULL(i.description, '')) SEPARATOR ':::') as image_data
        FROM cars c
        LEFT JOIN vehicle_types vt ON c.type_id = vt.id
        LEFT JOIN dealers d ON c.dealer_id = d.id
        LEFT JOIN images i ON c.id = i.car_id
        WHERE c.id = ?
        GROUP BY c.id
      `,
        [carId]
      );

      connection.release();

      // Парсим изображения
      let parsedImages = [];
      if (newCarRows[0]?.image_data) {
        const imagePairs = newCarRows[0].image_data.split(":::");
        parsedImages = imagePairs.map((pair) => {
          const [image_url, description] = pair.split("|||");
          return { image_url, description: description || "" };
        });
      }

      const newCar = {
        ...Car.fromRow(newCarRows[0]),
        images: parsedImages,
      };

      res.status(201).json(newCar);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Ошибка при добавлении машины:", error);
    res.status(500).json({ error: "Ошибка сервера при добавлении машины" });
  }
});

/**
 * PUT /api/cars/:id
 * Обновить автомобиль
 */
carsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { brand, model, year, price, dealer_id, type_id } = req.body;

  try {
    const result = await db.query(
      "UPDATE cars SET brand = ?, model = ?, year = ?, price = ?, dealer_id = ?, type_id = ? WHERE id = ?",
      [brand, model, year, price, dealer_id, type_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Автомобиль не найден" });
    }

    // Получаем обновленный автомобиль
    const updatedCar = await db.query("SELECT * FROM cars WHERE id = ?", [id]);
    res.json(Car.fromRow(updatedCar[0]));
  } catch (error) {
    console.error("Ошибка при обновлении машины:", error);
    res.status(500).json({ error: "Ошибка сервера при обновлении машины" });
  }
});

/**
 * DELETE /api/cars/:id
 * Удалить автомобиль
 */
carsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Удаляем изображения автомобиля
      await connection.query("DELETE FROM images WHERE car_id = ?", [id]);

      // Удаляем автомобиль
      const [result] = await connection.query("DELETE FROM cars WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "Автомобиль не найден" });
      }

      await connection.commit();
      connection.release();
      res.json({ message: "Автомобиль успешно удален" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Ошибка при удалении машины:", error);
    res.status(500).json({ error: "Ошибка сервера при удалении машины" });
  }
});
/**
 * GET /api/cars/filters/options
 * Получить опции для фильтров (бренды, типы и т.д.)
 */
carsRouter.get("/filters/options", async (req, res) => {
  try {
    const [brands, types, dealers] = await Promise.all([
      db.query("SELECT DISTINCT brand FROM cars ORDER BY brand"),
      db.query("SELECT * FROM vehicle_types ORDER BY type_name"),
      db.query("SELECT id, name FROM dealers ORDER BY name"),
    ]);

    res.json({
      brands: brands.map((row) => row.brand),
      types: types.map((row) => VehicleType.fromRow(row)),
      dealers: dealers.map((row) => ({ id: row.id, name: row.name })),
    });
  } catch (error) {
    console.error("Ошибка при получении опций фильтров:", error);
    res
      .status(500)
      .json({ error: "Ошибка сервера при получении опций фильтров" });
  }
});

/**
 * POST /api/cars/:id/images
 * Добавить изображения к автомобилю
 */
carsRouter.post("/:id/images", async (req, res) => {
  const { id } = req.params;
  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: "Неверный формат изображений" });
  }

  try {
    for (const imageData of images) {
      await db.query(
        "INSERT INTO images (car_id, image_url, description) VALUES (?, ?, ?)",
        [id, imageData.image_url, imageData.description || ""]
      );
    }

    // Получаем обновленный список изображений
    const imageRows = await db.query("SELECT * FROM images WHERE car_id = ?", [
      id,
    ]);
    res.status(201).json(imageRows.map((img) => Image.fromRow(img)));
  } catch (error) {
    console.error("Ошибка при добавлении изображений:", error);
    res
      .status(500)
      .json({ error: "Ошибка сервера при добавлении изображений" });
  }
});

/**
 * DELETE /api/cars/:id/images
 * Удалить все изображения автомобиля
 */
carsRouter.delete("/:id/images", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM images WHERE car_id = ?", [
      id,
    ]);
    res.json({
      message: "Изображения удалены",
      deleted: result.affectedRows || 0,
    });
  } catch (error) {
    console.error("Ошибка при удалении изображений:", error);
    res.status(500).json({ error: "Ошибка сервера при удалении изображений" });
  }
});

