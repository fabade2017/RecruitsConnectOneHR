'use client';
import { useEffect } from 'react';

const AVA_CSS = `
  /* ===== WIDGET ROOT ===== */
  #ava-widget-root {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }
  .ava-toggle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: 3px solid rgba(255,255,255,0.15);
    box-shadow: 0 8px 32px rgba(102,126,234,0.4), 0 0 0 4px rgba(102,126,234,0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
  }
  .ava-toggle:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(102,126,234,0.5); }
  .ava-toggle:active { transform: scale(0.95); }
  .ava-toggle.open { transform: scale(0) rotate(90deg); opacity: 0; pointer-events: none; }
  .ava-toggle svg { width: 42px; height: 42px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
  .ava-toggle .notif {
    position: absolute;
    top: -2px; right: -2px;
    width: 18px; height: 18px;
    background: #e53e3e;
    border-radius: 50%;
    border: 2px solid white;
    animation: notif-pulse 2s infinite;
    display: none;
  }
  @keyframes notif-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,62,62,0.4);} 50%{box-shadow:0 0 0 6px rgba(229,62,62,0);} }
  .ava-panel {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 380px;
    max-width: calc(100vw - 40px);
    height: 560px;
    max-height: calc(100vh - 120px);
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 24px;
    box-shadow: 0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transform: translateY(20px) scale(0.92);
    pointer-events: none;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .ava-panel.open {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: all;
  }
  .ava-close {
    position: absolute;
    top: 12px; right: 12px;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    border: none;
    color: #a0aec0;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 10;
  }
  .ava-close:hover { background: rgba(255,255,255,0.15); color: white; }
  .ava-header {
    padding: 20px 20px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .ava-header-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 12px rgba(102,126,234,0.3);
    flex-shrink: 0;
  }
  .ava-header-info h3 { font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 0; }
  .ava-header-info span { font-size: 11px; color: #48bb78; display: flex; align-items: center; gap: 5px; }
  .ava-header-info span::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%; background: #48bb78;
    box-shadow: 0 0 6px #48bb78;
  }
  .ava-stage {
    height: 180px;
    background: radial-gradient(ellipse at 50% 90%, rgba(102,126,234,0.1) 0%, transparent 60%);
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }
  .ava-stage::before {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: conic-gradient(from 0deg, transparent, rgba(102,126,234,0.04), transparent 30%);
    animation: ava-rotate 12s linear infinite; pointer-events: none;
  }
  @keyframes ava-rotate { to { transform: rotate(360deg); } }
  .ava-svg {
    width: 140px;
    height: 175px;
    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));
    z-index: 2;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .ava-svg.thinking { animation: ava-float 2.5s ease-in-out infinite; }
  .ava-svg.listening { animation: ava-lean 1.2s ease-in-out infinite; }
  .ava-svg.talking { animation: ava-breathe 0.9s ease-in-out infinite; }
  @keyframes ava-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }
  @keyframes ava-lean { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(1.5deg);} }
  @keyframes ava-breathe { 0%,100%{transform:scale(1);} 50%{transform:scale(1.01);} }
  .mouth-path { transition: d 0.1s ease; }
  .mouth-group.talking .mouth-path { animation: ava-mouth-morph 0.15s ease-in-out infinite alternate; }
  @keyframes ava-mouth-morph {
    0% { d: path("M 62 100 Q 70 103 78 100"); }
    100% { d: path("M 60 98 Q 70 110 80 98"); }
  }
  .eye-lid { transition: transform 0.1s ease; }
  .eye-lid.blink { transform: scaleY(0.03); }
  .pupil-group { transition: transform 0.12s ease; }
  .eyebrow { transition: transform 0.3s ease; transform-origin: center; }
  .eyebrow.surprised { transform: translateY(-3px) rotate(-6deg); }
  .eyebrow.right.surprised { transform: translateY(-3px) rotate(6deg); }
  .eyebrow.happy { transform: translateY(1px) rotate(5deg); }
  .eyebrow.right.happy { transform: translateY(1px) rotate(-5deg); }
  .hand-left, .hand-right { transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .hand-left { transform-origin: 28px 148px; }
  .hand-right { transform-origin: 112px 148px; }
  .hand-left.wave { animation: ava-wave-left 0.8s ease-in-out infinite; }
  .hand-right.wave { animation: ava-wave-right 0.8s ease-in-out infinite; }
  .hand-left.think { transform: rotate(30deg) translate(2px, -8px); }
  .hand-right.think { transform: rotate(-30deg) translate(-2px, -8px); }
  @keyframes ava-wave-left { 0%,100%{transform:rotate(5deg);} 50%{transform:rotate(40deg);} }
  @keyframes ava-wave-right { 0%,100%{transform:rotate(-5deg);} 50%{transform:rotate(-40deg);} }
  .ava-bubble {
    position: absolute;
    top: 10px; right: 10px;
    max-width: 140px;
    background: rgba(255,255,255,0.95);
    color: #1a202c;
    padding: 8px 12px;
    border-radius: 14px 14px 2px 14px;
    font-size: 11px;
    line-height: 1.4;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    opacity: 0; transform: translateY(8px) scale(0.95);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 10; pointer-events: none;
  }
  .ava-bubble.show { opacity: 1; transform: translateY(0) scale(1); }
  .ava-bubble::after {
    content: ''; position: absolute; bottom: -5px; right: 14px;
    width: 10px; height: 10px; background: rgba(255,255,255,0.95);
    transform: rotate(45deg); border-radius: 2px;
  }
  .ava-viz {
    position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 2px; align-items: flex-end; height: 18px;
    opacity: 0; transition: opacity 0.3s; z-index: 5;
  }
  .ava-viz.show { opacity: 1; }
  .ava-vbar { width: 3px; background: linear-gradient(to top, #667eea, #a3bffa); border-radius: 2px; transition: height 0.04s ease; }
  .ava-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ava-messages::-webkit-scrollbar { width: 3px; }
  .ava-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
  .ava-msg {
    padding: 10px 13px;
    border-radius: 14px;
    font-size: 13px;
    line-height: 1.5;
    max-width: 88%;
    animation: ava-msg-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    word-break: break-word;
  }
  @keyframes ava-msg-pop { from { opacity:0; transform:translateY(8px) scale(0.95);} }
  .ava-msg.user {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white; align-self: flex-end;
    border-radius: 14px 14px 4px 14px;
  }
  .ava-msg.bot {
    background: rgba(255,255,255,0.06);
    color: #e2e8f0; align-self: flex-start;
    border-radius: 14px 14px 14px 4px;
    border: 1px solid rgba(255,255,255,0.04);
  }
  .ava-msg .time { font-size: 9px; opacity: 0.45; margin-top: 4px; display: block; }
  .ava-sources { font-size: 9px; color: #718096; margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px; }
  .ava-source-tag { background: rgba(102,126,234,0.12); color: #a3bffa; padding: 1px 6px; border-radius: 4px; text-decoration: none; }
  .ava-input-wrap {
    padding: 12px 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .ava-transcript-banner {
    background: linear-gradient(90deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15));
    border: 1px solid rgba(102,126,234,0.2);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 12px;
    color: #c3dafe;
    display: none;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    animation: ava-slide-in 0.25s ease;
  }
  .ava-transcript-banner.show { display: flex; }
  @keyframes ava-slide-in { from { opacity:0; transform:translateY(-6px);} }
  .ava-transcript-banner .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #a3bffa; font-weight: 700; white-space: nowrap; }
  .ava-transcript-banner .text { flex: 1; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ava-transcript-banner .send-now {
    background: rgba(102,126,234,0.35); border: none; color: white;
    padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: background 0.2s; white-space: nowrap;
  }
  .ava-transcript-banner .send-now:hover { background: rgba(102,126,234,0.55); }
  .ava-transcript-banner .dismiss { background: transparent; border: none; color: #a0aec0; font-size: 14px; cursor: pointer; padding: 0 2px; }
  .ava-transcript-banner .dismiss:hover { color: white; }
  .ava-input-row { display: flex; gap: 8px; }
  .ava-input-row input {
    flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 10px 12px; color: #e2e8f0; font-size: 13px; outline: none; transition: all 0.2s;
  }
  .ava-input-row input::placeholder { color: #718096; }
  .ava-input-row input:focus { border-color: #667eea; background: rgba(255,255,255,0.08); }
  .ava-btn {
    border: none; border-radius: 12px; padding: 10px 14px;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .ava-btn-send { background: linear-gradient(135deg, #667eea, #764ba2); color: white; box-shadow: 0 3px 12px rgba(102,126,234,0.25); }
  .ava-btn-send:hover { transform: translateY(-1px); }
  .ava-btn-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .ava-btn-mic { width: 38px; padding: 0; background: rgba(255,255,255,0.06); color: #a0aec0; border: 1px solid rgba(255,255,255,0.06); font-size: 16px; }
  .ava-btn-mic:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
  .ava-btn-mic.recording { background: linear-gradient(135deg, #e53e3e, #c53030); color: white; animation: ava-mic-glow 1s infinite; border-color: transparent; }
  @keyframes ava-mic-glow { 0%,100%{box-shadow:0 0 0 0 rgba(229,62,62,0.4);} 50%{box-shadow:0 0 0 8px rgba(229,62,62,0);} }
  .ava-typing { display: none; align-items: center; gap: 4px; padding: 8px 12px; }
  .ava-typing.show { display: flex; }
  .ava-typing span { width: 5px; height: 5px; background: #a0aec0; border-radius: 50%; animation: ava-typing-bounce 1.4s infinite ease-in-out both; }
  .ava-typing span:nth-child(1) { animation-delay: -0.32s; }
  .ava-typing span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes ava-typing-bounce { 0%,80%,100%{transform:scale(0);opacity:0.4;} 40%{transform:scale(1);opacity:1;} }
`;

const AVA_HTML = `
<div id="ava-widget-root">
  <button class="ava-toggle" id="avaToggle" title="Chat with Ava">
    <svg viewBox="0 0 140 175" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wSkin" cx="45%" cy="35%" r="65%"><stop offset="0%" stop-color="#f8dcc8"/><stop offset="50%" stop-color="#eac4a8"/><stop offset="100%" stop-color="#d4a078"/></radialGradient>
        <linearGradient id="wHair" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#6b4c3a"/><stop offset="100%" stop-color="#4a3528"/></linearGradient>
        <radialGradient id="wIris" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#4a6fa5"/><stop offset="100%" stop-color="#1a2d45"/></radialGradient>
      </defs>
      <path d="M 40 50 C 35 65, 33 85, 38 100 C 40 108, 45 113, 50 115 L 90 115 C 95 113, 100 108, 102 100 C 107 85, 105 65, 100 50 C 95 30, 82 22, 70 22 C 58 22, 45 30, 40 50 Z" fill="url(#wHair)"/>
      <ellipse cx="70" cy="75" rx="28" ry="34" fill="url(#wSkin)"/>
      <ellipse cx="60" cy="70" rx="8" ry="6" fill="white"/><circle cx="60" cy="70" r="4" fill="url(#wIris)"/><circle cx="60" cy="70" r="2" fill="#1a202c"/><circle cx="61" cy="69" r="1" fill="white" opacity="0.8"/>
      <ellipse cx="80" cy="70" rx="8" ry="6" fill="white"/><circle cx="80" cy="70" r="4" fill="url(#wIris)"/><circle cx="80" cy="70" r="2" fill="#1a202c"/><circle cx="81" cy="69" r="1" fill="white" opacity="0.8"/>
      <path d="M 62 88 Q 70 93 78 88" stroke="#c0392b" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M 45 108 Q 40 125 38 140 Q 38 155 42 168 Q 55 172 70 172 Q 85 172 98 168 Q 102 155 102 140 Q 100 125 95 108" fill="url(#wHair)" opacity="0.3"/>
    </svg>
    <div class="notif"></div>
  </button>
  <div class="ava-panel" id="avaPanel">
    <button class="ava-close" id="avaClose">×</button>
    <div class="ava-header">
      <div class="ava-header-avatar">🤖</div>
      <div class="ava-header-info">
        <h3>Chioma</h3>
        <span>Online</span>
      </div>
    </div>
    <div class="ava-stage">
      <div class="ava-bubble" id="avaBubble">Hello! How can I help?</div>
      <svg class="ava-svg" id="avaSvg" viewBox="0 0 140 175" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="skin" cx="45%" cy="35%" r="65%"><stop offset="0%" stop-color="#f8dcc8"/><stop offset="50%" stop-color="#eac4a8"/><stop offset="100%" stop-color="#d4a078"/></radialGradient>
          <radialGradient id="skinShadow" cx="50%" cy="60%" r="50%"><stop offset="0%" stop-color="#c49a6c" stop-opacity="0"/><stop offset="100%" stop-color="#a07850" stop-opacity="0.35"/></radialGradient>
          <linearGradient id="hair" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#6b4c3a"/><stop offset="100%" stop-color="#4a3528"/></linearGradient>
          <linearGradient id="hairHi" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b6f5c"/><stop offset="100%" stop-color="#6b4c3a"/></linearGradient>
          <radialGradient id="iris" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#4a6fa5"/><stop offset="60%" stop-color="#2d4a6f"/><stop offset="100%" stop-color="#1a2d45"/></radialGradient>
          <linearGradient id="shirt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5a67d8"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
          <linearGradient id="shirtD" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4c51bf"/><stop offset="100%" stop-color="#6b21a8"/></linearGradient>
          <filter id="soft"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.2"/></filter>
        </defs>
        <path d="M 48 125 C 44 132, 42 145, 44 155 C 46 165, 42 175, 40 182 C 38 188, 39 193, 42 196 L 98 196 C 101 193, 102 188, 100 182 C 98 175, 94 165, 96 155 C 98 145, 96 132, 92 125 Q 70 129 48 125 Z" fill="url(#shirt)" filter="url(#soft)"/>
        <path d="M 48 125 C 44 132, 42 145, 44 155 C 46 165, 42 175, 40 182 C 38 188, 39 193, 42 196 L 58 196 C 55 188, 53 175, 55 162 C 56 150, 58 138, 60 128 Q 54 127 48 125 Z" fill="rgba(0,0,0,0.12)"/>
        <path d="M 92 125 C 96 132, 98 145, 96 155 C 94 165, 98 175, 100 182 C 102 188, 101 193, 98 196 L 82 196 C 85 188, 87 175, 85 162 C 84 150, 82 138, 80 128 Q 86 127 92 125 Z" fill="rgba(255,255,255,0.06)"/>
        <path d="M 46 155 Q 70 160 94 155" stroke="rgba(0,0,0,0.08)" stroke-width="0.8" fill="none"/>
        <rect x="62" y="118" width="16" height="12" rx="4" fill="#d4a078"/>
        <rect x="62" y="118" width="16" height="12" rx="4" fill="url(#skinShadow)"/>
        <ellipse cx="70" cy="120" rx="8" ry="2" fill="#b08860" opacity="0.35"/>
        <path d="M 55 126 Q 70 135 85 126 Q 80 122 70 124 Q 60 122 55 126" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
        <g class="hand-left" id="handLeft">
          <path d="M 48 130 Q 32 145 30 162" stroke="url(#shirtD)" stroke-width="9" stroke-linecap="round" fill="none"/>
          <path d="M 30 162 Q 28 175 27 186" stroke="url(#skin)" stroke-width="6" stroke-linecap="round" fill="none"/>
          <ellipse cx="27" cy="190" rx="4" ry="5" fill="url(#skin)" filter="url(#soft)"/>
        </g>
        <g class="hand-right" id="handRight">
          <path d="M 92 130 Q 108 145 110 162" stroke="url(#shirtD)" stroke-width="9" stroke-linecap="round" fill="none"/>
          <path d="M 110 162 Q 112 175 113 186" stroke="url(#skin)" stroke-width="6" stroke-linecap="round" fill="none"/>
          <ellipse cx="113" cy="190" rx="4" ry="5" fill="url(#skin)" filter="url(#soft)"/>
        </g>
        <g id="headGroup">
          <path d="M 38 55 C 32 65, 30 82, 34 95 C 36 102, 40 107, 45 109 L 95 109 C 100 107, 104 102, 106 95 C 110 82, 108 65, 102 55 C 97 38, 84 30, 70 30 C 56 30, 43 38, 38 55 Z" fill="url(#hair)"/>
          <path d="M 40 52 C 46 38, 58 32, 70 32 C 82 32, 94 38, 100 52 C 94 42, 82 36, 70 36 C 58 36, 46 42, 40 52" fill="url(#hairHi)" opacity="0.5"/>
          <path d="M 38 68 Q 34 85 39 100" stroke="url(#hair)" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M 102 68 Q 106 85 101 100" stroke="url(#hair)" stroke-width="3" stroke-linecap="round" fill="none"/>
          <ellipse cx="42" cy="75" rx="5" ry="7" fill="#eac4a8"/><ellipse cx="42" cy="75" rx="5" ry="7" fill="url(#skinShadow)"/>
          <ellipse cx="98" cy="75" rx="5" ry="7" fill="#eac4a8"/><ellipse cx="98" cy="75" rx="5" ry="7" fill="url(#skinShadow)"/>
          <ellipse cx="70" cy="72" rx="26" ry="32" fill="url(#skin)" filter="url(#soft)"/>
          <ellipse cx="70" cy="72" rx="26" ry="32" fill="url(#skinShadow)"/>
          <path d="M 40 58 C 44 45, 56 38, 70 38 C 84 38, 96 45, 100 58 C 96 48, 84 42, 70 42 C 56 42, 44 48, 40 58" fill="url(#hair)"/>
          <path d="M 42 54 C 48 44, 60 40, 70 40 C 80 40, 92 44, 98 54 C 92 48, 80 44, 70 44 C 60 44, 48 48, 42 54" fill="url(#hairHi)" opacity="0.45"/>
          <g class="eyebrow" id="ebLeft"><path d="M 54 55 Q 62 52 68 55" stroke="url(#hair)" stroke-width="2" stroke-linecap="round" fill="none"/></g>
          <g class="eyebrow right" id="ebRight"><path d="M 72 55 Q 78 52 86 55" stroke="url(#hair)" stroke-width="2" stroke-linecap="round" fill="none"/></g>
          <g id="eyesGroup">
            <ellipse cx="60" cy="68" rx="7" ry="5.5" fill="white" stroke="#e2e8f0" stroke-width="0.3"/>
            <g class="pupil-group" id="pupilLeft">
              <circle cx="60" cy="68" r="3.8" fill="url(#iris)"/><circle cx="60" cy="68" r="1.8" fill="#1a202c"/>
              <circle cx="61" cy="67" r="1.2" fill="white" opacity="0.85"/><circle cx="59" cy="69" r="0.5" fill="white" opacity="0.4"/>
            </g>
            <g class="eye-lid" id="eyeLidLeft"><ellipse cx="60" cy="63" rx="7" ry="1.5" fill="#eac4a8" opacity="0"/></g>
            <path d="M 54 74 Q 60 77 66 74" stroke="#c49a6c" stroke-width="0.5" fill="none" opacity="0.3"/>
            <ellipse cx="80" cy="68" rx="7" ry="5.5" fill="white" stroke="#e2e8f0" stroke-width="0.3"/>
            <g class="pupil-group" id="pupilRight">
              <circle cx="80" cy="68" r="3.8" fill="url(#iris)"/><circle cx="80" cy="68" r="1.8" fill="#1a202c"/>
              <circle cx="81" cy="67" r="1.2" fill="white" opacity="0.85"/><circle cx="79" cy="69" r="0.5" fill="white" opacity="0.4"/>
            </g>
            <g class="eye-lid" id="eyeLidRight"><ellipse cx="80" cy="63" rx="7" ry="1.5" fill="#eac4a8" opacity="0"/></g>
            <path d="M 74 74 Q 80 77 86 74" stroke="#c49a6c" stroke-width="0.5" fill="none" opacity="0.3"/>
          </g>
          <path d="M 70 76 Q 69 83 67 86 Q 70 89 73 86" stroke="#c49a6c" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.5"/>
          <ellipse cx="52" cy="82" rx="5" ry="3" fill="#e53e3e" opacity="0.06"/>
          <ellipse cx="88" cy="82" rx="5" ry="3" fill="#e53e3e" opacity="0.06"/>
          <g class="mouth-group" id="mouthGroup">
            <path class="mouth-path" id="mouthPath" d="M 62 92 Q 70 96 78 92" fill="#c0392b" stroke="#a93226" stroke-width="0.6"/>
            <path id="mouthInner" d="M 64 93 Q 70 95 76 93" fill="#922b21" opacity="0.5"/>
            <path id="teeth" d="M 64 92.5 Q 70 93.5 76 92.5" fill="#fdf2f0" opacity="0"/>
            <ellipse cx="70" cy="95" rx="5" ry="1.5" fill="#e74c3c" opacity="0.55"/>
          </g>
          <ellipse cx="70" cy="99" rx="7" ry="2" fill="#c49a6c" opacity="0.12"/>
        </g>
      </svg>
      <div class="ava-viz" id="avaViz">
        <div class="ava-vbar" style="height:4px"></div>
        <div class="ava-vbar" style="height:6px"></div>
        <div class="ava-vbar" style="height:9px"></div>
        <div class="ava-vbar" style="height:12px"></div>
        <div class="ava-vbar" style="height:9px"></div>
        <div class="ava-vbar" style="height:6px"></div>
        <div class="ava-vbar" style="height:4px"></div>
      </div>
    </div>
    <div class="ava-messages" id="avaMessages"></div>
    <div class="ava-typing" id="avaTyping"><span></span><span></span><span></span></div>
    <div class="ava-input-wrap">
      <div class="ava-transcript-banner" id="avaTranscriptBanner">
        <span class="label">🎙️ Heard</span>
        <span class="text" id="avaTranscriptText"></span>
        <button class="send-now" id="avaSendNow">Send →</button>
        <button class="dismiss" id="avaDismiss">×</button>
      </div>
      <div class="ava-input-row">
        <button class="ava-btn ava-btn-mic" id="avaMicBtn">🎙️</button>
        <input type="text" id="avaInput" placeholder="Ask me anything..." autocomplete="off"/>
        <button class="ava-btn ava-btn-send" id="avaSendBtn">Send</button>
      </div>
    </div>
  </div>
</div>
<audio id="avaAudio" style="display:none"></audio>
`;

export default function AvaWidget() {
  useEffect(() => {
    // clean old version if exists
    document.getElementById('ava-widget-css')?.remove();
    document.getElementById('ava-widget-root')?.remove();
    document.getElementById('avaAudio')?.remove();
    document.getElementById('ava-widget-js')?.remove();
    const style = document.createElement('style');
    style.id = 'ava-widget-css';
    style.textContent = AVA_CSS;
    document.head.appendChild(style);

    // (removed early return, cleaned above)
    const host = document.createElement('div');
    host.innerHTML = AVA_HTML;
    while (host.firstChild) document.body.appendChild(host.firstChild);

    // Inject behavior
    const script = document.createElement('script');
    script.id = 'ava-widget-js-v2';
    script.textContent = `
(function(){
  const API_BASE = (window.NEXT_PUBLIC_CHATBOT_API || "http://localhost:8003").replace(/\\/$/, "");
  // Also support 127.0.0.1 fallback
  const API = API_BASE;
  const SESSION_ID = "ava-" + Math.random().toString(36).slice(2,10);
  let state = "idle";
  let audioCtx, analyser, dataArray;
  let mediaRecorder, audioChunks = [], recording = false;
  let pendingTranscript = null;
  let isOpen = false;
  const $ = id => document.getElementById(id);
  const toggle = $("avaToggle");
  const panel = $("avaPanel");
  const closeBtn = $("avaClose");
  const svg = $("avaSvg");
  const mouthPath = $("mouthPath");
  const mouthGroup = $("mouthGroup");
  const teeth = $("teeth");
  const bubble = $("avaBubble");
  const handL = $("handLeft");
  const handR = $("handRight");
  const ebL = $("ebLeft");
  const ebR = $("ebRight");
  const viz = $("avaViz");
  const bars = viz ? viz.querySelectorAll(".ava-vbar") : [];
  const audioEl = $("avaAudio");
  const messagesEl = $("avaMessages");
  const inputEl = $("avaInput");
  const sendBtn = $("avaSendBtn");
  const micBtn = $("avaMicBtn");
  const typing = $("avaTyping");
  const transcriptBanner = $("avaTranscriptBanner");
  const transcriptText = $("avaTranscriptText");
  const sendNowBtn = $("avaSendNow");
  const dismissBtn = $("avaDismiss");
  const pupilL = $("pupilLeft");
  const pupilR = $("pupilRight");
  const eyeLidL = $("eyeLidLeft");
  const eyeLidR = $("eyeLidRight");
  if (!toggle || !panel) return;
  toggle.onclick = () => { isOpen = true; toggle.classList.add("open"); panel.classList.add("open"); };
  closeBtn.onclick = () => { isOpen = false; panel.classList.remove("open"); toggle.classList.remove("open"); };
  document.addEventListener("mousemove", e => {
    if (!isOpen) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height * 0.4;
    const dx = (e.clientX - cx) / (window.innerWidth/2);
    const dy = (e.clientY - cy) / (window.innerHeight/2);
    const clamp = (v,mn,mx) => Math.max(mn, Math.min(mx, v));
    const px = clamp(dx * 4, -3, 3);
    const py = clamp(dy * 3, -2, 2);
    if (pupilL) pupilL.style.transform = "translate("+px+"px, "+py+"px)";
    if (pupilR) pupilR.style.transform = "translate("+px+"px, "+py+"px)";
  });
  function blink() {
    if (!eyeLidL || !eyeLidR) return;
    eyeLidL.setAttribute("opacity", "0.7");
    eyeLidR.setAttribute("opacity", "0.7");
    setTimeout(() => { eyeLidL.setAttribute("opacity", "0"); eyeLidR.setAttribute("opacity", "0"); }, 120);
  }
  setInterval(() => { if (isOpen && Math.random() > 0.6) blink(); }, 3200);
  const mouthShapes = {
    idle: "M 62 92 Q 70 96 78 92",
    smile: "M 61 91 Q 70 98 79 91",
    o: "M 66 92 Q 70 97 74 92 Q 70 87 66 92",
    talk1: "M 61 93 Q 70 100 79 93",
    talk2: "M 63 90 Q 70 102 77 90",
    talk3: "M 62 94 Q 70 99 78 94",
    talk4: "M 64 91 Q 70 103 76 91",
    think: "M 66 94 Q 70 92 74 94",
  };
  function setMouth(shape) { if (mouthPath) mouthPath.setAttribute("d", mouthShapes[shape] || mouthShapes.idle); }
  function setState(s) {
    state = s;
    if (svg) svg.classList.remove("thinking","listening","talking");
    if (handL) handL.classList.remove("wave","think");
    if (handR) handR.classList.remove("wave","think");
    if (ebL) ebL.classList.remove("surprised","happy");
    if (ebR) ebR.classList.remove("surprised","happy");
    if (mouthGroup) mouthGroup.classList.remove("talking");
    if (viz) viz.classList.remove("show");
    if (teeth) teeth.setAttribute("opacity", "0");
    if (typing) typing.classList.remove("show");
    switch(s) {
      case "idle": setMouth("smile"); break;
      case "listening":
        if (svg) svg.classList.add("listening"); setMouth("o"); break;
      case "thinking":
        if (svg) svg.classList.add("thinking");
        if (handL) handL.classList.add("think"); if (handR) handR.classList.add("think");
        if (ebL) ebL.classList.add("surprised"); if (ebR) ebR.classList.add("surprised");
        setMouth("think"); if (typing) typing.classList.add("show");
        break;
      case "talking":
        if (svg) svg.classList.add("talking");
        if (handR) handR.classList.add("wave");
        if (ebL) ebL.classList.add("happy"); if (ebR) ebR.classList.add("happy");
        if (mouthGroup) mouthGroup.classList.add("talking");
        if (teeth) teeth.setAttribute("opacity", "0.7");
        if (viz) viz.classList.add("show");
        startLipSync();
        break;
    }
  }
  function startLipSync() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (!analyser) {
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 64;
      try {
        const src = audioCtx.createMediaElementSource(audioEl);
        src.connect(analyser); analyser.connect(audioCtx.destination);
      } catch(e) {}
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    const talkShapes = ["talk1","talk2","talk3","talk4","talk2","talk1","talk3"];
    let frame = 0;
    function animate() {
      if (state !== "talking") { bars.forEach(b => b.style.height = "4px"); return; }
      try { analyser.getByteFrequencyData(dataArray); } catch(e) {}
      const avg = dataArray ? dataArray.reduce((a,b) => a+b, 0) / dataArray.length : 60;
      bars.forEach((bar, i) => { bar.style.height = Math.max(3, Math.min(16, (dataArray[i*2]||0)/6)) + "px"; });
      if (frame % 2 === 0) setMouth(talkShapes[Math.floor((avg/255)*(talkShapes.length-1))] || "talk1");
      frame++; requestAnimationFrame(animate);
    }
    animate();
  }
  function timeStr() { return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
  function addMsg(text, who, sources) {
    const d = document.createElement("div");
    d.className = "ava-msg " + who;
    d.innerHTML = String(text).replace(/\\n/g, "<br>");
    const t = document.createElement("span"); t.className = "time"; t.textContent = timeStr(); d.appendChild(t);
    if (sources && sources.length) {
      const srcDiv = document.createElement("div"); srcDiv.className = "ava-sources";
      sources.forEach(url => { try { const a = document.createElement("a"); a.className = "ava-source-tag"; a.href = url; a.target = "_blank"; a.textContent = new URL(url).hostname; srcDiv.appendChild(a); } catch(e) {} });
      d.appendChild(srcDiv);
    }
    messagesEl.appendChild(d); messagesEl.scrollTop = messagesEl.scrollHeight; return d;
  }
  function speakBrowser(text) {
    try {
      if (!('speechSynthesis' in window)) { setState("talking"); setTimeout(() => setState("idle"), Math.max(1200, String(text).split(/\s+/).length * 160)); return; }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text));
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v => /female|zira|samantha|karen|moira|tessa|ava|chioma/i.test(v.name)) || voices.find(v => v.lang && v.lang.startsWith("en")) || voices[0];
      if (pick) utter.voice = pick;
      utter.rate = 1; utter.pitch = 1; utter.volume = 1;
      utter.onstart = () => { setState("talking"); };
      utter.onend = () => { setState("idle"); if (mouthPath) mouthPath.setAttribute("d", mouthShapes.smile); };
      utter.onerror = () => { setState("idle"); };
      // fallback viz while browser TTS plays
      const vizInt = setInterval(() => {
        if (state !== "talking") { clearInterval(vizInt); return; }
        bars.forEach(b => b.style.height = (4 + Math.random()*12) + "px");
        if (Math.random() > 0.7) setMouth(["talk1","talk2","talk3","talk4"][Math.floor(Math.random()*4)]);
      }, 90);
      const origEnd = utter.onend;
      utter.onend = (e) => { clearInterval(vizInt); bars.forEach(b => b.style.height = "4px"); origEnd(e); };
      // ensure voices loaded
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.speak(utter);
        setTimeout(() => window.speechSynthesis.speak(utter), 100);
      } else {
        window.speechSynthesis.speak(utter);
      }
    } catch(e) { setState("talking"); setTimeout(() => setState("idle"), Math.max(1200, String(text).split(/\s+/).length * 160)); }
  }
  async function sendMessage(text, withVoice) {
    if (!text || !text.trim()) return;
    addMsg(text, "user"); if (inputEl) inputEl.value = "";
    hideTranscriptBanner(); setState("thinking"); if (sendBtn) sendBtn.disabled = true;
    try {
      const res = await fetch(API + "/api/user/chat", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ session_id: SESSION_ID, question: text, voice: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      addMsg(data.answer, "bot", data.sources);
      showBubble(data.answer);
      if (data.voice_audio) {
        audioEl.src = "data:audio/wav;base64," + data.voice_audio;
        audioEl.onplay = () => setState("talking");
        audioEl.onended = () => { setState("idle"); if (mouthPath) mouthPath.setAttribute("d", mouthShapes.smile); };
        audioEl.play().catch(() => { speakBrowser(data.answer); });
      } else {
        speakBrowser(data.answer);
      }
    } catch(err) {
      addMsg("Connection error. Is the backend running on " + API + "?", "bot");
      setState("idle");
    } finally { if (sendBtn) sendBtn.disabled = false; }
  }
  function showBubble(text) {
    if (!bubble) return;
    bubble.textContent = String(text).length > 50 ? String(text).slice(0,50)+"..." : String(text);
    bubble.classList.add("show");
    clearTimeout(bubble._timer);
    bubble._timer = setTimeout(() => bubble.classList.remove("show"), 5000);
  }
  function showTranscriptBanner(text) {
    pendingTranscript = text;
    if (transcriptText) transcriptText.textContent = text;
    if (transcriptBanner) transcriptBanner.classList.add("show");
    if (inputEl) { inputEl.value = text; inputEl.focus(); }
  }
  function hideTranscriptBanner() {
    pendingTranscript = null;
    if (transcriptBanner) transcriptBanner.classList.remove("show");
  }
  if (sendNowBtn) sendNowBtn.onclick = () => { if (pendingTranscript) sendMessage(pendingTranscript, true); };
  if (dismissBtn) dismissBtn.onclick = () => { hideTranscriptBanner(); if (inputEl) inputEl.value = ""; setState("idle"); };
  if (micBtn) {
    micBtn.onmousedown = micBtn.ontouchstart = async () => {
      if (recording) return;
      hideTranscriptBanner();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream); audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunks, { type: "audio/wav" });
          const form = new FormData(); form.append("file", blob, "voice.wav");
          setState("thinking");
          try {
            const r = await fetch(API + "/api/user/transcribe", { method: "POST", body: form });
            const t = await r.json();
            if (t.text && String(t.text).trim()) { showTranscriptBanner(String(t.text).trim()); setState("idle"); }
            else { addMsg("(Couldn't hear you — try again)", "bot"); setState("idle"); }
          } catch(e) { addMsg("(Transcription failed)", "bot"); setState("idle"); }
        };
        mediaRecorder.start(); recording = true; micBtn.classList.add("recording"); setState("listening");
      } catch(e) { alert("Microphone access denied"); }
    };
    const stopRec = () => {
      if (!recording) return; recording = false; micBtn.classList.remove("recording");
      if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
      if (mediaRecorder && mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach(t => t.stop());
    };
    micBtn.onmouseup = micBtn.onmouseleave = micBtn.ontouchend = stopRec;
  }
  if (sendBtn) sendBtn.onclick = () => sendMessage(inputEl ? inputEl.value : "", true);
  if (inputEl) inputEl.onkeydown = e => {
    if (e.key === "Enter") {
      if (pendingTranscript) sendMessage(pendingTranscript, true);
      else sendMessage(inputEl.value, true);
    }
  };
  setTimeout(() => {
    const notif = toggle ? toggle.querySelector('.notif') : null;
    if (notif && !isOpen) notif.style.display = 'block';
  }, 2000);
  if (!localStorage.getItem('ava-visited')) {
    localStorage.setItem('ava-visited', '1');
    setTimeout(() => { if (toggle) toggle.click(); addMsg("Hi there! I'm Chioma, your AI support agent. Ask me anything about our products and services!", "bot"); showBubble("Hi there! How can I help?"); }, 1500);
  } else {
    setState("idle");
  }
})();
`;
    document.body.appendChild(script);
  }, []);

  return null;
}
