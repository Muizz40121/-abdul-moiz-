const API = {
  base: (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api',
  token: () => Store.get('olx_token'),
  user: () => JSON.parse(Store.get('olx_user') || 'null'),
  headers(extra) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this.token(); if (t) h.Authorization = `Bearer ${t}`;
    return h;
  },
  async handle(r) {
    if (r.status === 401) {
      Store.remove('olx_token');
      Store.remove('olx_user');
      const page = window.location.pathname.split('/').pop();
      window.location.href = 'login.html?redirect=' + encodeURIComponent(page) + '&expired=1';
      throw new Error('Session expired. Redirecting to login...');
    }
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
  },
  async get(path) { const r = await fetch(this.base + path, { headers: this.headers() }); return this.handle(r); },
  async post(path, data) { const r = await fetch(this.base + path, { method: 'POST', headers: this.headers(), body: JSON.stringify(data) }); return this.handle(r); },
  async put(path, data) { const r = await fetch(this.base + path, { method: 'PUT', headers: this.headers(), body: JSON.stringify(data) }); return this.handle(r); },
  async delete(path) { const r = await fetch(this.base + path, { method: 'DELETE', headers: this.headers() }); return this.handle(r); },
  async patch(path, data) { const r = await fetch(this.base + path, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(data) }); return this.handle(r); }
};

const Store = {
  _data: {},
  get(key) {
    try { const v = localStorage.getItem(key); if (v !== null) return v; } catch {}
    try { const v = sessionStorage.getItem(key); if (v !== null) return v; } catch {}
    const c = document.cookie.split('; ').find(r => r.startsWith(key + '='));
    if (c) return decodeURIComponent(c.split('=')[1]);
    return this._data[key] ?? null;
  },
  set(key, value) {
    this._data[key] = value;
    try { localStorage.setItem(key, value); return; } catch {}
    try { sessionStorage.setItem(key, value); return; } catch {}
    document.cookie = key + '=' + encodeURIComponent(value) + '; path=/; max-age=' + (7 * 86400);
  },
  remove(key) {
    delete this._data[key];
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
    document.cookie = key + '=; path=/; max-age=0';
  }
};

const Auth = {
  async register(data) {
    const res = await API.post('/auth/register', data);
    Store.set('olx_token', res.token);
    Store.set('olx_user', JSON.stringify(res.user));
    return res;
  },
  async login(data) {
    const res = await API.post('/auth/login', data);
    Store.set('olx_token', res.token);
    Store.set('olx_user', JSON.stringify(res.user));
    return res;
  },
  logout() {
    Store.remove('olx_token');
    Store.remove('olx_user');
    window.location.href = '/';
  },
  isLoggedIn() { return !!this.token(); },
  token() { return Store.get('olx_token'); },
  getUser() { return JSON.parse(Store.get('olx_user') || 'null'); },
  getFullName(u) { return u ? u.name : ''; }
};

function updateAuthUI() {
  try {
    const loggedIn = Auth.isLoggedIn();
    const user = Auth.getUser();
    const isAdmin = user && user.is_admin === 1;
    document.querySelectorAll('[data-guest-menu]').forEach(el => el.classList.toggle('hidden', loggedIn));
    document.querySelectorAll('[data-user-menu]').forEach(el => el.classList.toggle('hidden', !loggedIn));
    document.querySelectorAll('[data-admin-menu]').forEach(el => el.classList.toggle('hidden', !isAdmin));
    document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = loggedIn ? Auth.getFullName(user) : 'User'; });
    document.querySelectorAll('[data-admin-name]').forEach(el => { el.textContent = loggedIn ? Auth.getFullName(user) : 'Admin'; });
  } catch (e) { console.error('Auth UI error:', e); }
}

function handleRegister(e) {
  e.preventDefault();
  const msg = document.getElementById('registerMessage');
  if (!msg) return;
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  if (password.length < 8) { msg.className = 'alert alert-danger'; msg.textContent = 'Password must be at least 8 characters.'; msg.classList.remove('d-none'); return; }
  if (password !== confirm) { msg.className = 'alert alert-danger'; msg.textContent = 'Passwords do not match.'; msg.classList.remove('d-none'); return; }
  Auth.register({
    name: (document.getElementById('regFirstName').value.trim() + ' ' + document.getElementById('regLastName').value.trim()).trim(),
    email: document.getElementById('regEmail').value.trim(),
    password: password
  }).then(() => {
    msg.className = 'alert alert-success'; msg.textContent = 'Account created! Redirecting...'; msg.classList.remove('d-none');
    setTimeout(() => window.location.href = '../index.html', 1000);
  }).catch(err => {
    msg.className = 'alert alert-danger'; msg.textContent = err.message; msg.classList.remove('d-none');
  });
}

function handleLogin(e) {
  e.preventDefault();
  const msg = document.getElementById('loginMessage');
  if (!msg) return;
  Auth.login({
    email: document.getElementById('loginEmail').value.trim(),
    password: document.getElementById('loginPassword').value
  }).then(() => {
    msg.className = 'alert alert-success'; msg.textContent = 'Login successful! Redirecting...'; msg.classList.remove('d-none');
    setTimeout(() => {
      const p = new URLSearchParams(window.location.search);
      window.location.href = p.get('redirect') || '../index.html';
    }, 1000);
  }).catch(err => {
    msg.className = 'alert alert-danger'; msg.textContent = err.message; msg.classList.remove('d-none');
  });
}

async function initHomePage() {
  const grid = document.querySelector('.category-grid');
  if (grid) {
    try {
      const data = await API.get('/categories');
      grid.innerHTML = data.categories.map(c => `
        <div class="category-item" data-category="${c.slug}">
          <div class="icon"><i class="fas ${c.icon || 'fa-tag'}"></i></div>
          <div class="label">${c.name}</div>
        </div>`).join('');
    } catch (e) { console.error('Failed to load categories:', e); }
  }
  const featuredRow = document.getElementById('featuredAds');
  const recentRow = document.getElementById('recentAds');
  if (featuredRow || recentRow) {
    try {
      const data = await API.get('/ads?limit=12');
      const cards = data.ads.map(a => {
        const img = a.images && a.images[0] ? a.images[0] : 'https://placehold.co/400x300/eee/999?text=No+Image';
        return `<div class="col-6 col-md-4 col-lg-3">
          <div class="ad-card" data-href="pages/product-detail.html?id=${a.id}">
            <div class="img-wrap">
              <img src="${img}" alt="${a.title}" loading="lazy">
              <button class="fav-btn" data-id="${a.id}"><i class="far fa-heart"></i></button>
            </div>
            <div class="card-body">
              <div class="price">PKR ${Number(a.price).toLocaleString()}</div>
              <div class="title">${a.title}</div>
              <div class="meta"><span><i class="far fa-clock"></i> ${timeAgo(a.created_at)}</span><span><i class="fas fa-map-marker-alt"></i> ${a.location || 'N/A'}</span></div>
            </div>
          </div>
        </div>`;
      }).join('');
      if (featuredRow) featuredRow.innerHTML = cards;
      if (recentRow) recentRow.innerHTML = cards;
    } catch (e) { console.error('Failed to load ads:', e); }
  }
}

async function initProductListing() {
  const params = new URLSearchParams(window.location.search);
  const container = document.getElementById('adsContainer');
  const resultCount = document.getElementById('resultCount');
  if (!container) return;
  try {
    const q = { category: params.get('category'), search: params.get('search'), location: params.get('location'), page: params.get('page') || 1 };
    const query = Object.entries(q).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const data = await API.get(`/ads?${query}`);
    if (resultCount) resultCount.textContent = `${data.total} ad${data.total !== 1 ? 's' : ''}`;
    if (data.ads.length === 0) { container.innerHTML = '<div class="col-12 text-center py-5"><h5 class="text-muted">No ads found</h5></div>'; return; }
    container.innerHTML = data.ads.map(a => {
      const img = a.images && a.images[0] ? a.images[0] : 'https://placehold.co/400x300/eee/999?text=No+Image';
      return `<div class="col-6 col-md-4 col-lg-3">
        <div class="ad-card" data-href="product-detail.html?id=${a.id}">
          <div class="img-wrap"><img src="${img}" alt="${a.title}" loading="lazy"><button class="fav-btn" data-id="${a.id}"><i class="far fa-heart"></i></button></div>
          <div class="card-body"><div class="price">PKR ${Number(a.price).toLocaleString()}</div><div class="title">${a.title}</div><div class="meta"><span><i class="far fa-clock"></i> ${timeAgo(a.created_at)}</span><span><i class="fas fa-map-marker-alt"></i> ${a.location || 'N/A'}</span></div></div>
        </div>
      </div>`;
    }).join('');
  } catch (e) { console.error('Failed to load listings:', e); container.innerHTML = '<div class="col-12 text-center py-5"><h5 class="text-muted">Failed to load ads</h5></div>'; }
}

async function initProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;
  try {
    const data = await API.get(`/ads/${id}`);
    const a = data.ad;
    document.title = `${a.title} - OLX Marketplace`;
    document.querySelectorAll('.product-info-card h4').forEach(el => el.textContent = a.title);
    document.querySelectorAll('.price-large').forEach(el => el.textContent = `PKR ${Number(a.price).toLocaleString()}`);
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = `<li class="breadcrumb-item"><a href="../index.html">Home</a></li><li class="breadcrumb-item"><a href="product-listing.html?category=${a.category_slug}">${a.category_name}</a></li><li class="breadcrumb-item active">${a.title}</li>`;
    const dtable = document.querySelector('.product-info-card table');
    if (dtable) {
      const rows = { 'Condition': a.condition, 'Category': a.category_name, 'Location': a.location, 'Posted': new Date(a.created_at).toLocaleDateString(), 'Views': a.views };
      dtable.innerHTML = Object.entries(rows).filter(([_, v]) => v).map(([k, v]) => `<tr><td class="text-muted">${k}</td><td class="fw-medium">${v}</td></tr>`).join('');
    }
    const desc = document.querySelector('.product-info-card .description');
    if (desc) desc.textContent = a.description;
    const sellerName = document.querySelector('.seller-card h6');
    if (sellerName) sellerName.textContent = a.seller_name;
    const sellerMeta = document.querySelector('.seller-card .seller-meta');
    if (sellerMeta) sellerMeta.textContent = `Member since ${new Date(a.seller_joined).toLocaleDateString()}`;
    const sellerLoc = document.querySelector('.seller-card .seller-location');
    if (sellerLoc && a.location) sellerLoc.innerHTML = `<i class="fas fa-map-marker-alt me-1"></i> ${a.location}`;
    const sellerPhone = document.querySelector('.seller-card .seller-phone');
    if (sellerPhone && a.seller_phone) sellerPhone.innerHTML = `<i class="fas fa-phone-alt me-2"></i>${a.seller_phone}`;
    const chatBtn = document.querySelector('.seller-card .btn-chat');
    if (chatBtn) chatBtn.href = `messages.html?user=${a.seller_id}&ad=${a.id}`;
    const mainImg = document.querySelector('.gallery-main img');
    const thumbs = document.querySelector('.gallery-thumbs');
    if (a.images && a.images.length > 0) {
      if (mainImg) { mainImg.src = a.images[0].image_url || a.images[0]; mainImg.alt = a.title; }
      if (thumbs) {
        thumbs.innerHTML = a.images.map((img, i) => `<img src="${img.image_url || img}" alt="${a.title} ${i + 1}" class="${i === 0 ? 'active' : ''}">`).join('');
      }
    }
    const similarRow = document.getElementById('similarAds');
    if (similarRow && a.similar_ads) {
      similarRow.innerHTML = a.similar_ads.map(s => {
        const img = s.image || 'https://placehold.co/400x300/eee/999?text=No+Image';
        return `<div class="col-6 col-md-3"><div class="ad-card" data-href="product-detail.html?id=${s.id}"><div class="img-wrap"><img src="${img}" alt="${s.title}" loading="lazy"></div><div class="card-body"><div class="price">PKR ${Number(s.price).toLocaleString()}</div><div class="title">${s.title}</div><div class="meta"><span><i class="far fa-clock"></i> ${timeAgo(s.created_at)}</span></div></div></div></div>`;
      }).join('');
    }
    initProductChat(a);
  } catch (e) { console.error('Failed to load ad:', e); }
}

async function initProductChat(ad) {
  const chatBox = document.getElementById('productChatBox');
  const chatBody = document.getElementById('productChatBody');
  const chatForm = document.getElementById('productChatForm');
  const sellerName = document.getElementById('productChatSellerName');
  if (!chatBox || !chatBody || !chatForm || !ad) return;
  const user = Auth.getUser();
  if (!user || user.id === ad.seller_id) { chatBox.classList.add('hidden'); return; }
  chatBox.classList.remove('hidden');
  if (sellerName) sellerName.textContent = ad.seller_name;
  let convId = null;
  try {
    const convs = await API.get('/messages/conversations');
    const existing = convs.conversations.find(c => c.product_id === ad.id && (c.buyer_id === user.id || c.seller_id === user.id));
    if (existing) convId = existing.id;
  } catch {}
  async function loadMessages() {
    if (!convId) { chatBody.innerHTML = '<div class="text-center text-muted py-4">Start a conversation with the seller</div>'; return; }
    try {
      const data = await API.get(`/messages/conversations/${convId}`);
      chatBody.innerHTML = data.messages.map(m => {
        const isMe = m.sender_id === user.id;
        return `<div class="message ${isMe ? 'sent' : 'received'}"><div class="msg-text">${m.message}</div><small class="msg-time">${timeAgo(m.created_at)}</small></div>`;
      }).join('');
      chatBody.scrollTop = chatBody.scrollHeight;
    } catch { chatBody.innerHTML = '<div class="text-center text-muted py-4">Could not load messages.</div>'; }
  }
  await loadMessages();
  chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = this.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    try {
      const res = await API.post('/messages/send', { product_id: ad.id, receiver_id: ad.seller_id, message: text });
      convId = res.conversation_id;
      const msgEl = document.createElement('div');
      msgEl.className = 'message sent';
      msgEl.innerHTML = `<div class="msg-text">${text}</div><small class="msg-time">Just now</small>`;
      chatBody.appendChild(msgEl);
      chatBody.scrollTop = chatBody.scrollHeight;
      input.value = '';
    } catch (err) { alert('Error: ' + err.message); }
  });
}

async function initPostAd() {
  const sel = document.getElementById('adCategory');
  if (sel) {
    try {
      const data = await API.get('/categories');
      sel.innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (e) { console.error('Failed to load categories:', e); }
  }
  const form = document.querySelector('.post-ad-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Posting...';
      try {
        const title = document.getElementById('adTitle').value.trim();
        const description = document.getElementById('adDescription').value.trim();
        const price = document.getElementById('adPrice').value;
        const category = sel.value;
        const location = document.getElementById('adCity').value;
        if (!title) throw new Error('Title is required.');
        if (!description) throw new Error('Description is required.');
        if (!price || isNaN(price) || Number(price) <= 0) throw new Error('Enter a valid price.');
        if (!category) throw new Error('Select a category.');
        const fileInput = document.getElementById('adImages');
        let images = [];
        if (fileInput && fileInput.files.length > 0) {
          const fd = new FormData();
          for (const file of fileInput.files) fd.append('images', file);
          const res = await fetch(API.base + '/upload/multiple', { method: 'POST', headers: { Authorization: 'Bearer ' + API.token() }, body: fd });
          if (!res.ok) throw new Error('Image upload failed');
          const data = await res.json();
          images = data.urls;
        }
        const ad = await API.post('/ads', {
          title,
          description,
          price: Number(price),
          condition: document.getElementById('adCondition').value,
          category_id: Number(category),
          location,
          images: images.length > 0 ? images : undefined
        });
        window.location.href = `product-detail.html?id=${ad.ad.id}`;
      } catch (err) {
        alert('Error: ' + err.message);
        btn.disabled = false; btn.textContent = 'Post Ad';
      }
    });
  }
}

async function initMyAds() {
  const container = document.getElementById('myAdsContainer');
  if (!container) return;
  try {
    const data = await API.get('/ads/my-ads');
    if (data.ads.length === 0) { container.innerHTML = '<div class="col-12 text-center py-5"><h5 class="text-muted">You haven\'t posted any ads yet.</h5><a href="post-ad.html" class="btn btn-primary mt-3">Post Your First Ad</a></div>'; return; }
    container.innerHTML = data.ads.map(a => {
      const statusBadge = { active: 'bg-success', sold: 'bg-secondary', pending: 'bg-warning text-dark', rejected: 'bg-danger' };
      const img = a.image_count > 0 ? 'https://placehold.co/120x90/eee/999?text=Has+Image' : 'https://placehold.co/120x90/eee/999?text=No+Image';
      return `<div class="col-12"><div class="d-flex bg-white rounded shadow-sm p-3 gap-3 align-items-center">
        <img src="${img}" style="width:120px;height:90px;object-fit:cover;border-radius:8px;" alt="${a.title}">
        <div class="flex-grow-1 min-w-0"><h6 class="fw-bold mb-1">${a.title}</h6>
        <div class="d-flex flex-wrap gap-2 small text-muted mb-1"><span class="fw-bold text-dark">PKR ${Number(a.price).toLocaleString()}</span><span><i class="far fa-eye"></i> ${a.views||0}</span><span><i class="far fa-clock"></i> ${timeAgo(a.created_at)}</span></div>
        <span class="badge ${statusBadge[a.status]||'bg-secondary'}">${a.status}</span></div>
        <div class="dropdown"><button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="product-detail.html?id=${a.id}"><i class="far fa-eye"></i> View</a></li>
          <li><a class="dropdown-item" href="post-ad.html?edit=${a.id}"><i class="far fa-edit"></i> Edit</a></li>
          ${a.status === 'active' ? `<li><hr class="dropdown-divider"><li><a class="dropdown-item text-success mark-sold" data-id="${a.id}" href="#"><i class="fas fa-check"></i> Mark as Sold</a></li></li>` : ''}
          <li><hr class="dropdown-divider"><li><a class="dropdown-item text-danger delete-ad" data-id="${a.id}" href="#"><i class="far fa-trash-alt"></i> Delete</a></li></li>
        </ul></div></div></div>`;
    }).join('');
    container.querySelectorAll('.mark-sold').forEach(btn => {
      btn.addEventListener('click', async function (e) { e.preventDefault(); try { await API.patch(`/ads/${this.dataset.id}/sold`); location.reload(); } catch (err) { alert(err.message); } });
    });
    container.querySelectorAll('.delete-ad').forEach(btn => {
      btn.addEventListener('click', async function (e) { e.preventDefault(); if (!confirm('Delete this ad?')) return; try { await API.deleteete(`/ads/${this.dataset.id}`); location.reload(); } catch (err) { alert(err.message); } });
    });
  } catch (e) { console.error('Failed to load my ads:', e); container.innerHTML = '<div class="col-12 text-center py-5"><h5 class="text-muted">Failed to load your ads.</h5></div>'; }
}

async function initFavorites() {
  const container = document.getElementById('favoritesContainer');
  if (!container) return;
  try {
    const data = await API.get('/favorites');
    if (data.ads.length === 0) { container.innerHTML = '<div class="col-12 text-center py-5"><h5 class="text-muted">No favorites yet. Browse ads and save your favorites!</h5><a href="../index.html" class="btn btn-primary mt-3">Browse Ads</a></div>'; return; }
    container.innerHTML = data.ads.map(a => {
      const img = a.images && a.images[0] ? a.images[0] : 'https://placehold.co/400x300/eee/999?text=No+Image';
      return `<div class="col-6 col-md-4 col-lg-3"><div class="ad-card" data-href="product-detail.html?id=${a.id}">
        <div class="img-wrap"><img src="${img}" alt="${a.title}" loading="lazy"><button class="fav-btn active" data-id="${a.id}"><i class="fas fa-heart"></i></button></div>
        <div class="card-body"><div class="price">PKR ${Number(a.price).toLocaleString()}</div><div class="title">${a.title}</div><div class="meta"><span><i class="fas fa-map-marker-alt"></i> ${a.location || 'N/A'}</span></div></div></div></div>`;
    }).join('');
  } catch (e) { console.error('Failed to load favorites:', e); }
}

async function initMessages() {
  const list = document.getElementById('conversationList');
  const chatBody = document.getElementById('chatBody');
  const chatHeader = document.getElementById('chatHeader');
  const chatForm = document.getElementById('chatForm');
  if (!list) return;
  const params = new URLSearchParams(window.location.search);
  try {
    const data = await API.get('/messages/conversations');
    if (data.conversations.length === 0) {
      if (params.get('ad')) {
        list.innerHTML = '<div class="text-center text-muted p-4">Select a conversation from the list.</div>';
      } else {
        list.innerHTML = '<div class="text-center text-muted p-4">No conversations yet.</div>';
      }
      return;
    }
    list.innerHTML = data.conversations.map(c => {
      const otherName = c.buyer_id === Auth.getUser()?.id ? c.seller_name : c.buyer_name;
      const unread = c.unread_count > 0 ? `<span class="badge bg-danger rounded-pill ms-auto">${c.unread_count}</span>` : '';
      return `<div class="msg-preview ${c.unread_count > 0 ? 'unread' : ''}" data-id="${c.id}">
        <div class="d-flex align-items-center"><span class="fw-medium name">${otherName}</span><small class="time ms-auto">${c.last_message_at ? timeAgo(c.last_message_at) : ''}</small>${unread}</div>
        <small class="text-muted d-block">Re: ${c.product_title}</small>
        <small class="preview-text d-block">${c.last_message || ''}</small></div>`;
    }).join('');
    list.querySelectorAll('.msg-preview').forEach(el => {
      el.addEventListener('click', async function () {
        list.querySelectorAll('.msg-preview').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const convId = this.dataset.id;
        const conv = data.conversations.find(c => c.id == convId);
        const otherName = conv.buyer_id === Auth.getUser()?.id ? conv.seller_name : conv.buyer_name;
        if (chatHeader) chatHeader.innerHTML = `<strong>${otherName}</strong> <small class="text-muted">Re: ${conv.product_title}</small>`;
        await API.patch(`/messages/read/${convId}`);
        const msgs = await API.get(`/messages/conversations/${convId}`);
        if (chatBody) {
          chatBody.innerHTML = msgs.messages.map(m => {
            const isMe = m.sender_id === Auth.getUser()?.id;
            return `<div class="message ${isMe ? 'sent' : 'received'}"><div class="msg-text">${m.message}</div><small class="msg-time">${timeAgo(m.created_at)}</small></div>`;
          }).join('');
          chatBody.scrollTop = chatBody.scrollHeight;
        }
        if (chatForm) {
          chatForm.dataset.convId = convId;
          chatForm.style.display = '';
        }
      });
    });
    if (chatForm) {
      chatForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const input = this.querySelector('input');
        if (!input.value.trim()) return;
        const convId = this.dataset.convId;
        try {
          const conv = data.conversations.find(c => c.id == convId);
          const receiver_id = conv.buyer_id === Auth.getUser()?.id ? conv.seller_id : conv.buyer_id;
          const res = await API.post('/messages/send', { product_id: conv.product_id, receiver_id, message: input.value.trim() });
          const msgEl = document.createElement('div');
          msgEl.className = 'message sent';
          msgEl.innerHTML = `<div class="msg-text">${input.value}</div><small class="msg-time">Just now</small>`;
          if (chatBody) { chatBody.appendChild(msgEl); chatBody.scrollTop = chatBody.scrollHeight; }
          input.value = '';
        } catch (err) { alert(err.message); }
      });
    }
    if (params.get('user')) {
      const first = list.querySelector('.msg-preview');
      if (first) first.click();
    }
  } catch (e) { console.error('Failed to load messages:', e); }
}

async function initProfile() {
  const user = Auth.getUser();
  if (!user) return;
  document.querySelectorAll('[data-profile-name]').forEach(el => el.textContent = user.name);
  const avatar = document.querySelector('[data-profile-avatar]');
  if (avatar) avatar.src = user.avatar || 'https://placehold.co/200x200/eee/999?text=User';
  document.querySelectorAll('[data-profile-email]').forEach(el => el.value = user.email || '');
  document.querySelectorAll('[data-profile-phone]').forEach(el => el.value = user.phone || '');
  document.querySelectorAll('[data-profile-location]').forEach(el => el.value = user.location || '');
  document.querySelector('[data-profile-firstname]') && document.querySelectorAll('[data-profile-firstname]').forEach(el => el.value = (user.name || '').split(' ')[0] || '');
  document.querySelector('[data-profile-lastname]') && document.querySelectorAll('[data-profile-lastname]').forEach(el => el.value = (user.name || '').split(' ').slice(1).join(' ') || '');
  if (user.created_at) {
    document.querySelectorAll('[data-profile-joined]').forEach(el => el.textContent = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
  }
  const form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        const res = await API.put('/profile/update', {
          name: (document.getElementById('profileFirstName').value.trim() + ' ' + document.getElementById('profileLastName').value.trim()).trim(),
          phone: document.getElementById('profilePhone').value.trim(),
          location: document.getElementById('profileLocation').value.trim()
        });
        Store.set('olx_user', JSON.stringify(res.user));
        updateAuthUI();
        initProfile();
        alert('Profile updated!');
      } catch (err) { alert(err.message); }
    });
  }
  const pwForm = document.getElementById('passwordForm');
  if (pwForm) {
    pwForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const np = document.getElementById('newPassword').value;
      if (np.length < 8) { alert('Password must be at least 8 characters.'); return; }
      if (np !== document.getElementById('confirmPassword').value) { alert('Passwords do not match.'); return; }
      try {
        await API.put('/profile/change-password', { currentPassword: document.getElementById('currentPassword').value, newPassword: np });
        alert('Password changed!');
        pwForm.reset();
      } catch (err) { alert(err.message); }
    });
  }
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00')).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function checkAdminAccess() {
  if (!Auth.isLoggedIn()) { window.location.href = '../pages/login.html?redirect=' + window.location.pathname; return false; }
  const user = Auth.getUser();
  if (user && user.is_admin === 1) return true;
  try {
    const data = await API.get('/auth/me');
    if (data.user && data.user.is_admin === 1) { Store.set('olx_user', JSON.stringify(data.user)); return true; }
  } catch {}
  window.location.href = '../index.html';
  return false;
}

async function initAdminDashboard() {
  const el = document.getElementById('adminDashboardContent');
  if (!el) return;
  const ok = await checkAdminAccess();
  if (!ok) return;
  try {
    const data = await API.get('/admin/dashboard');
    el.innerHTML = `
      <h5 class="fw-bold mb-4">Welcome back, ${Auth.getUser()?.name || 'Admin'}!</h5>
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#4e73df;"><i class="fas fa-users"></i></div><div><div class="stat-number">${data.totalUsers}</div><div class="stat-label">Total Users</div></div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#1cc88a;"><i class="fas fa-list"></i></div><div><div class="stat-number">${data.totalAds}</div><div class="stat-label">Total Ads</div></div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#f6c23e;"><i class="fas fa-check-circle"></i></div><div><div class="stat-number">${data.activeAds}</div><div class="stat-label">Active Ads</div></div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#e74a3b;"><i class="fas fa-flag"></i></div><div><div class="stat-number">${data.pendingReports}</div><div class="stat-label">Pending Reports</div></div></div></div>
      </div>
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#36b9cc;"><i class="fas fa-folder"></i></div><div><div class="stat-number">${data.totalCategories}</div><div class="stat-label">Categories</div></div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#5a5c69;"><i class="fas fa-comments"></i></div><div><div class="stat-number">${data.totalConversations}</div><div class="stat-label">Conversations</div></div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#fd7e14;"><i class="fas fa-calendar-day"></i></div><div><div class="stat-number">${data.todayAds}</div><div class="stat-label">Ads Today</div></div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="stat-icon" style="background:#6f42c1;"><i class="fas fa-exclamation-triangle"></i></div><div><div class="stat-number">${data.totalReports}</div><div class="stat-label">Total Reports</div></div></div></div>
      </div>`;
  } catch (e) { el.innerHTML = '<div class="text-center py-5 text-danger">Failed to load dashboard.</div>'; }
}

async function initAdminUsers() {
  const el = document.getElementById('adminUsersContent');
  if (!el) return;
  const ok = await checkAdminAccess();
  if (!ok) return;
  let pageNum = 1;
  let searchTerm = '';
  async function loadUsers() {
    try {
      const qs = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const data = await API.get(`/admin/users?page=${pageNum}&limit=20${qs}`);
      let rows = data.users.map(u => `<tr>
        <td>${u.name}</td><td>${u.email}</td><td>${u.phone || '-'}</td><td>${u.location || '-'}</td>
        <td>${u.is_admin === 1 ? '<span class="badge bg-danger">Admin</span>' : '<span class="badge bg-secondary">User</span>'}</td>
        <td>${timeAgo(u.created_at)}</td>
        <td class="action-btns">
          <button class="btn btn-outline-primary btn-sm toggle-admin" data-id="${u.id}" data-admin="${u.is_admin}">${u.is_admin === 1 ? 'Remove Admin' : 'Make Admin'}</button>
          <button class="btn btn-outline-danger btn-sm delete-user" data-id="${u.id}" data-name="${u.name}"><i class="fas fa-trash"></i></button>
        </td></tr>`).join('');
      if (!rows) rows = '<tr><td colspan="7" class="text-center text-muted py-4">No users found.</td></tr>';
      const prevDisabled = pageNum <= 1 ? 'disabled' : '';
      el.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 class="fw-bold mb-0">Users (${data.total})</h5>
          <div class="d-flex gap-2"><input type="text" class="form-control form-control-sm search-bar" id="userSearch" placeholder="Search users..." value="${searchTerm}">
          <button class="btn btn-sm btn-outline-secondary" id="searchUserBtn"><i class="fas fa-search"></i></button></div>
        </div>
        <div class="bg-white rounded shadow-sm"><div class="table-responsive"><table class="table table-hover table-sm mb-0"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small class="text-muted">Page ${data.page} of ${Math.ceil(data.total / 20)}</small>
          <div><button class="btn btn-sm btn-outline-secondary me-1" id="prevUserPage" ${prevDisabled}><i class="fas fa-chevron-left"></i> Prev</button>
          <button class="btn btn-sm btn-outline-secondary" id="nextUserPage"><i class="fas fa-chevron-right"></i> Next</button></div>
        </div>`;
      el.querySelector('#prevUserPage')?.addEventListener('click', () => { if (pageNum > 1) { pageNum--; loadUsers(); } });
      el.querySelector('#nextUserPage')?.addEventListener('click', () => { pageNum++; loadUsers(); });
      el.querySelector('#searchUserBtn')?.addEventListener('click', () => { pageNum = 1; searchTerm = document.getElementById('userSearch')?.value || ''; loadUsers(); });
      el.querySelector('#userSearch')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') { pageNum = 1; searchTerm = e.target.value; loadUsers(); } });
      el.querySelectorAll('.toggle-admin').forEach(btn => btn.addEventListener('click', async function () {
        try { await API.put(`/admin/users/${this.dataset.id}`, { is_admin: this.dataset.admin === '1' ? 0 : 1 }); loadUsers(); }
        catch (err) { alert(err.message); }
      }));
      el.querySelectorAll('.delete-user').forEach(btn => btn.addEventListener('click', async function () {
        if (!confirm(`Delete user "${this.dataset.name}"? This cannot be undone.`)) return;
        try { await API.delete(`/admin/users/${this.dataset.id}`); loadUsers(); } catch (err) { alert(err.message); }
      }));
    } catch (e) { el.innerHTML = '<div class="text-center py-5 text-danger">Failed to load users.</div>'; }
  }
  await loadUsers();
}

async function initAdminAds() {
  const el = document.getElementById('adminAdsContent');
  if (!el) return;
  const ok = await checkAdminAccess();
  if (!ok) return;
  let pageNum = 1, filterStatus = '', searchTerm = '';
  async function loadAds() {
    try {
      const qs = filterStatus ? `&status=${filterStatus}` : '';
      const ss = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const data = await API.get(`/admin/ads?page=${pageNum}&limit=20${qs}${ss}`);
      let rows = data.ads.map(a => `<tr>
        <td><a href="../pages/product-detail.html?id=${a.id}" target="_blank" class="text-decoration-none fw-medium">${a.title}</a></td>
        <td>${a.seller_name}</td><td>PKR ${Number(a.price).toLocaleString()}</td><td>${a.category_name}</td>
        <td><span class="badge ${a.status === 'active' ? 'bg-success' : a.status === 'sold' ? 'bg-secondary' : a.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'}">${a.status}</span></td>
        <td>${timeAgo(a.created_at)}</td>
        <td class="action-btns">
          <select class="form-select form-select-sm status-select" data-id="${a.id}" style="width:auto;display:inline-block;">
            <option value="active" ${a.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="sold" ${a.status === 'sold' ? 'selected' : ''}>Sold</option>
            <option value="rejected" ${a.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
          <button class="btn btn-outline-danger btn-sm delete-ad" data-id="${a.id}" data-title="${a.title}"><i class="fas fa-trash"></i></button>
        </td></tr>`).join('');
      if (!rows) rows = '<tr><td colspan="7" class="text-center text-muted py-4">No ads found.</td></tr>';
      const prevDisabled = pageNum <= 1 ? 'disabled' : '';
      el.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 class="fw-bold mb-0">Advertisements (${data.total})</h5>
          <div class="d-flex gap-2 flex-wrap">
            <select class="form-select form-select-sm" id="adStatusFilter" style="width:auto;"><option value="">All Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option><option value="rejected">Rejected</option></select>
            <input type="text" class="form-control form-control-sm search-bar" id="adSearch" placeholder="Search..." value="${searchTerm}">
            <button class="btn btn-sm btn-outline-secondary" id="searchAdBtn"><i class="fas fa-search"></i></button>
          </div>
        </div>
        <div class="bg-white rounded shadow-sm"><div class="table-responsive"><table class="table table-hover table-sm mb-0"><thead><tr><th>Title</th><th>Seller</th><th>Price</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small class="text-muted">Page ${data.page} of ${Math.ceil(data.total / 20)}</small>
          <div><button class="btn btn-sm btn-outline-secondary me-1" id="prevAdPage" ${prevDisabled}><i class="fas fa-chevron-left"></i> Prev</button>
          <button class="btn btn-sm btn-outline-secondary" id="nextAdPage"><i class="fas fa-chevron-right"></i> Next</button></div>
        </div>`;
      el.querySelector('#prevAdPage')?.addEventListener('click', () => { if (pageNum > 1) { pageNum--; loadAds(); } });
      el.querySelector('#nextAdPage')?.addEventListener('click', () => { pageNum++; loadAds(); });
      el.querySelector('#adStatusFilter')?.addEventListener('change', function () { pageNum = 1; filterStatus = this.value; loadAds(); });
      el.querySelector('#searchAdBtn')?.addEventListener('click', () => { pageNum = 1; searchTerm = document.getElementById('adSearch')?.value || ''; loadAds(); });
      el.querySelector('#adSearch')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') { pageNum = 1; searchTerm = e.target.value; loadAds(); } });
      el.querySelectorAll('.status-select').forEach(sel => sel.addEventListener('change', async function () {
        try { await API.put(`/admin/ads/${this.dataset.id}`, { status: this.value }); loadAds(); } catch (err) { alert(err.message); }
      }));
      el.querySelectorAll('.delete-ad').forEach(btn => btn.addEventListener('click', async function () {
        if (!confirm(`Delete ad "${this.dataset.title}"?`)) return;
        try { await API.delete(`/admin/ads/${this.dataset.id}`); loadAds(); } catch (err) { alert(err.message); }
      }));
    } catch (e) { el.innerHTML = '<div class="text-center py-5 text-danger">Failed to load ads.</div>'; }
  }
  await loadAds();
}

async function initAdminCategories() {
  const el = document.getElementById('adminCategoriesContent');
  if (!el) return;
  const ok = await checkAdminAccess();
  if (!ok) return;
  async function loadCats() {
    try {
      const data = await API.get('/admin/categories');
      let rows = data.categories.map(c => `<tr>
        <td><i class="fas ${c.icon || 'fa-tag'} me-2"></i>${c.name}</td><td>${c.slug}</td><td>${c.ad_count || 0}</td>
        <td class="action-btns">
          <button class="btn btn-outline-primary btn-sm edit-cat" data-id="${c.id}" data-name="${c.name}" data-slug="${c.slug}" data-icon="${c.icon || ''}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-outline-danger btn-sm delete-cat" data-id="${c.id}" data-name="${c.name}"><i class="fas fa-trash"></i></button>
        </td></tr>`).join('');
      el.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Categories</h5>
          <button class="btn btn-sm btn-primary" id="addCatBtn"><i class="fas fa-plus"></i> Add Category</button>
        </div>
        <div class="bg-white rounded shadow-sm"><div class="table-responsive"><table class="table table-hover table-sm mb-0"><thead><tr><th>Name</th><th>Slug</th><th>Ads</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
      el.querySelector('#addCatBtn')?.addEventListener('click', () => showCatModal(null));
      el.querySelectorAll('.edit-cat').forEach(btn => btn.addEventListener('click', () => showCatModal(btn.dataset)));
      el.querySelectorAll('.delete-cat').forEach(btn => btn.addEventListener('click', async function () {
        if (!confirm(`Delete category "${this.dataset.name}"?`)) return;
        try { await API.delete(`/admin/categories/${this.dataset.id}`); loadCats(); } catch (err) { alert(err.message); }
      }));
    } catch (e) { el.innerHTML = '<div class="text-center py-5 text-danger">Failed to load categories.</div>'; }
  }
  function showCatModal(data) {
    const isEdit = data && data.id;
    const modal = document.createElement('div');
    modal.className = 'modal fade show d-block';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header">
      <h6 class="modal-title">${isEdit ? 'Edit' : 'Add'} Category</h6>
      <button type="button" class="btn-close close-modal"></button></div>
      <div class="modal-body">
        <div class="mb-3"><label class="form-label small">Name</label><input class="form-control form-control-sm" id="catName" value="${isEdit ? data.name : ''}"></div>
        <div class="mb-3"><label class="form-label small">Slug</label><input class="form-control form-control-sm" id="catSlug" value="${isEdit ? data.slug : ''}"></div>
        <div class="mb-3"><label class="form-label small">Icon (FontAwesome class, e.g. fa-car)</label><input class="form-control form-control-sm" id="catIcon" value="${isEdit ? data.icon : 'fa-tag'}"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-sm btn-secondary close-modal">Cancel</button>
      <button class="btn btn-sm btn-primary" id="saveCatBtn">${isEdit ? 'Update' : 'Create'}</button></div></div></div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => modal.remove()));
    modal.querySelector('#saveCatBtn').addEventListener('click', async function () {
      const body = { name: document.getElementById('catName').value, slug: document.getElementById('catSlug').value, icon: document.getElementById('catIcon').value };
      if (!body.name || !body.slug) { alert('Name and slug are required.'); return; }
      try {
        if (isEdit) await API.put(`/admin/categories/${data.id}`, body);
        else await API.post('/admin/categories', body);
        modal.remove(); loadCats();
      } catch (err) { alert(err.message); }
    });
  }
  await loadCats();
}

async function initAdminReports() {
  const el = document.getElementById('adminReportsContent');
  if (!el) return;
  const ok = await checkAdminAccess();
  if (!ok) return;
  async function loadReports() {
    try {
      const data = await API.get('/admin/reports');
      let rows = data.reports.map(r => `<tr>
        <td>${r.reporter_name}</td><td><a href="../pages/product-detail.html?id=${r.product_id}" target="_blank">${r.product_title}</a></td>
        <td>${r.reason}</td><td>${r.description || '-'}</td>
        <td><span class="badge ${r.status === 'resolved' ? 'bg-success' : r.status === 'dismissed' ? 'bg-secondary' : 'bg-warning text-dark'}">${r.status}</span></td>
        <td>${timeAgo(r.created_at)}</td>
        <td class="action-btns">
          ${r.status === 'pending' ? `<button class="btn btn-sm btn-success resolve-report me-1" data-id="${r.id}"><i class="fas fa-check"></i></button>
          <button class="btn btn-sm btn-secondary dismiss-report me-1" data-id="${r.id}"><i class="fas fa-times"></i></button>` : ''}
          <button class="btn btn-sm btn-outline-danger delete-report" data-id="${r.id}"><i class="fas fa-trash"></i></button>
        </td></tr>`).join('');
      if (!rows) rows = '<tr><td colspan="7" class="text-center text-muted py-4">No reports found.</td></tr>';
      el.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Reports (${data.reports.length})</h5>
        </div>
        <div class="bg-white rounded shadow-sm"><div class="table-responsive"><table class="table table-hover table-sm mb-0"><thead><tr><th>Reporter</th><th>Ad</th><th>Reason</th><th>Description</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
      el.querySelectorAll('.resolve-report').forEach(b => b.addEventListener('click', async function () {
        try { await API.put(`/admin/reports/${this.dataset.id}`, { status: 'resolved' }); loadReports(); } catch (err) { alert(err.message); }
      }));
      el.querySelectorAll('.dismiss-report').forEach(b => b.addEventListener('click', async function () {
        try { await API.put(`/admin/reports/${this.dataset.id}`, { status: 'dismissed' }); loadReports(); } catch (err) { alert(err.message); }
      }));
      el.querySelectorAll('.delete-report').forEach(b => b.addEventListener('click', async function () {
        if (!confirm('Delete this report?')) return;
        try { await API.delete(`/admin/reports/${this.dataset.id}`); loadReports(); } catch (err) { alert(err.message); }
      }));
    } catch (e) { el.innerHTML = '<div class="text-center py-5 text-danger">Failed to load reports.</div>'; }
  }
  await loadReports();
}

document.addEventListener('error', function (e) {
  if (e.target.tagName === 'IMG' && !e.target.src.startsWith('data:')) {
    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23eee" width="400" height="300"/><text fill="%23999" font-family="sans-serif" font-size="18" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';
  }
}, true);

document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('expired') === '1') {
    const msg = document.getElementById('loginMessage');
    if (msg) { msg.className = 'alert alert-warning'; msg.textContent = 'Session expired. Please login again.'; msg.classList.remove('d-none'); }
  }
  updateAuthUI();
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('[data-logout]').forEach(btn => { btn.addEventListener('click', function (e) { e.preventDefault(); Auth.logout(); }); });
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  const protectedPaths = ['my-ads.html', 'favorites.html', 'messages.html', 'profile.html', 'post-ad.html'];
  if (protectedPaths.includes(page) && !Auth.isLoggedIn()) { window.location.href = 'login.html?redirect=' + encodeURIComponent(page); return; }
  const searchToggle = document.getElementById('searchToggle');
  const mobileSearch = document.getElementById('mobileSearch');
  if (searchToggle && mobileSearch) searchToggle.addEventListener('click', function () { mobileSearch.classList.toggle('d-none'); });
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', async function (e) {
      e.preventDefault(); e.stopPropagation();
      const id = this.dataset.id;
      if (!Auth.isLoggedIn()) { window.location.href = 'login.html?redirect=' + page; return; }
      const active = this.classList.contains('active');
      try {
        if (active) { await API.deleteete(`/favorites/${id}`); this.classList.remove('active'); this.querySelector('i').className = 'far fa-heart'; }
        else { await API.post(`/favorites/${id}`); this.classList.add('active'); this.querySelector('i').className = 'fas fa-heart'; }
      } catch (err) { console.error(err); }
    });
  });
  const thumbs = document.querySelectorAll('.gallery-thumbs img');
  const mainImg = document.querySelector('.gallery-main img');
  if (thumbs.length && mainImg) {
    thumbs.forEach(img => { img.addEventListener('click', function () { thumbs.forEach(t => t.classList.remove('active')); this.classList.add('active'); mainImg.src = this.src; mainImg.alt = this.alt; }); });
  }
  const uploadInput = document.getElementById('adImages');
  const previewContainer = document.getElementById('imagePreview');
  if (uploadInput && previewContainer) {
    uploadInput.addEventListener('change', function () {
      previewContainer.innerHTML = '';
      Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
          const col = document.createElement('div'); col.className = 'col-4 col-md-3';
          const img = document.createElement('img'); img.src = e.target.result; img.className = 'img-fluid rounded shadow-sm';
          img.style.height = '100px'; img.style.objectFit = 'cover';
          col.appendChild(img); previewContainer.appendChild(col);
        };
        reader.readAsDataURL(file);
      });
    });
  }
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
      const target = document.querySelector(this.dataset.target);
      if (target) { const t = target.getAttribute('type') === 'password' ? 'text' : 'password'; target.setAttribute('type', t); this.querySelector('i').className = t === 'password' ? 'far fa-eye' : 'far fa-eye-slash'; }
    });
  });
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  if (sidebarToggle && adminSidebar) sidebarToggle.addEventListener('click', function () { adminSidebar.classList.toggle('show'); });
  const selectAll = document.getElementById('selectAll');
  if (selectAll) selectAll.addEventListener('change', function () { document.querySelectorAll('.select-item').forEach(cb => cb.checked = this.checked); });
  document.querySelectorAll('.alert-dismissible').forEach(alert => { setTimeout(() => { alert.classList.add('fade'); setTimeout(() => alert.remove(), 300); }, 5000); });
  const priceRange = document.getElementById('priceRange');
  const priceValue = document.getElementById('priceValue');
  if (priceRange && priceValue) { priceValue.textContent = priceRange.value; priceRange.addEventListener('input', function () { priceValue.textContent = this.value; }); }
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', function () { const cat = this.dataset.category || this.querySelector('.label')?.textContent; if (cat) window.location.href = `pages/product-listing.html?category=${encodeURIComponent(cat)}`; });
  });
  document.addEventListener('click', function (e) { const card = e.target.closest('.ad-card'); if (card && !e.target.closest('.fav-btn')) { window.location.href = card.dataset.href || 'pages/product-detail.html'; } });
  const isAdminPage = window.location.pathname.includes('/admin/');
  if (isAdminPage) {
    switch (page) {
      case 'index.html': initAdminDashboard(); break;
      case 'users.html': initAdminUsers(); break;
      case 'ads.html': initAdminAds(); break;
      case 'categories.html': initAdminCategories(); break;
      case 'reports.html': initAdminReports(); break;
    }
  } else {
    switch (page) {
      case 'index.html': case '': initHomePage(); break;
      case 'product-listing.html': initProductListing(); break;
      case 'product-detail.html': initProductDetail(); break;
      case 'post-ad.html': initPostAd(); break;
      case 'my-ads.html': initMyAds(); break;
      case 'favorites.html': initFavorites(); break;
      case 'messages.html': initMessages(); break;
      case 'profile.html': initProfile(); break;
    }
  }
});
