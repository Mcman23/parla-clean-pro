// admin.js — Parla Admin Panel

// ── Config ──
const API_URL = window.API_URL || 'https://parla-clean-backend.onrender.com/api';
const TOKEN_KEY = 'parla_admin_token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function authHeaders() {
  const t = getToken();
  return t ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` } : { 'Content-Type': 'application/json' };
}

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: authHeaders() });
  if (res.status === 401) {
    clearToken();
    window.location.href = 'admin.html';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Xəta baş verdi');
  return data;
}

// ── Mobil menyu ──
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
if (menuBtn) menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

// ── Səhifə keçidi ──
const navLinks = document.querySelectorAll('.nav-menu a');
const pages = document.querySelectorAll('.page');
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const target = link.dataset.page;
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    sidebar.classList.remove('open');
  });
});

// ── Charts ──
const chartColors = {
  primary: '#1ca9c9', blue: '#3498db', orange: '#e67e22',
  purple: '#9b59b6', green: '#2ecc71', red: '#e74c3c'
};

// Gəlir qrafiki
const revenueCtx = document.getElementById('revenueChart');
if (revenueCtx) {
  new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'],
      datasets: [{
        label: 'Aylıq gəlir (₼)',
        data: [9,11,10,13,12,15,14,16,17,18,19,21],
        borderColor: chartColors.primary,
        backgroundColor: 'rgba(28,169,201,.1)',
        fill: true, tension: .4, borderWidth: 3, pointRadius: 0
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

// Xidmət bölgüsü (Doughnut)
const serviceCtx = document.getElementById('serviceChart');
if (serviceCtx) {
  new Chart(serviceCtx, {
    type: 'doughnut',
    data: {
      labels: ['Ev','Ofis','Pəncərə','Dezinfeksiya','Tikinti'],
      datasets: [{ data: [42,28,15,10,5], backgroundColor: [chartColors.primary, chartColors.blue, chartColors.orange, chartColors.purple, chartColors.green] }]
    },
    options: { cutout: '65%', plugins: { legend: { position: 'bottom' } } }
  });
}

// Maliyyə qrafiki
const financeCtx = document.getElementById('financeChart');
if (financeCtx) {
  new Chart(financeCtx, {
    type: 'bar',
    data: {
      labels: ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'],
      datasets: [
        { label: 'Gəlir', data: [9,11,10,13,12,15,14,16,17,18,19,21], backgroundColor: chartColors.primary },
        { label: 'Xərc', data: [4,5,4,6,5,7,6,8,8,9,10,11], backgroundColor: chartColors.orange }
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

// ── API calls (try to load real data, keep demo data on error) ──
async function loadDashboardStats() {
  try {
    const [orders, customers, employees, payments] = await Promise.all([
      api('/orders?limit=1'),
      api('/customers?limit=1'),
      api('/employees'),
      api('/payments/stats')
    ]);
    if (orders.total !== undefined) document.getElementById('stat-orders').textContent = orders.total;
    if (customers.total !== undefined) document.getElementById('stat-customers').textContent = customers.total;
    if (employees.length !== undefined) document.getElementById('stat-employees').textContent = employees.length;
    if (payments.totalIncome !== undefined) document.getElementById('stat-income').textContent = `₼ ${payments.totalIncome.toLocaleString()}`;
  } catch (e) {
    console.log('Dashboard: using demo data (API not connected)');
  }
}

async function loadOrders() {
  try {
    const data = await api('/orders?limit=10');
    if (data.data && data.data.length > 0) {
      const tbody = document.getElementById('orders-body');
      if (tbody) {
        tbody.innerHTML = data.data.map(o => `
          <tr>
            <td>#${o.id}</td>
            <td>${o.customer?.name || '—'}</td>
            <td>${o.service?.name || '—'}</td>
            <td>${o.date || '—'}</td>
            <td>${o.employee?.name || 'Təyin edilməyib'}</td>
            <td><span class="tag ${statusTag(o.status)}">${statusLabel(o.status)}</span></td>
            <td><button class="btn-sm" onclick="viewOrder(${o.id})">Bax</button></td>
          </tr>`).join('');
      }
    }
  } catch (e) {
    console.log('Orders: using demo data');
  }
}

async function loadCustomers() {
  try {
    const data = await api('/customers?limit=20');
    if (data.data && data.data.length > 0) {
      const tbody = document.getElementById('customers-body');
      if (tbody) {
        tbody.innerHTML = data.data.map(c => `
          <tr>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.address || '—'}</td>
            <td>${c.orders?.length || 0}</td>
            <td><span class="tag ${c.status === 'aktiv' ? 'green' : 'gray'}">${c.status === 'aktiv' ? 'Aktiv' : 'Passiv'}</span></td>
          </tr>`).join('');
      }
    }
  } catch (e) {
    console.log('Customers: using demo data');
  }
}

async function loadEmployees() {
  try {
    const data = await api('/employees');
    if (data.length > 0) {
      const grid = document.getElementById('employees-grid');
      if (grid) {
        grid.innerHTML = data.map(e => {
          const initials = e.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          return `<div class="emp-card">
            <div class="avatar lg">${initials}</div>
            <h4>${e.name}</h4>
            <small>${e.specialty || '—'}</small>
            <p class="rate">⭐ ${parseFloat(e.rating).toFixed(1)}</p>
          </div>`;
        }).join('');
      }
    }
  } catch (e) {
    console.log('Employees: using demo data');
  }
}

async function loadServices() {
  try {
    const data = await api('/services');
    if (data.length > 0) {
      const tbody = document.getElementById('services-body');
      if (tbody) {
        tbody.innerHTML = data.map(s => `
          <tr>
            <td>${s.name}</td>
            <td>₼ ${s.price}</td>
            <td>${s.workers || '—'}</td>
            <td><span class="tag ${s.status === 'aktiv' ? 'green' : 'gray'}">${s.status === 'aktiv' ? 'Aktiv' : 'Passiv'}</span></td>
          </tr>`).join('');
      }
    }
  } catch (e) {
    console.log('Services: using demo data');
  }
}

// ── Helpers ──
function statusTag(s) {
  const map = { 'tamamlandı': 'green', 'gedişdə': 'blue', 'gözləyir': 'yellow', 'ləğv': 'red', 'yeni': 'gray' };
  return map[s] || 'gray';
}
function statusLabel(s) {
  const map = { 'tamamlandı': 'Tamamlandı', 'gedişdə': 'Gedişdə', 'gözləyir': 'Gözləyir', 'ləğv': 'Ləğv', 'yeni': 'Yeni' };
  return map[s] || s;
}
function viewOrder(id) {
  // TODO: open order detail modal
  console.log('View order:', id);
}

// ── Init ──
loadDashboardStats();
loadOrders();
loadCustomers();
loadEmployees();
loadServices();
