# Notes for Mozilla Reviewer (AMO Submission)

**Add-on Name:** Gemini Screen Translator  
**Add-on ID:** `gemini-screen-translator@firefox.local`  
**Manifest Version:** 3  
**Target Platform:** Firefox Desktop (Gecko strict_min_version: 109.0)  

---

## 1. Summary & How the Add-on Works

**Gemini Screen Translator** allows users to select any region of a webpage on Firefox Desktop, capture an image snippet of that visual area, and obtain an instant AI-powered translation overlaid directly on top of the page.

### User Flow:
1. **Activation:** The user triggers either `Alt+Shift+T` (free rectangle selection), `Alt+Shift+Q` (repeat translation on the last memorized coordinates), or clicks the extension toolbar action icon.
2. **Screen Snippet Capture:** `browser.tabs.captureVisibleTab` is called to capture the active tab's visible viewport.
3. **Local Cropping:** The user drags the mouse to select a rectangular area. When the mouse is released, the canvas crops the selected coordinates into an optimized in-memory image.
4. **Direct API Call:** The cropped base64 image snippet is transmitted via `fetch` directly from `background.js` to the official Google Gemini REST endpoint (`https://generativelanguage.googleapis.com/v1beta/models/...`) with `gemini-3.5-flash-lite`.
5. **Overlay Result:** The resulting translated text is sent back to `content.js` and rendered in a matte-black, strictly square, minimalist floating window with persistent positioning.

---

## 2. API Key Requirement & Testing Instructions

The extension requires a Google Gemini API key to query the translation model (`gemini-3.5-flash-lite` or `gemini-3.8-flash`).

### How to Test during Review:
1. Open the extension Options page (`options.html` or through `about:debugging` -> This Firefox -> Gemini Screen Translator -> Options).
2. Enter any valid Google AI Studio API key in the field. (A free personal API key can be obtained in 10 seconds with any Google account at https://aistudio.google.com/app/apikey).
3. Click **"Testar Conexão"** (*Test Connection*) to verify API connectivity.
4. Open any webpage with foreign text (e.g., Japanese, English, French).
5. Press `Alt+Shift+T`, drag a rectangle over the foreign text, and release.
6. The minimalist floating window appears displaying the translated text.
7. Inspect the **"Logs de Auditoria"** (*Audit Logs*) section at the bottom of `options.html` to inspect real-time logs of outgoing requests (timestamps, model used, HTTP status code, and crop dimensions).

---

## 3. Strict Privacy & Zero Data Collection Policy

**This extension DOES NOT collect, store, track, sell, or transmit any user data.**

- **No Analytics / No Telemetry:** There are zero external trackers, no Google Analytics, no Sentry, no Mixpanel, and no remote telemetry scripts.
- **No Remote Code:** 100% of the code executed is contained inside the extension bundle (`background.js`, `content.js`, `options.js`). No scripts are loaded from CDN or remote servers.
- **Local Storage Only:** The user's API Key, preferred target language, selected model, and saved coordinates are stored strictly inside the browser using `browser.storage.local`.
- **Ephemerality:** Screenshots are processed strictly in-memory (canvas) and transmitted solely to Google Gemini's REST API for translation. No screenshots or browsing history are ever saved or transmitted anywhere else.

---

## 4. No Build Tools, No Minification & No Obfuscation

The extension files submitted in the `.zip` archive are **100% human-readable source code**:

- **Written in standard Vanilla JavaScript (ES2022), HTML5, and CSS3.**
- **No bundlers used:** No Webpack, Rollup, Vite, esbuild, or Parcel are involved in building the extension runtime files.
- **No code minification:** All files (`background.js`, `content.js`, `options.js`) contain full indentation, original variable and function names, and developer comments.
- **Safe DOM APIs:** The codebase uses strict DOM manipulation (`textContent`, `createElement`, `setAttribute`, `appendChild`). There are zero occurrences of `innerHTML`, `outerHTML`, `document.write`, or `eval()`.

---

## 5. Security & Permissions Analysis

All permissions declared in `manifest.json` are strictly minimized to what is functionally required:

| Permission | Justification |
| :--- | :--- |
| `activeTab` | Grants temporary access to capture the visible tab (`tabs.captureVisibleTab`) and communicate with the page overlay only when invoked by the user. |
| `storage` | Stores user configuration locally (`browser.storage.local`: API key, language preference, model selection, bubble position). |
| `scripting` | Fallback mechanism to inject `content.js` and `content.css` into tabs opened before the extension was installed/reloaded. |
| `host_permissions: https://generativelanguage.googleapis.com/*` | Required to send POST requests directly to Google Gemini's official REST API endpoint from `background.js` without CORS blocking. |
| `content_scripts: <all_urls>` | Required so the user can select and translate text on any webpage they are reading. |
| `browser_specific_settings.gecko.id` | Set to `gemini-screen-translator@firefox.local` for unique add-on identification on Firefox Desktop. |

---

*Thank you for reviewing Gemini Screen Translator! If any further clarification is required, please reach out via AMO.*
