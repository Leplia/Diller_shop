import { fetchCars } from './api.js';

function renderCars(cars) {
  const container = document.getElementById('cars');
  container.innerHTML = '';

  cars.forEach(car => {
    const el = document.createElement('div');
    el.className = 'car-item';
    el.innerHTML = `
      <strong>${car.brand} ${car.model}</strong><br>
      Год: ${car.year}<br>
      Цена: $${car.price}<br>
      Дилер: ${car.dealer_id}, Тип: ${car.type_id}
      <hr>
    `;
    container.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const cars = await fetchCars();
    renderCars(cars);
  } catch (err) {
    console.error('Ошибка:', err);
  }
});
