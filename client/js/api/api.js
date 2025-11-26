const API_BASE = 'http://localhost:4200/api';

export async function fetchCars() {
  const response = await fetch(`${API_BASE}/cars`);
  console.log(response.body)
  if (!response.ok) throw new Error('Ошибка при загрузке машин');
  return await response.json();
}
