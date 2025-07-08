// scripts/content.js
if (typeof window.docipedia_injected === 'undefined') {
    window.docipedia_injected = true;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'GET_PAGE_CONTENT') {
            try {
                const content = extractCleanedBodyText();
                sendResponse({ text: content });
            } catch (e) {
                sendResponse({ text: null });
            }
            return true;
        }

        if (message.type === 'HIGHLIGHT_TERMS') {
            try {
                highlightAndAttachTooltips(message.data);
                sendResponse({ status: 'ok' });
            } catch (e) {
                console.error("[Docipedia-CS] Highlighting failed:", e);
                sendResponse({ status: 'error', error: e.message });
            }
            return true;
        }

        if (message.type === 'API_ERROR') {
            alert(`Docipedia Error: ${message.error}`);
        }
    });

    function extractCleanedBodyText() {
        try {
            const bodyClone = document.body.cloneNode(true);
            const selectorsToRemove = ['nav', 'footer', 'aside', 'script', 'style', 'header', 'form', 'noscript', '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'];
            bodyClone.querySelectorAll(selectorsToRemove.join(', ')).forEach(el => el.remove());
            const bodyText = bodyClone.innerText.replace(/\n\s*\n/g, '\n\n').trim();
            const pageTitle = document.title || 'Untitled Page';
            return (bodyText.length < 150) ? null : `${pageTitle}\n\n${bodyText}`;
        } catch (e) { return null; }
    }

    function highlightAndAttachTooltips(termsData) {
        if (!termsData || !Array.isArray(termsData) || termsData.length === 0) {
            console.warn("Docipedia: Không có thuật ngữ nào để highlight.");
            return;
        }

        const termsMap = new Map();
        termsData.forEach(item => termsMap.set(item.term.toLowerCase(), item));

        const allTerms = termsData.map(item => item.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`\\b(${allTerms.join('|')})\\b`, 'gi');

        findAndReplaceDOMText(document.body, { find: regex, wrap: 'span', wrapClass: 'docipedia-term' });

        let tooltip = document.getElementById('docipedia-custom-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'docipedia-custom-tooltip';
            document.body.appendChild(tooltip);
        }
        tooltip.className = 'docipedia-tooltip-hidden';

        const styleId = 'docipedia-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .docipedia-term { border-bottom: 2px dotted #4A90E2; cursor: pointer; background-color: rgba(74, 144, 226, 0.08); padding: 0 2px; border-radius: 3px; }
                #docipedia-custom-tooltip { position: absolute; background-color: #fff; color: #222; border: 1px solid #ccc; border-radius: 6px; padding: 10px; max-width: 350px; font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.5; z-index: 2147483647; pointer-events: none; transition: opacity 0.2s ease-in-out; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .docipedia-tooltip-hidden { opacity: 0; visibility: hidden; }
                .docipedia-tooltip-visible { opacity: 1; visibility: visible; }
                #docipedia-custom-tooltip p { margin: 0 0 8px 0; }
                #docipedia-custom-tooltip p:last-child { margin-bottom: 0; }
                #docipedia-custom-tooltip strong { color: #000; }
                #docipedia-custom-tooltip em { color: #555; }
            `;
            document.head.appendChild(style);
        }

        let hoverTimeout;
        document.body.addEventListener('mouseover', (event) => {
            const target = event.target;
            if (target.classList.contains('docipedia-term')) {
                clearTimeout(hoverTimeout);
                const termData = termsMap.get(target.textContent.toLowerCase());
                if (termData) {
                    tooltip.innerHTML = `<p><strong>${termData.term}</strong></p><p>${termData.summary}</p><p><em>${termData.contextual_explanation}</em></p><hr style="border: 0; border-top: 1px solid #eee; margin: 8px 0;"><p style="font-size: 12px; color: #777;">Click để xem giải thích chi tiết</p>`;
                    const rect = target.getBoundingClientRect();
                    tooltip.style.display = 'block';
                    const tooltipRect = tooltip.getBoundingClientRect();
                    let top = window.scrollY + rect.top - tooltipRect.height - 10;
                    let left = window.scrollX + rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    if (top < window.scrollY) top = window.scrollY + rect.bottom + 10;
                    if (left < 0) left = 5;
                    if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 5;
                    tooltip.style.top = `${top}px`;
                    tooltip.style.left = `${left}px`;
                    tooltip.className = 'docipedia-tooltip-visible';
                }
            }
        });

        document.body.addEventListener('mouseout', (event) => {
            if (event.target.classList.contains('docipedia-term')) {
                hoverTimeout = setTimeout(() => { tooltip.className = 'docipedia-tooltip-hidden'; }, 300);
            }
        });

        document.body.addEventListener('click', (event) => {
            if (event.target.classList.contains('docipedia-term')) {
                const termData = termsMap.get(event.target.textContent.toLowerCase());
                if (termData) {
                    alert(`--- ${termData.term} ---\n\n${termData.deep_dive}`);
                }
            }
        });
    }
}