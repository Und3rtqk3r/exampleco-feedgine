/**
 * Scroll Header — adapted from ExampleCo WebSite
 * Handles sticky header state changes on scroll.
 */
document.addEventListener("DOMContentLoaded", function () {
    const topBanner = document.querySelector('.top-banner');
    if (!topBanner) return;

    const scrollThreshold   = 50;
    const rafDelay          = 8;

    let isScrolled    = false;
    let lastScrollY   = 0;
    let rafId         = null;
    let lastUpdateTime = 0;
    let lastScrollTime = 0;

    function calculateVelocity(currentScrollY, currentTime) {
        if (lastScrollTime === 0) { lastScrollTime = currentTime; return 0; }
        const timeDelta  = currentTime - lastScrollTime;
        const scrollDelta = Math.abs(currentScrollY - lastScrollY);
        lastScrollTime = currentTime;
        return scrollDelta / timeDelta;
    }

    function updateHeaderState(scrolled, velocity = 0) {
        if (scrolled === isScrolled) return;
        if (velocity > 5) {
            topBanner.classList.add('fast-scroll');
        } else {
            topBanner.classList.remove('fast-scroll');
        }
        requestAnimationFrame(() => {
            if (scrolled) {
                topBanner.classList.add('scrolled');
            } else {
                topBanner.classList.remove('scrolled');
            }
        });
        isScrolled = scrolled;
    }

    function handleScroll(currentTime) {
        if (currentTime - lastUpdateTime < rafDelay) {
            rafId = requestAnimationFrame(handleScroll);
            return;
        }
        lastUpdateTime = currentTime;

        const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
        const velocity       = calculateVelocity(currentScrollY, currentTime);

        updateHeaderState(currentScrollY > scrollThreshold, velocity);
        lastScrollY = currentScrollY;
        rafId = null;
    }

    window.addEventListener('scroll', () => {
        if (!rafId) rafId = requestAnimationFrame(handleScroll);
    }, { passive: true });

    // Initial state
    if (window.pageYOffset > scrollThreshold) updateHeaderState(true);
});
