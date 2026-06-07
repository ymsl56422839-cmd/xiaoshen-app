import { ttsSpeak } from './api.js';

let currentAudio = null;

export function init() {}

export function speak(text, voice, onStart, onEnd) {
  stopSpeak();
  const a = new Audio();
  let cleanup = null;
  currentAudio = a;

  const done = () => {
    if (currentAudio === a) currentAudio = null;
    try { a.pause(); a.src = ''; a.load(); } catch {}
    if (cleanup) { cleanup(); cleanup = null; }
    onEnd?.();
  };

  // Try AudioContext first (proper WAV decoding, no beep)
  ttsSpeak(text, voice).then(buf => {
    tryWithAudioContext(buf, done, onStart).then(ok => {
      if (ok) return;
      // Fallback: <audio> element
    const blob = new Blob([buf], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    cleanup = () => URL.revokeObjectURL(url);
    a.src = url;
    a.load();
    a.onloadedmetadata = () => {
      // Skip WAV header (44 bytes ≈ 2.75ms at 16kHz 16bit mono)
      try { a.currentTime = 0.01; } catch {}
    };
    a.onseeked = () => { a.play().catch(() => done()); onStart?.(); };
    a.onended = () => done();
    a.onerror = () => done();
    });
  }).catch(() => {
    a.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;
    a.load();
    a.onloadeddata = () => { setTimeout(() => a.play().catch(() => done()), 100); onStart?.(); };
    a.onended = () => done();
    a.onerror = () => done();
  });

  setTimeout(() => done(), 15000);
}

async function tryWithAudioContext(buf, done, onStart) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await ctx.decodeAudioData(buf.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    currentAudio = source; // allow stopSpeak() to stop this source

    source.onended = () => done();
    source.start(0);
    onStart?.();
    return true;
  } catch {
    return false;
  }
}

export function stopSpeak() {
  try {
    if (currentAudio) {
      if (currentAudio.stop) currentAudio.stop(); // AudioBufferSourceNode
      else { currentAudio.pause(); currentAudio.src = ''; } // HTMLAudioElement
    }
  } catch {}
  currentAudio = null;
}

export function isSpeaking() { return !!currentAudio; }
export function stopAll() { stopSpeak(); }
