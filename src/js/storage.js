const KEY = 'xiaoshen_v3';

const D = { modes: 'chat', lastVisit: '' };

export function get() {
  try { const r = localStorage.getItem(KEY); return r ? { ...D, ...JSON.parse(r) } : { ...D }; }
  catch { return { ...D }; }
}

export function set(partial) {
  const cur = get();
  const updated = { ...cur, ...partial };
  try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
  return updated;
}

export function getMode() { return get().modes; }
export function setMode(id) { set({ modes: id }); }
