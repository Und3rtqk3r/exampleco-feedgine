// cursor.js — Venom/Spider Cursor · Space Edition (white + neon)

document.addEventListener("DOMContentLoaded", function () {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    /* ── CONFIG ── */
    const CONFIG = {
        tentacleCount:  10,
        triggerDist:    8,
        maxLength:      300,
        connectionDist: 150,
        prediction:     3.5,

        // Idle: cold silver-white
        idleStroke: { r: 210, g: 228, b: 255 },
        idleGlow:   { r: 160, g: 200, b: 255 },

        // Hover: neon orange (matches site accent)
        hoverStroke: { r: 255, g: 102, b: 0 },
        hoverGlow:   { r: 255, g: 80,  b: 0 },
    };

    /* ── toggle ── */
    const toggleBtn = document.getElementById('cursorToggle');
    const body = document.body;

    let isCursorDisabled = localStorage.getItem('venomCursorDisabled') !== 'false';

    function updateCursorState() {
        if (isCursorDisabled) {
            body.classList.add('system-cursor');
            document.documentElement.style.cursor = '';
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                const icon = toggleBtn.querySelector('.cursor-icon');
                if (icon && icon.tagName === 'IMG') {
                    icon.src = 'images/icons/spider.png';
                    icon.alt = 'Spider Cursor';
                }
            }
        } else {
            body.classList.remove('system-cursor');
            document.documentElement.style.cursor = 'none';
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                const icon = toggleBtn.querySelector('.cursor-icon');
                if (icon && icon.tagName === 'IMG') {
                    icon.src = 'images/additional/cursor.png';
                    icon.alt = 'Custom Cursor';
                }
            }
        }
    }

    updateCursorState();

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isCursorDisabled = !isCursorDisabled;
            localStorage.setItem('venomCursorDisabled', isCursorDisabled);
            updateCursorState();
        });
    }

    /* ── canvas ── */
    const canvas = document.createElement('canvas');
    canvas.id = 'venom-cursor';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── state ── */
    const mouse    = { x: 0, y: 0 };
    const oldMouse = { x: 0, y: 0 };
    let isHover    = false;
    let colorT     = 0;  // 0 = idle, 1 = hover (lerped)

    const tentacles = [];
    let   rotation  = 0;      // reticle ring slow spin

    /* ── hover selector ── */
    const HOVER_SEL = [
        'a', 'button', '[role="button"]', 'select', 'label',
        '.nav-link', '.btn-primary', '.btn-ghost', '.nav-demo-btn',
        '.price-cta', '.prob-card', '.module-card', '.how-step',
        '.dropdown-item', '.mobile-nav-link', '.mobile-nav-cta',
        '[onclick]', '.clickable'
    ].join(',');

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        isHover = !!el && (el.matches(HOVER_SEL) || !!el.closest(HOVER_SEL));
    }, { passive: true });

    /* ── colour helper ── */
    function lerpColor(a, b, t) {
        return {
            r: a.r + (b.r - a.r) * t | 0,
            g: a.g + (b.g - a.g) * t | 0,
            b: a.b + (b.b - a.b) * t | 0,
        };
    }

    /* ── Tentacle ── */
    class Tentacle {
        constructor(targetX, targetY) {
            this.anchor = { x: targetX, y: targetY };
            this.dead   = false;
            this.dist   = 0;
            this.age    = 0;
        }

        update() {
            const dx = mouse.x - this.anchor.x;
            const dy = mouse.y - this.anchor.y;
            this.dist = Math.sqrt(dx * dx + dy * dy);
            this.age++;
            if (this.dist > CONFIG.maxLength) this.dead = true;
        }

        draw(stroke, glow) {
            if (this.dead) return;

            const tension = Math.min(this.dist / CONFIG.maxLength, 1);

            // Fade in over first 10 frames
            const fadeIn  = Math.min(this.age / 10, 1);
            const lineAlpha = fadeIn * (1 - tension * 0.85) * 0.70;
            const dotAlpha  = fadeIn * (1 - tension) * 0.90;
            const lw = Math.max(0.2, 1.1 * (1 - tension * 0.80));

            // Glow pass (wide, soft)
            ctx.save();
            ctx.shadowColor = `rgba(${glow.r},${glow.g},${glow.b},${lineAlpha * 0.55})`;
            ctx.shadowBlur  = 6;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(this.anchor.x, this.anchor.y);
            ctx.strokeStyle = `rgba(${stroke.r},${stroke.g},${stroke.b},${lineAlpha})`;
            ctx.lineWidth   = lw;
            ctx.lineCap     = 'round';
            ctx.stroke();
            ctx.restore();

            // Anchor dot
            ctx.beginPath();
            ctx.arc(this.anchor.x, this.anchor.y, 1.8 * (1 - tension), 0, Math.PI * 2);
            ctx.fillStyle   = `rgba(${stroke.r},${stroke.g},${stroke.b},${dotAlpha})`;
            ctx.shadowColor = `rgba(${glow.r},${glow.g},${glow.b},${dotAlpha * 0.6})`;
            ctx.shadowBlur  = 4;
            ctx.fill();
            ctx.shadowBlur  = 0;
        }
    }

    /* ── render ── */
    function render() {
        if (isCursorDisabled) {
            requestAnimationFrame(render);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Lerp color T
        colorT += (isHover ? 1 : 0 - colorT) * 0.12;

        const stroke = lerpColor(CONFIG.idleStroke, CONFIG.hoverStroke, colorT);
        const glow   = lerpColor(CONFIG.idleGlow,   CONFIG.hoverGlow,   colorT);

        /* spawn tentacle on movement */
        const moved = Math.hypot(mouse.x - oldMouse.x, mouse.y - oldMouse.y);
        if (moved > CONFIG.triggerDist) {
            const vx = mouse.x - oldMouse.x;
            const vy = mouse.y - oldMouse.y;
            const tx = mouse.x + vx * CONFIG.prediction + (Math.random() - 0.5) * 60;
            const ty = mouse.y + vy * CONFIG.prediction + (Math.random() - 0.5) * 60;
            tentacles.push(new Tentacle(tx, ty));
            oldMouse.x = mouse.x;
            oldMouse.y = mouse.y;
        }
        if (tentacles.length > CONFIG.tentacleCount) tentacles.shift();

        /* update + draw tentacles */
        for (let i = tentacles.length - 1; i >= 0; i--) {
            tentacles[i].update();
            if (tentacles[i].dead) tentacles.splice(i, 1);
            else tentacles[i].draw(stroke, glow);
        }

        /* web connections between close anchor pairs */
        for (let i = 0; i < tentacles.length; i++) {
            for (let j = i + 1; j < tentacles.length; j++) {
                const a = tentacles[i].anchor;
                const b = tentacles[j].anchor;
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < CONFIG.connectionDist) {
                    const alpha = (1 - d / CONFIG.connectionDist) * 0.28;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(${stroke.r},${stroke.g},${stroke.b},${alpha})`;
                    ctx.lineWidth   = 0.5;
                    ctx.stroke();
                }
            }
        }

        /* cursor shape — segmented reticle ring */
        rotation += isHover ? 0.040 : 0.016;

        const ringR  = isHover ? 9 : 7;
        const gapHalf = 0.28;   // gap half-angle in radians at each cardinal point
        const segments = [
            [rotation + gapHalf,              rotation + Math.PI * 0.5 - gapHalf],
            [rotation + Math.PI * 0.5 + gapHalf, rotation + Math.PI       - gapHalf],
            [rotation + Math.PI       + gapHalf, rotation + Math.PI * 1.5 - gapHalf],
            [rotation + Math.PI * 1.5 + gapHalf, rotation + Math.PI * 2.0 - gapHalf],
        ];

        ctx.save();
        ctx.shadowColor = `rgba(${glow.r},${glow.g},${glow.b},0.75)`;
        ctx.shadowBlur  = isHover ? 14 : 8;
        ctx.strokeStyle = `rgba(${stroke.r},${stroke.g},${stroke.b},0.90)`;
        ctx.lineWidth   = isHover ? 1.4 : 1.1;
        ctx.lineCap     = 'round';
        for (const [start, end] of segments) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, ringR, start, end);
            ctx.stroke();
        }
        ctx.restore();

        // Center dot — exact cursor tip
        ctx.save();
        ctx.shadowColor = `rgba(${glow.r},${glow.g},${glow.b},0.90)`;
        ctx.shadowBlur  = isHover ? 10 : 6;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, isHover ? 2.2 : 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${stroke.r},${stroke.g},${stroke.b},1)`;
        ctx.fill();
        ctx.restore();

        requestAnimationFrame(render);
    }

    render();
});
