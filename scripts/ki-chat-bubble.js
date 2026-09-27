// KI Chat Bubble — Flowise embed (ExampleFeed-branded)
// To remove: delete this file and its <script> tag in index.html.

import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js";

// Read from config - on localhost talk directly to Flowise, on prod use proxy.
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

Chatbot.init({
    chatflowid: isLocal ? "00000000-0000-0000-0000-000000000000" : "chat",
    apiHost:    isLocal ? "https://flowise.example-company.example" : window.location.origin,
    theme: {
        button: {
            backgroundColor: "#05050d",
            right:           24,
            bottom:          24,
            size:            "medium",
            iconColor:       "#ff6600"
        },
        chatWindow: {
            showTitle:            true,
            title:                "ExampleFeed Assistent",
            titleBackgroundColor: "#05050d",
            titleTextColor:       "#e8e8f2",
            welcomeMessage:       "Hallo! Ich bin der KI-Assistent von ExampleFeed.\n\nIch beantworte Ihre Fragen rund um Profit Intelligence, POAS-Optimierung und Server-Side Tracking.",
            backgroundColor:      "#0d0d1a",
            fontSize:             15,
            showAgentMessages:    true,
            poweredByTextColor:   "#0d0d1a",
            botMessage: {
                backgroundColor: "rgba(255,255,255,0.07)",
                textColor:       "#e8e8f2",
                showAvatar:      true,
                avatarSrc:       "/images/icons/KI.png"
            },
            userMessage: {
                backgroundColor: "rgba(255,102,0,0.18)",
                textColor:       "#e8e8f2",
                showAvatar:      false
            },
            textInput: {
                placeholder:     "Ihre Nachricht...",
                backgroundColor: "rgba(255,255,255,0.04)",
                textColor:       "#e8e8f2",
                sendButtonColor: "#ff6600"
            },
            footer: {
                textColor:   "#8888a8",
                text:        "KI-System · Keine sensiblen Daten eingeben.",
                company:     " ",
                companyLink: ""
            }
        }
    }
});

// Inject orange border around the chat header via shadow DOM
function injectHeaderStyle() {
    const flowise = document.querySelector('flowise-chatbot');
    if (!flowise?.shadowRoot) return false;

    const shadow = flowise.shadowRoot;
    if (shadow.querySelector('#feedgine-header-applied')) return true;

    const all = [...shadow.querySelectorAll('*')];
    const header = all.find(el => {
        const bg = getComputedStyle(el).backgroundColor;
        return bg === 'rgb(5, 5, 13)' && el.textContent.includes('ExampleFeed Assistent');
    });

    if (!header) return false;

    header.style.borderTop    = '1px solid rgba(255,102,0,0.5)';
    header.style.borderLeft   = '1px solid rgba(255,102,0,0.5)';
    header.style.borderRight  = '1px solid rgba(255,102,0,0.5)';
    header.style.borderBottom = '1px solid rgba(255,102,0,0.25)';
    header.style.boxShadow    = '0 0 10px rgba(255,102,0,0.28), 0 0 24px rgba(255,102,0,0.10)';
    header.style.boxSizing    = 'border-box';

    const chatWindow = header.parentElement;
    if (chatWindow) {
        chatWindow.style.borderBottomLeftRadius  = '12px';
        chatWindow.style.borderBottomRightRadius = '12px';
        chatWindow.style.border                  = '1px solid rgba(255,102,0,0.25)';
        chatWindow.style.boxShadow               = '0 0 30px rgba(255,102,0,0.08)';
        chatWindow.style.overflow                = 'hidden';
    }

    const marker = document.createElement('span');
    marker.id           = 'feedgine-header-applied';
    marker.style.display = 'none';
    shadow.appendChild(marker);
    return true;
}

let attempts = 0;
const interval = setInterval(() => {
    if (injectHeaderStyle() || ++attempts > 20) clearInterval(interval);
}, 300);

// Keep shadow DOM cursor in sync with the main-page cursor toggle.
// CSS from the outer document cannot penetrate shadow DOM, so we inject
// a <style> tag directly and update it whenever body's class changes.
function updateShadowCursor(shadow) {
    let style = shadow.querySelector('#feedgine-cursor-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'feedgine-cursor-style';
        shadow.appendChild(style);
    }
    style.textContent = document.body.classList.contains('system-cursor')
        ? ''
        : '* { cursor: none !important; }';
}

function initShadowCursorSync() {
    const host = document.querySelector('flowise-chatbot');
    if (!host?.shadowRoot) return false;

    updateShadowCursor(host.shadowRoot);

    new MutationObserver(() => updateShadowCursor(host.shadowRoot))
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return true;
}

let cursorAttempts = 0;
const cursorInterval = setInterval(() => {
    if (initShadowCursorSync() || ++cursorAttempts > 20) clearInterval(cursorInterval);
}, 300);

// Global helper: open the Flowise chat and automatically send a message.
// Called by CTA buttons across the page.
window.openChatWithMessage = function (message) {
    // Defer by one tick so Flowise's own click-outside handler runs first
    // (otherwise it would close the chat immediately after we open it).
    setTimeout(() => {
        const chatbot = document.querySelector('flowise-chatbot');
        if (!chatbot || !chatbot.shadowRoot) return;

        const shadow = chatbot.shadowRoot;

        // Open chat window if not yet visible
        if (!shadow.querySelector('textarea')) {
            const toggleBtn = shadow.querySelector('button[part="button"]') || shadow.querySelector('button');
            if (toggleBtn) toggleBtn.click();
        }

        // Poll until the textarea is available, then fill + send via Enter key
        let tries = 0;
        const poll = setInterval(() => {
            if (++tries > 30) { clearInterval(poll); return; }

            const ta = shadow.querySelector('textarea');
            if (!ta) return;
            clearInterval(poll);

            // Use execCommand('insertText') — fires a real, trusted InputEvent
            // that Solid.js signal tracking actually picks up (unlike synthetic events).
            ta.focus();
            ta.select();
            document.execCommand('delete', false);
            document.execCommand('insertText', false, message);

            // Find and click the send button.
            // Walk UP from the textarea; the send button is a sibling in the
            // same input-row container. Fall back to the last non-toggle button
            // in the entire shadow DOM (send button is always last in source order).
            setTimeout(() => {
                const toggleBtn = shadow.querySelector('button[part="button"]');

                let sendBtn = null;
                let el = ta;
                for (let i = 0; i < 6 && !sendBtn; i++) {
                    el = el.parentElement;
                    if (!el) break;
                    const candidate = [...el.querySelectorAll('button')]
                        .find(b => b !== toggleBtn);
                    if (candidate) sendBtn = candidate;
                }

                // Fallback: the send button is the last button in the shadow DOM
                if (!sendBtn) {
                    const all = [...shadow.querySelectorAll('button')]
                        .filter(b => b !== toggleBtn);
                    sendBtn = all[all.length - 1] || null;
                }

                if (sendBtn) sendBtn.click();
            }, 300);
        }, 150);
    }, 200); // 200 ms lets the click-outside event fully propagate before we open
};
