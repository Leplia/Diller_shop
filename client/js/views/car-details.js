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
        document.getElementById('order-btn').addEventListener('click', () => handleOrder(car));
        document.getElementById('test-drive-btn').addEventListener('click', () => handleTestDrive(car.id));
        
        carDetailsEl.style.display = 'block';
    }
    
    function showError(message) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    // Обработка заказа
    async function handleOrder(car) {
        const carId = car.id;
        if (!isUserLoggedIn) {
            if (confirm('Для оформления заказа необходимо войти в систему. Перейти на страницу входа?')) {
                window.location.href = '/client/html/Login-Register.html';
            }
            return;
        }

        showOrderModal(car);
    }

    // Модальное окно подтверждения заказа
    function showOrderModal(car) {
        const modal = document.createElement('div');
        modal.className = 'order-modal';

        const formattedPrice = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'USD'
        }).format(car.price);

        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + 5);
        const estimatedDelivery = etaDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long'
        });

        modal.innerHTML = `
            <div class="modal-content order-modal-content">
                <div class="modal-header">
                    <h3>Подтверждение заказа</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-highlight">
                        <p>Пожалуйста, проверьте детали заказа перед оплатой. После подтверждения мы закрепим автомобиль за вами и свяжемся для финализации сделки.</p>
                    </div>
                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Автомобиль</span>
                            <strong>${car.brand} ${car.model} (${car.year})</strong>
                        </div>
                        <div class="summary-row">
                            <span>Стоимость</span>
                            <strong>${formattedPrice}</strong>
                        </div>
                        <div class="summary-row">
                            <span>Дилер</span>
                            <strong>${car.dealer?.name || 'Уточняется'}</strong>
                        </div>
                        <div class="summary-row">
                            <span>Контакты дилера</span>
                            <strong>${car.dealer?.phone || '—'} / ${car.dealer?.email || '—'}</strong>
                        </div>
                        <div class="summary-row">
                            <span>Ориентировочная выдача</span>
                            <strong>до ${estimatedDelivery}</strong>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Способ оплаты</label>
                        <div class="payment-methods">
                            <label class="payment-option">
                                <input type="radio" name="payment-method" value="card" checked>
                                <span>
                                    <strong>Банковская карта</strong>
                                    <small>Instant</small>
                                </span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment-method" value="cash">
                                <span>
                                    <strong>Наличные</strong>
                                    <small>В дилерском центре</small>
                                </span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment-method" value="bank_transfer">
                                <span>
                                    <strong>Банковский перевод</strong>
                                    <small>до 1 рабочего дня</small>
                                </span>
                            </label>
                        </div>
                    </div>
                    <div class="order-extra-info">
                        <h4>Что входит в заказ</h4>
                        <ul>
                            <li>Предпродажная подготовка и диагностика автомобиля</li>
                            <li>Комплект сезонной резины при оплате картой</li>
                            <li>Персональный менеджер и сопровождение оформления</li>
                            <li>Бесплатное хранение на складе до 10 дней</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-order-btn">Отмена</button>
                    <button class="btn btn-primary" id="confirm-order-btn">
                        Подтвердить и оплатить
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-order-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        const confirmBtn = modal.querySelector('#confirm-order-btn');
        let isProcessing = false;

        confirmBtn.addEventListener('click', async () => {
            if (isProcessing) return;

            const selectedMethod = modal.querySelector('input[name="payment-method"]:checked')?.value;
            if (!selectedMethod) {
                alert('Пожалуйста, выберите способ оплаты');
                return;
            }

            isProcessing = true;
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Оформляем...';

            try {
                const orderResponse = await fetch(`${API_BASE}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        car_id: car.id,
                        user_id: currentUser.id
                    })
                });

                if (!orderResponse.ok) {
                    const error = await orderResponse.json().catch(() => ({}));
                    throw new Error(error.error || 'Ошибка при создании заказа');
                }

                const order = await orderResponse.json();

                const paymentResponse = await fetch(`${API_BASE}/payments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        order_id: order.id,
                        method: selectedMethod
                    })
                });

                if (!paymentResponse.ok) {
                    const error = await paymentResponse.json().catch(() => ({}));
                    throw new Error(error.error || 'Ошибка при оплате заказа');
                }

                const payment = await paymentResponse.json();

                showOrderSuccess(modal, order, payment, car);
            } catch (error) {
                console.error('Ошибка при оформлении заказа:', error);
                alert('Ошибка при оформлении заказа: ' + error.message);
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Подтвердить и оплатить';
                isProcessing = false;
            }
        });
    }

    function showOrderSuccess(modal, order, payment, car) {
        const modalBody = modal.querySelector('.modal-body');
        const modalFooter = modal.querySelector('.modal-footer');

        const paymentDate = new Date(payment.payment_date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });

        const formattedAmount = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'USD'
        }).format(payment.amount);

        modalBody.innerHTML = `
            <div class="order-success">
                <h3>Заказ подтверждён!</h3>
                <p>Номер заказа <strong>#${order.id}</strong></p>
                <div class="success-grid">
                    <div>
                        <span>Автомобиль</span>
                        <strong>${car.brand} ${car.model}</strong>
                    </div>
                    <div>
                        <span>Сумма оплаты</span>
                        <strong>${formattedAmount}</strong>
                    </div>
                    <div>
                        <span>Способ оплаты</span>
                        <strong>${translateMethod(payment.method)}</strong>
                    </div>
                    <div>
                        <span>Время оплаты</span>
                        <strong>${paymentDate}</strong>
                    </div>
                </div>
                <p class="success-note">Менеджер свяжется с вами в ближайшее время для уточнения выдачи автомобиля и дополнительных услуг.</p>
            </div>
        `;

        modalFooter.innerHTML = `
            <button class="btn btn-secondary" id="close-success-modal">Закрыть</button>
            <button class="btn btn-primary" id="leave-review-btn">Оставить отзыв</button>
        `;

        modal.querySelector('#close-success-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#leave-review-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            showReviewModal(car.id);
        });
    }

    function translateMethod(method) {
        switch (method) {
            case 'card':
                return 'Банковская карта';
            case 'cash':
                return 'Наличные';
            case 'bank_transfer':
                return 'Банковский перевод';
            default:
                return method;
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

