# ElevenLabs Voice Studio & REST API Suite 🎙️⚡

A modern, full-stack Text-to-Speech playground and developer suite built using **HTML5**, **CSS3**, modern **JavaScript** (ES6+), and a zero-dependency **Python REST API server**, powered by the **ElevenLabs API**.

![ElevenLabs API](https://img.shields.io/badge/ElevenLabs-API%20v1-6366f1?style=for-the-badge)
![Python 3](https://img.shields.io/badge/Python-3.14-3776ab?style=for-the-badge&logo=python&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🌟 What's Inside

### 1. 🎙️ Voice Studio (Web UI)
- **Expandable Textarea**: Type or paste up to 5,000 characters with real-time character count.
- **Sample Presets**: One-click text presets for *Fantasy Story*, *Tech News*, *Motivation*, and *Dramatic Dialogue*.
- **Model Selector Dropdown**:
  - `eleven_multilingual_v2`: Flagship model, 29 languages, emotional cadence.
  - `eleven_turbo_v2_5`: Fast, natural dialogue.
  - `eleven_flash_v2_5`: Ultra-low (<100ms) latency.
- **Voice Selector Dropdown**: 17 verified voices (Alice, Sarah, George, Laura, Charlie, Liam, etc.) + custom Voice ID option.
- **Real-Time Spectrum Visualizer Canvas**: Web Audio API frequency spectrum analyzer that bounces dynamically to the speech audio.
- **Custom Audio Player**: Time scrubber, speed multiplier (`0.75x` to `2.0x`), volume slider, waveform animations, and **Download MP3** button.
- **Session History**: Instant replay and download for previous generations.

### 2. ⚡ Developer API Console (Live in Studio UI)
- **Live Request Sync**: Real-time HTTP method (`POST`) and endpoint preview reflecting your chosen voice.
- **Multi-Language Code Generators**: Live code snippets in **cURL**, **JavaScript (Fetch)**, **Python (urllib)**, and **Node.js (Native Fetch)** that dynamically update as you type or change sliders, complete with a 1-click **Copy Code** button.
- **Request Body Inspector**: Formatted JSON payload viewer with live parameter synchronization.
- **API Response Inspector**: Real-time response metrics showing Status (`200 OK`), Latency (`ms`), Content-Type, and Payload Size.

### 3. 🚀 Zero-Dependency Python REST API Server (`server.py`)
- Built using the Python 3 standard library (`http.server`, `urllib.request`, `json`) — **no `pip install` required!**
- **Interactive REST Documentation (`/api/docs`)**: Swagger/Stripe-styled documentation page with Try-It-Out forms for testing endpoints directly in the browser.
- **Endpoints**:
  | Method | Endpoint | Description |
  |---|---|---|
  | `POST` | `/api/tts` | Converts text to speech, returns `audio/mpeg` binary stream |
  | `GET` | `/api/voices` | Returns curated catalog of supported voices |
  | `GET` | `/api/models` | Returns available ElevenLabs neural models |
  | `GET` | `/api/health` | Service health status and key readiness |
  | `GET` | `/api/docs` | Interactive API documentation & live testing portal |
  | `GET` | `/` | Serves the Voice Studio web application |

---

## 🏃 How to Run

### Start the REST API & Web Server
In PowerShell, run:

```powershell
python server.py
```

Then visit:
- **Web Voice Studio & API Console**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Documentation**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

*(You can also double-click `index.html` to run client-side without starting the Python server!)*

---

## 📡 REST API Examples

### 1. Synthesize Speech Audio (`POST /api/tts`)

```bash
curl -X POST "http://localhost:8000/api/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world from the ElevenLabs REST API!",
    "voice_id": "Xb7hH8MSUJpSbSDYk0k2",
    "model_id": "eleven_turbo_v2_5"
  }' \
  --output narration.mp3
```

### 2. List Voices (`GET /api/voices`)

```bash
curl "http://localhost:8000/api/voices"
```

### 3. List Models (`GET /api/models`)

```bash
curl "http://localhost:8000/api/models"
```

---

## ⌨️ Keyboard Shortcuts

- **`Ctrl + Enter`** (Windows) / **`Cmd + Enter`** (macOS): Trigger speech generation instantly from anywhere on the page.

---

## 📁 Project Structure

```
Antigravity/
├── server.py        # Zero-dependency Python REST API server & docs
├── index.html       # Web Studio, Spectrum Canvas & Developer API Console
├── styles.css       # Dark-mode styling, glassmorphism, animations & syntax boxes
├── app.js           # ElevenLabs client, Web Audio analyzer, snippet generator
└── README.md        # Comprehensive documentation
```
