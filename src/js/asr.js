import { asrTranscribe } from './api.js';
import { error as logErr } from './logger.js';

let onResult, recording = false, timer = null;

export function init(cbs) { onResult = cbs.onResult; }

export async function startRecord() {
  if (recording) return true;
  try {
    const { Microphone } = await import('@mozartec/capacitor-microphone');
    await Microphone.startRecording();
    recording = true;
    clearTimeout(timer);
    timer = setTimeout(stopRecord, 8000);
    return true;
  } catch (e) {
    logErr('录音启动:' + e.message, 'ASR');
    return false;
  }
}

export async function stopRecord() {
  clearTimeout(timer);
  if (!recording) return;
  recording = false;
  try {
    const { Microphone } = await import('@mozartec/capacitor-microphone');
    const r = await Microphone.stopRecording();
    const b64 = r?.base64String || r?.dataUrl?.replace(/^data:audio\/\w+;base64,/, '');
    if (b64) {
      const text = await asrTranscribe(b64);
      if (text?.trim()) onResult?.(text.trim());
    }
  } catch (e) { logErr('录音识别:' + e.message, 'ASR'); }
}

export function isRecording() { return recording; }
