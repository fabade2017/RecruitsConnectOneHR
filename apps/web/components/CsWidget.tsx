'use client';
import { useEffect } from 'react';

const CS_CSS = `
  :root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --bg-light: #f8fafc;
    --text-dark: #1e293b;
    --border-color: #e2e8f0;
  }
  #cs-widget-launcher {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--primary-gradient);
    color: #ffffff;
    box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.5);
    border: none;
    cursor: pointer;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  #cs-widget-launcher:hover {
    transform: scale(1.08);
    box-shadow: 0 14px 30px -5px rgba(102, 126, 234, 0.6);
  }
  #cs-widget-container {
    position: fixed;
    bottom: 96px;
    right: 24px;
    width: 380px;
    max-width: calc(100vw - 48px);
    height: 600px;
    max-height: calc(100vh - 120px);
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 99999;
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px) scale(0.95);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  #cs-widget-container.active {
    opacity: 1;
    pointer-events: all;
    transform: translateY(0) scale(1);
  }
  .cs-header {
    background: var(--primary-gradient);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cs-agent-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cs-avatar-wrap {
    position: relative;
    width: 42px;
    height: 42px;
  }
  .cs-avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid white;
  }
  .cs-status-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
  }
  .cs-agent-name {
    font-weight: 600;
    font-size: 1rem;
    margin: 0;
  }
  .cs-agent-role {
    font-size: 0.75rem;
    opacity: 0.85;
    margin: 0;
  }
  .cs-close-btn {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
  }
  .cs-close-btn:hover { opacity: 1; }
  .cs-messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg-light);
  }
  .cs-msg {
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 0.9rem;
    line-height: 1.4;
    word-break: break-word;
    color: #1e293b;
  }
  .cs-msg.user {
    align-self: flex-end;
    background: #667eea !important;
    color: #ffffff !important;
    border-bottom-right-radius: 4px;
    border: 1px solid transparent;
  }
  .cs-msg.assistant {
    align-self: flex-start;
    background: #ffffff !important;
    color: #1e293b !important;
    border: 1px solid #e2e8f0 !important;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .cs-sources {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .cs-source-pill {
    background: #ede9fe;
    color: #5b21b6;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 12px;
  }
  .cs-confidence {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 4px;
  }
  .cs-voice-bar {
    background: #fee2e2;
    color: #991b1b;
    padding: 10px 16px;
    border-top: 1px solid var(--border-color);
    display: none;
    align-items: center;
    justify-content: space-between;
    font-size: 0.85rem;
  }
  .cs-voice-bar.active { display: flex; }
  .cs-rec-dot {
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    display: inline-block;
    animation: pulse 1s infinite;
  }
  .cs-edit-drawer {
    background: #f1f5f9;
    border-top: 1px solid var(--border-color);
    padding: 12px 16px;
    display: none;
    flex-direction: column;
    gap: 8px;
  }
  .cs-edit-drawer.active { display: flex; }
  .cs-edit-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cs-edit-textarea {
    width: 100%;
    height: 64px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px;
    font-size: 0.85rem;
    font-family: inherit;
    resize: none;
    outline: none;
    box-sizing: border-box;
  }
  .cs-edit-textarea:focus {
    border-color: #667eea;
  }
  .cs-edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .cs-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  .cs-btn:hover { opacity: 0.9; }
  .cs-btn-primary { background: #667eea; color: white; }
  .cs-btn-secondary { background: #e2e8f0; color: #475569; }
  .cs-footer {
    padding: 12px;
    background: white;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cs-input {
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 10px 16px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .cs-input:focus {
    border-color: #667eea;
  }
  .cs-icon-btn {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }
  .cs-icon-btn:hover {
    background: #f1f5f9;
    color: #667eea;
  }
  .cs-icon-btn.recording {
    color: #ef4444;
    background: #fee2e2;
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }
  /* Legacy ids from widget.js for compatibility — high contrast light theme with !important to beat remote widget.css */
  #cs-widget-root { position: fixed; right: 20px; bottom: 20px; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; }
  #cs-widget-root * { box-sizing: border-box; }
  #cs-launcher { width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 26px; box-shadow: 0 10px 30px rgba(0,0,0,.35); display: grid; place-items: center; }
  #cs-launcher.open { background: #2a314d; }
  #cs-panel { display: none; flex-direction: column; width: 380px; max-width: calc(100vw - 32px); height: 560px; max-height: calc(100vh - 100px); margin-bottom: 12px; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 16px; box-shadow: 0 16px 50px rgba(0,0,0,.15); overflow: hidden; }
  #cs-panel.open { display: flex; }
  #cs-header { padding: 14px 16px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: space-between; color: white; }
  #cs-header .title { color: #fff !important; }
  #cs-header .sub { color: rgba(255,255,255,0.9) !important; }
  #cs-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #f8fafc !important; }
  .cs-msg .meta { font-size: 11px; opacity: 0.7; margin-bottom: 4px; color: #64748b !important; }
  .cs-msg.user .meta { color: rgba(255,255,255,0.85) !important; }
  .cs-msg.assistant .meta { color: #64748b !important; }
  #cs-footer { padding: 12px; background: #ffffff !important; border-top: 1px solid #e2e8f0 !important; }
  #cs-form { display: flex; gap: 8px; align-items: center; }
  #cs-input { flex: 1; border: 1px solid #e2e8f0 !important; border-radius: 20px; padding: 10px 16px; outline: none; background: #ffffff !important; color: #1e293b !important; }
  #cs-input::placeholder { color: #94a3b8 !important; }
  #cs-input:focus { border-color: #667eea !important; }
  #cs-mic { background: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #1e293b !important; }
  #cs-send { background: linear-gradient(135deg, #667eea, #764ba2) !important; color: #fff !important; }
  #cs-mic, #cs-send { padding: 8px 14px; border-radius: 20px; cursor: pointer; }
  #cs-mic.recording { background: #fee2e2 !important; color: #ef4444 !important; border-color: #fecaca !important; }
  #cs-options { font-size: 12px; margin-top: 8px; color: #64748b !important; }
  #cs-voice-status { font-size: 12px; color: #ef4444 !important; min-height: 16px; }
  .cs-typing span { display: inline-block; width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; margin: 0 2px; animation: pulse 1s infinite; }
  /* Final override to ensure remote widget.css never makes text invisible (white-on-white) */
  #cs-messages .cs-msg.assistant { background: #ffffff !important; color: #1e293b !important; }
  #cs-messages .cs-msg.user { background: #667eea !important; color: #ffffff !important; }
`;

const CS_JS = `(function () {
  const script = document.currentScript;
  const API = (script && script.getAttribute("data-api")) || window.CS_API || window.NEXT_PUBLIC_CHATBOT_API || "http://localhost:8003";
  const TITLE = (script && script.getAttribute("data-title")) || "Support";
  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  const sessionId = localStorage.getItem("cs_widget_session") || uuid();
  localStorage.setItem("cs_widget_session", sessionId);
  // Remote widget.css disabled — local CS_CSS already provides high-contrast light theme.
  // Keeping this block removed prevents dark-theme override (white-on-white invisible text).
  // If you need remote CSS, ensure it matches local light theme or uses !important.
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === "className") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (children || []).forEach((c) => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  }
  const root = el("div", { id: "cs-widget-root" });
  const panel = el("div", { id: "cs-panel" });
  const header = el("div", { id: "cs-header" });
  const headerText = el("div");
  const titleEl = el("div", { className: "title", text: TITLE });
  const subEl = el("div", { className: "sub", text: "We typically reply instantly" });
  headerText.appendChild(titleEl);
  headerText.appendChild(subEl);
  const closeBtn = el("button", { id: "cs-close", type: "button", text: "✕" });
  header.appendChild(headerText);
  header.appendChild(closeBtn);
  const messages = el("div", { id: "cs-messages" });
  const footer = el("div", { id: "cs-footer" });
  const voiceStatus = el("div", { id: "cs-voice-status" });
  const form = el("form", { id: "cs-form" });
  const micBtn = el("button", { id: "cs-mic", type: "button", text: "🎤", title: "Voice input" });
  const input = el("textarea", { id: "cs-input", rows: "1", placeholder: "Type your message…" });
  const sendBtn = el("button", { id: "cs-send", type: "submit", text: "Send" });
  form.appendChild(micBtn);
  form.appendChild(input);
  form.appendChild(sendBtn);
  const options = el("div", { id: "cs-options" });
  const voiceLabel = el("label");
  const voiceToggle = el("input", { type: "checkbox", id: "cs-speak" });
  voiceToggle.checked = true;
  voiceLabel.appendChild(voiceToggle);
  voiceLabel.appendChild(document.createTextNode(" Speak reply"));
  options.appendChild(voiceLabel);
  footer.appendChild(voiceStatus);
  footer.appendChild(form);
  footer.appendChild(options);
  panel.appendChild(header);
  panel.appendChild(messages);
  panel.appendChild(footer);
  const launcher = el("button", { id: "cs-launcher", type: "button", text: "💬", title: "Chat with support" });
  root.appendChild(panel);
  root.appendChild(launcher);
  document.body.appendChild(root);
  function setOpen(open) {
    panel.classList.toggle("open", open);
    launcher.classList.toggle("open", open);
    launcher.textContent = open ? "✕" : "💬";
    if (open) {
      input.focus();
      try {
        fetch(API.replace(/\\/$/, "") + "/api/analytics/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_type: "widget_open", path: location.pathname, referrer: document.referrer || "" }),
        });
      } catch (_) {}
    }
  }
  launcher.addEventListener("click", () => setOpen(!panel.classList.contains("open")));
  closeBtn.addEventListener("click", () => setOpen(false));
  function addMsg(role, content) {
    const wrap = el("div", { className: "cs-msg " + role });
    const meta = el("div", { className: "meta", text: role === "user" ? "You" : titleEl.textContent || "Agent" });
    const body = el("div", { text: content });
    wrap.appendChild(meta);
    wrap.appendChild(body);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }
  function addTyping() {
    const wrap = el("div", { className: "cs-msg assistant", id: "cs-typing" });
    wrap.innerHTML = '<div class="meta">Agent</div><div class="cs-typing"><span></span><span></span><span></span></div>';
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }
  function removeTyping() {
    const t = document.getElementById("cs-typing");
    if (t) t.remove();
  }
  async function loadConfig() {
    try {
      const res = await fetch(API.replace(/\\/$/, "") + "/api/user/config");
      const data = await res.json();
      if (data.agent_name) titleEl.textContent = data.agent_name;
      if (data.welcome_message && messages.children.length === 0) {
        addMsg("assistant", data.welcome_message);
      }
    } catch (_) {
      addMsg("assistant", "Hello! How can I help you today?");
    }
  }
  function trySpeakLocal(text) {
    if (!text || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const maxChunk = 1600;
      let remaining = String(text).trim();
      while (remaining.length) {
        let chunk = remaining;
        if (remaining.length > maxChunk) {
          let cut = remaining.lastIndexOf(".", maxChunk);
          if (cut < maxChunk * 0.4) cut = remaining.lastIndexOf(" ", maxChunk);
          if (cut < maxChunk * 0.4) cut = maxChunk;
          chunk = remaining.slice(0, cut + 1).trim();
          remaining = remaining.slice(cut + 1).trim();
        } else remaining = "";
        const u = new SpeechSynthesisUtterance(chunk);
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
  }
  async function playServerAudio(b64) {
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      let mime = "audio/wav";
      if (bytes.length > 12 && bytes[0] === 0x52 && bytes[8] === 0x57) mime = "audio/wav";
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const audio = new Audio(url);
      await audio.play();
      audio.addEventListener("ended", () => URL.revokeObjectURL(url));
      return true;
    } catch (_) {
      return false;
    }
  }
  async function send(text) {
    if (!text.trim()) return;
    addMsg("user", text);
    input.value = "";
    sendBtn.disabled = true;
    addTyping();
    voiceStatus.textContent = "";
    try {
      const res = await fetch(API.replace(/\\/$/, "") + "/api/user/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question: text, voice: !!voiceToggle.checked }),
      });
      removeTyping();
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addMsg("assistant", err.detail || "Sorry, something went wrong.");
        return;
      }
      const data = await res.json();
      addMsg("assistant", data.answer || "");
      if (voiceToggle.checked) {
        if (data.voice_audio) {
          const ok = await playServerAudio(data.voice_audio);
          if (!ok) trySpeakLocal(data.answer || "");
        } else {
          trySpeakLocal(data.answer || "");
        }
      }
    } catch (_) {
      removeTyping();
      addMsg("assistant", "Network error. Please try again.");
    } finally {
      sendBtn.disabled = false;
    }
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input.value);
    }
  });
  let mediaRecorder = null;
  let chunks = [];
  let recording = false;
  let stream = null;
  micBtn.addEventListener("click", async () => {
    if (recording) {
      if (mediaRecorder) mediaRecorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      voiceStatus.textContent = "Mic not supported";
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        recording = false;
        micBtn.classList.remove("recording");
        voiceStatus.textContent = "Transcribing…";
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
        stream?.getTracks().forEach((t) => t.stop());
        stream = null;
        try {
          const fd = new FormData();
          fd.append("file", blob, "speech.webm");
          const res = await fetch(API.replace(/\\/$/, "") + "/api/user/transcribe", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { voiceStatus.textContent = data.detail || "Transcription failed"; return; }
          const text = (data.text || "").trim();
          if (!text) { voiceStatus.textContent = "No speech detected"; return; }
          input.value = input.value.trim() ? input.value.trim() + " " + text : text;
          voiceStatus.textContent = "Transcribed — edit, then Send";
          input.focus();
        } catch (_) { voiceStatus.textContent = "Transcription failed"; }
      };
      mediaRecorder.start();
      recording = true;
      micBtn.classList.add("recording");
      voiceStatus.textContent = "Recording… click mic to stop";
    } catch (_) { voiceStatus.textContent = "Microphone permission denied"; }
  });
  loadConfig();
})();`;

export default function CsWidget() {
  useEffect(() => {
    // Clean old Ava widget and any stale remote dark-theme CSS that causes white-on-white
    document.querySelectorAll('link[data-cs-widget-css]').forEach((el) => el.remove());
    document.getElementById('ava-widget-root')?.remove();
    document.getElementById('ava-widget-css')?.remove();
    document.getElementById('ava-widget-js-v2')?.remove();
    document.getElementById('cs-widget-root')?.remove();
    document.getElementById('cs-widget-css-inline')?.remove();
    document.getElementById('cs-widget-js-inline')?.remove();
    if (document.getElementById('cs-widget-css-inline')) return;
    const style = document.createElement('style');
    style.id = 'cs-widget-css-inline';
    style.textContent = CS_CSS;
    document.head.appendChild(style);
    if (document.getElementById('cs-widget-js-inline')) return;
    const script = document.createElement('script');
    script.id = 'cs-widget-js-inline';
    // NEXT_PUBLIC_ is inlined at build-time — use window fallback for runtime override
    // Do NOT use `import` for env; Next.js replaces process.env.NEXT_PUBLIC_* at build.
    // Set NEXT_PUBLIC_CHATBOT_API in apps/web/.env.local or Vercel env and rebuild: `npm run build`
    const envApi = (typeof process !== 'undefined' && (process.env as any).NEXT_PUBLIC_CHATBOT_API) as string | undefined;
    const winApi = typeof window !== 'undefined' ? ((window as any).NEXT_PUBLIC_CHATBOT_API || (window as any).CS_API) : undefined;
    const api = winApi || envApi || 'http://localhost:8003';
    console.log(`${api}`);
    script.setAttribute('data-api', api);
    script.setAttribute('data-title', 'Support');
    script.textContent = CS_JS;
    document.body.appendChild(script);
    // Also set global for widget fallback (window.CS_API read by widget.js)
    (window as any).CS_API = api;
    (window as any).NEXT_PUBLIC_CHATBOT_API = api;
  }, []);
  return null;
}
