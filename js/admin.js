/* ════════════════════════════════════════════════════════════════════
   PARLA ADMIN PANEL — admin.js
   Complete JavaScript for Vibe Cleaning admin panel
   ════════════════════════════════════════════════════════════════════ */

// ── STATE ────────────────────────────────────────────────────────────
let currentUser = null;
let ordersPage = 1;
let ordersFilter = '';
let customersPage = 1;
let paymentsPage = 1;
let revenueChart = null;
let serviceChart = null;
let financeChart = null;
let servicesCache = [];
let employeesCache = [];
let isMobile = window.innerWidth < 768;

const PAGE_TITLES = {
  dashboard: 'Panel',
  orders: 'Sifarişlər',
  customers: 'Müştərilər',
  employees: 'İşçilər',
  services: 'Xidmətlər',
  payments: 'Ödənişlər',
  finance: 'Maliyyə',
  settings: 'Tənzimləmələr'
};

const CHART_COLORS = ['#1ca9c9', '#8b5cf6', '#f59e0b', '#ec4899', '#22c55e', '#6366f1'];

const MONTHS_AZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];

// ════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════

function getToken() {
  return localStorage.getItem('accessToken');
}

function clearToken() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('parlaUser');
}

function showLogin() {
  document.getElementById('loginOverlay').classList.remove('hidden');
}

function hideLogin() {
  document.getElementById('loginOverlay').classList.add('hidden');
}

function showLoginError(msg) {
  const err = document.getElementById('loginError');
  document.getElementById('loginErrorText').textContent = msg;
  err.classList.add('show');
}

function hideLoginError() {
  document.getElementById('loginError').classList.remove('show');
}

async function handleLogin(e) {
  e.preventDefault();
  hideLoginError();

  const btn = document.getElementById('loginBtn');
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!username || !password) {
    showLoginError('İstifadəçi adı və şifrə tələb olunur');
    return;
  }

  btn.classList.add('loading');

  try {
    const res = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Giriş uğursuz oldu');
    }

    const data = await res.json();
    localStorage.setItem('accessToken', data.token);
    if (data.user) {
      currentUser = data.user;
      localStorage.setItem('parlaUser', JSON.stringify(data.user));
    }

    btn.classList.remove('loading');
    hideLogin();
    initApp();
    showToast('Xoş gəldiniz, ' + (currentUser?.username || 'Admin') + '!', 'success');
  } catch (err) {
    btn.classList.remove('loading');
    showLoginError(err.message || 'Giriş zamanı xəta baş verdi');
  }
}

function logout() {
  clearToken();
  currentUser = null;
  location.reload();
}

// ════════════════════════════════════════════════════════════════════
// API HELPER
// ════════════════════════════════════════════════════════════════════

async function api(url, method = 'GET', body = null) {
  const token = getToken();
  if (!token) {
    clearToken();
    showLogin();
    return null;
  }

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const options = { method, headers };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(API_URL + url, options);

    if (res.status === 401) {
      clearToken();
      showLogin();
      showToast('Sessiya bitib, yenidən daxil olun', 'error');
      return null;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'API xətası: ' + res.status);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return { success: true };
    }

    return await res.json();
  } catch (err) {
    if (err.message !== 'Failed to fetch') {
      console.error('API Error:', err);
    }
    showToast(err.message || 'Şəbəkə xətası', 'error');
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════
// NAV & PAGES
// ════════════════════════════════════════════════════════════════════

function navigateTo(page) {
  // Update nav links
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector('.nav-links a[data-page="' + page + '"]');
  if (activeLink) activeLink.classList.add('active');

  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(page);
  if (targetPage) targetPage.classList.add('active');

  // Update title
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;

  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'orders': loadOrders(); break;
    case 'customers': loadCustomers(); break;
    case 'employees': loadEmployees(); break;
    case 'services': loadServices(); break;
    case 'payments': loadPayments(); loadPaymentStats(); break;
    case 'finance': loadFinance(); break;
    case 'settings': loadSettings(); break;
  }

  // Close sidebar on mobile
  if (isMobile) closeSidebar();
}

// ════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════

function toggleSidebar() {
  if (isMobile) {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('show');
  } else {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('show');
}

// ════════════════════════════════════════════════════════════════════
// DARK MODE
// ════════════════════════════════════════════════════════════════════

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('darkToggle').textContent = '☀️';
    const sm = document.getElementById('settingDarkMode');
    if (sm) sm.checked = true;
  } else {
    document.body.removeAttribute('data-theme');
    document.getElementById('darkToggle').textContent = '🌙';
    const sm = document.getElementById('settingDarkMode');
    if (sm) sm.checked = false;
  }
}

function toggleDarkMode() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('parlaTheme', newTheme);
  showToast(newTheme === 'dark' ? 'Qaranlıq rejim aktivləşdi' : 'İşıqlı rejim aktivləşdi', 'info');
}

// ════════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ════════════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  // Auto-dismiss after 4s
  const timeout = setTimeout(() => dismissToast(toast), 4000);

  // Click to dismiss
  toast.addEventListener('click', () => {
    clearTimeout(timeout);
    dismissToast(toast);
  });
}

function dismissToast(toast) {
  toast.classList.add('toast-out');
  setTimeout(() => toast.remove(), 300);
}

// ════════════════════════════════════════════════════════════════════
// MODAL SYSTEM
// ════════════════════════════════════════════════════════════════════

function openModal(title, fields, onSave, existingData = {}) {
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = title;

  const body = document.getElementById('modalBody');
  body.innerHTML = '';

  fields.forEach(field => {
    const group = document.createElement('div');
    group.className = 'form-group';

    // Wrap two fields in a row if marked
    if (field.half) {
      group.style.cssText = 'display:inline-block;width:48%;';
    }

    const label = document.createElement('label');
    label.innerHTML = escapeHtml(field.label) + (field.required ? '<span class="req">*</span>' : '');
    group.appendChild(label);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        input.appendChild(option);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
    }

    input.name = field.name;
    input.id = 'modalField_' + field.name;

    if (field.step) input.step = field.step;

    // Pre-fill from existing data
    const val = existingData[field.name];
    if (val !== undefined && val !== null) {
      if (field.type === 'select') {
        input.value = String(val);
      } else if (field.type === 'number') {
        input.value = val;
      } else if (typeof val === 'object') {
        input.value = val.name || val.id || '';
      } else {
        input.value = val;
      }
    }

    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.required) input.required = true;

    group.appendChild(input);
    body.appendChild(group);
  });

  // Set up save handler
  const saveBtn = document.getElementById('modalSave');
  // Clone to remove old listeners
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

  newSaveBtn.addEventListener('click', async () => {
    // Collect form values
    const data = {};
    let hasError = false;

    fields.forEach(field => {
      const el = document.getElementById('modalField_' + field.name);
      if (!el) return;

      let val = el.value.trim();
      if (field.type === 'number') {
        val = val === '' ? 0 : parseFloat(val);
      }

      if (field.required && (val === '' || val === null)) {
        el.style.borderColor = '#ef4444';
        hasError = true;
      } else {
        el.style.borderColor = '';
      }

      data[field.name] = val;
    });

    if (hasError) {
      showToast('Bütün vacib sahələri doldurun', 'error');
      return;
    }

    // Show loading on button
    newSaveBtn.textContent = 'Yadda saxlanır...';
    newSaveBtn.disabled = true;

    try {
      await onSave(data);
      closeModal();
    } catch (err) {
      newSaveBtn.textContent = 'Yadda saxla';
      newSaveBtn.disabled = false;
    }
  });

  overlay.classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('modalBody').innerHTML = '';
  const saveBtn = document.getElementById('modalSave');
  saveBtn.textContent = 'Yadda saxla';
  saveBtn.disabled = false;
}

// ════════════════════════════════════════════════════════════════════
// STATUS HELPERS
// ════════════════════════════════════════════════════════════════════

const STATUS_MAP = {
  'tamamlandı': { tag: 'tag-green', label: 'Tamamlandı' },
  'gedişdə': { tag: 'tag-blue', label: 'Gedişdə' },
  'gözləyir': { tag: 'tag-yellow', label: 'Gözləyir' },
  'ləğv': { tag: 'tag-red', label: 'Ləğv' },
  'yeni': { tag: 'tag-gray', label: 'Yeni' },
  'aktiv': { tag: 'tag-green', label: 'Aktiv' },
  'passiv': { tag: 'tag-gray', label: 'Passiv' },
  'ödənilib': { tag: 'tag-green', label: 'Ödənilib' },
  'gözləyir_ödəniş': { tag: 'tag-yellow', label: 'Gözləyir' },
  'pending': { tag: 'tag-yellow', label: 'Gözləyir' },
  'paid': { tag: 'tag-green', label: 'Ödənilib' },
  'completed': { tag: 'tag-green', label: 'Tamamlandı' },
  'cancelled': { tag: 'tag-red', label: 'Ləğv' },
  'active': { tag: 'tag-green', label: 'Aktiv' },
  'passive': { tag: 'tag-gray', label: 'Passiv' },
  'nağd': { tag: 'tag-blue', label: 'Nağd' },
  'kart': { tag: 'tag-purple', label: 'Kart' },
  'köçürmə': { tag: 'tag-yellow', label: 'Köçürmə' }
};

function statusTag(status) {
  const s = String(status || '').toLowerCase();
  const info = STATUS_MAP[s] || { tag: 'tag-gray', label: status || '—' };
  return '<span class="tag ' + info.tag + '">' + escapeHtml(info.label) + '</span>';
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase();
  const info = STATUS_MAP[s] || { label: status || '—' };
  return info.label;
}

function paymentMethodLabel(method) {
  const m = String(method || '').toLowerCase();
  if (m === 'nağd' || m === 'cash') return 'Nağd';
  if (m === 'kart' || m === 'card') return 'Kart';
  if (m === 'köçürmə' || m === 'transfer') return 'Köçürmə';
  return method || '—';
}

// ════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════

async function loadDashboard() {
  // Parallel fetch
  const [stats, ordersRes, customersRes, employees] = await Promise.all([
    api('/payments/stats'),
    api('/orders?limit=1'),
    api('/customers?limit=1'),
    api('/employees')
  ]);

  // Stat cards
  if (ordersRes && ordersRes.total !== undefined) {
    document.getElementById('stat-orders').textContent = ordersRes.total;
  }
  if (stats) {
    document.getElementById('stat-income').textContent = formatMoney(stats.totalIncome || 0);
  }
  if (customersRes && customersRes.total !== undefined) {
    document.getElementById('stat-customers').textContent = customersRes.total;
  }
  if (employees && Array.isArray(employees)) {
    document.getElementById('stat-employees').textContent = employees.length;
  }

  // Recent orders (last 5)
  try {
    const recent = await api('/orders?limit=5');
    if (recent && recent.data) {
      renderRecentOrders(recent.data);
    }
  } catch (e) { /* ignore */ }

  // Charts
  initCharts();
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersBody');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td>Heç bir sifariş yoxdur</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td class="col-id">#${o.id}</td>
      <td>${escapeHtml(o.customer?.name || '—')}</td>
      <td>${escapeHtml(o.service?.name || '—')}</td>
      <td>${formatDate(o.date)}</td>
      <td class="col-amount">${o.amount ? formatMoney(o.amount) : '—'}</td>
      <td>${statusTag(o.status)}</td>
    </tr>
  `).join('');
}

// ════════════════════════════════════════════════════════════════════
// CHARTS
// ════════════════════════════════════════════════════════════════════

function initCharts() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // Revenue line chart
  if (revenueChart) revenueChart.destroy();
  const revCtx = document.getElementById('revenueChart');
  if (revCtx) {
    // Get last 6 months labels
    const now = new Date();
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(MONTHS_AZ[d.getMonth()]);
    }
    const revData = [4500, 5200, 4800, 6100, 5800, 7200];

    revenueChart = new Chart(revCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Gəlir (₼)',
          data: revData,
          borderColor: '#1ca9c9',
          backgroundColor: 'rgba(28,169,201,0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#1ca9c9',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
        }
      }
    });
  }

  // Service doughnut chart
  if (serviceChart) serviceChart.destroy();
  const svcCtx = document.getElementById('serviceChart');
  if (svcCtx) {
    const svcNames = (servicesCache.length > 0 ? servicesCache : [
      { name: 'Ümumi təmizlik' }, { name: 'Pəncərə təmizliyi' },
      { name: 'Xalça təmizliyi' }, { name: 'Sofa təmizliyi' },
      { name: 'Ofis təmizliyi' }, { name: 'Sonradan təmizlik' }
    ]).map(s => s.name).slice(0, 6);

    while (svcNames.length < 6) svcNames.push('Xidmət ' + (svcNames.length + 1));

    serviceChart = new Chart(svcCtx, {
      type: 'doughnut',
      data: {
        labels: svcNames,
        datasets: [{
          data: [35, 20, 15, 12, 10, 8],
          backgroundColor: CHART_COLORS,
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 12, font: { size: 12 } }
          }
        },
        cutout: '65%'
      }
    });
  }
}

function initFinanceChart() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  if (financeChart) financeChart.destroy();
  const ctx = document.getElementById('financeChart');
  if (!ctx) return;

  const now = new Date();
  const labels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTHS_AZ[d.getMonth()]);
  }

  financeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Gəlir (₼)',
          data: [4500, 5200, 4800, 6100, 5800, 7200],
          backgroundColor: '#1ca9c9',
          borderRadius: 6
        },
        {
          label: 'Xərc (₼)',
          data: [2100, 2400, 2200, 2800, 2600, 3100],
          backgroundColor: '#f59e0b',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, padding: 12 }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// ORDERS CRUD
// ════════════════════════════════════════════════════════════════════

async function loadOrders(page, status) {
  if (page !== undefined) ordersPage = page;
  if (status !== undefined) ordersFilter = status;

  const url = '/orders?page=' + ordersPage + '&limit=20' + (ordersFilter ? '&status=' + encodeURIComponent(ordersFilter) : '');
  const res = await api(url);

  // Cache services & employees for dropdowns
  if (servicesCache.length === 0) {
    const svc = await api('/services');
    if (svc && Array.isArray(svc)) servicesCache = svc;
  }
  if (employeesCache.length === 0) {
    const emp = await api('/employees');
    if (emp && Array.isArray(emp)) employeesCache = emp;
  }

  const tbody = document.getElementById('ordersBody');
  if (!res || !res.data) {
    tbody.innerHTML = '<tr class="empty-row"><td>Məlumat yüklənmədi</td></tr>';
    return;
  }

  if (res.data.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td>Heç bir sifariş tapılmadı</td></tr>';
  } else {
    tbody.innerHTML = res.data.map(o => `
      <tr>
        <td data-label="ID" class="col-id">#${o.id}</td>
        <td data-label="Müştəri">${escapeHtml(o.customer?.name || '—')}</td>
        <td data-label="Xidmət">${escapeHtml(o.service?.name || '—')}</td>
        <td data-label="Tarix">${formatDate(o.date)}</td>
        <td data-label="İşçi">${escapeHtml(o.employee?.name || '—')}</td>
        <td data-label="Məbləğ" class="col-amount">${o.amount != null ? formatMoney(o.amount) : '—'}</td>
        <td data-label="Status">${statusTag(o.status)}</td>
        <td data-label="Əməliyyat" class="col-actions">
          <button class="btn-icon btn-edit" onclick="editOrder(${o.id}, ${escapeAttr(JSON.stringify(o))})" title="Düzəlt">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteOrder(${o.id})" title="Sil">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  // Apply mobile cards class
  applyMobileCards('ordersTable');

  // Pagination
  renderPagination('ordersPagination', res.total || 0, res.pages || 1, ordersPage, (p) => loadOrders(p));
}

function orderFields() {
  const serviceOptions = servicesCache.map(s => ({ value: s.id, label: s.name + ' (' + formatMoney(s.price) + ')' }));
  const employeeOptions = [{ value: '', label: 'İşçi seçin' }, ...employeesCache.map(e => ({ value: e.id, label: e.name + ' (' + e.specialty + ')' }))];

  return [
    { name: 'customerName', label: 'Müştəri adı', type: 'text', required: true },
    { name: 'customerPhone', label: 'Müştəri telefonu', type: 'text', required: true },
    { name: 'customerEmail', label: 'Müştəri e-poçtu', type: 'text', required: false },
    { name: 'customerAddress', label: 'Ünvan', type: 'text', required: true },
    { name: 'serviceId', label: 'Xidmət', type: 'select', options: serviceOptions, required: true },
    { name: 'employeeId', label: 'İşçi', type: 'select', options: employeeOptions, required: false },
    { name: 'address', label: 'Xidmət ünvanı', type: 'text', required: false },
    { name: 'date', label: 'Tarix', type: 'text', required: false, placeholder: 'YYYY-MM-DD' },
    { name: 'amount', label: 'Məbləğ (₼)', type: 'number', required: false },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'yeni', label: 'Yeni' },
      { value: 'gözləyir', label: 'Gözləyir' },
      { value: 'gedişdə', label: 'Gedişdə' },
      { value: 'tamamlandı', label: 'Tamamlandı' },
      { value: 'ləğv', label: 'Ləğv' }
    ], required: true },
    { name: 'message', label: 'Qeyd', type: 'textarea', required: false }
  ];
}

function addOrder() {
  openModal('Yeni Sifariş', orderFields(), async (data) => {
    // Build POST body
    const body = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || '',
      customerAddress: data.customerAddress,
      serviceId: data.serviceId ? parseInt(data.serviceId) : null,
      address: data.address || data.customerAddress,
      date: data.date || null,
      amount: data.amount ? parseFloat(data.amount) : null,
      message: data.message || ''
    };
    const res = await api('/orders', 'POST', body);
    if (res !== null) {
      showToast('Sifariş əlavə edildi', 'success');
      loadOrders();
    }
  });
}

function editOrder(id, data) {
  if (typeof data === 'string') data = JSON.parse(data);
  // Map nested objects to flat for form
  const flatData = {
    customerName: data.customer?.name || data.customerName || '',
    customerPhone: data.customer?.phone || data.customerPhone || '',
    customerEmail: data.customer?.email || data.customerEmail || '',
    customerAddress: data.customer?.address || data.customerAddress || data.address || '',
    serviceId: data.service?.id || data.serviceId || '',
    employeeId: data.employee?.id || data.employeeId || '',
    address: data.address || '',
    date: data.date || '',
    amount: data.amount || '',
    status: data.status || 'yeni',
    message: data.notes || data.message || ''
  };
  openModal('Sifarişi Düzəlt', orderFields(), async (updated) => {
    const body = {
      serviceId: updated.serviceId ? parseInt(updated.serviceId) : null,
      employeeId: updated.employeeId ? parseInt(updated.employeeId) : null,
      address: updated.address || '',
      date: updated.date || null,
      amount: updated.amount ? parseFloat(updated.amount) : null,
      status: updated.status,
      notes: updated.message || ''
    };
    const res = await api('/orders/' + id, 'PUT', body);
    if (res !== null) {
      showToast('Sifariş yeniləndi', 'success');
      loadOrders();
    }
  }, flatData);
}

async function deleteOrder(id) {
  if (!confirm('Bu sifarişi silmək istədiyinizə əminsiniz?')) return;
  const res = await api('/orders/' + id, 'DELETE');
  if (res !== null) {
    showToast('Sifariş silindi', 'info');
    loadOrders();
  }
}

// ════════════════════════════════════════════════════════════════════
// CUSTOMERS CRUD
// ════════════════════════════════════════════════════════════════════

async function loadCustomers(page) {
  if (page !== undefined) customersPage = page;

  const res = await api('/customers?page=' + customersPage + '&limit=20');
  const tbody = document.getElementById('customersBody');

  if (!res || !res.data) {
    tbody.innerHTML = '<tr class="empty-row"><td>Məlumat yüklənmədi</td></tr>';
    return;
  }

  if (res.data.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td>Heç bir müştəri tapılmadı</td></tr>';
  } else {
    tbody.innerHTML = res.data.map(c => `
      <tr>
        <td data-label="Ad">${escapeHtml(c.name || '—')}</td>
        <td data-label="Telefon">${escapeHtml(c.phone || '—')}</td>
        <td data-label="E-poçt">${escapeHtml(c.email || '—')}</td>
        <td data-label="Ünvan">${escapeHtml(c.address || '—')}</td>
        <td data-label="Sifariş sayı">${c.orderCount || c.orders_count || '—'}</td>
        <td data-label="Status">${statusTag(c.status)}</td>
        <td data-label="Əməliyyat" class="col-actions">
          <button class="btn-icon btn-edit" onclick="editCustomer(${c.id}, ${escapeAttr(JSON.stringify(c))})" title="Düzəlt">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteCustomer(${c.id})" title="Sil">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  applyMobileCards('customersTable');
  renderPagination('customersPagination', res.total || 0, res.pages || 1, customersPage, (p) => loadCustomers(p));
}

function customerFields() {
  return [
    { name: 'name', label: 'Ad Soyad', type: 'text', required: true },
    { name: 'phone', label: 'Telefon', type: 'text', required: true },
    { name: 'email', label: 'E-poçt', type: 'text', required: false },
    { name: 'address', label: 'Ünvan', type: 'text', required: false },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'aktiv', label: 'Aktiv' },
      { value: 'passiv', label: 'Passiv' }
    ], required: true }
  ];
}

function addCustomer() {
  openModal('Yeni Müştəri', customerFields(), async (data) => {
    const body = {
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      status: data.status
    };
    const res = await api('/customers', 'POST', body);
    if (res !== null) {
      showToast('Müştəri əlavə edildi', 'success');
      loadCustomers();
    }
  });
}

function editCustomer(id, data) {
  if (typeof data === 'string') data = JSON.parse(data);
  openModal('Müştərini Düzəlt', customerFields(), async (updated) => {
    const body = {
      name: updated.name,
      phone: updated.phone,
      email: updated.email || '',
      address: updated.address || '',
      status: updated.status
    };
    const res = await api('/customers/' + id, 'PUT', body);
    if (res !== null) {
      showToast('Müştəri yeniləndi', 'success');
      loadCustomers();
    }
  }, data);
}

async function deleteCustomer(id) {
  if (!confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) return;
  const res = await api('/customers/' + id, 'DELETE');
  if (res !== null) {
    showToast('Müştəri silindi', 'info');
    loadCustomers();
  }
}

// ════════════════════════════════════════════════════════════════════
// EMPLOYEES CRUD
// ════════════════════════════════════════════════════════════════════

async function loadEmployees() {
  const res = await api('/employees');
  const grid = document.getElementById('employeesGrid');

  if (!res || !Array.isArray(res)) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">Məlumat yüklənmədi</div>';
    return;
  }

  employeesCache = res;

  if (res.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">Heç bir işçi tapılmadı</div>';
    return;
  }

  grid.innerHTML = res.map((e, i) => {
    const initials = getInitials(e.name);
    const bgClass = 'bg-' + ((i % 6) + 1);
    const stars = renderStars(e.rating);
    return `
      <div class="employee-card">
        <div class="employee-avatar ${bgClass}">${escapeHtml(initials)}</div>
        <div class="employee-name">${escapeHtml(e.name || '—')}</div>
        <div class="employee-specialty">${escapeHtml(e.specialty || '—')}</div>
        <div class="employee-rating">
          <span class="stars">${stars}</span>
          <span>${e.rating != null ? parseFloat(e.rating).toFixed(1) : '—'}</span>
        </div>
        <div class="employee-phone">📞 ${escapeHtml(e.phone || '—')}</div>
        <div style="margin-bottom:14px;">${statusTag(e.status)}</div>
        <div class="employee-actions">
          <button class="btn-icon btn-edit" onclick="editEmployee(${e.id}, ${escapeAttr(JSON.stringify(e))})" title="Düzəlt">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteEmployee(${e.id})" title="Sil">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function employeeFields() {
  return [
    { name: 'name', label: 'Ad Soyad', type: 'text', required: true },
    { name: 'specialty', label: 'İxtisas', type: 'text', required: true, placeholder: 'məs: Ümumi təmizlik' },
    { name: 'phone', label: 'Telefon', type: 'text', required: false },
    { name: 'rating', label: 'Reytinq (0-5)', type: 'number', required: false, step: '0.1' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'aktiv', label: 'Aktiv' },
      { value: 'passiv', label: 'Passiv' }
    ], required: true }
  ];
}

function addEmployee() {
  openModal('Yeni İşçi', employeeFields(), async (data) => {
    const body = {
      name: data.name,
      specialty: data.specialty,
      phone: data.phone || '',
      rating: data.rating ? parseFloat(data.rating) : 0,
      status: data.status
    };
    const res = await api('/employees', 'POST', body);
    if (res !== null) {
      showToast('İşçi əlavə edildi', 'success');
      loadEmployees();
    }
  });
}

function editEmployee(id, data) {
  if (typeof data === 'string') data = JSON.parse(data);
  openModal('İşçini Düzəlt', employeeFields(), async (updated) => {
    const body = {
      name: updated.name,
      specialty: updated.specialty,
      phone: updated.phone || '',
      rating: updated.rating ? parseFloat(updated.rating) : 0,
      status: updated.status
    };
    const res = await api('/employees/' + id, 'PUT', body);
    if (res !== null) {
      showToast('İşçi yeniləndi', 'success');
      loadEmployees();
    }
  }, data);
}

async function deleteEmployee(id) {
  if (!confirm('Bu işçini silmək istədiyinizə əminsiniz?')) return;
  const res = await api('/employees/' + id, 'DELETE');
  if (res !== null) {
    showToast('İşçi silindi', 'info');
    loadEmployees();
  }
}

// ════════════════════════════════════════════════════════════════════
// SERVICES CRUD
// ════════════════════════════════════════════════════════════════════

async function loadServices() {
  const res = await api('/services');
  const tbody = document.getElementById('servicesBody');

  if (!res || !Array.isArray(res)) {
    tbody.innerHTML = '<tr class="empty-row"><td>Məlumat yüklənmədi</td></tr>';
    return;
  }

  servicesCache = res;

  if (res.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td>Heç bir xidmət tapılmadı</td></tr>';
  } else {
    tbody.innerHTML = res.map(s => `
      <tr>
        <td data-label="Xidmət">${escapeHtml(s.name || '—')}</td>
        <td data-label="Qiymət" class="col-amount">${s.price != null ? formatMoney(s.price) : '—'}</td>
        <td data-label="İşçi sayı">${s.workers || '—'}</td>
        <td data-label="Status">${statusTag(s.status)}</td>
        <td data-label="Əməliyyat" class="col-actions">
          <button class="btn-icon btn-edit" onclick="editService(${s.id}, ${escapeAttr(JSON.stringify(s))})" title="Düzəlt">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteService(${s.id})" title="Sil">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  applyMobileCards('servicesTable');
}

function serviceFields() {
  return [
    { name: 'name', label: 'Xidmət adı', type: 'text', required: true },
    { name: 'price', label: 'Qiymət (₼)', type: 'number', required: true, step: '0.01' },
    { name: 'workers', label: 'İşçi sayı', type: 'number', required: false },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'aktiv', label: 'Aktiv' },
      { value: 'passiv', label: 'Passiv' }
    ], required: true }
  ];
}

function addService() {
  openModal('Yeni Xidmət', serviceFields(), async (data) => {
    const body = {
      name: data.name,
      price: data.price ? parseFloat(data.price) : 0,
      workers: data.workers ? parseInt(data.workers) : 1,
      status: data.status
    };
    const res = await api('/services', 'POST', body);
    if (res !== null) {
      showToast('Xidmət əlavə edildi', 'success');
      loadServices();
    }
  });
}

function editService(id, data) {
  if (typeof data === 'string') data = JSON.parse(data);
  openModal('Xidməti Düzəlt', serviceFields(), async (updated) => {
    const body = {
      name: updated.name,
      price: updated.price ? parseFloat(updated.price) : 0,
      workers: updated.workers ? parseInt(updated.workers) : 1,
      status: updated.status
    };
    const res = await api('/services/' + id, 'PUT', body);
    if (res !== null) {
      showToast('Xidmət yeniləndi', 'success');
      loadServices();
    }
  }, data);
}

async function deleteService(id) {
  if (!confirm('Bu xidməti silmək istədiyinizə əminsiniz?')) return;
  const res = await api('/services/' + id, 'DELETE');
  if (res !== null) {
    showToast('Xidmət silindi', 'info');
    loadServices();
  }
}

// ════════════════════════════════════════════════════════════════════
// PAYMENTS CRUD
// ════════════════════════════════════════════════════════════════════

async function loadPaymentStats() {
  const res = await api('/payments/stats');
  if (!res) return;

  document.getElementById('payTotalIncome').textContent = formatMoney(res.totalIncome || 0);
  document.getElementById('payTotalPending').textContent = formatMoney(res.totalPending || 0);
  document.getElementById('payPaidCount').textContent = res.paidCount || 0;
}

async function loadPayments(page) {
  if (page !== undefined) paymentsPage = page;

  const res = await api('/payments?page=' + paymentsPage + '&limit=20');
  const tbody = document.getElementById('paymentsBody');

  if (!res || !res.data) {
    tbody.innerHTML = '<tr class="empty-row"><td>Məlumat yüklənmədi</td></tr>';
    return;
  }

  if (res.data.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td>Heç bir ödəniş tapılmadı</td></tr>';
  } else {
    tbody.innerHTML = res.data.map(p => `
      <tr>
        <td data-label="ID" class="col-id">#${p.id}</td>
        <td data-label="Sifariş">${p.order ? '#' + p.order.id : '—'}</td>
        <td data-label="Məbləğ" class="col-amount">${p.amount != null ? formatMoney(p.amount) : '—'}</td>
        <td data-label="Üsul">${escapeHtml(paymentMethodLabel(p.method))}</td>
        <td data-label="Status">${statusTag(p.status)}</td>
        <td data-label="Əməliyyat" class="col-actions">
          <button class="btn-icon btn-edit" onclick="editPayment(${p.id}, ${escapeAttr(JSON.stringify(p))})" title="Düzəlt">✏️</button>
          <button class="btn-icon btn-delete" onclick="deletePayment(${p.id})" title="Sil">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  applyMobileCards('paymentsTable');
  renderPagination('paymentsPagination', res.total || 0, res.pages || 1, paymentsPage, (p) => loadPayments(p));
}

function paymentFields() {
  return [
    { name: 'orderId', label: 'Sifariş ID', type: 'number', required: true },
    { name: 'amount', label: 'Məbləğ (₼)', type: 'number', required: true, step: '0.01' },
    { name: 'method', label: 'Ödəniş üsulu', type: 'select', options: [
      { value: 'nağd', label: 'Nağd' },
      { value: 'kart', label: 'Kart' },
      { value: 'köçürmə', label: 'Köçürmə' }
    ], required: true },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'ödənilib', label: 'Ödənilib' },
      { value: 'gözləyir', label: 'Gözləyir' }
    ], required: true }
  ];
}

function addPayment() {
  openModal('Yeni Ödəniş', paymentFields(), async (data) => {
    const body = {
      orderId: data.orderId ? parseInt(data.orderId) : null,
      amount: data.amount ? parseFloat(data.amount) : 0,
      method: data.method,
      status: data.status
    };
    const res = await api('/payments', 'POST', body);
    if (res !== null) {
      showToast('Ödəniş əlavə edildi', 'success');
      loadPayments();
      loadPaymentStats();
    }
  });
}

function editPayment(id, data) {
  if (typeof data === 'string') data = JSON.parse(data);
  const flatData = {
    orderId: data.order?.id || data.orderId || '',
    amount: data.amount || '',
    method: data.method || 'nağd',
    status: data.status || 'gözləyir'
  };
  openModal('Ödənişi Düzəlt', paymentFields(), async (updated) => {
    const body = {
      orderId: updated.orderId ? parseInt(updated.orderId) : null,
      amount: updated.amount ? parseFloat(updated.amount) : 0,
      method: updated.method,
      status: updated.status
    };
    const res = await api('/payments/' + id, 'PUT', body);
    if (res !== null) {
      showToast('Ödəniş yeniləndi', 'success');
      loadPayments();
      loadPaymentStats();
    }
  }, flatData);
}

async function deletePayment(id) {
  if (!confirm('Bu ödənişi silmək istədiyinizə əminsiniz?')) return;
  const res = await api('/payments/' + id, 'DELETE');
  if (res !== null) {
    showToast('Ödəniş silindi', 'info');
    loadPayments();
    loadPaymentStats();
  }
}

// ════════════════════════════════════════════════════════════════════
// FINANCE
// ════════════════════════════════════════════════════════════════════

async function loadFinance() {
  const stats = await api('/payments/stats');

  if (stats) {
    const income = stats.totalIncome || 0;
    const expense = Math.round(income * 0.45); // Estimated expenses ~45%
    const profit = income - expense;

    document.getElementById('financeIncome').textContent = formatMoney(income);
    document.getElementById('financeExpense').textContent = formatMoney(expense);
    document.getElementById('financeProfit').textContent = formatMoney(profit);
  }

  initFinanceChart();
}

// ════════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════════

function loadSettings() {
  if (currentUser) {
    const initials = getInitials(currentUser.username);
    document.getElementById('settingsAvatar').textContent = initials;
    document.getElementById('settingsUserName').textContent = currentUser.username || 'Admin';
    document.getElementById('settingsUserEmail').textContent = currentUser.email || 'admin@vibecleaning.az';
  }

  // Apply saved theme to toggle
  const theme = localStorage.getItem('parlaTheme') || 'light';
  const darkToggle = document.getElementById('settingDarkMode');
  if (darkToggle) darkToggle.checked = (theme === 'dark');

  // Load other settings from localStorage
  const settings = JSON.parse(localStorage.getItem('parlaSettings') || '{}');
  const sms = document.getElementById('settingSms');
  const email = document.getElementById('settingEmail');
  const tfa = document.getElementById('setting2fa');
  if (sms) sms.checked = settings.sms || false;
  if (email) email.checked = settings.email || false;
  if (tfa) tfa.checked = settings.tfa || false;
}

function saveSettings() {
  const settings = {
    sms: document.getElementById('settingSms').checked,
    email: document.getElementById('settingEmail').checked,
    tfa: document.getElementById('setting2fa').checked
  };
  localStorage.setItem('parlaSettings', JSON.stringify(settings));
  showToast('Tənzimləmələr yadda saxlandı', 'success');
}

// ════════════════════════════════════════════════════════════════════
// SEARCH (client-side table filter)
// ════════════════════════════════════════════════════════════════════

function filterTable(tableId, searchId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const input = document.getElementById(searchId);
  if (!input) return;

  const filter = input.value.toLowerCase();
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(row => {
    if (row.classList.contains('empty-row')) return;
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

// ════════════════════════════════════════════════════════════════════
// PAGINATION
// ════════════════════════════════════════════════════════════════════

function renderPagination(containerId, total, pages, currentPage, loadFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Prev button
  html += `<button onclick="void(0)" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹ Əvvəlki</button>`;

  // Page numbers
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(pages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    html += `<button data-page="1">1</button>`;
    if (start > 2) html += `<span class="page-info">...</span>`;
  }

  for (let i = start; i <= end; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (end < pages) {
    if (end < pages - 1) html += `<span class="page-info">...</span>`;
    html += `<button data-page="${pages}">${pages}</button>`;
  }

  // Next button
  html += `<button ${currentPage >= pages ? 'disabled' : ''} data-page="${currentPage + 1}">Növbəti ›</button>`;

  container.innerHTML = html;

  // Bind clicks
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      if (p > 0 && p <= pages) {
        loadFn(p);
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════════
// STATUS FILTER TABS
// ════════════════════════════════════════════════════════════════════

function setupFilterTabs() {
  const tabs = document.querySelectorAll('#orderFilterTabs .filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const status = tab.dataset.status;
      loadOrders(1, status);
    });
  });
}

// ════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════

function formatMoney(amount) {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('az-AZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₼';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function renderStars(rating) {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < full ? '★' : '☆';
  }
  return stars;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
}

function applyMobileCards(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  if (window.innerWidth < 768) {
    table.classList.add('mobile-cards');
  } else {
    table.classList.remove('mobile-cards');
  }
}

// ════════════════════════════════════════════════════════════════════
// USER INFO
// ════════════════════════════════════════════════════════════════════

function updateUserInfo() {
  if (!currentUser) return;

  const initials = getInitials(currentUser.username);
  const name = currentUser.username || 'Admin';
  const role = currentUser.role || 'admin';

  // Sidebar
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarUserName').textContent = name;
  document.getElementById('sidebarUserRole').textContent = role;

  // Topbar
  document.getElementById('topbarAvatar').textContent = initials;
}

// ════════════════════════════════════════════════════════════════════
// INIT APP
// ════════════════════════════════════════════════════════════════════

async function initApp() {
  // Load current user from localStorage or fetch from API
  const storedUser = localStorage.getItem('parlaUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }

  // Try to fetch current user from API
  const me = await api('/auth/me');
  if (me) {
    currentUser = me;
    localStorage.setItem('parlaUser', JSON.stringify(me));
  }

  updateUserInfo();

  // Apply saved theme
  const savedTheme = localStorage.getItem('parlaTheme') || 'light';
  applyTheme(savedTheme);

  // Apply saved sidebar state
  if (localStorage.getItem('sidebarCollapsed') === 'true' && !isMobile) {
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('main').classList.add('expanded');
  }

  // Bind events
  bindEvents();

  // Setup filter tabs
  setupFilterTabs();

  // Load dashboard
  loadDashboard();
}

function bindEvents() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Nav links
  document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Menu button
  document.getElementById('menuBtn').addEventListener('click', toggleSidebar);

  // Sidebar backdrop
  document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);

  // Dark mode toggle
  document.getElementById('darkToggle').addEventListener('click', toggleDarkMode);

  // Modal overlay click to close
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });

  // Global search (filters current page's table)
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('keyup', () => {
      const activePage = document.querySelector('.page.active');
      if (!activePage) return;
      const tables = activePage.querySelectorAll('table.data-table');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        const filter = globalSearch.value.toLowerCase();
        rows.forEach(row => {
          if (row.classList.contains('empty-row')) return;
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(filter) ? '' : 'none';
        });
      });
    });
  }

  // Window resize
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.getElementById('sidebar').classList.remove('collapsed');
      document.getElementById('main').classList.remove('expanded');
    } else {
      closeSidebar();
    }
    // Re-apply mobile cards
    document.querySelectorAll('table.data-table').forEach(t => {
      if (isMobile) t.classList.add('mobile-cards');
      else t.classList.remove('mobile-cards');
    });
  });

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ════════════════════════════════════════════════════════════════════
// DOMContentLoaded
// ════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme immediately
  const savedTheme = localStorage.getItem('parlaTheme') || 'light';
  applyTheme(savedTheme);

  // Check auth
  const token = getToken();
  if (!token) {
    showLogin();
    // Still bind login event
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  } else {
    hideLogin();
    initApp();
  }
});
