// main.js — Parla Təmizlik frontend

// ── Config ──
const API_URL = window.API_URL || 'https://parla-clean-backend.onrender.com/api';

// ── Mobil menyu ──
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle) {
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
}

// ── Smooth scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      if (navLinks) navLinks.classList.remove('active');
    }
  });
});

// ── Contact form ──
const contactForm = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const payload = {
      customerName: formData.get('name'),
      customerPhone: formData.get('phone'),
      customerEmail: formData.get('email') || formData.get('customerEmail'),
      customerAddress: formData.get('address') || '',
      serviceId: parseInt(formData.get('service')) || null,
      address: formData.get('address') || '',
      message: formData.get('message') || ''
    };

    if (formMsg) {
      formMsg.textContent = 'Göndərilir...';
      formMsg.className = 'form-msg';
    }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (formMsg) {
          formMsg.textContent = '✅ Müraciətiniz uğurla göndərildi! Tezliklə əlaqə saxlayacağıq.';
          formMsg.className = 'form-msg success';
        }
        contactForm.reset();
      } else {
        throw new Error(data.error || 'Xəta baş verdi');
      }
    } catch (err) {
      if (formMsg) {
        formMsg.textContent = '❌ Xəta: ' + err.message + ' — Zəhmət olmasa telefon ilə əlaqə saxlayın.';
        formMsg.className = 'form-msg error';
      }
    }
  });
}

// ── Load services into select ──
async function loadServices() {
  const select = document.querySelector('#contactForm select[name="service"]');
  if (!select) return;
  try {
    const res = await fetch(`${API_URL}/services`);
    const services = await res.json();
    if (Array.isArray(services) && services.length > 0) {
      select.innerHTML = '<option value="">Xidmət seçin</option>' +
        services.map(s => `<option value="${s.id}">${s.name} — ₼${s.price}/saat</option>`).join('');
    }
  } catch (e) {
    console.log('Services: API not connected, using default options');
  }
}

loadServices();
