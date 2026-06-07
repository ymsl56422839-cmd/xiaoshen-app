import { asrTranscribe } from './api.js';
import { error as logErr } from './logger.js';

let onResult, recording = false;

export function init(cbs) { onResult = cbs.onResult; }

export async function startRecord() {
  if (recording) return true;
  try {
    const { VoiceRecorder } = await import('@independo/capacitor-voice-recorder');

    // Check permission
    const perm = await VoiceRecorder.hasRecordPermission();
    if (!perm) {
      const granted = await VoiceRecorder.requestRecordPermission();
      if (!granted) { logErr('录音权限被拒绝', 'ASR'); return false; }
    }

    await VoiceRecorder.startRecording();
    recording = true;

    // Auto-stop after 8 seconds
    setTimeout(async () => {
      if (!recording) return;
      await stopAndTranscribe();
    }, 8000);

    return true;
  } catch (e) {
    logErr('录音启动失败:' + e.message, 'ASR');
    return false;
  }
}

async function stopAndTranscribe() {
  if (!recording) return;
  recording = false;
  try {
    const { VoiceRecorder } = await import('@independo/capacitor-voice-recorder');
    const result = await VoiceRecorder.stopRecording();
    const b64 = result.value?.recordDataBase64;
    if (!b64) return;
    const text = await asrTranscribe(b64);
    if (text?.trim()) onResult?.(text.trim());
  } catch (e) {
    logErr('录音识别失败:' + e.message, 'ASR');
  }
}

export function stopRecord() {
  if (recording) stopAndTranscribe();
}

export function isRecording() { return recording; }
