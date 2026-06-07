import { TextToSpeech } from '@capacitor-community/text-to-speech';

let speaking = false;

export function init() {}

export function speak(text, voice) {
  return new Promise(async (resolve) => {
    stopAll();
    speaking = true;
    const pitch = voice === 'male' ? 0.9 : 1.2;
    try {
      await TextToSpeech.speak({ text, lang: 'zh-CN', rate: 1.0, pitch, volume: 1.0 });
    } catch {
      // Fallback: Google TTS URL via <audio>
      const a = new Audio();
      a.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
      await new Promise(r => { a.onended = r; a.onerror = r; a.play().catch(r); });
    }
    speaking = false;
    resolve();
  });
}

export function stopSpeak() {
  speaking = false;
  try { TextToSpeech.stop(); } catch {}
}

export function isSpeaking() { return speaking; }
export function stopAll() { stopSpeak(); }
