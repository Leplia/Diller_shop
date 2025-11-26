import { DatabaseManager } from '../../models/DatabaseManager.js';
import { Car } from '../../models/Car.js';
import { Image } from '../../models/Image.js';
import { VehicleType } from '../../models/VehicleType.js';
import { Dealer } from '../../models/Dealer.js';

export class CarsService {
  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * Получить все автомобили с фильтрами
   */
  async getAllCars(filters = {}) {
    const {
      brand,
      model,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      type_id,
      dealer_id,
      sortBy = 'id',
      order = 'ASC',
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT 
        c.*,
        vt.type_name,
        d.name as dealer_name,
        d.address as dealer_address,
        d.phone as dealer_phone,
        d.email as dealer_email,
        GROUP_CONCAT(i.image_url) as image_urls
      FROM cars c
      LEFT JOIN vehicle_types vt ON c.type_id = vt.id
      LEFT JOIN dealers d ON c.dealer_id = d.id
      LEFT JOIN images i ON c.id = i.car_id
    `;

    const conditions = [];
    const params = [];

    if (brand) {
      conditions.push('c.brand LIKE ?');
      params.push(`%${brand}%`);
    }
    if (model) {
      conditions.push('c.model LIKE ?');
      params.push(`%${model}%`);
    }
    if (minPrice) {
      conditions.push('c.price >= ?');
      params.push(minPrice);
    }
    if (maxPrice) {
      conditions.push('c.price <= ?');
      params.push(maxPrice);
    }
    if (minYear) {
      conditions.push('c.year >= ?');
      params.push(minYear);
    }
    if (maxYear) {
      conditions.push('c.year <= ?');
      params.push(maxYear);
    }
    if (type_id) {
      conditions.push('c.type_id = ?');
      params.push(type_id);
    }
    if (dealer_id) {
      conditions.push('c.dealer_id = ?');
      params.push(dealer_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` 
      GROUP BY c.id
      ORDER BY ${sortBy} ${order}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const rows = await this.db.query(query, params);
    
    return rows.map(row => {
      const car = Car.fromRow(row);
      return {
        ...car,
        vehicle_type: row.type_name,
        dealer: {
          name: row.dealer_name,
          address: row.dealer_address,
          phone: row.dealer_phone,
          email: row.dealer_email
        },
        images: row.image_urls ? row.image_urls.split(',') : []
      };
    });
  }

  /**
   * Получить автомобиль по ID
   */
  async getCarById(id) {
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

    const carRows = await this.db.query(carQuery, [id]);
    
    if (carRows.length === 0) {
      return null;
    }

    const imagesQuery = 'SELECT * FROM images WHERE car_id = ?';
    const imageRows = await this.db.query(imagesQuery, [id]);

    const car = Car.fromRow(carRows[0]);
    return {
      ...car,
      vehicle_type: carRows[0].type_name,
      dealer: {
        name: carRows[0].dealer_name,
        address: carRows[0].dealer_address,
        phone: carRows[0].dealer_phone,
        email: carRows[0].dealer_email
      },
      images: imageRows.map(img => Image.fromRow(img))
    };
  }

  /**
   * Добавить автомобиль
   */
  async addCar(carData) {
    const { brand, model, year, price, dealer_id, type_id, images = [] } = carData;

    await this.db.beginTransaction();

    try {
      // Добавляем автомобиль
      const car = new Car({ brand, model, year, price, dealer_id, type_id });
      const result = await this.db.query(
        'INSERT INTO cars (brand, model, year, price, dealer_id, type_id) VALUES (?, ?, ?, ?, ?, ?)',
        [car.brand, car.model, car.year, car.price, car.dealer_id, car.type_id]
      );

      const carId = result.insertId;

      // Добавляем изображения
      if (images.length > 0) {
        for (const imageData of images) {
          await this.db.query(
            'INSERT INTO images (car_id, image_url, description) VALUES (?, ?, ?)',
            [carId, imageData.image_url, imageData.description || '']
          );
        }
      }

      await this.db.commit();
      return await this.getCarById(carId);
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Обновить автомобиль
   */
  async updateCar(id, carData) {
    const { brand, model, year, price, dealer_id, type_id } = carData;

    const result = await this.db.query(
      'UPDATE cars SET brand = ?, model = ?, year = ?, price = ?, dealer_id = ?, type_id = ? WHERE id = ?',
      [brand, model, year, price, dealer_id, type_id, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Автомобиль не найден');
    }

    return await this.getCarById(id);
  }

  /**
   * Удалить автомобиль
   */
  async deleteCar(id) {
    await this.db.beginTransaction();

    try {
      // Удаляем изображения
      await this.db.query('DELETE FROM images WHERE car_id = ?', [id]);
      
      // Удаляем автомобиль
      const result = await this.db.query('DELETE FROM cars WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        await this.db.rollback();
        throw new Error('Автомобиль не найден');
      }

      await this.db.commit();
      return { message: 'Автомобиль успешно удален' };
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Получить опции для фильтров
   */
  async getFilterOptions() {
    const [brands, types, dealers] = await Promise.all([
      this.db.query('SELECT DISTINCT brand FROM cars ORDER BY brand'),
      this.db.query('SELECT * FROM vehicle_types ORDER BY type_name'),
      this.db.query('SELECT id, name FROM dealers ORDER BY name')
    ]);

    return {
      brands: brands.map(row => row.brand),
      types: types.map(row => ({ id: row.id, type_name: row.type_name })),
      dealers: dealers.map(row => ({ id: row.id, name: row.name }))
    };
  }

  /**
   * Добавить изображения к автомобилю
   */
  async addCarImages(carId, images) {
    await this.db.beginTransaction();

    try {
      for (const imageData of images) {
        await this.db.query(
          'INSERT INTO images (car_id, image_url, description) VALUES (?, ?, ?)',
          [carId, imageData.image_url, imageData.description || '']
        );
      }

      await this.db.commit();

      // Возвращаем обновленный список изображений
      const imageRows = await this.db.query('SELECT * FROM images WHERE car_id = ?', [carId]);
      return imageRows.map(img => Image.fromRow(img));
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Получить бренды автомобилей
   */
  async getBrands() {
    const rows = await this.db.query('SELECT DISTINCT brand FROM cars ORDER BY brand');
    return rows.map(row => row.brand);
  }

  /**
   * Получить типы автомобилей
   */
  async getVehicleTypes() {
    const rows = await this.db.query('SELECT * FROM vehicle_types ORDER BY type_name');
    return rows.map(row => VehicleType.fromRow(row));
  }

  /**
   * Получить дилеров
   */
  async getDealers() {
    const rows = await this.db.query('SELECT id, name FROM dealers ORDER BY name');
    return rows.map(row => ({ id: row.id, name: row.name }));
  }
}