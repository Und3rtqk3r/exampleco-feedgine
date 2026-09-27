/**
 * Space Background — Glass Shards · Animated Nebula · Drifting Stars · Shooting Stars
 * No hex grid. Cursor scatters floating glass fragments.
 */

(function () {
    'use strict';

    let canvas, ctx;
    let W = 0, H = 0;
    let mouse = { x: -2000, y: -2000 };
    let rafId;
    let initialized = false;
    let time = 0;

    /* ──────────────────────────────────────────────
       NEBULA BLOBS  (animated radial gradients) — dimmed
    ────────────────────────────────────────────── */
    const NEBULAS = [
        { px: 0.12, py: 0.25, pr: 0.50, cr: 255, cg: 80,  cb: 0,   a: 0.040, spx: 0.00014, spy: 0.00007, phase: 0.0 },
        { px: 0.82, py: 0.55, pr: 0.55, cr: 0,   cg: 255, cb: 136, a: 0.028, spx:-0.00009, spy: 0.00011, phase: 2.1 },
        { px: 0.50, py: 0.88, pr: 0.42, cr: 0,   cg: 180, cb: 255, a: 0.022, spx: 0.00007, spy:-0.00009, phase: 4.3 },
        { px: 0.72, py: 0.12, pr: 0.38, cr: 160, cg: 0,   cb: 255, a: 0.016, spx:-0.00010, spy: 0.00005, phase: 1.5 },
        { px: 0.35, py: 0.65, pr: 0.32, cr: 255, cg: 140, cb: 0,   a: 0.016, spx: 0.00005, spy:-0.00006, phase: 3.7 },
    ];

    function drawNebulas() {
        for (let i = 0; i < NEBULAS.length; i++) {
            const n = NEBULAS[i];
            const ox  = Math.sin(time * n.spx * 800 + n.phase)       * W * 0.10;
            const oy  = Math.cos(time * n.spy * 800 + n.phase + 1.2) * H * 0.10;
            const cx  = n.px * W + ox;
            const cy  = n.py * H + oy;
            const rad = n.pr * Math.min(W, H);
            const pa  = n.a  * (0.65 + 0.35 * Math.sin(time * 0.28 + n.phase));

            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
            g.addColorStop(0,   `rgba(${n.cr},${n.cg},${n.cb},${pa})`);
            g.addColorStop(0.45,`rgba(${n.cr},${n.cg},${n.cb},${pa * 0.35})`);
            g.addColorStop(1,   `rgba(${n.cr},${n.cg},${n.cb},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ──────────────────────────────────────────────
       DRIFTING STARS — dimmed halos
    ────────────────────────────────────────────── */
    const STAR_COUNT = 220;
    let stars = [];

    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x:  Math.random() * W,
                y:  Math.random() * H,
                r:  0.35 + Math.random() * 1.65,
                vx: (Math.random() - 0.5) * 0.055,
                vy: 0.018 + Math.random() * 0.055,
                phase:        Math.random() * Math.PI * 2,
                twinkleSpeed: 0.4 + Math.random() * 1.6,
                // 0=white  1=neon-green  2=neon-teal
                type: Math.random() < 0.78 ? 0 : (Math.random() < 0.5 ? 1 : 2),
            });
        }
    }

    function drawStars() {
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.phase));

            s.x += s.vx;
            s.y += s.vy;
            if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
            if (s.x <  -2)   s.x = W + 2;
            if (s.x > W + 2) s.x = -2;

            const clr = s.type === 0
                ? `rgba(255,255,255,${tw * 0.70})`
                : s.type === 1
                    ? `rgba(0,255,136,${tw * 0.50})`
                    : `rgba(0,220,255,${tw * 0.50})`;

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = clr;
            ctx.fill();

            // Halo only on larger stars, dimmed
            if (s.r > 1.1) {
                const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.5);
                const ha = tw * (s.type === 0 ? 0.14 : 0.10);
                halo.addColorStop(0, s.type === 0
                    ? `rgba(255,255,255,${ha})`
                    : s.type === 1
                        ? `rgba(0,255,136,${ha})`
                        : `rgba(0,220,255,${ha})`);
                halo.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = halo;
                ctx.fill();
            }
        }
    }

    /* ──────────────────────────────────────────────
       SHOOTING STARS
    ────────────────────────────────────────────── */
    const MAX_SHOOTING_STARS = 3;
    let shootingStars = [];
    let nextShootingStarAt = 0;  // time value when next star spawns

    function spawnShootingStar() {
        // Spawn from top or right edge, travel down-left or down-right
        const fromRight = Math.random() < 0.5;
        const startX = fromRight ? W * (0.5 + Math.random() * 0.6) : W * Math.random() * 0.7;
        const startY = Math.random() * H * 0.45;
        const angle  = (Math.PI / 4) + (Math.random() - 0.5) * 0.6;  // ~45° downward
        const speed  = 6 + Math.random() * 9;
        const length = 80 + Math.random() * 160;

        shootingStars.push({
            x:      startX,
            y:      startY,
            vx:     Math.cos(angle) * speed * (fromRight ? -1 : 1),
            vy:     Math.sin(angle) * speed,
            length,
            alpha:  0,
            fadeIn: true,
            life:   0,
            maxLife: (length / speed) * 1.6,  // frames to live
        });
    }

    function updateDrawShootingStars() {
        // Possibly spawn a new one
        if (shootingStars.length < MAX_SHOOTING_STARS && time > nextShootingStarAt) {
            spawnShootingStar();
            // Next star between 4–14 seconds of time units (time += 0.016/frame)
            nextShootingStarAt = time + 4 + Math.random() * 10;
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            s.life++;

            // Fade in quickly, fade out near end
            if (s.life < 8) {
                s.alpha = s.life / 8;
            } else if (s.life > s.maxLife - 10) {
                s.alpha = Math.max(0, (s.maxLife - s.life) / 10);
            } else {
                s.alpha = 1;
            }

            s.x += s.vx;
            s.y += s.vy;

            // Draw trail
            const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.length;
            const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.length;

            const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
            grad.addColorStop(0,   `rgba(255,255,255,${s.alpha * 0.90})`);
            grad.addColorStop(0.15,`rgba(220,235,255,${s.alpha * 0.55})`);
            grad.addColorStop(1,   `rgba(180,210,255,0)`);

            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 1.5;
            ctx.stroke();

            // Bright head dot
            ctx.beginPath();
            ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.alpha * 0.95})`;
            ctx.fill();

            // Remove if expired or off-screen
            if (s.life >= s.maxLife || s.x < -50 || s.x > W + 50 || s.y > H + 50) {
                shootingStars.splice(i, 1);
            }
        }
    }

    /* ──────────────────────────────────────────────
       GLASS SHARDS — fixed physics
    ────────────────────────────────────────────── */
    const SHARD_COUNT    = 30;
    const SHARD_RADIUS   = 230;   // mouse influence radius
    const SCATTER_FORCE  = 3.0;
    const ROT_V_MAX      = 0.018; // cap on rotation speed

    const SHARD_COLORS = [
        { r: 255, g: 102, b:   0 },   // neon orange
        { r:   0, g: 255, b: 136 },   // neon green
        { r:   0, g: 220, b: 255 },   // neon teal
        { r: 255, g: 255, b: 255 },   // white
        { r: 255, g: 180, b:   0 },   // amber
    ];

    let shards = [];

    function buildVerts(size, sides) {
        const verts = [];
        const base  = Math.random() * Math.PI * 2;
        for (let i = 0; i < sides; i++) {
            const a = base + (Math.PI * 2 * i / sides) + (Math.random() - 0.5) * 0.65;
            const r = size * (0.55 + Math.random() * 0.45);
            verts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        return verts;
    }

    function initShards() {
        shards = [];
        for (let i = 0; i < SHARD_COUNT; i++) {
            const size  = 11 + Math.random() * 42;
            const sides = 3  + Math.floor(Math.random() * 3);  // 3–5 sides
            const col   = SHARD_COLORS[Math.floor(Math.random() * SHARD_COLORS.length)];
            shards.push({
                x:  Math.random() * W,
                y:  Math.random() * H,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                rot:   Math.random() * Math.PI * 2,
                rotV:  (Math.random() - 0.5) * 0.003,  // very gentle initial spin
                verts: buildVerts(size, sides),
                size, col,
                alpha:       0.18 + Math.random() * 0.24,
                alphaTarget: 0.18 + Math.random() * 0.24,
                svx: 0, svy: 0,
                phase:      Math.random() * Math.PI * 2,
                floatSpeed: 0.20 + Math.random() * 0.45,  // slower float
            });
        }
    }

    function drawShard(s) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);

        const { r, g, b } = s.col;
        const al = s.alpha;

        ctx.beginPath();
        ctx.moveTo(s.verts[0][0], s.verts[0][1]);
        for (let i = 1; i < s.verts.length; i++) ctx.lineTo(s.verts[i][0], s.verts[i][1]);
        ctx.closePath();

        // Glass fill
        const fill = ctx.createLinearGradient(-s.size, -s.size, s.size * 0.6, s.size * 0.6);
        fill.addColorStop(0,   `rgba(${r},${g},${b},${al * 0.18})`);
        fill.addColorStop(0.45,`rgba(255,255,255,${al * 0.08})`);
        fill.addColorStop(1,   `rgba(${r},${g},${b},${al * 0.03})`);
        ctx.fillStyle = fill;
        ctx.fill();

        // Neon outline — dimmed
        ctx.shadowColor = `rgba(${r},${g},${b},0.45)`;
        ctx.shadowBlur  = 7;
        ctx.strokeStyle = `rgba(${r},${g},${b},${al * 0.70})`;
        ctx.lineWidth   = 1.0;
        ctx.stroke();

        // Soft outer glow — dimmed
        ctx.shadowBlur  = 14;
        ctx.strokeStyle = `rgba(${r},${g},${b},${al * 0.18})`;
        ctx.lineWidth   = 2.0;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // Inner highlight
        if (s.verts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(s.verts[0][0] * 0.55, s.verts[0][1] * 0.55);
            ctx.lineTo(s.verts[1][0] * 0.55, s.verts[1][1] * 0.55);
            ctx.strokeStyle = `rgba(255,255,255,${al * 0.40})`;
            ctx.lineWidth   = 0.8;
            ctx.shadowBlur  = 3;
            ctx.shadowColor = 'rgba(255,255,255,0.3)';
            ctx.stroke();
            ctx.shadowBlur  = 0;
        }

        ctx.restore();
    }

    function updateShards() {
        const infSq = SHARD_RADIUS * SHARD_RADIUS;

        for (let i = 0; i < shards.length; i++) {
            const s = shards[i];

            // Gentle float bob
            s.vy += Math.sin(time * s.floatSpeed + s.phase) * 0.002;

            // Mouse scatter
            if (mouse.x > -1000) {
                const dx     = s.x - mouse.x;
                const dy     = s.y - mouse.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < infSq) {
                    const dist  = Math.sqrt(distSq);
                    const force = (1 - dist / SHARD_RADIUS) * SCATTER_FORCE;
                    const ang   = Math.atan2(dy, dx);
                    s.svx += Math.cos(ang) * force * 0.065;
                    s.svy += Math.sin(ang) * force * 0.065;
                    // Small nudge to rotation — NOT multiplicative
                    s.rotV += (Math.random() - 0.5) * 0.004 * (1 - dist / SHARD_RADIUS);
                    // Brighten on interaction
                    s.alphaTarget = Math.min(0.75, s.alphaTarget + 0.03);
                }
            }

            // Rotation damping — keeps shards from spinning endlessly
            s.rotV *= 0.96;
            // Hard cap on rotation speed
            if (s.rotV >  ROT_V_MAX) s.rotV =  ROT_V_MAX;
            if (s.rotV < -ROT_V_MAX) s.rotV = -ROT_V_MAX;

            // Scatter velocity damping
            s.svx *= 0.92;
            s.svy *= 0.92;
            s.vx  *= 0.998;
            s.vy  *= 0.998;

            // Apply
            s.x   += s.vx + s.svx;
            s.y   += s.vy + s.svy;
            s.rot += s.rotV;

            // Fade alpha toward target
            s.alpha += (s.alphaTarget - s.alpha) * 0.025;
            // Slowly restore target
            const base = 0.18;
            if (s.alphaTarget > base) s.alphaTarget -= 0.006;

            // Edge wrap
            const m = s.size + 10;
            if (s.x < -m)    s.x = W + m;
            if (s.x > W + m) s.x = -m;
            if (s.y < -m)    s.y = H + m;
            if (s.y > H + m) s.y = -m;
        }
    }

    /* ──────────────────────────────────────────────
       CURSOR AURA — dimmed
    ────────────────────────────────────────────── */
    function drawCursorAura() {
        const r   = 130 + Math.sin(time * 1.8) * 22;
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, r);
        aura.addColorStop(0,   'rgba(255,102,0,0.04)');
        aura.addColorStop(0.5, 'rgba(255,102,0,0.012)');
        aura.addColorStop(1,   'rgba(255,102,0,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    /* ──────────────────────────────────────────────
       MAIN LOOP
    ────────────────────────────────────────────── */
    function animate() {
        if (!initialized) return;

        time += 0.016;

        ctx.clearRect(0, 0, W, H);

        drawNebulas();
        drawStars();
        updateDrawShootingStars();
        updateShards();
        for (let i = 0; i < shards.length; i++) drawShard(shards[i]);
        if (mouse.x > -1000) drawCursorAura();

        rafId = requestAnimationFrame(animate);
    }

    /* ──────────────────────────────────────────────
       MOBILE — one-shot static render
    ────────────────────────────────────────────── */
    function initMobileStatic() {
        const c = document.getElementById('hexCanvas');
        if (!c) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        c.width  = w * dpr;
        c.height = h * dpr;
        c.style.width  = w + 'px';
        c.style.height = h + 'px';
        const cx = c.getContext('2d');
        cx.scale(dpr, dpr);

        // Nebula blobs — dimmed
        const g1 = cx.createRadialGradient(w*0.15, h*0.3,  0, w*0.15, h*0.3,  w*0.5);
        g1.addColorStop(0, 'rgba(255,80,0,0.04)'); g1.addColorStop(1, 'rgba(255,80,0,0)');
        cx.fillStyle = g1; cx.fillRect(0, 0, w, h);

        const g2 = cx.createRadialGradient(w*0.82, h*0.65, 0, w*0.82, h*0.65, w*0.45);
        g2.addColorStop(0, 'rgba(0,255,136,0.03)'); g2.addColorStop(1, 'rgba(0,255,136,0)');
        cx.fillStyle = g2; cx.fillRect(0, 0, w, h);

        const g3 = cx.createRadialGradient(w*0.5,  h*0.85, 0, w*0.5,  h*0.85, w*0.4);
        g3.addColorStop(0, 'rgba(0,180,255,0.025)'); g3.addColorStop(1, 'rgba(0,180,255,0)');
        cx.fillStyle = g3; cx.fillRect(0, 0, w, h);

        // Stars
        for (let i = 0; i < 130; i++) {
            const sx = Math.random() * w;
            const sy = Math.random() * h;
            const sr = 0.35 + Math.random() * 1.5;
            const sa = 0.20 + Math.random() * 0.55;
            cx.beginPath();
            cx.arc(sx, sy, sr, 0, Math.PI * 2);
            cx.fillStyle = `rgba(255,255,255,${sa})`;
            cx.fill();
        }

        // Glass shards
        const MCOLS = [[255,102,0],[0,255,136],[0,220,255],[255,255,255],[255,180,0]];
        for (let i = 0; i < 14; i++) {
            const sx    = Math.random() * w;
            const sy    = Math.random() * h;
            const ss    = 10 + Math.random() * 35;
            const sides = 3 + Math.floor(Math.random() * 3);
            const [cr,cg,cb] = MCOLS[Math.floor(Math.random() * MCOLS.length)];
            cx.save();
            cx.translate(sx, sy);
            cx.rotate(Math.random() * Math.PI * 2);
            cx.beginPath();
            for (let j = 0; j < sides; j++) {
                const a = (Math.PI * 2 * j / sides) + (Math.random()-0.5)*0.6;
                const r = ss * (0.55 + Math.random() * 0.45);
                j === 0 ? cx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
                        : cx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
            }
            cx.closePath();
            cx.fillStyle   = `rgba(${cr},${cg},${cb},0.04)`;
            cx.strokeStyle = `rgba(${cr},${cg},${cb},0.38)`;
            cx.lineWidth   = 1;
            cx.fill();
            cx.shadowColor = `rgba(${cr},${cg},${cb},0.45)`;
            cx.shadowBlur  = 6;
            cx.stroke();
            cx.shadowBlur  = 0;
            cx.restore();
        }
    }

    /* ──────────────────────────────────────────────
       INIT
    ────────────────────────────────────────────── */
    function init() {
        if (window.innerWidth <= 768 || ('ontouchstart' in window)) {
            initMobileStatic();
            return;
        }

        canvas = document.getElementById('hexCanvas');
        if (!canvas) return;

        ctx = canvas.getContext('2d', { alpha: true });
        resize();

        window.addEventListener('resize', debounce(resize, 200));
        document.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }, { passive: true });
        document.addEventListener('mouseleave', () => {
            mouse.x = -2000;
            mouse.y = -2000;
        });

        // First shooting star after a short delay
        nextShootingStarAt = 3 + Math.random() * 5;

        initialized = true;
        animate();
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width    = W + 'px';
        canvas.style.height   = H + 'px';
        canvas.style.position = 'fixed';
        canvas.style.top      = '0';
        canvas.style.left     = '0';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        initStars();
        initShards();
    }

    function debounce(fn, ms) {
        let t;
        return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    }

    function destroy() {
        if (rafId) cancelAnimationFrame(rafId);
        initialized = false;
        stars = []; shards = []; shootingStars = [];
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.HexBackground = { init, destroy };
})();
