"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const user = localStorage.getItem("user");
  const loginRoot = document.querySelector(".login-root");
  const loginSuccess = document.getElementById("loginSuccess");

  // Check if user is really authenticated
  if (token && isAuthenticated === "true" && user) {
    try {
      const userData = JSON.parse(user);
      // Дополнительная проверка - есть ли у пользователя ID
      if (userData && userData.id) {
        loginRoot.style.display = "none";
        loginSuccess.style.display = "flex";
      } else {
        throw new Error("Invalid user data");
      }
    } catch (error) {
      // Если данные повреждены - очищаем и показываем форму входа
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
      loginRoot.style.display = "flex";
      loginSuccess.style.display = "none";
    }
  } else {
    loginRoot.style.display = "flex";
    loginSuccess.style.display = "none";
  }

  const passwordInput = document.getElementById("passwordInput");
  const togglePassword = document.getElementById("togglePassword");
  const togglePasswordIcon = togglePassword?.querySelector("i");

  togglePassword?.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePasswordIcon.classList.toggle("bx-show");
    togglePasswordIcon.classList.toggle("bx-hide");
  });

  // Registration fields elements
  const formTitle = document.querySelector("h1");
  const formSubtitle = document.querySelector(
    ".formbg-inner .padding-bottom--15"
  );
  const switchModeLink = document.getElementById("switch-mode-link");
  const accountSwitchText = document.getElementById("account-switch-text");
  const loginForm = document.getElementById("stripe-login");

  // Безопасное получение элементов
  const usernameField = document.querySelector(
    '.field label[for="usernameInput"]'
  )?.parentElement;
  const passwordField = document.querySelector(
    '.field label[for="passwordInput"]'
  )?.parentElement;
  const forgotPasswordLink = document.querySelector(".reset-pass"); // Добавляем ссылку "Забыли пароль"
  const checkboxField = document.querySelector(".field-checkbox");
  const ssoLink = document.querySelector(".ssolink");
  const submitButton = document.querySelector('input[type="submit"]');

  // Проверяем, что необходимые элементы существуют
  if (!loginForm || !usernameField || !passwordField) {
    console.error("Не найдены необходимые элементы формы");
    return;
  }

  let isRegisterMode = false;

  // Создаем поля для регистрации
  const nameField = createField("name", "Имя", "text");
  const emailField = createField("email", "Email", "email");
  const confirmPasswordField = createConfirmPasswordField();

  // Перемещаем поля в правильном порядке: Имя -> Email -> Пароль -> Подтверждение пароля
  if (passwordField && nameField) {
    passwordField.parentNode.insertBefore(nameField, passwordField);
  }
  if (passwordField && emailField) {
    passwordField.parentNode.insertBefore(emailField, passwordField);
  }
  // Вставляем поле подтверждения пароля после поля пароля (перед следующим элементом)
  if (passwordField && confirmPasswordField) {
    const passwordContainer = passwordField.parentNode;
    passwordContainer.parentNode.insertBefore(
      confirmPasswordField,
      passwordContainer.nextSibling
    );
  }

  // Toggle between login and register modes
  switchModeLink?.addEventListener("click", function (e) {
    e.preventDefault();
    toggleFormMode();
  });

  function toggleFormMode() {
    isRegisterMode = !isRegisterMode;

    if (isRegisterMode) {
      enableRegisterMode();
    } else {
      enableLoginMode();
    }
  }

  function enableRegisterMode() {
    formTitle.textContent = "Форма регистрации";
    formSubtitle.textContent = "Создайте новый аккаунт";
    submitButton.value = "Зарегистрироваться";

    if (switchModeLink && accountSwitchText) {
      switchModeLink.textContent = "Войти";
      accountSwitchText.innerHTML =
        'Уже есть аккаунт? <a href="#" id="switch-mode-link">Войти</a>';
    }

    // Show registration fields, hide login fields
    if (usernameField) usernameField.style.display = "none";
    if (nameField) nameField.style.display = "block";
    if (emailField) emailField.style.display = "block";
    if (confirmPasswordField) confirmPasswordField.style.display = "block";
    if (checkboxField) checkboxField.style.display = "none";
    if (ssoLink) ssoLink.style.display = "none";
    if (forgotPasswordLink) forgotPasswordLink.style.display = "none"; // Скрываем "Забыли пароль"

    // Update event listener
    loginForm.removeEventListener("submit", handleLogin);
    loginForm.addEventListener("submit", handleRegister);

    // Re-attach event listener to the new link
    const newLink = document.getElementById("switch-mode-link");
    if (newLink) {
      newLink.addEventListener("click", function (e) {
        e.preventDefault();
        toggleFormMode();
      });
    }
  }

  function enableLoginMode() {
    formTitle.textContent = "Форма входа";
    formSubtitle.textContent = "Войдите в свой аккаунт";
    submitButton.value = "Продолжить";

    if (switchModeLink && accountSwitchText) {
      switchModeLink.textContent = "Зарегистрироваться";
      accountSwitchText.innerHTML =
        'Нет аккаунта? <a href="#" id="switch-mode-link">Зарегистрироваться</a>';
    }

    // Hide registration fields, show login fields
    if (usernameField) usernameField.style.display = "block";
    if (nameField) nameField.style.display = "none";
    if (emailField) emailField.style.display = "none";
    if (confirmPasswordField) confirmPasswordField.style.display = "none";
    if (checkboxField) checkboxField.style.display = "flex";
    if (ssoLink) ssoLink.style.display = "block";
    if (forgotPasswordLink) forgotPasswordLink.style.display = "block"; // Показываем "Забыли пароль"

    // Update event listener
    loginForm.removeEventListener("submit", handleRegister);
    loginForm.addEventListener("submit", handleLogin);

    // Re-attach event listener to the new link
    const newLink = document.getElementById("switch-mode-link");
    if (newLink) {
      newLink.addEventListener("click", function (e) {
        e.preventDefault();
        toggleFormMode();
      });
    }
  }

  function createField(name, label, type) {
    const field = document.createElement("div");
    field.className = "field padding-bottom--24";
    field.style.display = "none";

    const labelElement = document.createElement("label");
    labelElement.setAttribute("for", `${name}Input`);
    labelElement.textContent = label;

    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.id = `${name}Input`;
    input.autocomplete = "off";

    field.appendChild(labelElement);
    field.appendChild(input);

    return field;
  }

  function createConfirmPasswordField() {
    const field = document.createElement("div");
    field.className = "field padding-bottom--24";
    field.style.display = "none";

    const label = document.createElement("label");
    label.setAttribute("for", "confirmPasswordInput");
    label.textContent = "Подтверждение пароля";

    const passwordContainer = document.createElement("div");
    passwordContainer.className = "password-container";

    const input = document.createElement("input");
    input.type = "password";
    input.name = "confirmPassword";
    input.id = "confirmPasswordInput";
    input.autocomplete = "off";
    // input.required = true; // УБРАНО для избежания ошибок HTML5 валидации

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "toggle-password";
    toggleButton.innerHTML = '<i class="bx bx-show"></i>';

    toggleButton.addEventListener("click", function () {
      const type =
        input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
      const icon = toggleButton.querySelector("i");
      icon.classList.toggle("bx-show");
      icon.classList.toggle("bx-hide");
    });

    passwordContainer.appendChild(input);
    passwordContainer.appendChild(toggleButton);
    field.appendChild(label);
    field.appendChild(passwordContainer);

    return field;
  }

  // Password validation function
  function validatePassword(password, confirmPassword) {
    const errors = [];

    if (password.length < 8) {
      errors.push("Пароль должен содержать минимум 8 символов");
    }

    if (password !== confirmPassword) {
      errors.push("Пароли не совпадают");
    }

    return errors;
  }

  // Login handler
  async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("usernameInput")?.value;
    const password = document.getElementById("passwordInput")?.value;

    // Clear previous errors
    clearErrors();

    // Validate required fields
    if (!username || !password) {
      showError("Все поля обязательны для заполнения");
      return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.value = "Вход...";

    try {
      const res = await fetch("http://localhost:4200/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка входа");
      }

      // ФИКС: проверяем, что авторизация действительно успешна
      if (data.user && data.user.id) {
        // Сохраняем данные только при успешной авторизации
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", `user-token-${data.user.id}`);
        localStorage.setItem("isAuthenticated", "true"); // Добавляем флаг авторизации

        // Показываем сообщение об успешном входе
        loginRoot.style.display = "none";
        loginSuccess.style.display = "flex";

        // Redirect в зависимости от роли
        setTimeout(() => {
          redirectByRole(data.user.role_id);
        }, 2000);
      } else {
        throw new Error("Ошибка авторизации: неверные данные пользователя");
      }
    } catch (err) {
      console.error("Ошибка входа:", err);
      showError(err.message);

      // ФИКС: очищаем данные при неудачной авторизации
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
    } finally {
      // Reset loading state
      submitButton.disabled = false;
      submitButton.value = "Продолжить";
    }
  }

  // Registration handler
  async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById("nameInput")?.value;
    const email = document.getElementById("emailInput")?.value;
    const password = document.getElementById("passwordInput")?.value;
    const confirmPassword = document.getElementById(
      "confirmPasswordInput"
    )?.value;

    // Clear previous errors
    clearErrors();

    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      showError("Все поля обязательны для заполнения");
      return;
    }

    // Validate password
    const passwordErrors = validatePassword(password, confirmPassword);
    if (passwordErrors.length > 0) {
      passwordErrors.forEach((error) => showError(error));
      return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.value = "Регистрация...";

    try {
      const res = await fetch("http://localhost:4200/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

      // ФИКС: проверяем, что регистрация действительно успешна
      if (data.user && data.user.id) {
        // Сохраняем данные только при успешной регистрации
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", `user-token-${data.user.id}`);
        localStorage.setItem("isAuthenticated", "true"); // Добавляем флаг авторизации

        loginRoot.style.display = "none";
        loginSuccess.style.display = "flex";

        // Redirect в зависимости от роли (по умолчанию обычный пользователь)
        setTimeout(() => {
          redirectByRole(data.user.role_id);
        }, 2000);
      } else {
        throw new Error("Ошибка регистрации: неверные данные пользователя");
      }
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      showError(err.message);

      // ФИКС: очищаем данные при неудачной регистрации
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
    } finally {
      // Reset loading state
      submitButton.disabled = false;
      submitButton.value = "Зарегистрироваться";
    }
  }

  // Helper function to show errors
  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.style.color = "#ff0000";
    errorDiv.style.marginTop = "10px";
    errorDiv.style.padding = "10px";
    errorDiv.style.backgroundColor = "#ffe6e6";
    errorDiv.style.borderRadius = "5px";
    errorDiv.style.border = "1px solid #ff0000";
    errorDiv.textContent = message;

    // Remove existing errors
    const existingError = loginForm.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    loginForm.appendChild(errorDiv);
  }

  // Helper function to clear errors
  function clearErrors() {
    const existingError = loginForm.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }
  }

  // Initialize with login handler
  loginForm.addEventListener("submit", handleLogin);
});

// Глобальная функция перенаправления по роли пользователя
function redirectByRole(roleId) {
  switch (roleId) {
    case 1: // менеджер / администратор
      window.location.href = "/client/html/manager-dashboard.html";
      break;
    case 2: // системный администратор
      window.location.href = "/client/html/sysadmin-dashboard.html";
      break;
    case 3: // обычный пользователь
    default:
      window.location.href = "/client/html/main.html";
      break;
  }
}

// Dark and light Mood
document.addEventListener("DOMContentLoaded", () => {
  const modeSwitch = document.querySelector(".mode-switch");
  const darkModeStored = localStorage.getItem("darkMode");

  if (darkModeStored === "true") {
    document.documentElement.classList.add("dark");
    modeSwitch.classList.add("active");
  }

  modeSwitch?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    modeSwitch.classList.toggle("active");
    localStorage.setItem(
      "darkMode",
      document.documentElement.classList.contains("dark")
    );
  });
});
