import { deepseekChat, visionDescribe, ttsSpeak } from './api.js';

export async function runDiagnostics() {
  const r = [];

  // Network
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 5000);
    const resp = await fetch('https://api.deepseek.com/v1/models', { signal: ctrl.signal });
    clearTimeout(tm);
    r.push({ name: '网络连接', ok: resp.ok, ms: Date.now() - t0, d: resp.ok ? '正常' : resp.status });
  } catch (e) { r.push({ name: '网络连接', ok: false, ms: Date.now() - t0, d: e.message }); }

  // DeepSeek
  const t1 = Date.now();
  try { const reply = await race(deepseekChat([{ role: 'user', content: '回OK' }]), 8000);
    r.push({ name: 'DeepSeek API', ok: !!reply, ms: Date.now() - t1, d: reply ? '正常' : '空' }); }
  catch (e) { r.push({ name: 'DeepSeek API', ok: false, ms: Date.now() - t1, d: e.message }); }

  // GLM-TTS
  const t2 = Date.now();
  try { const buf = await race(ttsSpeak('测试音', 'tongtong'), 8000);
    r.push({ name: '智譜 GLM-TTS', ok: buf.byteLength > 0, ms: Date.now() - t2, d: buf.byteLength + 'B' }); }
  catch (e) { r.push({ name: '智譜 GLM-TTS', ok: false, ms: Date.now() - t2, d: e.message }); }

  // GLM-Vision (small test image)
  const t3 = Date.now();
  try { const desc = await race(visionDescribe(TEST_JPG), 8000);
    r.push({ name: '智譜 Vision', ok: !!desc, ms: Date.now() - t3, d: desc || '空' }); }
  catch (e) { r.push({ name: '智譜 Vision', ok: false, ms: Date.now() - t3, d: e.message }); }

  // Camera
  try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach(t => t.stop());
    r.push({ name: '摄像头权限', ok: true, ms: 0, d: '已授权' }); }
  catch (e) { r.push({ name: '摄像头权限', ok: false, ms: 0, d: e.name === 'NotAllowedError' ? '被拒绝' : e.message }); }

  // Mic
  try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop());
    r.push({ name: '麦克风权限', ok: true, ms: 0, d: '已授权' }); }
  catch (e) { r.push({ name: '麦克风权限', ok: false, ms: 0, d: e.name === 'NotAllowedError' ? '被拒绝' : e.message }); }

  return r;
}

const TEST_JPG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJUVY2J3Y2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

async function race(p, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
  });
}
