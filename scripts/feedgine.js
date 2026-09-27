/**
 * feedgine.js — Main page interactions
 * - Scroll animations (IntersectionObserver)
 * - Bar animation for the profit visual
 * - Terminal pulse effect
 * - Smooth scroll for anchor links
 */
(function () {
    'use strict';

    // ---- SCROLL ANIMATIONS ----
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-in').forEach(el => obs.observe(el));

    // ---- BAR ANIMATION ----
    const barObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.querySelectorAll('.poas-fill').forEach(bar => {
                    const w = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(() => { bar.style.width = w; }, 150);
                });
                barObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.how-visual').forEach(el => barObs.observe(el));

    // ---- TERMINAL PULSE ----
    setInterval(() => {
        document.querySelectorAll('.t-val').forEach(v => {
            v.style.transition = 'opacity 0.3s';
            v.style.opacity    = '0.4';
            setTimeout(() => { v.style.opacity = '1'; }, 300);
        });
    }, 3500);

    // ---- HAMBURGER MENU ----
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');

    function closeMobileNav() {
        if (!hamburger || !mobileNav) return;
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.contains('open');
            if (isOpen) {
                closeMobileNav();
            } else {
                hamburger.classList.add('open');
                hamburger.setAttribute('aria-expanded', 'true');
                mobileNav.classList.add('open');
                mobileNav.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }
        });

        // Close on any nav link click
        mobileNav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeMobileNav);
        });

        // Close on overlay click or Escape key
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileNav(); });
    }

    // ---- SMOOTH SCROLL ----
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = 100;
            const top    = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    // ---- CONTACT FORM SUBMIT ----
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Wird gesendet…'; }

            const data = {
                type:    'contact',
                name:    form.querySelector('[name="name"]')?.value    || '',
                contact: form.querySelector('[name="contact"]')?.value || '',
                message: form.querySelector('[name="message"]')?.value || '',
                company: form.querySelector('[name="company"]')?.value || '',
            };

            try {
                const res = await fetch('scripts/add/send.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(data),
                });
                const json = await res.json();
                const msg  = form.querySelector('.form-success');
                if (msg) { msg.style.display = 'block'; }
                form.reset();
            } catch (err) {
                console.error('Form error:', err);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Demo anfragen →'; }
            }
        });
    }
})();
