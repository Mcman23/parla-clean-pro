/* ========================================
   PARLA TƏMİZLİK — main.js
   Interactive functionality
   ======================================== */

const API_URL = window.API_URL || 'https://vibe-cleaning-backend.onrender.com/api';

/* ===== PRELOADER ===== */
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            setTimeout(() => preloader.style.display = 'none', 600);
        }
    }, 1500);
});

/* ===== NAVBAR SCROLL EFFECT ===== */
const navbar = document.getElementById('navbar');

function handleNavScroll() {
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleNavScroll, { passive: true });

/* ===== MOBILE MENU ===== */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta, .mobile-phone');

function toggleMobileMenu(open) {
    const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('active');
    hamburger.classList.toggle('active', isOpen);
    mobileMenu.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

hamburger.addEventListener('click', () => toggleMobileMenu());

mobileLinks.forEach(link => {
    link.addEventListener('click', () => toggleMobileMenu(false));
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggleMobileMenu(false);
    }
});

/* ===== SMOOTH SCROLL TO SECTIONS ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '') return;

        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;

        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight + 1;

        window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
        });
    });
});

/* ===== INTERSECTION OBSERVER (Animate on Scroll) ===== */
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            scrollObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    scrollObserver.observe(el);
});

/* ===== COUNTER ANIMATION ===== */
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // easeOutExpo for a nice decelerating effect
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = Math.floor(eased * target);
                el.textContent = current.toLocaleString('az-AZ') + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    el.textContent = target.toLocaleString('az-AZ') + suffix;
                }
            }

            requestAnimationFrame(updateCounter);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => {
    counterObserver.observe(el);
});

/* ===== LOAD SERVICES FROM API ===== */
async function loadServices() {
    const select = document.getElementById('service');
    if (!select) return;

    // Fallback services in case API is unreachable
    const fallbackServices = [
        { id: 1, name: 'Ev Təmizliyi', price: 15 },
        { id: 2, name: 'Ofis Təmizliyi', price: 20 },
        { id: 3, name: 'Pəncərə Yuyulması', price: 12 },
        { id: 4, name: 'Tikinti Sonrası', price: 30 },
        { id: 5, name: 'Mebl Təmizliyi', price: 18 },
        { id: 6, name: 'Dezinfeksiya', price: 25 }
    ];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${API_URL}/services`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('API returned non-OK status');

        const services = await response.json();

        if (Array.isArray(services) && services.length > 0) {
            populateServiceSelect(select, services);
        } else {
            populateServiceSelect(select, fallbackServices);
        }
    } catch (err) {
        console.warn('API services unavailable, using fallback:', err.message);
        populateServiceSelect(select, fallbackServices);
    }
}

function populateServiceSelect(select, services) {
    // Keep the placeholder option, clear the rest
    const placeholder = select.querySelector('option[disabled]');
    select.innerHTML = '';
    if (placeholder) {
        select.appendChild(placeholder);
    } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = 'Seçin...';
        select.appendChild(opt);
    }

    services.forEach(service => {
        const option = document.createElement('option');
        const name = service.name || service.title || service.service_name || 'Xidmət';
        const price = service.price || service.pricePerHour || service.price_per_hour;
        option.value = name;
        if (price) {
            option.textContent = `${name} — ₼${price}/saat`;
        } else {
            option.textContent = name;
        }
        select.appendChild(option);
    });
}

/* ===== PHONE VALIDATION (AZ) ===== */
function validateAzPhone(phone) {
    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Must start with +994 or 0, then 9 digits (total 10-13 digits)
    const regex = /^(?:\+994|0)\d{9}$/;
    return regex.test(cleaned);
}

/* ===== EMAIL VALIDATION (basic) ===== */
function validateEmail(email) {
    if (!email) return true; // optional field
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/* ===== TOAST SYSTEM ===== */
const toastContainer = document.getElementById('toastContainer');

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 4000);

    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
}

/* ===== FORM SUBMISSION ===== */
const orderForm = document.getElementById('orderForm');
const submitBtn = document.getElementById('submitBtn');

if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Clear previous errors
        orderForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        // Gather form data
        const name = orderForm.name.value.trim();
        const phone = orderForm.phone.value.trim();
        const email = orderForm.email.value.trim();
        const service = orderForm.service.value;
        const address = orderForm.address.value.trim();
        const message = orderForm.message.value.trim();

        let hasError = false;

        // Validate name
        if (!name || name.length < 3) {
            orderForm.name.classList.add('error');
            hasError = true;
        }

        // Validate phone
        if (!phone || !validateAzPhone(phone)) {
            orderForm.phone.classList.add('error');
            hasError = true;
        }

        // Validate email (if provided)
        if (email && !validateEmail(email)) {
            orderForm.email.classList.add('error');
            hasError = true;
        }

        // Validate service
        if (!service) {
            orderForm.service.classList.add('error');
            hasError = true;
        }

        // Validate address
        if (!address || address.length < 5) {
            orderForm.address.classList.add('error');
            hasError = true;
        }

        if (hasError) {
            showToast('Zəhmət olmasa, qırmızı xanaları düzgün doldurun.', 'error');
            return;
        }

        // Prepare payload
        const payload = {
            name,
            phone,
            email: email || undefined,
            service,
            address,
            message: message || undefined
        };

        // Loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMsg = 'Sifariş göndərilərkən xəta baş verdi.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || errorMsg;
                } catch (_) {}
                throw new Error(errorMsg);
            }

            // Success
            showToast('Sifarişiniz uğurla göndərildi! Tezliklə sizinlə əlaqə saxlayacağıq.', 'success');
            orderForm.reset();
        } catch (err) {
            if (err.name === 'AbortError') {
                showToast('Bağlantı vaxtı bitdi. İnternet bağlantınızı yoxlayın və yenidən cəhd edin.', 'error');
            } else {
                showToast(err.message || 'Sifariş göndərilərkən xəta baş verdi. Yenidən cəhd edin.', 'error');
            }
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

/* ===== ACTIVE NAV LINK ON SCROLL ===== */
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

function highlightActiveNav() {
    const scrollY = window.pageYOffset;
    const navHeight = navbar.offsetHeight;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - navHeight - 20;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            navLinkEls.forEach(link => {
                link.classList.remove('active-nav');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active-nav');
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightActiveNav, { passive: true });

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
});

/* ===== YEAR AUTO-UPDATE (footer) ===== */
const yearEl = document.querySelector('.footer-bottom p');
if (yearEl) {
    const currentYear = new Date().getFullYear();
    yearEl.innerHTML = yearEl.innerHTML.replace(/\d{4}/, currentYear);
}
