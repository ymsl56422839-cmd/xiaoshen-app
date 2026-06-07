import { deepseekChat, visionDescribe } from './api.js';
import { MODES, getMode } from './prompts.js';
import { VERSION } from './config.js';
import { runDiagnostics } from './diagnose.js';
import { init as initVoice, speak, stopSpeak, stopAll, isSpeaking } from './voice.js';
import { init as initASR, startRecord, stopRecord, isRecording } from './asr.js';
import { initAvatar, setExpression } from './avatar.js';
import { getMode as savedMode, setMode } from './storage.js';
import { install as installLogger, getLogs } from './logger.js';

installLogger();
const $ = id => document.getElementById(id);
let mode = getMode(savedMode()), chatMsgs = [], callActive = false;

async function aiReply(t) {
  chatMsgs.push({ role: 'user', content: t }); if (chatMsgs.length > 14) chatMsgs = chatMsgs.slice(-14);
  return deepseekChat([{ role: 'system', content: mode.prompt }, ...chatMsgs]).then(r => { if (r) chatMsgs.push({ role: 'assistant', content: r }); return r; });
}
async function aiVision(b64) {
  const desc = await visionDescribe(b64); if (!desc) return '';
  chatMsgs.push({ role: 'user', content: `[孩子展示：${desc}]` }); if (chatMsgs.length > 14) chatMsgs = chatMsgs.slice(-14);
  return deepseekChat([{ role: 'system', content: mode.prompt }, ...chatMsgs]).then(r => { if (r) chatMsgs.push({ role: 'assistant', content: r }); return r; });
}

// speak returns immediately, onEnd callback handles next ASR loop
function doSpeak(t) {
  setExpression('speaking');
  showOverlay('🦕 小深在回答...');
  speak(t, mode.voice,
    () => {},  // onStart
    () => {    // onEnd — audio truly finished, or was interrupted
      setExpression('default');
      hideOverlay();
      if (callActive) startASRLoop();
    }
  );
}

// Overlay helpers
function showOverlay(t) { const e = document.getElementById('action-overlay'); if (e) { e.textContent = t; e.style.display = 'flex'; } }
function hideOverlay() { const e = document.getElementById('action-overlay'); if (e) e.style.display = 'none'; }
function setStatus(t) { const e = document.getElementById('status-text'); if (e) e.textContent = t; }
function showBubble(t) { const b = $('bubble'), tx = document.getElementById('bubble-text'); if (!b || !tx) return; tx.textContent = t; b.style.display = 'block'; clearTimeout(window._bb); window._bb = setTimeout(() => b.style.display = 'none', 12000); }

// ========== HOME ==========
function showHome() {
  callActive = false; stopAll(); chatMsgs = [];
  mode = getMode(savedMode());
  let cards = MODES.map(m => `<button class="mc${mode.id === m.id ? ' sel' : ''}" data-id="${m.id}"><span class="mci">${m.icon}</span><span class="mcn">${m.name}</span></button>`).join('');
  $('app').innerHTML = `<div class="home"><div class="ht"><div id="dino-home"></div><div class="hg">你好呀，小朋友！</div><div class="hs">🦕 我是小深，你的AI小伙伴</div></div><div class="mg">${cards}</div><div class="ha"><button id="call-btn" class="big-btn c-orange">📞 打电话</button><button id="cam-btn" class="big-btn c-green">📹 视频通话</button></div><div class="ver">v${VERSION}</div></div>`;
  initAvatar('dino-home'); setExpression('default');
  document.querySelectorAll('.mc').forEach(c => c.addEventListener('click', () => { mode = getMode(c.dataset.id); setMode(mode.id); showHome(); }));
  let pt; const d = document.getElementById('dino-home'); if (d) { d.addEventListener('pointerdown', () => { pt = setTimeout(showDiag, 3000) }); d.addEventListener('pointerup', () => clearTimeout(pt)); d.addEventListener('pointerleave', () => clearTimeout(pt)); }
  $('call-btn').addEventListener('click', enterCall); $('cam-btn').addEventListener('click', enterVideo);
}

// ========== DIAGNOSE ==========
async function showDiag() {
  $('app').innerHTML = `<div class="diag"><div class="diag-head"><button id="diag-back" class="diag-back">← 返回</button><span>🔧 诊断中心</span><span>v${VERSION}</span></div><div class="diag-list" id="diag-list">⏳ 检测中...</div><div class="diag-log-w" id="diag-log-w"></div><div class="diag-act"><button id="diag-retry" class="big-btn c-orange" style="max-width:240px">🔄 重新检测</button></div></div>`;
  $('diag-back').addEventListener('click', showHome); $('diag-retry').addEventListener('click', showDiag);
  showLogs(); const results = await runDiagnostics();
  $('diag-list').innerHTML = results.map(r => `<div class="diag-item"><span class="diag-icon">${r.ok ? '✅' : '❌'}</span><span class="diag-name">${r.name}</span><span class="diag-ms">${r.ms}ms</span><span class="diag-d">${r.d}</span></div>`).join('');
}
function showLogs() { const logs = getLogs(), el = $('diag-log-w'); if (!el) return; if (!logs.length) { el.innerHTML = '<div class="diag-log-t">📋 错误日志：(空)</div>'; return; } el.innerHTML = '<div class="diag-log-t">📋 错误日志</div>' + logs.slice(0, 20).map(x => `<div class="diag-log-e ${x.l === 'E' ? 'dle' : ''}">${new Date(x.t).toLocaleTimeString()} [${x.l}] ${x.msg}</div>`).join(''); }

// ========== CALL MODE ==========
async function startASRLoop() {
  if (!callActive || isRecording()) return;
  // Interrupt AI if it's currently speaking
  if (isSpeaking()) stopSpeak();

  showOverlay('🎤 正在听...');
  const ok = await startRecord();
  if (!ok) { hideOverlay(); setStatus('🎤 录音未就绪，请打字'); }
}

function onASRResult(t) {
  if (!callActive || isSpeaking()) return;
  hideOverlay();
  if (t) { setStatus('🤔 小深在想...'); processText(t); }
  else { startASRLoop(); }
}

async function processText(t) { addMsg('u', t); try { const r = await aiReply(t); if (r) { addMsg('a', r); doSpeak(r); } else startASRLoop(); } catch { addMsg('s', '网络出错了'); startASRLoop(); } }

function enterCall() {
  callActive = true; chatMsgs = [];
  $('app').innerHTML = `
    <div class="chat">
      <div class="chat-top"><button id="chat-back" class="chat-back">←</button><span class="chat-title">${mode.icon} ${mode.name}</span><span></span></div>
      <div class="chat-dino" id="chat-dino"></div>
      <div id="chat-msgs" class="chat-msgs"></div>
      <div id="action-overlay" class="aol" style="display:none"></div>
      <div class="chat-status" id="status-text"></div>
      <div class="chat-input">
        <input id="chat-inp" class="chat-inp" placeholder="打字或直接说话，小深会用语音回复你～">
        <button id="chat-send" class="chat-send">发送</button>
      </div>
    </div>`;

  initAvatar('chat-dino'); initVoice(); initASR({ onResult: onASRResult });
  setExpression('default');

  $('chat-back').addEventListener('click', showHome);
  $('chat-send').addEventListener('click', sendText);
  $('chat-inp').addEventListener('keydown', e => { if (e.key === 'Enter') sendText(); });

  // AI greets
  setTimeout(async () => {
    try {
      const msgs = [{ role: 'system', content: mode.prompt }, { role: 'user', content: '你好！' }];
      const reply = await deepseekChat(msgs);
      if (reply) { chatMsgs.push({ role: 'assistant', content: reply }); addMsg('a', reply); doSpeak(reply); }
      else startASRLoop();
    } catch { addMsg('s', '网络连接失败'); startASRLoop(); }
  }, 500);
}

function sendText() {
  const inp = $('chat-inp'), v = inp?.value?.trim(); if (!v) return; inp.value = '';
  addMsg('u', v); processText(v);
}
function addMsg(role, text) {
  const el = $('chat-msgs'); if (!el) return;
  const d = document.createElement('div');
  d.className = role === 'u' ? 'cm cm-u' : role === 's' ? 'cm cm-s' : 'cm cm-a';
  d.textContent = text;
  el.appendChild(d);
  setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
}

// ========== VIDEO MODE ==========
let visionTimer = null;
async function enterVideo() {
  callActive = true; chatMsgs = [];
  $('app').innerHTML = `<div class="cam"><div class="cw"><video id="cam-video" autoplay playsinline muted></video><canvas id="cam-canvas" style="display:none"></canvas></div><div class="co"><div id="dino-cam" style="width:70px;height:70px"></div><div id="status-text" class="st cam-st">📷 正在启动...</div><div id="bubble" class="bub cam-bub" style="display:none"><span id="bubble-text"></span></div></div><div class="ca cam-ca"><button id="hangup-btn" class="hangup">🔴 挂断</button></div></div>`;
  initAvatar('dino-cam'); initVoice();
  $('hangup-btn').addEventListener('click', () => { const v = $('cam-video'); if (v?.srcObject) v.srcObject.getTracks().forEach(t => t.stop()); clearInterval(visionTimer); showHome(); });
  try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }); const v = $('cam-video'); if (v) { v.srcObject = stream; await v.play(); setStatus('📷 已就绪'); } } catch (e) { setStatus('🔒 摄像头: ' + (e.name === 'NotAllowedError' ? '被拒绝' : e.message)); }
  setTimeout(async () => { try { const r = await deepseekChat([{ role: 'system', content: mode.prompt }, { role: 'user', content: '我们开始视频聊天吧！' }]); if (r) { chatMsgs.push({ role: 'assistant', content: r }); showBubble(r); doSpeak(r); } } catch { } }, 800);
  visionTimer = setInterval(async () => { if (!callActive || isSpeaking()) return; const v = $('cam-video'), c = $('cam-canvas'); if (!v || !c || !v.videoWidth) return; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); const b64 = c.toDataURL('image/jpeg', 0.6).split(',')[1]; try { setStatus('🔍 让我看看...'); const r = await aiVision(b64); if (r) { showBubble(r); doSpeak(r); } } catch { } }, 6000);
}

// ========== BOOT ==========
showHome();
