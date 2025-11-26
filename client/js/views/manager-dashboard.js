const API_BASE = 'http://localhost:4200/api';

document.addEventListener('DOMContentLoaded', () => {
  const carsTableBody = document.querySelector('#cars-table tbody');
  const carForm = document.getElementById('car-form');
  const carFormMode = document.getElementById('car-form-mode');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  const brandInput = document.getElementById('car-brand');
  const modelInput = document.getElementById('car-model');
  const yearInput = document.getElementById('car-year');
  const priceInput = document.getElementById('car-price');
  const dealerInput = document.getElementById('car-dealer');
  const typeInput = document.getElementById('car-type');
  const imageUrlInput = document.getElementById('car-image-url');
  const imageDescriptionInput = document.getElementById('car-image-description');

  let cars = [];
  let editingId = null;
  let dealers = [];
  let vehicleTypes = [];

  initAuthHeader();
  loadDealersAndTypes();
  loadCars();
  loadFAQ();

  cancelEditBtn?.addEventListener('click', () => {
    resetForm();
  });

  carForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const images = [];
    if (imageUrlInput.value.trim()) {
      images.push({
        image_url: imageUrlInput.value.trim(),
        description: imageDescriptionInput.value.trim() || ''
      });
    }

    const carData = {
      brand: brandInput.value.trim(),
      model: modelInput.value.trim(),
      year: Number(yearInput.value),
      price: Number(priceInput.value),
      dealer_id: Number(dealerInput.value),
      type_id: Number(typeInput.value),
      images: images
    };

    if (!carData.brand || !carData.model || !carData.year || !carData.price || !carData.dealer_id || !carData.type_id) {
      alert('Пожалуйста, заполните все поля формы.');
      return;
    }

    try {
      if (editingId === null) {
        // добавление
        const res = await fetch(`${API_BASE}/cars`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(carData)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Ошибка при добавлении автомобиля');
        }
      } else {
        // редактирование - сначала обновляем данные автомобиля
        const { images, ...carUpdateData } = carData;
        const res = await fetch(`${API_BASE}/cars/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(carUpdateData)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Ошибка при обновлении автомобиля');
        }

        // Затем обновляем изображения
        if (images.length > 0) {
          // Удаляем старые изображения
          await fetch(`${API_BASE}/cars/${editingId}/images`, { method: 'DELETE' }).catch(() => {});
          
          // Добавляем новые изображения
          const imagesRes = await fetch(`${API_BASE}/cars/${editingId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images })
          });
          if (!imagesRes.ok) {
            console.warn('Ошибка при обновлении изображений, но автомобиль обновлён');
          }
        }
      }

      await loadCars();
      resetForm();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });

  async function loadCars() {
    try {
      const res = await fetch(`${API_BASE}/cars`);
      if (!res.ok) throw new Error('Ошибка загрузки автомобилей');
      cars = await res.json();

      carsTableBody.innerHTML = '';
      cars.forEach(car => {
        const tr = document.createElement('tr');
        
        // Получаем первое изображение или используем description
        let imageHtml = '<span class="no-image">Нет фото</span>';
        if (car.images && car.images.length > 0) {
          const firstImage = Array.isArray(car.images) ? car.images[0] : (typeof car.images === 'string' ? { image_url: car.images } : car.images);
          const imageUrl = firstImage.image_url || firstImage;
          const description = firstImage.description || '';
          
          if (imageUrl) {
            imageHtml = `
              <div class="car-image-cell">
                <img src="${imageUrl}" alt="${description || car.brand + ' ' + car.model}" 
                     onerror="this.parentElement.innerHTML='<span class=\\'no-image\\'>${description || 'Фото не загружено'}</span>'">
              </div>
            `;
          } else if (description) {
            imageHtml = `<span class="no-image">${description}</span>`;
          }
        } else if (car.image_urls) {
          // Если изображения приходят как строка через GROUP_CONCAT
          const urls = car.image_urls.split(',');
          if (urls[0]) {
            imageHtml = `
              <div class="car-image-cell">
                <img src="${urls[0]}" alt="${car.brand + ' ' + car.model}" 
                     onerror="this.parentElement.innerHTML='<span class=\\'no-image\\'>Фото не загружено</span>'">
              </div>
            `;
          }
        }
        
        tr.innerHTML = `
          <td>${car.id}</td>
          <td class="image-cell">${imageHtml}</td>
          <td>${car.brand}</td>
          <td>${car.model}</td>
          <td>${car.year}</td>
          <td>${car.price}</td>
          <td>
            <button class="btn btn-small edit-car" data-id="${car.id}">Редактировать</button>
            <button class="btn btn-small btn-danger delete-car" data-id="${car.id}">Удалить</button>
          </td>
        `;
        carsTableBody.appendChild(tr);
      });

      carsTableBody.querySelectorAll('.edit-car').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = Number(btn.getAttribute('data-id'));
          const car = cars.find(c => c.id === id);
          if (!car) return;
          
          editingId = id;
          brandInput.value = car.brand;
          modelInput.value = car.model;
          yearInput.value = car.year;
          priceInput.value = car.price;
          dealerInput.value = car.dealer_id || '';
          typeInput.value = car.type_id || '';
          
          // Загружаем изображения автомобиля
          try {
            const imagesRes = await fetch(`${API_BASE}/cars/${id}`);
            if (imagesRes.ok) {
              const carDetails = await imagesRes.json();
              if (carDetails.images && carDetails.images.length > 0) {
                const firstImage = carDetails.images[0];
                imageUrlInput.value = firstImage.image_url || '';
                imageDescriptionInput.value = firstImage.description || '';
              } else {
                imageUrlInput.value = '';
                imageDescriptionInput.value = '';
              }
            } else {
              imageUrlInput.value = '';
              imageDescriptionInput.value = '';
            }
          } catch (e) {
            console.error('Ошибка загрузки изображений:', e);
            imageUrlInput.value = '';
            imageDescriptionInput.value = '';
          }
          
          if (carFormMode) carFormMode.textContent = `Режим: редактирование автомобиля #${id}`;
        });
      });

      carsTableBody.querySelectorAll('.delete-car').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm(`Удалить автомобиль #${id}?`)) return;
          try {
            const res = await fetch(`${API_BASE}/cars/${id}`, { method: 'DELETE' });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Ошибка при удалении автомобиля');
            }
            await loadCars();
          } catch (error) {
            console.error(error);
            alert(error.message);
          }
        });
      });
    } catch (e) {
      console.error(e);
      carsTableBody.innerHTML = '<tr><td colspan="7">Ошибка загрузки автомобилей</td></tr>';
    }
  }

  async function loadDealersAndTypes() {
    try {
      // Загружаем дилеров и типы из API фильтров
      const res = await fetch(`${API_BASE}/cars/filters/options`);
      if (!res.ok) throw new Error('Ошибка загрузки опций');
      const data = await res.json();
      
      dealers = data.dealers || [];
      vehicleTypes = data.types || [];
      
      // Заполняем select для дилеров
      const dealerSelect = document.getElementById('car-dealer');
      if (dealerSelect) {
        dealerSelect.innerHTML = '<option value="">Выберите дилера</option>';
        dealers.forEach(dealer => {
          const option = document.createElement('option');
          option.value = dealer.id;
          option.textContent = dealer.name;
          dealerSelect.appendChild(option);
        });
      }
      
      // Заполняем select для типов
      const typeSelect = document.getElementById('car-type');
      if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Выберите тип</option>';
        vehicleTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type.id;
          option.textContent = type.type_name;
          typeSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки дилеров и типов:', error);
      alert('Не удалось загрузить список дилеров и типов');
    }
  }

  function resetForm() {
    carForm?.reset();
    editingId = null;
    imageUrlInput.value = '';
    imageDescriptionInput.value = '';
    if (carFormMode) carFormMode.textContent = 'Режим: добавление нового автомобиля';
    // Сбрасываем select'ы
    if (dealerInput) dealerInput.value = '';
    if (typeInput) typeInput.value = '';
  }

  // Загрузка вопросов пользователей
  async function loadFAQ() {
    try {
      const res = await fetch(`${API_BASE}/faq`);
      if (!res.ok) throw new Error('Ошибка загрузки вопросов');
      const faqs = await res.json();

      const questionsList = document.getElementById('questions-list');
      if (!questionsList) return;

      if (faqs.length === 0) {
        questionsList.innerHTML = '<p>Нет вопросов от пользователей</p>';
        return;
      }

      questionsList.innerHTML = faqs.map(faq => createFAQItem(faq)).join('');

      // Добавляем обработчики для кнопок ответа
      questionsList.querySelectorAll('.answer-faq-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const faqId = Number(btn.getAttribute('data-id'));
          const faq = faqs.find(f => f.id === faqId);
          if (!faq) return;

          showAnswerModal(faq);
        });
      });
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
      const questionsList = document.getElementById('questions-list');
      if (questionsList) {
        questionsList.innerHTML = '<p>Ошибка загрузки вопросов</p>';
      }
    }
  }

  // Создание элемента вопроса
  function createFAQItem(faq) {
    const statusClass = faq.status === 'pending' ? 'status-pending' : 'status-answered';
    const statusText = faq.status === 'pending' ? 'В ожидании' : 'Отвечено';
    const answerSection = faq.answer 
      ? `<div class="faq-answer"><strong>Ответ:</strong> ${faq.answer}</div>` 
      : '';

    return `
      <div class="faq-item ${statusClass}">
        <div class="faq-header">
          <div class="faq-meta">
            <span class="faq-theme">Тема: ${faq.theme}</span>
            <span class="faq-status ${statusClass}">${statusText}</span>
            <span class="faq-date">${new Date(faq.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          ${faq.user_name ? `<div class="faq-user">От: ${faq.user_name}${faq.user_email ? ` (${faq.user_email})` : ''}</div>` : ''}
        </div>
        <div class="faq-question">
          <strong>Вопрос:</strong> ${faq.question}
        </div>
        ${answerSection}
        ${!faq.answer ? `<button class="btn btn-small answer-faq-btn" data-id="${faq.id}">Ответить</button>` : ''}
      </div>
    `;
  }

  // Показать модальное окно для ответа
  function showAnswerModal(faq) {
    const modal = document.createElement('div');
    modal.className = 'faq-answer-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ответить на вопрос</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="faq-question-display">
            <strong>Тема:</strong> ${faq.theme}<br>
            <strong>Вопрос:</strong> ${faq.question}
          </div>
          <div class="form-group">
            <label for="faq-answer">Ответ:</label>
            <textarea id="faq-answer" rows="6" placeholder="Введите ответ на вопрос..." required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-answer">Отмена</button>
          <button class="btn btn-primary" id="submit-answer">Отправить ответ</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('#cancel-answer').addEventListener('click', closeModal);

    modal.querySelector('#submit-answer').addEventListener('click', async () => {
      const answer = modal.querySelector('#faq-answer').value.trim();

      if (!answer) {
        alert('Пожалуйста, введите ответ');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/faq/${faq.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer, status: 'answered' })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Ошибка при отправке ответа');
        }

        closeModal();
        await loadFAQ();
        alert('Ответ успешно отправлен!');
      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
});

function initAuthHeader() {
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const userInfoBlock = document.getElementById('user-info');

  if (!userInfoBlock) return;

  if (user) {
    userInfoBlock.innerHTML = `
      <div class="user-name">${user.name}</div>
      <button id="logout-btn" class="btn">Выйти</button>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/client/html/main.html';
    });
  } else {
    userInfoBlock.innerHTML = `
      <button id="login-button" class="btn">Войти</button>
    `;
    document.getElementById('login-button')?.addEventListener('click', () => {
      window.location.href = '/client/html/Login-Register.html';
    });
  }
}


