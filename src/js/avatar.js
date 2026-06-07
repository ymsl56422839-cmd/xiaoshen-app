// 插画系小恐龙 — 森林绿 + 暖橙鳞甲 + 6 种表情
const DINO = {
  // 默认微笑
  default: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="bo" cx="45%" cy="35%" r="55%"><stop offset="0%" stop-color="#81C784"/><stop offset="60%" stop-color="#4CAF50"/><stop offset="100%" stop-color="#388E3C"/></radialGradient>
  <radialGradient id="be" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFECB3"/><stop offset="100%" stop-color="#FFE082"/></radialGradient>
  <radialGradient id="sp" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FF8C42"/><stop offset="100%" stop-color="#E06B2A"/></radialGradient>
  <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/></filter>
</defs>

<!-- Tail -->
<path d="M15,95 Q0,80 5,65 Q10,52 22,58 Q16,68 20,78 Q22,88 28,94" fill="url(#bo)" stroke="#388E3C" stroke-width="2"/>
<!-- Back spikes -->
<polygon points="55,50 62,28 72,48" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>
<polygon points="78,44 86,20 98,42" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>
<polygon points="102,40 110,18 120,38" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>

<!-- Body -->
<ellipse cx="85" cy="88" rx="48" ry="38" fill="url(#bo)" filter="url(#sh)"/>
<ellipse cx="88" cy="96" rx="30" ry="22" fill="url(#be)"/>

<!-- Left leg -->
<ellipse cx="62" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="60" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<!-- Right leg -->
<ellipse cx="102" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="104" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<!-- Left arm -->
<ellipse cx="52" cy="92" rx="7" ry="11" fill="#388E3C" transform="rotate(25,52,92)"/>
<!-- Right arm -->
<ellipse cx="120" cy="88" rx="7" ry="11" fill="#388E3C" transform="rotate(-15,120,88)"/>

<!-- Head -->
<ellipse cx="125" cy="65" rx="25" ry="24" fill="url(#bo)" filter="url(#sh)"/>
<!-- Snout -->
<ellipse cx="144" cy="74" rx="14" ry="10" fill="url(#be)" stroke="#E0C070" stroke-width="1"/>
<!-- Nostrils -->
<circle cx="140" cy="72" r="2.5" fill="#8D6E63"/>
<circle cx="148" cy="72" r="2.5" fill="#8D6E63"/>

<!-- Eyes (big cute) -->
<ellipse cx="118" cy="60" rx="10" ry="11" fill="white" stroke="#333" stroke-width="1.5"/>
<circle cx="120" cy="59" r="6.5" fill="#333"/>
<circle cx="122" cy="57" r="2.5" fill="white"/>

<ellipse cx="136" cy="60" rx="10" ry="11" fill="white" stroke="#333" stroke-width="1.5"/>
<circle cx="134" cy="59" r="6.5" fill="#333"/>
<circle cx="136" cy="57" r="2.5" fill="white"/>

<!-- Mouth smile -->
<path id="dm" d="M134,84 Q142,96 150,90" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>

<!-- Blush -->
<ellipse cx="112" cy="72" rx="6" ry="4" fill="#FF6B6B" opacity="0.25"/>
<ellipse cx="142" cy="72" rx="6" ry="4" fill="#FF6B6B" opacity="0.25"/>

<!-- Belly spots -->
<circle cx="78" cy="100" r="3" fill="#E0C070" opacity="0.4"/>
<circle cx="92" cy="105" r="2.5" fill="#E0C070" opacity="0.4"/>
<circle cx="85" cy="95" r="2" fill="#E0C070" opacity="0.3"/>
</svg>`,

  // 说话张嘴
  speaking: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="bo" cx="45%" cy="35%" r="55%"><stop offset="0%" stop-color="#81C784"/><stop offset="60%" stop-color="#4CAF50"/><stop offset="100%" stop-color="#388E3C"/></radialGradient>
  <radialGradient id="be" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFECB3"/><stop offset="100%" stop-color="#FFE082"/></radialGradient>
  <radialGradient id="sp" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FF8C42"/><stop offset="100%" stop-color="#E06B2A"/></radialGradient>
  <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/></filter>
</defs>
<path d="M15,95 Q0,80 5,65 Q10,52 22,58 Q16,68 20,78 Q22,88 28,94" fill="url(#bo)" stroke="#388E3C" stroke-width="2"/>
<polygon points="55,50 62,28 72,48" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/><polygon points="78,44 86,20 98,42" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/><polygon points="102,40 110,18 120,38" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>
<ellipse cx="85" cy="88" rx="48" ry="38" fill="url(#bo)" filter="url(#sh)"/><ellipse cx="88" cy="96" rx="30" ry="22" fill="url(#be)"/>
<ellipse cx="62" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="60" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<ellipse cx="102" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="104" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<ellipse cx="52" cy="92" rx="7" ry="11" fill="#388E3C" transform="rotate(25,52,92)"/>
<ellipse cx="120" cy="88" rx="7" ry="11" fill="#388E3C" transform="rotate(-15,120,88)"/>
<ellipse cx="125" cy="65" rx="25" ry="24" fill="url(#bo)" filter="url(#sh)"/>
<ellipse cx="144" cy="74" rx="14" ry="10" fill="url(#be)" stroke="#E0C070" stroke-width="1"/>
<circle cx="140" cy="72" r="2.5" fill="#8D6E63"/><circle cx="148" cy="72" r="2.5" fill="#8D6E63"/>
<ellipse cx="118" cy="60" rx="10" ry="11" fill="white" stroke="#333" stroke-width="1.5"/><circle cx="120" cy="59" r="6.5" fill="#333"/><circle cx="122" cy="57" r="2.5" fill="white"/>
<ellipse cx="136" cy="60" rx="10" ry="11" fill="white" stroke="#333" stroke-width="1.5"/><circle cx="134" cy="59" r="6.5" fill="#333"/><circle cx="136" cy="57" r="2.5" fill="white"/>
<path id="dm" d="M130,84 Q142,108 154,92" fill="#CC4444" stroke="#333" stroke-width="2.5"/>
<ellipse cx="112" cy="72" rx="6" ry="4" fill="#FF6B6B" opacity="0.25"/><ellipse cx="142" cy="72" rx="6" ry="4" fill="#FF6B6B" opacity="0.25"/>
<circle cx="78" cy="100" r="3" fill="#E0C070" opacity="0.4"/><circle cx="92" cy="105" r="2.5" fill="#E0C070" opacity="0.4"/><circle cx="85" cy="95" r="2" fill="#E0C070" opacity="0.3"/>
</svg>`,

  // 开心眯眼
  happy: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="bo" cx="45%" cy="35%" r="55%"><stop offset="0%" stop-color="#81C784"/><stop offset="60%" stop-color="#4CAF50"/><stop offset="100%" stop-color="#388E3C"/></radialGradient>
  <radialGradient id="be" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFECB3"/><stop offset="100%" stop-color="#FFE082"/></radialGradient>
  <radialGradient id="sp" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FF8C42"/><stop offset="100%" stop-color="#E06B2A"/></radialGradient>
  <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/></filter>
</defs>
<path d="M15,95 Q0,80 5,65 Q10,52 22,58 Q16,68 20,78 Q22,88 28,94" fill="url(#bo)" stroke="#388E3C" stroke-width="2"/>
<polygon points="55,50 62,28 72,48" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/><polygon points="78,44 86,20 98,42" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/><polygon points="102,40 110,18 120,38" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>
<ellipse cx="85" cy="88" rx="48" ry="38" fill="url(#bo)" filter="url(#sh)"/><ellipse cx="88" cy="96" rx="30" ry="22" fill="url(#be)"/>
<ellipse cx="62" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="60" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<ellipse cx="102" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="104" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<ellipse cx="52" cy="92" rx="7" ry="11" fill="#388E3C" transform="rotate(25,52,92)"/>
<ellipse cx="120" cy="88" rx="7" ry="11" fill="#388E3C" transform="rotate(-15,120,88)"/>
<ellipse cx="125" cy="65" rx="25" ry="24" fill="url(#bo)" filter="url(#sh)"/>
<ellipse cx="144" cy="74" rx="14" ry="10" fill="url(#be)" stroke="#E0C070" stroke-width="1"/>
<circle cx="140" cy="72" r="2.5" fill="#8D6E63"/><circle cx="148" cy="72" r="2.5" fill="#8D6E63"/>
<path d="M110,61 Q118,50 126,61" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
<path d="M128,61 Q136,50 144,61" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
<path id="dm" d="M130,84 Q142,100 152,88" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
<ellipse cx="112" cy="72" rx="7" ry="5" fill="#FF6B6B" opacity="0.3"/><ellipse cx="142" cy="72" rx="7" ry="5" fill="#FF6B6B" opacity="0.3"/>
<circle cx="78" cy="100" r="3" fill="#E0C070" opacity="0.4"/><circle cx="92" cy="105" r="2.5" fill="#E0C070" opacity="0.4"/>
</svg>`,

  // 思考歪头
  thinking: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="bo" cx="45%" cy="35%" r="55%"><stop offset="0%" stop-color="#81C784"/><stop offset="60%" stop-color="#4CAF50"/><stop offset="100%" stop-color="#388E3C"/></radialGradient>
  <radialGradient id="be" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFECB3"/><stop offset="100%" stop-color="#FFE082"/></radialGradient>
  <radialGradient id="sp" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FF8C42"/><stop offset="100%" stop-color="#E06B2A"/></radialGradient>
  <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/></filter>
</defs>
<g transform="rotate(-8,80,90)">
<path d="M15,95 Q0,80 5,65 Q10,52 22,58 Q16,68 20,78 Q22,88 28,94" fill="url(#bo)" stroke="#388E3C" stroke-width="2"/>
<polygon points="55,50 62,28 72,48" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>
<polygon points="78,44 86,20 98,42" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>
<polygon points="102,40 110,18 120,38" fill="url(#sp)" stroke="#D0551A" stroke-width="1"/>
<ellipse cx="85" cy="88" rx="48" ry="38" fill="url(#bo)" filter="url(#sh)"/><ellipse cx="88" cy="96" rx="30" ry="22" fill="url(#be)"/>
<ellipse cx="62" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="60" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<ellipse cx="102" cy="120" rx="10" ry="12" fill="#388E3C"/><ellipse cx="104" cy="133" rx="12" ry="6" fill="#2E7D32"/>
<ellipse cx="52" cy="92" rx="7" ry="11" fill="#388E3C" transform="rotate(25,52,92)"/>
<ellipse cx="125" cy="65" rx="25" ry="24" fill="url(#bo)" filter="url(#sh)"/>
<ellipse cx="144" cy="74" rx="14" ry="10" fill="url(#be)" stroke="#E0C070" stroke-width="1"/>
<circle cx="140" cy="72" r="2.5" fill="#8D6E63"/><circle cx="148" cy="72" r="2.5" fill="#8D6E63"/>
<ellipse cx="118" cy="60" rx="10" ry="11" fill="white" stroke="#333" stroke-width="1.5"/>
<circle cx="121" cy="57" r="6.5" fill="#333"/><circle cx="123" cy="55" r="2.5" fill="white"/>
<ellipse cx="136" cy="60" rx="10" ry="11" fill="white" stroke="#333" stroke-width="1.5"/>
<circle cx="139" cy="57" r="6.5" fill="#333"/><circle cx="141" cy="55" r="2.5" fill="white"/>
<path id="dm" d="M134,86 Q140,92 146,88" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
<text x="152" y="44" font-size="18">💭</text>
</g>
</svg>`
};

let mouthTimer = null;

export function initAvatar(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="dino-wrap">${DINO.default}</div>`;
}

export function setExpression(e) {
  const el = document.querySelector('.dino-wrap');
  if (!el) return;

  // Remove old mouth timer
  clearInterval(mouthTimer); mouthTimer = null;

  if (e === 'speaking') {
    let open = false;
    mouthTimer = setInterval(() => {
      open = !open;
      el.innerHTML = open ? DINO.speaking : DINO.default;
    }, 300);
  } else if (e === 'happy') {
    el.innerHTML = DINO.happy;
  } else if (e === 'thinking') {
    el.innerHTML = DINO.thinking;
  } else {
    el.innerHTML = DINO.default;
  }
}

export function cleanup() { clearInterval(mouthTimer); mouthTimer = null; }
