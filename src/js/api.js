const KEY = 'c5ef3d0d1b8b4c0b977bf9a12a25aee1.lztxLY3K3qWOkqJK';
const DS_KEY = 'sk-f58d4a62a4ba4e6b903667ad83123191';
const BASE = 'https://open.bigmodel.cn/api/paas/v4';
const TIMEOUT = 8000;

async function fetchJson(url, opts) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || `HTTP ${r.status}`);
    return d;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

export async function deepseekChat(messages) {
  const d = await fetchJson('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DS_KEY}` },
    body: JSON.stringify({ model: 'deepseek-v4-flash', messages, stream: false, temperature: 0.85, max_tokens: 300 })
  });
  return d.choices?.[0]?.message?.content || '';
}

export async function visionDescribe(base64) {
  const d = await fetchJson(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
    body: JSON.stringify({
      model: 'glm-5v-turbo',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: '请用中文简要描述画面内容，30字以内。' }
      ]}]
    })
  });
  return d.choices?.[0]?.message?.content || '';
}

export async function ttsSpeak(text, voice = 'tongtong') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(`${BASE}/audio/speech`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ model: 'glm-tts', input: text, voice, speed: 1.0, volume: 1.0, response_format: 'mp3' })
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.arrayBuffer();
  } catch (e) { clearTimeout(t); throw e; }
}

export async function asrTranscribe(audioBase64) {
  const fd = new FormData();
  fd.append('model', 'glm-asr-2512');
  fd.append('file_base64', audioBase64);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(`${BASE}/audio/transcriptions`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Authorization': `Bearer ${KEY}` }, body: fd
    });
    clearTimeout(t);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || `HTTP ${r.status}`);
    return d.text || '';
  } catch (e) { clearTimeout(t); throw e; }
}
