import { deepseekChat, visionDescribe, ttsSpeak } from './api.js';

export async function runDiagnostics() {
  const r = [];

  // Network - test via DeepSeek (known to work)
  const t0 = Date.now();
  try {
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 5000);
    await fetch('https://api.deepseek.com', { signal: ctrl.signal });
    clearTimeout(tm); r.push({ name: '网络连接', ok: true, ms: Date.now() - t0, d: '正常' });
  } catch (e) { r.push({ name: '网络连接', ok: false, ms: Date.now() - t0, d: e.message }); }

  // DeepSeek
  const t1 = Date.now();
  try { const reply = await race(deepseekChat([{ role: 'user', content: '回OK' }]), 8000);
    r.push({ name: 'DeepSeek API', ok: !!reply, ms: Date.now() - t1, d: reply ? '正常' : '空响应' }); }
  catch (e) { r.push({ name: 'DeepSeek API', ok: false, ms: Date.now() - t1, d: e.message }); }

  // GLM-TTS
  const t2 = Date.now();
  try { const buf = await race(ttsSpeak('测试音', 'female'), 8000);
    r.push({ name: '智譜 GLM-TTS', ok: buf.byteLength > 0, ms: Date.now() - t2, d: buf.byteLength + 'B' }); }
  catch (e) { r.push({ name: '智譜 GLM-TTS', ok: false, ms: Date.now() - t2, d: e.message }); }

  // GLM-Vision (real tiny image from internet)
  const t3 = Date.now();
  try { const desc = await race(visionDescribe(TEST_IMG, 'image/gif'), 8000);
    r.push({ name: '智譜 Vision', ok: !!desc, ms: Date.now() - t3, d: desc || '空' }); }
  catch (e) { r.push({ name: '智譜 Vision', ok: false, ms: Date.now() - t3, d: e.message }); }

  // Camera
  try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach(t => t.stop());
    r.push({ name: '摄像头权限', ok: true, ms: 0, d: '已授权' }); }
  catch (e) { r.push({ name: '摄像头权限', ok: false, ms: 0, d: e.name === 'NotAllowedError' ? '被拒绝' : e.message }); }

  // Mic (test via Android native SpeechRecognizer, not WebView getUserMedia)
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
    await SpeechRecognition.requestPermissions();
    const { available } = await SpeechRecognition.available();
    r.push({ name: '麦克风权限', ok: available, ms: 0, d: available ? '已授权' : '不可用' });
  } catch (e) { r.push({ name: '麦克风权限', ok: false, ms: 0, d: e.name === 'NotAllowedError' ? '被拒绝' : e.message }); }

  return r;
}

// Tiny 127B orange pixel GIF (valid image, wraps fast)
const TEST_IMG = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

async function race(p, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
  });
}
