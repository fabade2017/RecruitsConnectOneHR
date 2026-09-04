'use client';
import { useEffect } from 'react';

/**
 * OneHR AI Customer Service Agent — port 8003
 * Embeds the real widget from your Python agent (uvicorn on :8003).
 *
 * Canonical embed from /landing (http://localhost:8003/landing):
 *   <script src="http://localhost:8003/static/js/widget.js"
 *           data-api="http://localhost:8003"
 *           data-title="Support" defer></script>
 * The widget auto-loads /static/css/widget.css and creates #cs-widget-root.
 *
 * Drop-in: <ChatBot /> on landing page injects <link> + <script>.
 * Replace CHATBOT_API with your production host when deployed
 * (or set NEXT_PUBLIC_CHATBOT_API="https://your-host").
 *
 * To use custom <style>...</style> / <script>...</script> you already have:
 * paste your CSS into CHATBOT_CSS and your JS into CHATBOT_JS below — they
 * will be injected as <style> and <script> tags instead of the remote widget.
 */

const CHATBOT_API =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_CHATBOT_API as string | undefined)) ||
  'http://localhost:8003';

// If you have a bespoke <style>...</style> from the agent, paste it here.
// Leave empty to use the remote /static/css/widget.css.
const CHATBOT_CSS = ``;

// If you have a bespoke <script>...</script> from the agent, paste it here.
// Leave empty to use the remote /static/js/widget.js.
const CHATBOT_JS = ``;

export default function ChatBot() {
  useEffect(() => {
    const api = CHATBOT_API.replace(/\/$/, '');

    // 1) CSS: inline CHATBOT_CSS or remote widget.css
    if (CHATBOT_CSS.trim()) {
      const id = 'onehr-chatbot-style-inline';
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = CHATBOT_CSS;
        document.head.appendChild(style);
      }
    } else {
      const href = `${api}/static/css/widget.css`;
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute('data-cs-widget-css', '1');
        document.head.appendChild(link);
      }
    }

    // 2) JS: inline CHATBOT_JS or remote widget.js
    if (CHATBOT_JS.trim()) {
      const id = 'onehr-chatbot-script-inline';
      if (!document.getElementById(id)) {
        const s = document.createElement('script');
        s.id = id;
        s.textContent = CHATBOT_JS;
        document.body.appendChild(s);
      }
    } else {
      const src = `${api}/static/js/widget.js`;
      // Avoid double-inject on HMR
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement('script');
        s.src = src;
        s.setAttribute('data-api', api);
        s.setAttribute('data-title', 'OneHR Assistant');
        s.defer = true;
        document.body.appendChild(s);
      }
    }

    // 3) Track landing visit (optional — widget also tracks open)
    try {
      fetch(`${api}/api/analytics/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'landing_view',
          path: window.location.pathname,
          referrer: document.referrer || '',
        }),
      }).catch(() => {});
    } catch {}
  }, []);

  return null;
}
