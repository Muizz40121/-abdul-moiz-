// Shared JavaScript for OLX Marketplace

// ===================== AUTHENTICATION MODULE =====================
const Auth = {
  usersKey: 'olx_users',
  sessionKey: 'olx_session',

  getUsers() {
    return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
  },

  saveUsers(users) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  },

  getSession() {
    return JSON.parse(localStorage.getItem(this.sessionKey) || 'null');
  },

  saveSession(user) {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.sessionKey);
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  getCurrentUser() {
    return this.getSession();
  },

  register(firstName, lastName, email, phone, password) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    const newUser = {
      id: Date.now(),
      firstName,
      lastName,
      email,
      phone,
      password,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return { success: true, message: 'Account created successfully! Redirecting to login...' };
  },

  login(email, password, remember) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }
    const sessionUser = { ...user };
    delete sessionUser.password;
    this.saveSession(sessionUser);
    return { success: true, message: 'Login successful! Redirecting...' };
  },

  logout() {
    this.clearSession();
    window.location.href = '/';
  },

  getFullName(user) {
    return user ? `${user.firstName} ${user.lastName}` : '';
  }
};

// ===================== AUTH UI UPDATER =====================
function updateAuthUI() {
  try {
    const user = Auth.getCurrentUser();
    const isLoggedIn = Auth.isLoggedIn();

    document.querySelectorAll('[data-guest-menu]').forEach(el => el.style.display = isLoggedIn ? 'none' : '');
    document.querySelectorAll('[data-user-menu]').forEach(el => el.style.display = isLoggedIn ? 'flex' : 'none');
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = isLoggedIn ? Auth.getFullName(user) : 'User');
  } catch (e) {}
}

// ===================== HANDLE AUTH FORMS =====================
function handleRegister(e) {
  e.preventDefault();
  const msg = document.getElementById('registerMessage');
  if (!msg) return;
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  if (password.length < 8) {
    msg.className = 'alert alert-danger'; msg.textContent = 'Password must be at least 8 characters.'; msg.classList.remove('d-none');
    return;
  }
  if (password !== confirmPassword) {
    msg.className = 'alert alert-danger'; msg.textContent = 'Passwords do not match.'; msg.classList.remove('d-none');
    return;
  }
  const result = Auth.register(
    document.getElementById('regFirstName').value.trim(),
    document.getElementById('regLastName').value.trim(),
    document.getElementById('regEmail').value.trim(),
    document.getElementById('regPhone').value.trim(),
    password
  );
  msg.className = result.success ? 'alert alert-success' : 'alert alert-danger';
  msg.textContent = result.message;
  msg.classList.remove('d-none');
  if (result.success) {
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  }
}

function handleLogin(e) {
  e.preventDefault();
  const msg = document.getElementById('loginMessage');
  if (!msg) return;
  const result = Auth.login(
    document.getElementById('loginEmail').value.trim(),
    document.getElementById('loginPassword').value,
    document.getElementById('remember').checked
  );
  msg.className = result.success ? 'alert alert-success' : 'alert alert-danger';
  msg.textContent = result.message;
  msg.classList.remove('d-none');
  if (result.success) {
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || '../index.html';
    }, 1000);
  }
}

// ===================== DOM READY =====================
document.addEventListener('DOMContentLoaded', function () {

  updateAuthUI();

  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', function (e) { e.preventDefault(); Auth.logout(); });
  });

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    const btn = registerForm.querySelector('button[type="submit"]');
    if (btn) btn.addEventListener('click', handleRegister);
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    const btn = loginForm.querySelector('button[type="submit"]');
    if (btn) btn.addEventListener('click', handleLogin);
  }

  const protectedPaths = ['my-ads.html', 'favorites.html', 'messages.html', 'profile.html', 'post-ad.html'];
  const currentPage = window.location.pathname.split('/').pop();
  if (protectedPaths.includes(currentPage) && !Auth.isLoggedIn()) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
  }

  // --- Mobile search toggle ---
  const searchToggle = document.getElementById('searchToggle');
  const mobileSearch = document.getElementById('mobileSearch');
  if (searchToggle && mobileSearch) {
    searchToggle.addEventListener('click', function () {
      mobileSearch.classList.toggle('d-none');
    });
  }

  // --- Favorite toggle ---
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.toggle('active');
      const icon = this.querySelector('i');
      icon.className = this.classList.contains('active') ? 'fas fa-heart' : 'far fa-heart';
    });
  });

  // --- Product gallery thumbnail switcher ---
  const thumbs = document.querySelectorAll('.gallery-thumbs img');
  const mainImg = document.querySelector('.gallery-main img');
  if (thumbs.length && mainImg) {
    thumbs.forEach(img => {
      img.addEventListener('click', function () {
        thumbs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        mainImg.src = this.src;
        mainImg.alt = this.alt;
      });
    });
  }

  // --- Image upload preview ---
  const uploadInput = document.getElementById('adImages');
  const previewContainer = document.getElementById('imagePreview');
  if (uploadInput && previewContainer) {
    uploadInput.addEventListener('change', function () {
      previewContainer.innerHTML = '';
      Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
          const col = document.createElement('div');
          col.className = 'col-4 col-md-3';
          const img = document.createElement('img');
          img.src = e.target.result;
          img.className = 'img-fluid rounded shadow-sm';
          img.style.height = '100px';
          img.style.objectFit = 'cover';
          col.appendChild(img);
          previewContainer.appendChild(col);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // --- Toggle password visibility ---
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
      const target = document.querySelector(this.dataset.target);
      if (target) {
        const type = target.getAttribute('type') === 'password' ? 'text' : 'password';
        target.setAttribute('type', type);
        this.querySelector('i').className = type === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
      }
    });
  });

  // --- Admin sidebar toggle ---
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  if (sidebarToggle && adminSidebar) {
    sidebarToggle.addEventListener('click', function () {
      adminSidebar.classList.toggle('show');
    });
  }

  // --- Select all checkbox in admin tables ---
  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      document.querySelectorAll('.select-item').forEach(cb => cb.checked = this.checked);
    });
  }

  // --- Auto-dismiss alerts ---
  document.querySelectorAll('.alert-dismissible').forEach(alert => {
    setTimeout(() => {
      alert.classList.add('fade');
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });

  // --- Price range display ---
  const priceRange = document.getElementById('priceRange');
  const priceValue = document.getElementById('priceValue');
  if (priceRange && priceValue) {
    priceValue.textContent = priceRange.value;
    priceRange.addEventListener('input', function () {
      priceValue.textContent = this.value;
    });
  }

  // --- Category click redirect ---
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', function () {
      const cat = this.dataset.category || this.querySelector('.label')?.textContent;
      if (cat) window.location.href = `pages/product-listing.html?category=${encodeURIComponent(cat)}`;
    });
  });

  // --- Ad card click to detail ---
  document.querySelectorAll('.ad-card').forEach(card => {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.fav-btn')) return;
      window.location.href = this.dataset.href || 'pages/product-detail.html';
    });
  });
});
