const DINO = `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="db" cx="45%" cy="35%" r="55%"><stop offset="0%" stop-color="#FFB88C"/><stop offset="100%" stop-color="#E06B2A"/></radialGradient></defs>
<ellipse cx="68" cy="85" rx="42" ry="32" fill="url(#db)"/>
<ellipse cx="72" cy="92" rx="26" ry="18" fill="#FFE4C4"/>
<ellipse cx="115" cy="62" rx="22" ry="20" fill="url(#db)"/>
<ellipse cx="132" cy="70" rx="12" ry="9" fill="#FFE4C4"/>
<ellipse cx="118" cy="58" rx="8" ry="9" fill="white" stroke="#333" stroke-width="1"/>
<circle cx="120" cy="57" r="5" fill="#333"/>
<circle cx="122" cy="55" r="2" fill="white"/>
<circle cx="135" cy="68" r="2" fill="#333"/>
<path id="dm" d="M126,76 Q132,85 138,80" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/>
<polygon points="105,45 112,28 119,42" fill="#E06B2A"/><polygon points="90,42 100,22 110,42" fill="#E06B2A"/><polygon points="75,44 84,28 93,45" fill="#E06B2A"/>
<path d="M28,82 Q18,72 12,80 Q8,88 16,92" fill="url(#db)" stroke="#E06B2A" stroke-width="2"/>
<rect x="45" y="108" width="14" height="20" rx="5" fill="#E06B2A"/><rect x="70" y="108" width="14" height="20" rx="5" fill="#E06B2A"/>
<ellipse cx="52" cy="129" rx="9" ry="5" fill="#D0551A"/><ellipse cx="77" cy="129" rx="9" ry="5" fill="#D0551A"/>
<ellipse cx="90" cy="95" rx="6" ry="10" fill="#E06B2A" transform="rotate(-20,90,95)"/>
<ellipse cx="125" cy="67" rx="5" ry="3" fill="#FF6B6B" opacity=".25"/>
</svg>`;

let mouthTimer = null;

export function initAvatar(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="dino-wrap">${DINO}</div>`;
}

export function setExpression(e) {
  const m = document.getElementById('dm');
  if (!m) return;
  if (e === 'speaking') {
    if (!mouthTimer) {
      let open = false;
      mouthTimer = setInterval(() => {
        open = !open;
        m.setAttribute('d', open ? 'M123,76 Q132,98 140,80' : 'M126,76 Q132,85 138,80');
      }, 220);
    }
  } else {
    clearInterval(mouthTimer); mouthTimer = null;
    if (e === 'happy') m.setAttribute('d', 'M124,74 Q132,88 140,78');
    else if (e === 'thinking') m.setAttribute('d', 'M127,77 Q132,84 137,79');
    else m.setAttribute('d', 'M126,76 Q132,85 138,80');
  }
}

export function cleanup() { clearInterval(mouthTimer); mouthTimer = null; }
