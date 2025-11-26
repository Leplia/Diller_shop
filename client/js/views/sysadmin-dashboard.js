const API_BASE = 'http://localhost:4200/api';
let users = [];

document.addEventListener('DOMContentLoaded', () => {
  const usersTableBody = document.querySelector('#users-table tbody');

  initAuthHeader();
  loadUsers();

  async function loadUsers() {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error('Ошибка загрузки пользователей');
      users = await res.json();

      usersTableBody.innerHTML = '';
      users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${roleToText(user.role_id)}</td>
          <td>${user.is_blocked ? 'Заблокирован' : 'Активен'}</td>
          <td>
            <button class="btn btn-small" data-id="${user.id}" data-action="block">
              ${user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
            </button>
            <button class="btn btn-small btn-danger" data-id="${user.id}" data-action="delete">
              Удалить
            </button>
            <button class="btn btn-small" data-id="${user.id}" data-action="role-manager">
              Сделать менеджером
            </button>
            <button class="btn btn-small" data-id="${user.id}" data-action="role-sysadmin">
              Сделать системным админом
            </button>
          </td>
        `;
        usersTableBody.appendChild(tr);
      });

      usersTableBody.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = Number(btn.getAttribute('data-id'));
          const action = btn.getAttribute('data-action');
          await handleUserAction(id, action);
          await loadUsers();
        });
      });
    } catch (e) {
      console.error(e);
      usersTableBody.innerHTML = '<tr><td colspan="6">Ошибка загрузки пользователей</td></tr>';
    }
  }

  async function handleUserAction(id, action) {
    try {
      if (action === 'delete') {
        if (!confirm(`Удалить пользователя #${id}?`)) return;
        const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Ошибка при удалении пользователя');
        }
        alert('Пользователь успешно удалён');
        return;
      }

      if (action === 'block') {
        const user = users.find(u => u.id === id);
        if (!user) return;
        const shouldBlock = !user.is_blocked;
        const res = await fetch(`${API_BASE}/users/${id}/block`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ block: shouldBlock }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Ошибка при изменении блокировки');
        }
        alert(shouldBlock ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
        return;
      }

      if (action === 'role-manager' || action === 'role-sysadmin') {
        const role_id = action === 'role-manager' ? 1 : 2;
        const roleName = action === 'role-manager' ? 'менеджером' : 'системным администратором';
        if (!confirm(`Назначить пользователя #${id} ${roleName}?`)) return;
        
        const res = await fetch(`${API_BASE}/users/${id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Ошибка при изменении роли');
        }
        alert(`Пользователь теперь ${roleName}`);
        return;
      }
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  }
});

function roleToText(roleId) {
  switch (roleId) {
    case 1:
      return 'Менеджер / администратор';
    case 2:
      return 'Системный администратор';
    case 3:
    default:
      return 'Пользователь';
  }
}

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
