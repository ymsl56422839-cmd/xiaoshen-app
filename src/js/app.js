import { deepseekChat, visionDescribe } from './api.js';
import { MODES, getMode } from './prompts.js';
import { VERSION } from './config.js';
import { runDiagnostics } from './diagnose.js';
import { init as initVoice, speak, stopAll, isSpeaking } from './voice.js';
import { init as initASR, startRecord, stopRecord } from './asr.js';
import { initAvatar, setExpression } from './avatar.js';
import { getMode as savedMode, setMode } from './storage.js';

const $ = id => document.getElementById(id);

let mode = getMode(savedMode()), chatMsgs = [], camOn = false, callActive = false;

// === Chat helpers ===
async function aiReply(text) {
  chatMsgs.push({ role:'user', content:text });
  if (chatMsgs.length > 14) chatMsgs = chatMsgs.slice(-14);
  return await deepseekChat([{ role:'system', content:mode.prompt }, ...chatMsgs]).then(r => { if (r) chatMsgs.push({ role:'assistant', content:r }); return r; });
}

async function aiVision(img) {
  const desc = await visionDescribe(img);
  if (!desc) return '';
  chatMsgs.push({ role:'user', content:`[孩子展示：${desc}]` });
  if (chatMsgs.length > 14) chatMsgs = chatMsgs.slice(-14);
  const reply = await deepseekChat([{ role:'system', content:mode.prompt }, ...chatMsgs]);
  if (reply) chatMsgs.push({ role:'assistant', content:reply });
  return reply;
}

// === TTS + text fallback ===
async function doSpeak(text) {
  setExpression('speaking');
  const ok = await speak(text, mode.voice, () => {}, () => {});
  setExpression('default');
  showBubble(text);
  if (!ok) setStatus('🔇 语音暂不可用，请看文字');
  if (callActive) startASRLoop();
}

// === ASR loop ===
async function startASRLoop() {
  if (!callActive || isSpeaking()) return;
  setStatus('🎤 小深在听...');
  const ok = await startRecord();
  if (!ok) setStatus('⌨️ 麦克风未就绪，请打字');
}

function stopASRLoop() { stopRecord(); }
function onASRResult(text) { if (callActive && !isSpeaking() && text) { setStatus('🤔 小深在想...'); processMessage(text); } }
async function processMessage(text) {
  try { const reply = await aiReply(text); if (reply) doSpeak(reply); else startASRLoop(); }
  catch { setStatus('⚠️ 网络错误，重试中...'); startASRLoop(); }
}

// === UI helpers ===
function setStatus(t) { const e = document.getElementById('status-text'); if (e) e.textContent = t; }
function showBubble(text) {
  const b = $('bubble'), t = document.getElementById('bubble-text');
  if (!b || !t) return; t.textContent = text; b.style.display = 'block';
  clearTimeout(window._bb); window._bb = setTimeout(() => b.style.display = 'none', 12000);
}
function toast(m) {
  let el = $('toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = m; el.classList.add('show');
  clearTimeout(window._to); window._to = setTimeout(() => el.classList.remove('show'), 2000);
}

// ========== HOME ==========
function showHome() {
  callActive = false; camOn = false; stopAll(); stopASRLoop(); chatMsgs = [];
  mode = getMode(savedMode());
  let cards = MODES.map(m => `<button class="mc${mode.id===m.id?' sel':''}" data-id="${m.id}"><span class="mci">${m.icon}</span><span class="mcn">${m.name}</span></button>`).join('');

  $('app').innerHTML = `
<div class="home">
  <div class="ht"><div id="dino-home"></div><div class="hg">你好呀，小朋友！</div><div class="hs">🦕 我是小深，你的AI小伙伴</div></div>
  <div class="mg">${cards}</div>
  <div class="ha"><button id="call-btn" class="big-btn c-orange">📞 打电话</button><button id="cam-btn" class="big-btn c-green">📹 视频通话</button></div>
  <div class="ver">v${VERSION}</div>
</div>
<div id="toast" class="toast"></div>`;

  initAvatar('dino-home'); setExpression('default');

  document.querySelectorAll('.mc').forEach(c => c.addEventListener('click', () => {
    mode = getMode(c.dataset.id); setMode(mode.id); toast(`已切换「${mode.name}」`); showHome();
  }));

  // Long-press → diagnose
  let pressTimer;
  const dino = document.getElementById('dino-home');
  if (dino) {
    dino.addEventListener('pointerdown', () => { pressTimer = setTimeout(showDiagnose, 3000); });
    dino.addEventListener('pointerup', () => clearTimeout(pressTimer));
    dino.addEventListener('pointerleave', () => clearTimeout(pressTimer));
  }

  $('call-btn').addEventListener('click', enterCall);
  $('cam-btn').addEventListener('click', enterVideo);
}

// ========== DIAGNOSE ==========
async function showDiagnose() {
  toast('🔧 正在诊断...');
  $('app').innerHTML = `
<div class="diag">
  <div class="diag-head"><button id="diag-back" class="diag-back">← 返回</button><span>🔧 诊断中心</span><span>v${VERSION}</span></div>
  <div class="diag-list" id="diag-list"><div class="diag-item">⏳ 检测中...</div></div>
  <div class="diag-act"><button id="diag-retry" class="big-btn c-orange" style="max-width:240px">🔄 重新检测</button></div>
</div>`;

  $('diag-back').addEventListener('click', showHome);
  $('diag-retry').addEventListener('click', showDiagnose);

  const list = $('diag-list');
  list.innerHTML = '<div class="diag-item">⏳ 检测中...</div>';

  const results = await runDiagnostics();
  list.innerHTML = results.map(r =>
    `<div class="diag-item"><span class="diag-icon">${r.ok?'✅':'❌'}</span><span class="diag-name">${r.name}</span><span class="diag-ms">${r.ms}ms</span><span class="diag-detail">${r.d}</span></div>`
  ).join('');
}

// ========== CALL MODE ==========
function enterCall() {
  try {
    callActive = true; camOn = false; chatMsgs = [];
    $('app').innerHTML = `
<div class="call">
  <div id="dino-call"><span style="font-size:3em">🦕</span></div>
  <div id="status-text" class="st">🦕 小深正在连接...</div>
  <div id="bubble" class="bub" style="display:none"><span id="bubble-text"></span></div>
  <div class="ca"><button id="hangup-btn" class="hangup">🔴 挂断</button></div>
</div>
<div id="toast" class="toast"></div>`;

    setTimeout(() => { try { initAvatar('dino-call'); initVoice(); initASR({ onResult: onASRResult }); } catch (e) { setStatus('加载失败: ' + e.message); } }, 100);
    setTimeout(() => { try { $('hangup-btn')?.addEventListener('click', showHome); } catch {} }, 200);

    setTimeout(async () => {
      try {
        const msgs = [{ role:'system', content:mode.prompt }, { role:'user', content:'你好！' }];
        const reply = await deepseekChat(msgs);
        if (reply) { chatMsgs.push({ role:'assistant', content:reply }); doSpeak(reply); }
        else { setStatus('🎤 准备好了，请说话～'); startASRLoop(); }
      } catch { setStatus('⚠️ 网络连接失败，请检查后重试'); }
    }, 600);

  } catch (e) { toast('出错: ' + e.message); showHome(); }
}

// ========== VIDEO MODE ==========
let visionTimer = null;

async function enterVideo() {
  callActive = true; camOn = true; chatMsgs = [];
  $('app').innerHTML = `
<div class="cam">
  <div class="cw"><video id="cam-video" autoplay playsinline muted></video><canvas id="cam-canvas" style="display:none"></canvas></div>
  <div class="co">
    <div id="dino-cam" style="width:70px;height:70px"></div>
    <div id="status-text" class="st cam-st">📷 正在启动摄像头...</div>
    <div id="bubble" class="bub cam-bub" style="display:none"><span id="bubble-text"></span></div>
  </div>
  <div class="ca cam-ca"><button id="hangup-btn" class="hangup">🔴 挂断</button></div>
</div>`;

  initAvatar('dino-cam');
  initVoice();
  initASR({ onResult: onASRResult });

  $('hangup-btn').addEventListener('click', () => {
    const v = $('cam-video'); if (v?.srcObject) v.srcObject.getTracks().forEach(t => t.stop());
    clearInterval(visionTimer); showHome();
  });

  // Camera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    const v = $('cam-video');
    if (v) { v.srcObject = stream; await v.play(); setStatus('📷 摄像头已就绪'); }
  } catch (e) {
    setStatus('⚠️ 摄像头未授权或不可用，请在设置中允许');
    if (e.name === 'NotAllowedError') setStatus('🔒 摄像头权限被拒绝，请到系统设置开启');
  }

  // Greeting
  setTimeout(async () => {
    try {
      const reply = await deepseekChat([{ role:'system', content:mode.prompt }, { role:'user', content:'我们开始视频聊天吧！' }]);
      if (reply) { chatMsgs.push({ role:'assistant', content:reply }); doSpeak(reply); }
      else startASRLoop();
    } catch { setStatus('⚠️ 网络错误'); startASRLoop(); }
  }, 800);

  // Vision loop
  visionTimer = setInterval(async () => {
    if (!callActive || isSpeaking()) return;
    const v = $('cam-video'), c = $('cam-canvas');
    if (!v || !c || !v.videoWidth) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const b64 = c.toDataURL('image/jpeg', 0.6).split(',')[1];
    try {
      setStatus('🔍 让我看看...');
      const reply = await aiVision(b64);
      if (reply) { showBubble(reply); stopASRLoop(); doSpeak(reply); }
    } catch { setStatus('⚠️ 识图失败，继续尝试'); }
  }, 6000);
}

// ========== BOOT ==========
showHome();
