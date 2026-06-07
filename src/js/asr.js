import { asrTranscribe } from './api.js';

let stream = null;
let recorder = null;
let chunks = [];
let onResult = null;
let recording = false;
let timeout = null;

export function init(cbs) { onResult = cbs.onResult; }

export async function startRecord() {
  if (recording) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    chunks = [];

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
      recording = false;
      clearTimeout(timeout);
      if (chunks.length === 0) return;
      const blob = new Blob(chunks, { type: 'audio/webm' });
      chunks = [];

      // Convert to base64
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let b64 = '';
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        b64 += String.fromCharCode(...bytes.slice(i, i + CHUNK));
      }
      b64 = btoa(b64);

      try {
        const text = await asrTranscribe(b64);
        if (text?.trim()) onResult?.(text.trim());
      } catch {}
    };

    recorder.start();
    recording = true;

    // Auto-stop after 8 seconds
    timeout = setTimeout(() => stopRecord(), 8000);
    return true;
  } catch {
    stopRecord();
    return false;
  }
}

export function stopRecord() {
  clearTimeout(timeout);
  if (recorder?.state === 'recording') {
    try { recorder.stop(); } catch {}
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  recording = false;
}

export function isRecording() { return recording; }
