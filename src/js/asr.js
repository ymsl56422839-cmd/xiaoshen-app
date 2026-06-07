import { asrTranscribe } from './api.js';
import { error as logErr } from './logger.js';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

let stream=null,recorder=null,chunks=[],onResult=null,recording=false,timeout=null;

export function init(cbs){onResult=cbs.onResult;}

export async function startRecord(){
  if(recording)return true;
  try{
    // Request mic permission via native Android dialog
    await SpeechRecognition.requestPermissions();
    stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    const mime = detectMime();
    if(!mime){logErr('浏览器不支持音频录制','ASR');return false;}
    recorder=new MediaRecorder(stream,{mimeType:mime});chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data)};
    recorder.onstop=async()=>{
      recording=false;clearTimeout(timeout);
      if(!chunks.length)return;
      const blob=new Blob(chunks,{type:mime});chunks=[];
      const buf=await blob.arrayBuffer();const bytes=new Uint8Array(buf);
      let b64='';for(let i=0;i<bytes.length;i+=8192)b64+=String.fromCharCode(...bytes.slice(i,i+8192));b64=btoa(b64);
      try{const t=await asrTranscribe(b64);if(t?.trim())onResult?.(t.trim());}
      catch(e){logErr('ASR识别失败:'+e.message,'ASR');}
    };
    recorder.start();recording=true;timeout=setTimeout(stopRecord,8000);return true;
  }catch(e){logErr('麦克风:'+(e.name==='NotAllowedError'?'被拒绝':e.message),'ASR');stopRecord();return false;}
}

function detectMime(){
  for(const m of ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4']){
    if(MediaRecorder.isTypeSupported(m))return m;
  }
  return null;
}

export function stopRecord(){clearTimeout(timeout);if(recorder?.state==='recording')try{recorder.stop()}catch{};if(stream){stream.getTracks().forEach(t=>t.stop());stream=null};recording=false;}
export function isRecording(){return recording;}
