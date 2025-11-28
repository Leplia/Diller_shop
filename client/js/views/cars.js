document.addEventListener("DOMContentLoaded", function () {
    // ========== АВТОРИЗАЦИЯ ==========
    let isUserLoggedIn = false;
    let currentUser = null;

    // Проверка статуса авторизации
    function checkAuthStatus() {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        
        console.log('🔐 Проверка авторизации:', { 
            token: !!token, 
            userData: !!userData, 
            isAuthenticated 
        });
        
        if (token && isAuthenticated === "true" && userData) {
            try {
                currentUser = JSON.parse(userData);
                if (currentUser && currentUser.id) {
                    isUserLoggedIn = true;
                    console.log('✅ Пользователь авторизован:', currentUser.name);
                } else {
                    console.log('❌ Неверные данные пользователя');
                }
            } catch (error) {
                console.error('❌ Ошибка при чтении данных пользователя:', error);
                logout();
            }
        } else {
            console.log('❌ Пользователь не авторизован');
        }
    }

    // Обновление UI авторизации
    function updateAuthUI() {
        const loginBtn = document.querySelector("#login-btn");
        const userInfoBlock = document.querySelector("#user-info");
        
        console.log('🎨 Обновление UI:', { 
            isUserLoggedIn, 
            loginBtn: !!loginBtn, 
            userInfoBlock: !!userInfoBlock 
        });
        
        if (isUserLoggedIn && currentUser) {
            // Пользователь авторизован - скрываем кнопку входа, показываем информацию о пользователе
            if (loginBtn) {
                loginBtn.style.display = "none";
                console.log('👤 Скрыли кнопку входа');
            }

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
                
                // Добавляем стили если их нет в CSS
                addUserInfoStyles();
                
                document.getElementById('logout-btn').addEventListener('click', logout);

                const goToAdminBtn = document.getElementById('go-to-admin');
                if (goToAdminBtn) {
                    goToAdminBtn.addEventListener('click', () => {
                        if (isManager) {
                            window.location.href = "/client/html/manager-dashboard.html";
                        } else if (isSysAdmin) {
                            window.location.href = "/client/html/sysadmin-dashboard.html";
                        }
                    });
                }
                console.log('👋 Показали информацию о пользователе');
            }
        } else {
            // Пользователь не авторизован - показываем кнопку входа, скрываем информацию о пользователе
            if (loginBtn) {
                loginBtn.style.display = "block";
                console.log('🔓 Показали кнопку входа');
            }
            if (userInfoBlock) {
                userInfoBlock.style.display = "none";
                userInfoBlock.innerHTML = '';
                console.log('🚫 Скрыли информацию о пользователе');
            }
        }
    }

    // Добавляем стили для user-info если их нет в CSS
    function addUserInfoStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .user-info-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex-wrap: wrap;
            }
            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
                border: 2px solid var(--yellow, #f9d806);
            }
            .user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .user-name {
                color: var(--light-yellow, #130f40);
                font-size: 1.4rem;
                font-weight: 500;
                white-space: nowrap;
            }
            #go-to-admin {
                padding: 0.5rem 1rem;
                font-size: 1.2rem;
                margin: 0;
            }
            .logout-btn {
                background: #dc2626;
                padding: 0.5rem 1rem;
                font-size: 1.2rem;
                margin: 0;
                border: none;
                color: white;
                border-radius: 0.5rem;
                cursor: pointer;
                white-space: nowrap;
            }
            .logout-btn:hover {
                background: #b91c1c;
            }
        `;
        document.head.appendChild(style);
    }

    // Выход из системы
    function logout() {
        console.log('🚪 Выход из системы');
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("isAuthenticated");
        isUserLoggedIn = false;
        currentUser = null;
        window.location.reload();
    }

    // Перенаправление на страницу входа
    function redirectToLogin() {
        window.location.href = "/client/html/Login-Register.html";
    }

    // ========== КАТАЛОГ АВТОМОБИЛЕЙ ==========
    const carsContainer = document.getElementById('cars-container');
    const searchInput = document.getElementById('search-input');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const priceSlider = document.getElementById('price-slider');
    const sliderValue = document.getElementById('slider-value');
    const minYearInput = document.getElementById('min-year');
    const maxYearInput = document.getElementById('max-year');
    const dealerFiltersContainer = document.getElementById('dealer-filters');
    const bodyTypeFiltersContainer = document.getElementById('body-type-filters');
    const sortSelect = document.getElementById('sort-select');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const resultsCount = document.getElementById('results-count');
    const paginationContainer = document.getElementById('pagination');
    
    let allCars = [];
    let filteredCars = [];
    let dealers = [];
    let vehicleTypes = [];
    let currentPage = 1;
    const carsPerPage = 9;
    let currentView = 'grid';
    let maxPrice = 500000;

    // Инициализация
    async function init() {
        console.log('🚀 Инициализация каталога');
        checkAuthStatus();
        updateAuthUI();
        await loadDealers();
        await loadVehicleTypes();
        setupEventListeners();
        await loadCars();
        updatePriceSlider();
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        console.log('⚙️ Настройка обработчиков событий');
        
        // Авторизация
        const loginButton = document.querySelector("#login-button");
        if (loginButton) {
            loginButton.addEventListener("click", redirectToLogin);
            console.log('✅ Обработчик для кнопки входа добавлен');
        } else {
            console.log('❌ Кнопка входа не найдена');
        }

        // Поиск и фильтры
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        minPriceInput.addEventListener('input', () => {
            if (priceSlider) {
                priceSlider.value = maxPriceInput.value || maxPrice;
                updateSliderValue();
            }
            applyFilters();
        });
        maxPriceInput.addEventListener('input', () => {
            if (priceSlider) {
                priceSlider.value = maxPriceInput.value || maxPrice;
                updateSliderValue();
            }
            applyFilters();
        });
        
        if (priceSlider) {
            priceSlider.addEventListener('input', () => {
                maxPriceInput.value = priceSlider.value;
                updateSliderValue();
                applyFilters();
            });
        }
        
        minYearInput.addEventListener('input', applyFilters);
        maxYearInput.addEventListener('input', applyFilters);
        
        // Динамические фильтры для дилеров и типов кузова
        dealerFiltersContainer.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                applyFilters();
            }
        });
        
        bodyTypeFiltersContainer.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                applyFilters();
            }
        });
        
        sortSelect.addEventListener('change', applyFilters);
        resetFiltersBtn.addEventListener('click', resetFilters);
        
        // Вид отображения
        gridViewBtn.addEventListener('click', () => switchView('grid'));
        listViewBtn.addEventListener('click', () => switchView('list'));

        // Навигация
        setupNavigation();
    }

    // Навигация
    function setupNavigation() {
        let menu = document.querySelector("#menu-btn");
        let navbar = document.querySelector(".navbar");

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
    }

    // Загрузка дилеров
    async function loadDealers() {
        try {
            const response = await fetch('http://localhost:4200/api/dealers');
            if (!response.ok) throw new Error('Ошибка загрузки дилеров');
            dealers = await response.json();
            
            dealerFiltersContainer.innerHTML = dealers.map(dealer => 
                `<label><input type="checkbox" value="${dealer.id}" data-name="${dealer.name}"> ${dealer.name}</label>`
            ).join('');
            
            console.log('✅ Дилеры загружены:', dealers.length, 'шт.');
        } catch (error) {
            console.error('❌ Ошибка загрузки дилеров:', error);
        }
    }

    // Загрузка типов кузова
    async function loadVehicleTypes() {
        try {
            const response = await fetch('http://localhost:4200/api/vehicle-types');
            if (!response.ok) throw new Error('Ошибка загрузки типов кузова');
            vehicleTypes = await response.json();
            
            bodyTypeFiltersContainer.innerHTML = vehicleTypes.map(type => 
                `<label><input type="checkbox" value="${type.type_name}"> ${type.type_name}</label>`
            ).join('');
            
            console.log('✅ Типы кузова загружены:', vehicleTypes.length, 'шт.');
        } catch (error) {
            console.error('❌ Ошибка загрузки типов кузова:', error);
        }
    }

    // Обновление ползунка цены
    function updatePriceSlider() {
        if (allCars.length > 0) {
            maxPrice = Math.max(...allCars.map(car => car.price));
            maxPrice = Math.ceil(maxPrice / 10000) * 10000; // Округляем до 10000
            if (priceSlider) {
                priceSlider.max = maxPrice;
                priceSlider.value = maxPrice;
                maxPriceInput.max = maxPrice;
                updateSliderValue();
            }
        }
    }

    function updateSliderValue() {
        if (sliderValue && priceSlider) {
            sliderValue.textContent = `До ${parseInt(priceSlider.value).toLocaleString('ru-RU')} $`;
        }
    }

    // Загрузка автомобилей
    async function loadCars() {
        try {
            showLoading();
            console.log('📡 Загрузка автомобилей с сервера...');
            
            const response = await fetch('http://localhost:4200/api/cars');
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            
            const data = await response.json();
            console.log('✅ Автомобили загружены:', data.length, 'шт.');

            // Приводим данные с сервера к удобному формату для фронта
            allCars = data.map(carData => ({
                ...carData,
                // На сервере тип может приходить как vehicle_type / type_name
                type: carData.type || carData.vehicle_type || carData.type_name || 'Седан'
            }));
            filteredCars = [...allCars];
            updatePriceSlider();
            renderCars();
            updateResultsCount();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки автомобилей:', error);
            showError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
        }
    }

    // Остальные функции каталога остаются без изменений...
    function applyFilters() {
        filteredCars = [...allCars];
        
        const searchText = searchInput.value.toLowerCase().trim();
        if (searchText) {
            filteredCars = filteredCars.filter(car => 
                car.brand.toLowerCase().includes(searchText) || 
                car.model.toLowerCase().includes(searchText)
            );
        }
        
        const minPrice = parseFloat(minPriceInput.value) || 0;
        const maxPrice = parseFloat(maxPriceInput.value) || Infinity;
        filteredCars = filteredCars.filter(car => car.price >= minPrice && car.price <= maxPrice);
        
        const minYear = parseInt(minYearInput.value) || 0;
        const maxYear = parseInt(maxYearInput.value) || Infinity;
        filteredCars = filteredCars.filter(car => car.year >= minYear && car.year <= maxYear);
        
        const selectedDealers = getSelectedValues(dealerFiltersContainer.querySelectorAll('input[type="checkbox"]'));
        if (selectedDealers.length > 0) {
            const dealerIds = selectedDealers.map(id => parseInt(id));
            filteredCars = filteredCars.filter(car => dealerIds.includes(car.dealer_id));
        }
        
        const selectedBodyTypes = getSelectedValues(bodyTypeFiltersContainer.querySelectorAll('input[type="checkbox"]'));
        if (selectedBodyTypes.length > 0) {
            filteredCars = filteredCars.filter(car => {
                const carType = car.type || car.vehicle_type || car.type_name;
                return selectedBodyTypes.includes(carType);
            });
        }
        
        sortCars();
        
        currentPage = 1;
        renderCars();
        updateResultsCount();
    }

    function getSelectedValues(checkboxes) {
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    function sortCars() {
        const sortOption = sortSelect.value;
        switch (sortOption) {
            case 'price-asc':
                filteredCars.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredCars.sort((a, b) => b.price - a.price);
                break;
            case 'year-desc':
                filteredCars.sort((a, b) => b.year - a.year);
                break;
            case 'year-asc':
                filteredCars.sort((a, b) => a.year - b.year);
                break;
            case 'brand-asc':
                filteredCars.sort((a, b) => a.brand.localeCompare(b.brand));
                break;
            case 'brand-desc':
                filteredCars.sort((a, b) => b.brand.localeCompare(a.brand));
                break;
        }
    }

    function resetFilters() {
        searchInput.value = '';
        minPriceInput.value = '';
        maxPriceInput.value = '';
        minYearInput.value = '';
        maxYearInput.value = '';
        
        if (priceSlider) {
            priceSlider.value = maxPrice;
            updateSliderValue();
        }
        
        dealerFiltersContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
        bodyTypeFiltersContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
        sortSelect.value = 'default';
        
        applyFilters();
    }

    function switchView(view) {
        currentView = view;
        carsContainer.classList.toggle('list-view', view === 'list');
        gridViewBtn.classList.toggle('active', view === 'grid');
        listViewBtn.classList.toggle('active', view === 'list');
        renderCars();
    }

    function renderCars() {
        if (filteredCars.length === 0) {
            carsContainer.innerHTML = '<div class="no-results">По вашему запросу ничего не найдено</div>';
            paginationContainer.innerHTML = '';
            return;
        }
        
        const totalPages = Math.ceil(filteredCars.length / carsPerPage);
        const startIndex = (currentPage - 1) * carsPerPage;
        const carsToShow = filteredCars.slice(startIndex, startIndex + carsPerPage);
        
        carsContainer.innerHTML = '';
        carsToShow.forEach(car => {
            const carCard = createCarCard(car);
            carsContainer.appendChild(carCard);
        });
        
        renderPagination(totalPages);
    }

    function createCarCard(car) {
        const carCard = document.createElement('div');
        carCard.className = `car-card ${currentView === 'list' ? 'list-view' : ''}`;
        
        const formattedPrice = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'USD'
        }).format(car.price);
        
        // Получаем изображение из БД или используем заглушку
        let carImageUrl = '/client/assets/img/default.png';
        let carImageAlt = `${car.brand} ${car.model}`;
        
        if (car.images && Array.isArray(car.images) && car.images.length > 0) {
            carImageUrl = car.images[0].image_url;
            carImageAlt = car.images[0].description || `${car.brand} ${car.model}`;
        }
        
        const actionButtons = isUserLoggedIn ? 
            `
            <div class="car-actions">
                <button class="btn view-details" data-car-id="${car.id}">Подробнее</button>
                <button class="btn contact-dealer" data-car-id="${car.id}">Связаться</button>
            </div>
            ` :
            `
            <div class="car-actions">
                <button class="btn view-details" data-car-id="${car.id}">Подробнее</button>
                <button class="btn login-required" onclick="window.redirectToLogin()">Войдите для связи</button>
            </div>
            `;
        
        carCard.innerHTML = `
            <div class="car-image">
                <img src="${carImageUrl}" alt="${carImageAlt}" onerror="this.src='/client/assets/img/default.png'; this.alt='${car.brand} ${car.model}'">
            </div>
            <div class="car-info">
                <h3 class="car-title">${car.brand} ${car.model}</h3>
                <div class="car-specs">
                    <div class="car-spec">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${car.year} год</span>
                    </div>
                    <div class="car-spec">
                        <i class="fas fa-car"></i>
                        <span>${car.type || 'Седан'}</span>
                    </div>
                </div>
                <div class="car-price">${formattedPrice}</div>
                ${actionButtons}
            </div>
        `;
        
        addCardEventListeners(carCard, car.id);
        return carCard;
    }

    function addCardEventListeners(carCard, carId) {
        const viewDetailsBtn = carCard.querySelector('.view-details');
        const contactDealerBtn = carCard.querySelector('.contact-dealer');
        
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', () => viewCarDetails(carId));
        }
        
        if (contactDealerBtn) {
            contactDealerBtn.addEventListener('click', () => contactDealer(carId));
        }
    }

    function viewCarDetails(carId) {
        window.location.href = `/client/html/car-details.html?id=${carId}`;
    }
    
    function contactDealer(carId) {
        if (!isUserLoggedIn) {
            redirectToLogin();
            return;
        }
        alert(`Связь с дилером по автомобилю с ID: ${carId}`);
    }
    

    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        if (currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
        }
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
        }
        
        if (currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
        }
        
        paginationContainer.innerHTML = paginationHTML;
        
        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                renderCars();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    function updateResultsCount() {
        if (resultsCount) {
            resultsCount.querySelector('span').textContent = filteredCars.length;
        }
    }

    function showLoading() {
        if (carsContainer) {
            carsContainer.innerHTML = '<div class="loading">Загрузка автомобилей...</div>';
        }
    }
    
    function showError(message) {
        if (carsContainer) {
            carsContainer.innerHTML = `<div class="no-results">${message}</div>`;
        }
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Глобальные функции
    window.redirectToLogin = redirectToLogin;

    // Запуск приложения
    init();
});