# 🦕 小深 — AI 小伙伴 App

## 什么是小深

小深是一只住在手机里的 AI 小恐龙，陪伴 7-10 岁小朋友学习成长。

**后端（不改的）**：
- 对话：DeepSeek V4-Flash
- 识图：智谱 GLM-5V-Turbo
- API Key 已硬编码，无需每次输入

---

## 如何构建（电脑上操作）

```powershell
cd C:\Users\Administrator
git clone https://github.com/ymsl56422839-cmd/xiao-shen.git xiaoshen-app
cd xiaoshen-app

npm install
npx cap add android
npm run build
npx cap sync
npx cap open android

# 在 Android Studio 里：Build → Build APK
```

---

## 如何修改（方便以后调整）

### 改对话风格 → `src/js/prompts.js`

找到对应的模式（如 `science`），修改 `prompt` 字段：

```js
{ id:'science', icon:'🔬', name:'科学探索', color:'#4A90D9', voice:'doctor',
  prompt:`你是一位充满好奇心的小恐龙科学家...`   // ← 改这里
}
```

### 改语音 → `src/js/prompts.js`

修改 VOICES 对象的 pitch 和 rate：

```js
export const VOICES = {
  cheerful:   { pitch:1.20, rate:1.10 },    // 活泼姐姐
  gentle:     { pitch:1.00, rate:0.95 },    // 温柔老师
  doctor:     { pitch:0.85, rate:0.90 },    // 知识博士
  storyteller:{ pitch:1.00, rate:0.82 }     // 故事大王
};
// pitch: 0.5~2.0, 越高声音越尖（像小孩）
// rate: 0.5~2.0, 越高语速越快
```

### 改 API Key → `src/js/api.js`

```js
const DS_KEY = 'sk-你的新key';
const ZP_KEY = '你的新智谱key';
```

### 改恐龙外形 → `src/js/avatar.js`

把 `DINO` 变量里的 SVG 换成新的恐龙图。

### 改主题颜色 → `src/css/style.css`

修改 `:root` 里的 CSS 变量：

```css
:root{
  --or: #FF8C42;     /* 主色调 */
  --bg: #FFF8F0;     /* 背景色 */
  --txt: #4A3728;    /* 文字色 */
}
```

### 新增学习模式

在 `src/js/prompts.js` 的 MODES 数组里加一项：

```js
{ id:'music', icon:'🎵', name:'音乐启蒙', color:'#FF9800', voice:'cheerful',
  prompt:`你是一位音乐老师小恐龙。教小朋友认识音符...`
}
```

### 添加自定义模式入口

在 `src/js/app.js` 的 `showHome()` 中，home-btns 区域加按钮即可。

---

## 技术要点

| 组件 | 技术 |
|------|------|
| 框架 | Capacitor 7 + Android WebView |
| 打包 | Vite 6 |
| TTS | 原生 Android TTS → Web Speech API → Google TTS URL（三层兜底） |
| STT | Capacitor 原生语音识别，打字为主 |
| 摄像头 | WebRTC getUserMedia |
| API | DeepSeek + 智谱，全部国内直连 |
| UI | 纯 HTML/CSS/JS，无外部 UI 框架 |

---

## 文件结构

```
src/
├── index.html          ← 入口
├── style.css           ← 全部样式（暖橙系儿童主题）
└── js/
    ├── api.js          ← DeepSeek + 智谱 API（Key 硬编码）
    ├── prompts.js      ← 6 种学习模式 + 4 种语音人格
    ├── voice.js        ← TTS 三层兜底 + STT
    ├── camera.js       ← 摄像头 + 抓帧
    ├── avatar.js       ← 🦕 恐龙 SVG 动画
    ├── storage.js      ← 当前模式持久化
    └── app.js          ← 主界面（首页 + 对话 + 摄像头）
```
