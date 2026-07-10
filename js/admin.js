/* --------------------------------------------------------------------------- */
/*  Admin core: page toggle, sidebar, dark-mode, JWT, Chart.js, API            */
/* --------------------------------------------------------------------------- */

const API_URL = 'https://parla-clean-backend.onrender.com/api'

/* ── JWT token ── */
function getToken() { return localStorage.getItem('accessToken') }
function setToken(t) { localStorage.setItem('accessToken', t) }
function clearToken() { localStorage.removeItem('accessToken') }

function authHeaders() {
  const t = getToken()
  const h = { 'Content-Type': 'application/json' }
  if (t) h['Authorization'] = `Bearer ${t}`
  return h
}

/* ── Simple fetch helper ── */
async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: authHeaders() }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${API_URL}${url}`, opts)
  if (res.status === 401) { clearToken(); window.location.href = 'admin.html'; return }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Xəta')
  return data
}

/* ── Sidebar toggle ── */
const menuBtn = document.getElementById('menuBtn')
const sidebar = document.getElementById('sidebar')
if (menuBtn) menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'))

/* ── Page navigation ── */
const navLinks = document.querySelectorAll('.nav-links a')
const pages = document.querySelectorAll('.page')

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault()
    const target = link.getAttribute('data-page')
    navLinks.forEach(l => l.classList.remove('active'))
    link.classList.add('active')
    pages.forEach(p => p.classList.remove('active'))
    document.getElementById(target).classList.add('active')
    sidebar.classList.remove('open')
  })
})

/* ── Chart.js ── */
const colors = { primary: '#1ca9c9', blue: '#3498db', orange: '#e67e22', purple: '#9b59b6', green: '#2ecc71', red: '#e74c3c' }

const revenueCtx = document.getElementById('revenueChart')
if (revenueCtx) {
  new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'],
      datasets: [{
        label: 'Aylıq gəlir (₼)',
        data: [9,11,10,13,12,15,14,16,17,18,19,21],
        borderColor: colors.primary,
        backgroundColor: 'rgba(28,169,201,.1)',
        fill: true, tension: .4, borderWidth: 3, pointRadius: 0
      }]
    },
    options: { plugins: { legend: { display: false } } }
  })
}

const serviceCtx = document.getElementById('serviceChart')
if (serviceCtx) {
  new Chart(serviceCtx, {
    type: 'doughnut',
    data: {
      labels: ['Ev','Ofis','Pəncərə','Dezinfeksiya','Digər'],
      datasets: [{ data: [42,28,15,10,5], backgroundColor: [colors.primary, colors.blue, colors.orange, colors.purple, colors.green] }]
    },
    options: { cutout: '65%', plugins: { legend: { position: 'bottom' } } }
  })
}

const financeCtx = document.getElementById('financeChart')
if (financeCtx) {
  new Chart(financeCtx, {
    type: 'bar',
    data: {
      labels: ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'],
      datasets: [
        { label: 'Gəlir', data: [9,11,10,13,12,15,14,16,17,18,19,21], backgroundColor: colors.primary },
        { label: 'Xərc', data: [4,5,4,6,5,7,6,8,8,9,10,11], backgroundColor: colors.orange }
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  })
}

/* ── Helpers ── */
function statusTag(s) {
  const map = { 'tamamlandı': 'green', 'gedişdə': 'blue', 'gözləyir': 'yellow', 'ləğv': 'red', 'yeni': 'gray', 'ödənilib': 'green' }
  return map[s] || 'gray'
}
function statusLabel(s) {
  const map = { 'tamamlandı': 'Tamamlandı', 'gedişdə': 'Gedişdə', 'gözləyir': 'Gözləyir', 'ləğv': 'Ləğv', 'yeni': 'Yeni', 'ödənilib': 'Ödənilib' }
  return map[s] || s
}

/* ── Load orders ── */
async function loadOrders() {
  try {
    const out = await api('/orders', 'GET')
    const tbody = document.querySelector('#orders table tbody')
    if (tbody && out.data) {
      tbody.innerHTML = out.data.map(o => `
        <tr>
          <td>#${o.id}</td>
          <td>${o.customer?.name || '—'}</td>
          <td>${o.service?.name || '—'}</td>
          <td>${o.date || '—'}</td>
          <td>${o.employee?.name || 'Təyin edilməyib'}</td>
          <td><span class="tag ${statusTag(o.status)}">${statusLabel(o.status)}</span></td>
          <td><button class="btn-sm" onclick="viewOrder(${o.id})">Bax</button></td>
        </tr>`).join('')
    }
  } catch (e) { console.log('Orders: demo data', e.message) }
}

/* ── Load customers ── */
async function loadCustomers() {
  try {
    const out = await api('/customers', 'GET')
    const tbody = document.querySelector('#customers table tbody')
    if (tbody && out.data) {
      tbody.innerHTML = out.data.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.phone}</td>
          <td>${c.address || '—'}</td>
          <td>${c.orders?.length || 0}</td>
          <td><span class="tag ${c.status === 'aktiv' ? 'green' : 'gray'}">${c.status === 'aktiv' ? 'Aktiv' : 'Passiv'}</span></td>
        </tr>`).join('')
    }
  } catch (e) { console.log('Customers: demo data', e.message) }
}

/* ── Load employees ── */
async function loadEmployees() {
  try {
    const data = await api('/employees', 'GET')
    const grid = document.getElementById('employees-grid')
    if (grid && data.length > 0) {
      grid.innerHTML = data.map(e => {
        const initials = e.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        return `<div class="emp-card">
          <div class="avatar lg">${initials}</div>
          <h4>${e.name}</h4>
          <small>${e.specialty || '—'}</small>
          <p class="rate">⭐ ${parseFloat(e.rating).toFixed(1)}</p>
        </div>`
      }).join('')
    }
  } catch (e) { console.log('Employees: demo data', e.message) }
}

/* ── Load services ── */
async function loadServices() {
  try {
    const data = await api('/services', 'GET')
    const tbody = document.querySelector('#services table tbody')
    if (tbody && data.length > 0) {
      tbody.innerHTML = data.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>₼ ${s.price}</td>
          <td>${s.workers || '—'}</td>
          <td><span class="tag ${s.status === 'aktiv' ? 'green' : 'gray'}">${s.status === 'aktiv' ? 'Aktiv' : 'Passiv'}</span></td>
        </tr>`).join('')
    }
  } catch (e) { console.log('Services: demo data', e.message) }
}

/* ── Load payments ── */
async function loadPayments() {
  try {
    const out = await api('/payments', 'GET')
    const tbody = document.querySelector('#payments table tbody')
    if (tbody && out.data) {
      tbody.innerHTML = out.data.map(p => `
        <tr>
          <td>#${p.id}</td>
          <td>${p.order?.id || '—'}</td>
          <td>₼ ${p.amount}</td>
          <td>${p.method}</td>
          <td><span class="tag ${statusTag(p.status)}">${statusLabel(p.status)}</span></td>
        </tr>`).join('')
    }
  } catch (e) { console.log('Payments: demo data', e.message) }
}

/* ── Dashboard stats ── */
async function loadStats() {
  try {
    const [orders, customers, employees, payments] = await Promise.all([
      api('/orders?limit=1'), api('/customers?limit=1'), api('/employees'), api('/payments/stats')
    ])
    const el = id => document.getElementById(id)
    if (el('stat-orders') && orders.total !== undefined) el('stat-orders').textContent = orders.total
    if (el('stat-customers') && customers.total !== undefined) el('stat-customers').textContent = customers.total
    if (el('stat-employees') && employees.length !== undefined) el('stat-employees').textContent = employees.length
    if (el('stat-income') && payments.totalIncome !== undefined) el('stat-income').textContent = `₼ ${payments.totalIncome.toLocaleString()}`
  } catch (e) { console.log('Stats: demo data', e.message) }
}

/* ── View order (modal placeholder) ── */
function viewOrder(id) { console.log('View order:', id) }

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  loadStats()
  loadOrders()
  loadCustomers()
  loadEmployees()
  loadServices()
  loadPayments()
})
