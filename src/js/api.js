const KEY = 'c5ef3d0d1b8b4c0b977bf9a12a25aee1.lztxLY3K3qWOkqJK';
const DS_KEY = 'sk-f58d4a62a4ba4e6b903667ad83123191';
const BASE = 'https://open.bigmodel.cn/api/paas/v4';

export async function asrTranscribe(audioBase64) {
  const fd = new FormData();
  fd.append('model', 'glm-asr-2512');
  fd.append('file_base64', audioBase64);
  const r = await fetch(`${BASE}/audio/transcriptions`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${KEY}` }, body: fd
  });
  const d = await r.json();
  return d.text || '';
}

export async function ttsSpeak(text, voice = 'tongtong') {
  const r = await fetch(`${BASE}/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'glm-tts', input: text, voice, speed: 1.0, volume: 1.0, response_format: 'mp3' })
  });
  if (!r.ok) throw new Error('TTS failed');
  return await r.arrayBuffer();
}

export async function visionDescribe(base64) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
    body: JSON.stringify({
      model: 'glm-5v-turbo',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: '请用中文简要描述画面，用小朋友能懂的话，30字以内。' }
      ]}]
    })
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

export async function deepseekChat(messages) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DS_KEY}` },
    body: JSON.stringify({ model: 'deepseek-v4-flash', messages, stream: false, temperature: 0.85, max_tokens: 300 })
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}
