"""
ElevenLabs Voice Studio — Stylish REST API Server
A zero-dependency Python 3 backend providing clean REST API endpoints,
audio streaming proxy, and an interactive developer documentation page.
"""

import http.server
import json
import os
import sys
import urllib.request
import urllib.error
from urllib.parse import urlparse, parse_qs
import mimetypes

PORT = 8000
DEFAULT_API_KEY = "sk_aa3b6221e06f3c5d38240d20aaf449d3144c9213b493bf0b"

VOICES = [
    {"id": "Xb7hH8MSUJpSbSDYk0k2", "name": "Alice", "gender": "Female", "accent": "British", "description": "Confident & Clear"},
    {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah", "gender": "Female", "accent": "American", "description": "Soft & Articulate"},
    {"id": "FGY2WhTYpPnrIDTdsKH5", "name": "Laura", "gender": "Female", "accent": "American", "description": "Upbeat & Conversational"},
    {"id": "XB0fDUnXU5powFXDhCwa", "name": "Charlotte", "gender": "Female", "accent": "English", "description": "Expressive & Engaging"},
    {"id": "cgSgspJ2msm6clMCkdW9", "name": "Jessica", "gender": "Female", "accent": "American", "description": "Youthful & Bright"},
    {"id": "pFZP5JQG7iQjIQuC4Bku", "name": "Lily", "gender": "Female", "accent": "British", "description": "Warm Narration"},
    {"id": "JBFqnCBsd6RMkjVDRZzb", "name": "George", "gender": "Male", "accent": "British", "description": "Warm & Raspy"},
    {"id": "CwhRBWXzGAHq8TQ4Fs17", "name": "Roger", "gender": "Male", "accent": "American", "description": "Casual & Friendly"},
    {"id": "IKne3meq5aSn9X8ydAVf", "name": "Charlie", "gender": "Male", "accent": "Australian", "description": "Casual & Natural"},
    {"id": "TX3LPaxmHKxFdv7VOQHJ", "name": "Liam", "gender": "Male", "accent": "American", "description": "Energetic & Direct"},
    {"id": "bIHbv24MWmeRgasZH58o", "name": "Will", "gender": "Male", "accent": "American", "description": "Relaxed & Calm"},
    {"id": "cjVigY5qzO86Huf0OWal", "name": "Eric", "gender": "Male", "accent": "American", "description": "Smooth & Professional"},
    {"id": "iP95p4xoKVk53GoZ742B", "name": "Chris", "gender": "Male", "accent": "American", "description": "Down to Earth"},
    {"id": "nPczCjzI2devNBz1zQrb", "name": "Brian", "gender": "Male", "accent": "American", "description": "Deep & Resonant"},
    {"id": "onwK4e9ZLuTAKqWW03F9", "name": "Daniel", "gender": "Male", "accent": "British", "description": "Authoritative & Formal"},
    {"id": "pqHfZKP75CvOlQylNhV4", "name": "Bill", "gender": "Male", "accent": "American", "description": "Trustworthy & Warm"},
    {"id": "SAz9YHcvj6GT2YYXdXww", "name": "River", "gender": "Neutral", "accent": "American", "description": "Calm & Modern"}
]

MODELS = [
    {
        "id": "eleven_multilingual_v2",
        "name": "Eleven Multilingual v2",
        "description": "State-of-the-art multilingual model with rich emotional cadence, supporting 29 languages.",
        "recommended": True,
        "latency": "Standard (~300ms)"
    },
    {
        "id": "eleven_turbo_v2_5",
        "name": "Eleven Turbo v2.5",
        "description": "High-quality model optimized for speed and expressive dialogue.",
        "recommended": False,
        "latency": "Low (~150ms)"
    },
    {
        "id": "eleven_flash_v2_5",
        "name": "Eleven Flash v2.5",
        "description": "Ultra-low latency model designed for real-time conversational applications.",
        "recommended": False,
        "latency": "Ultra-Low (<100ms)"
    }
]

DOCS_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ElevenLabs Voice Studio — REST API Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #121826;
      --border: rgba(255, 255, 255, 0.08);
      --accent: #6366f1;
      --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
      --text: #f8fafc;
      --muted: #94a3b8;
      --code-bg: #0b0f19;
      --post-color: #10b981;
      --get-color: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1.5rem 4rem;
    }
    .container { max-width: 960px; margin: 0 auto; }
    header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .title-group h1 {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-group h1 span {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
    }
    .back-link {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: #fff; }
    .endpoint-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .endpoint-card:hover { border-color: rgba(255, 255, 255, 0.18); }
    .endpoint-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--border);
    }
    .method-pill {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .method-post { background: rgba(16, 185, 129, 0.15); color: var(--post-color); border: 1px solid rgba(16, 185, 129, 0.3); }
    .method-get { background: rgba(59, 130, 246, 0.15); color: var(--get-color); border: 1px solid rgba(59, 130, 246, 0.3); }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.05rem;
      font-weight: 600;
      color: #fff;
    }
    .endpoint-desc {
      margin-left: auto;
      font-size: 0.875rem;
      color: var(--muted);
    }
    .endpoint-body { padding: 1.5rem; }
    h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: #cbd5e1; }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #e2e8f0;
      overflow-x: auto;
      margin-bottom: 1.25rem;
    }
    .try-form {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
    }
    .try-form input, .try-form textarea, .try-form select {
      width: 100%;
      background: var(--code-bg);
      border: 1px solid var(--border);
      color: #fff;
      padding: 0.6rem 0.8rem;
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }
    .try-btn {
      background: var(--accent-gradient);
      color: #fff;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .try-btn:hover { opacity: 0.9; }
    .response-area {
      margin-top: 1rem;
      display: none;
    }
    audio { width: 100%; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-group">
        <a href="/" class="back-link">← Return to Voice Studio UI</a>
        <h1>ElevenLabs <span>REST API Suite</span></h1>
        <p style="color: var(--muted); font-size: 0.9rem;">Modern API endpoints for programmatic text-to-speech generation</p>
      </div>
      <div class="badge">v1.0.0 • Local Server</div>
    </header>

    <!-- POST /api/tts -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <span class="method-pill method-post">POST</span>
        <span class="endpoint-path">/api/tts</span>
        <span class="endpoint-desc">Synthesize speech audio from text</span>
      </div>
      <div class="endpoint-body">
        <h3>Request Headers</h3>
        <pre>Content-Type: application/json
xi-api-key: (optional, defaults to server-configured key)</pre>

        <h3>Request Body Schema (JSON)</h3>
        <pre>{
  "text": "Hello world from the ElevenLabs API!",
  "voice_id": "Xb7hH8MSUJpSbSDYk0k2",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "use_speaker_boost": true
  }
}</pre>

        <h3>Response</h3>
        <pre>HTTP 200 OK
Content-Type: audio/mpeg
[Binary Audio Stream MP3]</pre>

        <div class="try-form">
          <h3>Try It Out</h3>
          <input type="text" id="tryText" value="The ElevenLabs API delivers incredible voice synthesis." placeholder="Text to speak">
          <button class="try-btn" onclick="testTts()">Execute Request</button>
          <div class="response-area" id="ttsResult">
            <h3>Response Audio:</h3>
            <audio id="ttsAudio" controls></audio>
          </div>
        </div>
      </div>
    </div>

    <!-- GET /api/voices -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <span class="method-pill method-get">GET</span>
        <span class="endpoint-path">/api/voices</span>
        <span class="endpoint-desc">List all available voice profiles</span>
      </div>
      <div class="endpoint-body">
        <h3>Response Schema (JSON)</h3>
        <pre>{
  "voices": [
    {
      "id": "Xb7hH8MSUJpSbSDYk0k2",
      "name": "Alice",
      "gender": "Female",
      "accent": "British",
      "description": "Confident & Clear"
    },
    ...
  ]
}</pre>
        <button class="try-btn" onclick="testVoices()">Execute Request</button>
        <div class="response-area" id="voicesResult">
          <pre><code id="voicesCode"></code></pre>
        </div>
      </div>
    </div>

    <!-- GET /api/models -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <span class="method-pill method-get">GET</span>
        <span class="endpoint-path">/api/models</span>
        <span class="endpoint-desc">List all supported neural models</span>
      </div>
      <div class="endpoint-body">
        <h3>Response Schema (JSON)</h3>
        <pre>{
  "models": [
    {
      "id": "eleven_multilingual_v2",
      "name": "Eleven Multilingual v2",
      "latency": "Standard (~300ms)"
    },
    ...
  ]
}</pre>
        <button class="try-btn" onclick="testModels()">Execute Request</button>
        <div class="response-area" id="modelsResult">
          <pre><code id="modelsCode"></code></pre>
        </div>
      </div>
    </div>

    <!-- GET /api/health -->
    <div class="endpoint-card">
      <div class="endpoint-header">
        <span class="method-pill method-get">GET</span>
        <span class="endpoint-path">/api/health</span>
        <span class="endpoint-desc">Health check and key verification</span>
      </div>
      <div class="endpoint-body">
        <button class="try-btn" onclick="testHealth()">Execute Request</button>
        <div class="response-area" id="healthResult">
          <pre><code id="healthCode"></code></pre>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function testTts() {
      const text = document.getElementById('tryText').value;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
          model_id: 'eleven_turbo_v2_5'
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = document.getElementById('ttsAudio');
        audio.src = url;
        document.getElementById('ttsResult').style.display = 'block';
        audio.play();
      } else {
        alert('Error: ' + await res.text());
      }
    }
    async function testVoices() {
      const res = await fetch('/api/voices');
      const data = await res.json();
      document.getElementById('voicesCode').textContent = JSON.stringify(data, null, 2);
      document.getElementById('voicesResult').style.display = 'block';
    }
    async function testModels() {
      const res = await fetch('/api/models');
      const data = await res.json();
      document.getElementById('modelsCode').textContent = JSON.stringify(data, null, 2);
      document.getElementById('modelsResult').style.display = 'block';
    }
    async function testHealth() {
      const res = await fetch('/api/health');
      const data = await res.json();
      document.getElementById('healthCode').textContent = JSON.stringify(data, null, 2);
      document.getElementById('healthResult').style.display = 'block';
    }
  </script>
</body>
</html>
"""

class ElevenLabsAPIHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for all API endpoints
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, xi-api-key, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/docs":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(DOCS_HTML.encode("utf-8"))
            return

        if path == "/api/voices":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "count": len(VOICES), "voices": VOICES}, indent=2).encode("utf-8"))
            return

        if path == "/api/models":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "models": MODELS}, indent=2).encode("utf-8"))
            return

        if path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "ElevenLabs Voice Studio API",
                "version": "1.0.0",
                "api_key_configured": bool(DEFAULT_API_KEY)
            }, indent=2).encode("utf-8"))
            return

        # Fallback to serving static files (index.html, styles.css, app.js)
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/tts":
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)

            try:
                data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            except Exception as e:
                self.send_error_json(400, "Invalid JSON payload in request body")
                return

            text = data.get("text", "").strip()
            if not text:
                self.send_error_json(400, "Field 'text' is required and cannot be empty")
                return

            voice_id = data.get("voice_id", "Xb7hH8MSUJpSbSDYk0k2") # Default: Alice
            model_id = data.get("model_id", "eleven_multilingual_v2")
            voice_settings = data.get("voice_settings", {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "use_speaker_boost": True
            })

            # Check for key passed in header or fallback to server default
            api_key = self.headers.get("xi-api-key") or DEFAULT_API_KEY

            eleven_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            req_data = json.dumps({
                "text": text,
                "model_id": model_id,
                "voice_settings": voice_settings
            }).encode("utf-8")

            req = urllib.request.Request(eleven_url, data=req_data, headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            })

            try:
                with urllib.request.urlopen(req) as resp:
                    audio_content = resp.read()
                    self.send_response(200)
                    self.send_header("Content-Type", "audio/mpeg")
                    self.send_header("Content-Length", str(len(audio_content)))
                    self.send_header("X-Voice-ID", voice_id)
                    self.send_header("X-Model-ID", model_id)
                    self.end_headers()
                    self.wfile.write(audio_content)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8")
                self.send_error_json(e.code, f"ElevenLabs API Error: {error_body}")
            except Exception as e:
                self.send_error_json(500, f"Server internal error: {str(e)}")
            return

        self.send_error_json(404, "Endpoint not found")

    def send_error_json(self, status_code, message):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "error": True,
            "status": status_code,
            "message": message
        }).encode("utf-8"))

def run():
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = http.server.HTTPServer(("", PORT), ElevenLabsAPIHandler)
    print("=" * 60)
    print("  [+] ElevenLabs Voice Studio API Server running!")
    print(f"  * Web Studio UI:      http://localhost:{PORT}")
    print(f"  * Interactive Docs:   http://localhost:{PORT}/api/docs")
    print(f"  * REST TTS Endpoint:  http://localhost:{PORT}/api/tts")
    print(f"  * Voices Endpoint:    http://localhost:{PORT}/api/voices")
    print(f"  * Models Endpoint:    http://localhost:{PORT}/api/models")
    print(f"  * Health Endpoint:    http://localhost:{PORT}/api/health")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()

if __name__ == "__main__":
    run()
