// Меню и навигация
let menu = document.querySelector("#menu-btn");
let navbar = document.querySelector(".navbar");

menu.onclick = () => {
  menu.classList.toggle("fa-times");
  navbar.classList.toggle("active");
};

document.querySelector("#login-button")?.addEventListener("click", () => {
  window.location.href = "/client/html/Login-Register.html";
});

document.querySelector("#close-login-form")?.addEventListener("click", () => {
  document.querySelector(".login-form-container")?.classList.remove("active");
});

window.onscroll = () => {
  menu.classList.remove("fa-times");
  navbar.classList.remove("active");

  const header = document.querySelector(".header");
  if (window.scrollY > 0) {
    header?.classList.add("active");
  } else {
    header?.classList.remove("active");
  }
};

// Параллакс
document.querySelector(".home")?.addEventListener("mousemove", (e) => {
  document.querySelectorAll(".home-parallax").forEach((elm) => {
    let speed = elm.getAttribute("data-speed");
    let x = (window.innerWidth - e.pageX * speed) / 90;
    let y = (window.innerHeight - e.pageY * speed) / 90;
    elm.style.transform = `translateX(${y}px) translateY(${x}px)`;
  });
});

document.querySelector(".home")?.addEventListener("mouseleave", () => {
  document.querySelectorAll(".home-parallax").forEach((elm) => {
    elm.style.transform = `translateX(0px) translateY(0px)`;
  });
});

// Загрузка популярных автомобилей
let popularCarsSwiper = null;

async function loadPopularCars() {
  try {
    const response = await fetch('http://localhost:4200/api/cars/popular?limit=6');
    if (!response.ok) {
      throw new Error('Ошибка загрузки популярных автомобилей');
    }
    const cars = await response.json();
    displayPopularCars(cars);
  } catch (error) {
    console.error('Ошибка загрузки популярных автомобилей:', error);
    // Если ошибка, показываем заглушку
    const container = document.getElementById('popular-cars-container');
    if (container) {
      container.innerHTML = '<div class="swiper-slide box"><p>Популярные автомобили временно недоступны</p></div>';
    }
  }
}

// Отображение популярных автомобилей
function displayPopularCars(cars) {
  const container = document.getElementById('popular-cars-container');
  if (!container) return;
  
  // Если нет автомобилей, показываем сообщение
  if (!cars || cars.length === 0) {
    container.innerHTML = '<div class="swiper-slide box"><p>Популярные автомобили появятся после первых заказов</p></div>';
    // Инициализируем Swiper даже с одним слайдом
    if (typeof Swiper !== 'undefined' && !popularCarsSwiper) {
      popularCarsSwiper = new Swiper(".vehicles-slider", {
        grabCursor: true,
        centeredSlides: true,
        spaceBetween: 20,
        loop: false,
        pagination: {
          el: ".vehicles-slider .swiper-pagination",
          clickable: true,
        },
        breakpoints: {
          0: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
      });
    }
    return;
  }
  
  container.innerHTML = cars.map(car => {
    // Получаем изображение из БД или используем заглушку
    let carImageUrl = '/client/assets/img/default.png';
    let carImageAlt = `${car.brand} ${car.model}`;
    
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      carImageUrl = car.images[0].image_url;
      carImageAlt = car.images[0].description || `${car.brand} ${car.model}`;
    }
    
    const formattedPrice = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD'
    }).format(car.price);
    
    return `
      <div class="swiper-slide box">
        <img src="${carImageUrl}" alt="${carImageAlt}" onerror="this.src='/client/assets/img/default.png'">
        <div class="content">
          <h3>${car.brand} ${car.model}</h3>
          <div class="price"> <span>Цена : </span> ${formattedPrice} </div>
          <a href="/client/html/car-details.html?id=${car.id}" class="btn">Посмотреть</a>
        </div>
      </div>
    `;
  }).join('');
  
  // Инициализируем Swiper после загрузки данных
  if (typeof Swiper !== 'undefined') {
    // Уничтожаем предыдущий Swiper, если он существует
    if (popularCarsSwiper) {
      popularCarsSwiper.destroy(true, true);
    }
    
    popularCarsSwiper = new Swiper(".vehicles-slider", {
      grabCursor: true,
      centeredSlides: true,
      spaceBetween: 20,
      loop: cars.length > 3,
      autoplay: {
        delay: 9500,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".vehicles-slider .swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        0: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
  }
}

// Swiper-слайдеры для других секций
const swiperSettings = {
  grabCursor: true,
  centeredSlides: true,
  spaceBetween: 20,
  loop: true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  breakpoints: {
    0: { slidesPerView: 1 },
    768: { slidesPerView: 2 },
    1024: { slidesPerView: 3 },
  },
};

// Загрузка новых автомобилей
let newCarsTopSwiper = null;
let newCarsBottomSwiper = null;

async function loadNewCars() {
  try {
    const response = await fetch('http://localhost:4200/api/cars/new?limit=8');
    if (!response.ok) {
      throw new Error('Ошибка загрузки новых автомобилей');
    }
    const cars = await response.json();
    displayNewCars(cars);
  } catch (error) {
    console.error('Ошибка загрузки новых автомобилей:', error);
    // Если ошибка, показываем заглушку
    const containerTop = document.getElementById('new-cars-container-top');
    const containerBottom = document.getElementById('new-cars-container-bottom');
    if (containerTop) {
      containerTop.innerHTML = '<div class="swiper-slide box"><p>Новые автомобили временно недоступны</p></div>';
    }
    if (containerBottom) {
      containerBottom.innerHTML = '';
    }
  }
}

// Отображение новых автомобилей
function displayNewCars(cars) {
  const containerTop = document.getElementById('new-cars-container-top');
  const containerBottom = document.getElementById('new-cars-container-bottom');
  
  if (!containerTop || !containerBottom) return;
  
  if (!cars || cars.length === 0) {
    containerTop.innerHTML = '<div class="swiper-slide box"><p>Новые автомобили появятся после добавления</p></div>';
    containerBottom.innerHTML = '';
    return;
  }
  
  // Первые 4 автомобиля
  const topCars = cars.slice(0, 4);
  containerTop.innerHTML = topCars.map(car => createNewCarSlide(car)).join('');
  
  // Следующие 4 автомобиля
  const bottomCars = cars.slice(4, 8);
  containerBottom.innerHTML = bottomCars.map(car => createNewCarSlide(car)).join('');
  
  // Инициализируем Swiper для верхнего слайдера
  if (typeof Swiper !== 'undefined') {
    if (newCarsTopSwiper) {
      newCarsTopSwiper.destroy(true, true);
    }
    newCarsTopSwiper = new Swiper(".featured-slider-top", {
      ...swiperSettings,
      loop: topCars.length > 3,
    });
    
    // Инициализируем Swiper для нижнего слайдера
    if (newCarsBottomSwiper) {
      newCarsBottomSwiper.destroy(true, true);
    }
    if (bottomCars.length > 0) {
      newCarsBottomSwiper = new Swiper(".featured-slider-bottom", {
        ...swiperSettings,
        loop: bottomCars.length > 3,
      });
    }
  }
}

// Создание слайда для нового автомобиля
function createNewCarSlide(car) {
  // Получаем изображение из БД или используем заглушку
  let carImageUrl = '/client/assets/img/default.png';
  let carImageAlt = `${car.brand} ${car.model}`;
  
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    carImageUrl = car.images[0].image_url;
    carImageAlt = car.images[0].description || `${car.brand} ${car.model}`;
  }
  
  const formattedPrice = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD'
  }).format(car.price);
  
  return `
    <div class="swiper-slide box">
      <img src="${carImageUrl}" alt="${carImageAlt}" onerror="this.src='/client/assets/img/default.png'">
      <div class="content">
        <h3>${car.brand} ${car.model}</h3>
        <div class="stars">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star-half-alt"></i>
        </div>
        <div class="price">${formattedPrice}</div>
        <a href="/client/html/car-details.html?id=${car.id}" class="btn">Посмотреть</a>
      </div>
    </div>
  `;
}

// Загрузка отзывов
let reviewsSwiper = null;

async function loadReviews() {
  try {
    const response = await fetch('http://localhost:4200/api/reviews/best?limit=6');
    if (!response.ok) {
      throw new Error('Ошибка загрузки отзывов');
    }
    const reviews = await response.json();
    displayReviews(reviews);
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error);
    // Если ошибка, показываем заглушку
    const container = document.getElementById('reviews-container');
    if (container) {
      container.innerHTML = '<div class="swiper-slide box"><p>Отзывы временно недоступны</p></div>';
    }
  }
}

// Отображение отзывов
function displayReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;
  
  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<div class="swiper-slide box"><p>Отзывы появятся после первых заказов</p></div>';
    // Инициализируем Swiper даже с одним слайдом
    if (typeof Swiper !== 'undefined' && !reviewsSwiper) {
      reviewsSwiper = new Swiper(".review-slider", {
        ...swiperSettings,
        loop: false,
      });
    }
    return;
  }
  
  container.innerHTML = reviews.map(review => createReviewSlide(review)).join('');
  
  // Инициализируем Swiper после загрузки данных
  if (typeof Swiper !== 'undefined') {
    if (reviewsSwiper) {
      reviewsSwiper.destroy(true, true);
    }
    reviewsSwiper = new Swiper(".review-slider", {
      ...swiperSettings,
      loop: reviews.length > 3,
    });
  }
}

// Создание слайда для отзыва
function createReviewSlide(review) {
  // Генерируем звезды на основе рейтинга
  const starsHtml = Array.from({ length: 5 }, (_, i) => {
    if (i < review.rating) {
      return '<i class="fas fa-star"></i>';
    } else {
      return '<i class="far fa-star"></i>';
    }
  }).join('');
  
  const carInfo = review.car_brand && review.car_model 
    ? `${review.car_brand} ${review.car_model}` 
    : 'Автомобиль';
  
  return `
    <div class="swiper-slide box">
      <img src="/client/assets/img/default.png" alt="${review.user_name || 'Пользователь'}" onerror="this.src='/client/assets/img/default.png'">
      <div class="content">
        <p>${review.comment || 'Отличный автомобиль!'}</p>
        <h3>${review.user_name || 'Пользователь'}</h3>
        <p class="review-car" style="font-size: 1.2rem; color: #666; margin-bottom: 0.5rem;">${carInfo}</p>
        <div class="stars">
          ${starsHtml}
        </div>
      </div>
    </div>
  `;
}

// Инициализация других слайдеров
if (typeof Swiper !== 'undefined') {
  // review-slider будет инициализирован после загрузки отзывов
}

// Авторизация: отображение имени и аватарки
window.addEventListener("DOMContentLoaded", () => {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  const loginBtnBlock = document.querySelector("#login-btn");
  const userInfoBlock = document.querySelector("#user-info");

  if (user) {
    // Скрыть блок входа
    if (loginBtnBlock) loginBtnBlock.style.display = "none";

    // Показать имя, аватарку и (для админов) ссылку в их панель
    if (userInfoBlock) {
      const isManager = Number(user.role_id) === 1;
      const isSysAdmin = Number(user.role_id) === 2;

      let adminLinkHtml = "";
      if (isManager) {
        adminLinkHtml = `<button id="go-to-admin" class="btn">Панель менеджера</button>`;
      } else if (isSysAdmin) {
        adminLinkHtml = `<button id="go-to-admin" class="btn">Панель системного администратора</button>`;
      }

      userInfoBlock.innerHTML = `
        <div class="user-avatar" id="user-avatar-clickable" style="cursor: pointer;">
          <img src="/client/assets/img/default.png" alt="Аватар" />
        </div>
        <div class="user-name">Привет, ${user.name}!</div>
        ${adminLinkHtml}
        <button id="logout-btn" class="btn">Выйти</button>
      `;
      
      // Добавляем стили для кнопок админ-панели
      const style = document.createElement('style');
      style.textContent = `
        #user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        #user-info .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid var(--yellow, #f9d806);
        }
        #user-info .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        #user-info .user-name {
          font-size: 1.4rem;
          white-space: nowrap;
        }
        #go-to-admin {
          padding: 0.5rem 1rem;
          font-size: 1.2rem;
        }
        #logout-btn {
          padding: 0.5rem 1rem;
          font-size: 1.2rem;
          white-space: nowrap;
        }
      `;
      if (!document.getElementById('user-info-styles')) {
        style.id = 'user-info-styles';
        document.head.appendChild(style);
      }
    }

    // Обработка выхода
    document.querySelector("#logout-btn")?.addEventListener("click", () => {
      // Полностью очищаем состояние авторизации,
      // чтобы на всех страницах (включая каталог) хедер обновился одинаково
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
      window.location.reload(); // или window.location.href = "/login.html";
    });

    // Переход в админ-панель по роли
    document.querySelector("#go-to-admin")?.addEventListener("click", () => {
      if (Number(user.role_id) === 1) {
        window.location.href = "/client/html/manager-dashboard.html";
      } else if (Number(user.role_id) === 2) {
        window.location.href = "/client/html/sysadmin-dashboard.html";
      }
    });

    // Инициализация меню пользователя и последних вопросов
    initUserMenu(user);
    initMyQuestions(user);
  }
  
  // Загружаем популярные автомобили, новые автомобили и отзывы после инициализации страницы
  loadPopularCars();
  loadNewCars();
  loadReviews();
  setupContactForm();
});

// Инициализация меню пользователя
function initUserMenu(user) {
  const userAvatar = document.getElementById('user-avatar-clickable');
  const userMenu = document.getElementById('user-menu');
  const menuName = document.getElementById('user-menu-name');
  const menuEmail = document.getElementById('user-menu-email');
  const editNameBtn = document.getElementById('edit-name-btn');
  const editPasswordBtn = document.getElementById('edit-password-btn');
  const menuLogoutBtn = document.getElementById('menu-logout-btn');

  if (!userAvatar || !userMenu) return;

  // Заполняем информацию в меню
  if (menuName) menuName.textContent = user.name;
  if (menuEmail) menuEmail.textContent = user.email;

  // Открытие/закрытие меню по клику на аватарку
  userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('active');
  });

  // Закрытие меню при клике вне его
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target) && !userAvatar.contains(e.target)) {
      userMenu.classList.remove('active');
    }
  });

  // Обработчики кнопок меню
  editNameBtn?.addEventListener('click', () => {
    userMenu.classList.remove('active');
    openEditNameModal(user);
  });

  editPasswordBtn?.addEventListener('click', () => {
    userMenu.classList.remove('active');
    openEditPasswordModal();
  });

  menuLogoutBtn?.addEventListener('click', () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    window.location.reload();
  });
}

// Открытие модального окна для изменения имени
function openEditNameModal(user) {
  const modal = document.getElementById('edit-name-modal');
  const form = document.getElementById('edit-name-form');
  const input = document.getElementById('new-name-input');

  if (!modal || !form || !input) return;

  input.value = user.name;
  modal.style.display = 'block';

  // Закрытие модального окна
  const closeBtn = modal.querySelector('.modal-close');
  const closeHandler = () => {
    modal.style.display = 'none';
  };
  
  // Удаляем старые обработчики и добавляем новые
  closeBtn?.removeEventListener('click', closeHandler);
  closeBtn?.addEventListener('click', closeHandler);

  const clickHandler = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      window.removeEventListener('click', clickHandler);
    }
  };
  window.addEventListener('click', clickHandler);

  // Обработка отправки формы
  const submitHandler = async (e) => {
    e.preventDefault();
    const newName = input.value.trim();

    if (!newName) {
      alert('Имя не может быть пустым');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4200/api/users/${user.id}/name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Ошибка при изменении имени');
      }

      const data = await response.json();
      
      // Обновляем данные пользователя в localStorage
      const updatedUser = { ...user, name: newName };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Обновляем отображение имени
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl) userNameEl.textContent = `Привет, ${newName}!`;

      const menuNameEl = document.getElementById('user-menu-name');
      if (menuNameEl) menuNameEl.textContent = newName;

      alert('Имя успешно изменено!');
      modal.style.display = 'none';
      form.removeEventListener('submit', submitHandler);
    } catch (error) {
      console.error('Ошибка при изменении имени:', error);
      alert('Ошибка при изменении имени: ' + error.message);
    }
  };

  form.removeEventListener('submit', submitHandler);
  form.addEventListener('submit', submitHandler);
}

// Открытие модального окна для изменения пароля
function openEditPasswordModal() {
  const modal = document.getElementById('edit-password-modal');
  const form = document.getElementById('edit-password-form');
  const currentPasswordInput = document.getElementById('current-password-input');
  const newPasswordInput = document.getElementById('new-password-input');
  const confirmPasswordInput = document.getElementById('confirm-password-input');

  if (!modal || !form) return;

  form.reset();
  modal.style.display = 'block';

  // Закрытие модального окна
  const closeBtn = modal.querySelector('.modal-close');
  const closeHandler = () => {
    modal.style.display = 'none';
    form.reset();
  };
  
  closeBtn?.removeEventListener('click', closeHandler);
  closeBtn?.addEventListener('click', closeHandler);

  const clickHandler = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      form.reset();
      window.removeEventListener('click', clickHandler);
    }
  };
  window.addEventListener('click', clickHandler);

  // Обработка отправки формы
  const submitHandler = async (e) => {
    e.preventDefault();
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    if (!user) {
      alert('Пользователь не авторизован');
      return;
    }

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if (newPassword.length < 8) {
      alert('Новый пароль должен содержать минимум 8 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Новые пароли не совпадают');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4200/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Ошибка при изменении пароля');
      }

      alert('Пароль успешно изменён!');
      modal.style.display = 'none';
      form.reset();
      form.removeEventListener('submit', submitHandler);
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      alert('Ошибка при изменении пароля: ' + error.message);
    }
  };

  form.removeEventListener('submit', submitHandler);
  form.addEventListener('submit', submitHandler);
}

// Инициализация функции "Последние вопросы"
function initMyQuestions(user) {
  const showQuestionsBtn = document.getElementById('show-my-questions-btn');
  const myQuestionsModal = document.getElementById('my-questions-modal');
  const questionsList = document.getElementById('my-questions-list');

  if (!showQuestionsBtn || !myQuestionsModal || !questionsList) return;

  // Показываем кнопку только для авторизованных пользователей
  showQuestionsBtn.style.display = 'inline-block';

  // Обработчик открытия модального окна
  showQuestionsBtn.addEventListener('click', async () => {
    myQuestionsModal.style.display = 'block';
    await loadMyQuestions(user.id, questionsList);
  });

  // Закрытие модального окна
  const closeBtn = myQuestionsModal.querySelector('.modal-close');
  const closeHandler = () => {
    myQuestionsModal.style.display = 'none';
  };
  
  closeBtn?.removeEventListener('click', closeHandler);
  closeBtn?.addEventListener('click', closeHandler);

  // Закрытие при клике вне модального окна
  myQuestionsModal.addEventListener('click', (e) => {
    if (e.target === myQuestionsModal) {
      myQuestionsModal.style.display = 'none';
    }
  });
}

// Загрузка вопросов пользователя
async function loadMyQuestions(userId, container) {
  try {
    const response = await fetch(`http://localhost:4200/api/faq/user/${userId}`);
    if (!response.ok) {
      throw new Error('Ошибка загрузки вопросов');
    }

    const questions = await response.json();

    if (!questions || questions.length === 0) {
      container.innerHTML = '<p class="no-questions">У вас пока нет вопросов</p>';
      return;
    }

    container.innerHTML = questions.map(q => createQuestionCard(q)).join('');
  } catch (error) {
    console.error('Ошибка при загрузке вопросов:', error);
    container.innerHTML = '<p class="error-message">Ошибка при загрузке вопросов</p>';
  }
}

// Создание карточки вопроса
function createQuestionCard(question) {
  const statusClass = question.status === 'pending' ? 'status-pending' : 'status-answered';
  const statusText = question.status === 'pending' ? 'В ожидании' : 'Отвечено';
  const date = new Date(question.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="question-card">
      <div class="question-header">
        <h3 class="question-theme">${question.theme || 'Без темы'}</h3>
        <span class="question-status ${statusClass}">${statusText}</span>
      </div>
      <div class="question-date">${date}</div>
      <div class="question-text">
        <strong>Вопрос:</strong>
        <p>${question.question || ''}</p>
      </div>
      ${question.answer ? `
        <div class="question-answer">
          <strong>Ответ:</strong>
          <p>${question.answer}</p>
        </div>
      ` : ''}
    </div>
  `;
}

// Настройка формы обратной связи
function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const themeInput = document.getElementById('contact-theme');
    const messageInput = document.getElementById('contact-message');

    const theme = themeInput.value.trim();
    const question = messageInput.value.trim();

    if (!theme || !question) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    // Получаем ID пользователя, если он авторизован
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const user_id = user ? user.id : null;

    try {
      const response = await fetch('http://localhost:4200/api/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme,
          question: question,
          user_id: user_id
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Ошибка при отправке сообщения');
      }

      alert('Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.');
      contactForm.reset();
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      alert('Ошибка при отправке сообщения: ' + error.message);
    }
  });
}
