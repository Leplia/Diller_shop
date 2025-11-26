document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = 'http://localhost:4200/api';
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');
    
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const carDetailsEl = document.getElementById('car-details');
    
    let currentUser = null;
    let isUserLoggedIn = false;
    
    // Проверка авторизации
    function checkAuthStatus() {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        
        if (token && isAuthenticated === "true" && userData) {
            try {
                currentUser = JSON.parse(userData);
                if (currentUser && currentUser.id) {
                    isUserLoggedIn = true;
                }
            } catch (error) {
                console.error('Ошибка при чтении данных пользователя:', error);
            }
        }
        updateAuthUI();
    }
    
    // Обновление UI авторизации
    function updateAuthUI() {
        const loginBtn = document.querySelector("#login-btn");
        const userInfoBlock = document.querySelector("#user-info");
        
        if (isUserLoggedIn && currentUser) {
            if (loginBtn) loginBtn.style.display = "none";
            
            if (userInfoBlock) {
                const isManager = Number(currentUser.role_id) === 1;
                const isSysAdmin = Number(currentUser.role_id) === 2;
                
                let adminLinkHtml = "";
                if (isManager) {
                    adminLinkHtml = `<button id="go-to-admin" class="btn">Панель менеджера</button>`;
                } else if (isSysAdmin) {
                    adminLinkHtml = `<button id="go-to-admin" class="btn">Панель системного администратора</button>`;
                }
                
                userInfoBlock.style.display = "flex";
                userInfoBlock.innerHTML = `
                    <div class="user-info-content">
                        <div class="user-avatar">
                            <img src="/client/assets/img/default.png" alt="Аватар" />
                        </div>
                        <div class="user-name">${currentUser.name}</div>
                        ${adminLinkHtml}
                        <button id="logout-btn" class="btn logout-btn">Выйти</button>
                    </div>
                `;
                
                document.getElementById('logout-btn')?.addEventListener('click', logout);
                document.getElementById('go-to-admin')?.addEventListener('click', () => {
                    if (isManager) {
                        window.location.href = "/client/html/manager-dashboard.html";
                    } else if (isSysAdmin) {
                        window.location.href = "/client/html/sysadmin-dashboard.html";
                    }
                });
            }
        } else {
            if (loginBtn) loginBtn.style.display = "block";
            if (userInfoBlock) {
                userInfoBlock.style.display = "none";
                userInfoBlock.innerHTML = '';
            }
        }
    }
    
    function logout() {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("isAuthenticated");
        window.location.reload();
    }
    
    // Загрузка данных автомобиля
    async function loadCarDetails() {
        if (!carId) {
            showError('ID автомобиля не указан');
            return;
        }
        
        try {
            loadingEl.style.display = 'block';
            errorEl.style.display = 'none';
            carDetailsEl.style.display = 'none';
            
            const response = await fetch(`${API_BASE}/cars/${carId}`);
            
            if (!response.ok) {
                throw new Error('Автомобиль не найден');
            }
            
            const car = await response.json();
            displayCarDetails(car);
            
        } catch (error) {
            console.error('Ошибка загрузки автомобиля:', error);
            showError('Не удалось загрузить информацию об автомобиле. ' + error.message);
        } finally {
            loadingEl.style.display = 'none';
        }
    }
    
    // Отображение данных автомобиля
    function displayCarDetails(car) {
        // Основная информация
        document.getElementById('car-title').textContent = `${car.brand} ${car.model}`;
        document.getElementById('car-price').textContent = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'USD'
        }).format(car.price);
        document.getElementById('car-year').textContent = car.year;
        document.getElementById('car-type').textContent = car.vehicle_type || car.type_name || 'Не указан';
        document.getElementById('car-dealer').textContent = car.dealer?.name || 'Не указан';
        document.getElementById('car-dealer-address').textContent = car.dealer?.address || 'Не указан';
        document.getElementById('car-dealer-phone').textContent = car.dealer?.phone || 'Не указан';
        document.getElementById('car-dealer-email').textContent = car.dealer?.email || 'Не указан';
        
        // Изображения
        const mainImage = document.getElementById('main-car-image');
        const thumbnailsContainer = document.getElementById('image-thumbnails');
        
        if (car.images && Array.isArray(car.images) && car.images.length > 0) {
            mainImage.src = car.images[0].image_url;
            mainImage.alt = car.images[0].description || `${car.brand} ${car.model}`;
            mainImage.onerror = function() {
                this.src = '/client/assets/img/default.png';
            };
            
            thumbnailsContainer.innerHTML = '';
            car.images.forEach((img, index) => {
                const thumb = document.createElement('img');
                thumb.src = img.image_url;
                thumb.alt = img.description || `${car.brand} ${car.model}`;
                thumb.className = 'thumbnail';
                thumb.onerror = function() {
                    this.src = '/client/assets/img/default.png';
                };
                thumb.addEventListener('click', () => {
                    mainImage.src = img.image_url;
                    mainImage.alt = img.description || `${car.brand} ${car.model}`;
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                if (index === 0) thumb.classList.add('active');
                thumbnailsContainer.appendChild(thumb);
            });
        } else {
            mainImage.src = '/client/assets/img/default.png';
            mainImage.alt = `${car.brand} ${car.model}`;
            thumbnailsContainer.innerHTML = '';
        }
        
        // Обработчики кнопок
        document.getElementById('order-btn').addEventListener('click', () => handleOrder(car.id));
        document.getElementById('test-drive-btn').addEventListener('click', () => handleTestDrive(car.id));
        
        carDetailsEl.style.display = 'block';
    }
    
    function showError(message) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    // Обработка заказа
    async function handleOrder(carId) {
        if (!isUserLoggedIn) {
            if (confirm('Для оформления заказа необходимо войти в систему. Перейти на страницу входа?')) {
                window.location.href = '/client/html/Login-Register.html';
            }
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    car_id: carId,
                    user_id: currentUser.id
                })
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Ошибка при создании заказа');
            }
            
            // Показываем модальное окно для отзыва
            showReviewModal(carId);
        } catch (error) {
            console.error('Ошибка при оформлении заказа:', error);
            alert('Ошибка при оформлении заказа: ' + error.message);
        }
    }
    
    // Показать модальное окно для отзыва
    function showReviewModal(carId) {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Спасибо за заказ!</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Заказ успешно оформлен! Пожалуйста, оставьте отзыв о вашем опыте.</p>
                    <div class="form-group">
                        <label for="review-rating">Оценка:</label>
                        <div class="rating-stars" id="rating-stars">
                            <i class="far fa-star" data-rating="1"></i>
                            <i class="far fa-star" data-rating="2"></i>
                            <i class="far fa-star" data-rating="3"></i>
                            <i class="far fa-star" data-rating="4"></i>
                            <i class="far fa-star" data-rating="5"></i>
                        </div>
                        <input type="hidden" id="review-rating" value="0">
                    </div>
                    <div class="form-group">
                        <label for="review-comment">Комментарий (необязательно):</label>
                        <textarea id="review-comment" rows="4" placeholder="Поделитесь своими впечатлениями..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="skip-review">Пропустить</button>
                    <button class="btn btn-primary" id="submit-review">Отправить отзыв</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        let selectedRating = 0;
        
        // Обработчики событий для звезд
        const stars = modal.querySelectorAll('.rating-stars i');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                selectedRating = index + 1;
                document.getElementById('review-rating').value = selectedRating;
                stars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
            
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });
        });
        
        modal.querySelector('.rating-stars').addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });
        
        // Закрытие модального окна
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#skip-review').addEventListener('click', closeModal);
        
        // Отправка отзыва
        modal.querySelector('#submit-review').addEventListener('click', async () => {
            if (selectedRating === 0) {
                alert('Пожалуйста, выберите оценку');
                return;
            }
            
            const comment = modal.querySelector('#review-comment').value.trim();
            
            try {
                const response = await fetch(`${API_BASE}/reviews`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: currentUser.id,
                        car_id: carId,
                        rating: selectedRating,
                        comment: comment
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.error || 'Ошибка при отправке отзыва');
                }
                
                closeModal();
                alert('Спасибо за ваш отзыв!');
            } catch (error) {
                console.error('Ошибка при отправке отзыва:', error);
                alert('Ошибка при отправке отзыва: ' + error.message);
            }
        });
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Обработка тест-драйва
    async function handleTestDrive(carId) {
        if (!isUserLoggedIn) {
            if (confirm('Для записи на тест-драйв необходимо войти в систему. Перейти на страницу входа?')) {
                window.location.href = '/client/html/Login-Register.html';
            }
            return;
        }
        
        // Создаем модальное окно для выбора даты и времени
        showTestDriveModal(carId);
    }
    
    // Показать модальное окно для выбора даты и времени
    function showTestDriveModal(carId) {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'test-drive-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Выберите дату и время тест-драйва</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="test-drive-date">Дата:</label>
                        <input type="date" id="test-drive-date" min="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="test-drive-time">Время (с 8:00 до 20:00):</label>
                        <input type="time" id="test-drive-time" min="08:00" max="20:00" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-test-drive">Отмена</button>
                    <button class="btn btn-primary" id="confirm-test-drive">Записаться</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики событий
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-test-drive').addEventListener('click', closeModal);
        
        modal.querySelector('#confirm-test-drive').addEventListener('click', async () => {
            const dateInput = modal.querySelector('#test-drive-date');
            const timeInput = modal.querySelector('#test-drive-time');
            
            if (!dateInput.value || !timeInput.value) {
                alert('Пожалуйста, выберите дату и время');
                return;
            }
            
            // Проверяем время (8:00 - 20:00)
            const time = timeInput.value.split(':');
            const hours = parseInt(time[0]);
            if (hours < 8 || hours >= 20) {
                alert('Время должно быть с 8:00 до 20:00');
                return;
            }
            
            // Формируем дату и время в формате YYYY-MM-DD HH:MM:SS
            const scheduledDate = `${dateInput.value} ${timeInput.value}:00`;
            
            try {
                const response = await fetch(`${API_BASE}/test-drives`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        car_id: carId,
                        user_id: currentUser.id,
                        scheduled_date: scheduledDate
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.error || 'Ошибка при записи на тест-драйв');
                }
                
                closeModal();
                alert('Запись на тест-драйв успешно оформлена!');
            } catch (error) {
                console.error('Ошибка при записи на тест-драйв:', error);
                alert('Ошибка при записи на тест-драйв: ' + error.message);
            }
        });
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Навигация
    function setupNavigation() {
        const menu = document.querySelector("#menu-btn");
        const navbar = document.querySelector(".navbar");
        
        if (menu) {
            menu.onclick = () => {
                menu.classList.toggle("fa-times");
                navbar.classList.toggle("active");
            };
        }
        
        window.onscroll = () => {
            if (menu) {
                menu.classList.remove("fa-times");
                navbar.classList.remove("active");
            }
            
            const header = document.querySelector(".header");
            if (header) {
                header.classList.toggle("active", window.scrollY > 0);
            }
        };
        
        document.querySelector("#login-button")?.addEventListener("click", () => {
            window.location.href = "/client/html/Login-Register.html";
        });
    }
    
    // Инициализация
    checkAuthStatus();
    setupNavigation();
    loadCarDetails();
});

