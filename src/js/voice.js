// Primary: speechSynthesis (Chromium WebView built-in, no WAV header noise)
// Fallback: <audio> with Google TTS URL
let onStartCb = null, onEndCb = null;

export function init() {}

export function speak(text, voice, onStart, onEnd) {
  onStartCb = onStart;
  onEndCb = onEnd;

  // speechSynthesis is always available in Capacitor Chromium WebView
  stopAll();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = 1.0;
  u.pitch = 1.1;
  u.volume = 1;

  // Try to pick Chinese voice
  const voices = speechSynthesis.getVoices();
  const zh = voices.find(v => v.lang.startsWith('zh-CN')) || voices.find(v => v.lang.startsWith('zh'));
  if (zh) u.voice = zh;

  u.onstart = () => onStartCb?.();
  u.onend = () => { onEndCb?.(); onStartCb = null; onEndCb = null; };
  u.onerror = () => { onEndCb?.(); onStartCb = null; onEndCb = null; };

  speechSynthesis.speak(u);
}

export function stopSpeak() {
  try { speechSynthesis.cancel(); } catch {}
}

export function isSpeaking() { return speechSynthesis?.speaking ?? false; }
export function stopAll() { stopSpeak(); }
