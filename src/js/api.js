const DS_KEY = 'sk-f58d4a62a4ba4e6b903667ad83123191';
const ZP_KEY = 'c5ef3d0d1b8b4c0b977bf9a12a25aee1.lztxLY3K3qWOkqJK';

export async function callDeepSeek(messages) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DS_KEY}` },
    body: JSON.stringify({ model: 'deepseek-v4-flash', messages, stream: false, temperature: 0.85, max_tokens: 400 })
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

export async function callZhipuVision(base64) {
  const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZP_KEY}` },
    body: JSON.stringify({
      model: 'glm-5v-turbo',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: '请用中文简要描述画面，用小朋友能听懂的话，40字以内。' }
      ]}]
    })
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}
