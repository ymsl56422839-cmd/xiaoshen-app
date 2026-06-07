let logs = [];
export function error(msg, src) { logs.unshift({ l:'E', msg, src, t:Date.now() }); if(logs.length>50)logs.length=50; }
export function warn(msg, src) { logs.unshift({ l:'W', msg, src, t:Date.now() }); if(logs.length>50)logs.length=50; }
export function getLogs() { return logs; }
export function lastError() { const e=logs.find(x=>x.l==='E'); return e?e.msg:''; }
export function install() {
  window.onerror=(msg,src,line,col,err)=>error((err?.message||String(msg)).substring(0,120),src);
  window.onunhandledrejection=e=>error((e.reason?.message||String(e.reason)).substring(0,120),'');
}
