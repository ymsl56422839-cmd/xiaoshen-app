const KEY = 'xiaoshen_v4';
const D = { modes: 'chat' };

export function get() {
  try { const r = localStorage.getItem(KEY); return r ? { ...D, ...JSON.parse(r) } : { ...D }; }
  catch { return { ...D }; }
}

export function set(partial) {
  const cur = get();
  try { localStorage.setItem(KEY, JSON.stringify({ ...cur, ...partial })); } catch {}
}

export function getMode() { return get().modes; }
export function setMode(id) { set({ modes: id }); }
