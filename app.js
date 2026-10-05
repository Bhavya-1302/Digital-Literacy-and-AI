/**
 * ElevenLabs Voice Studio & API Playground - Application Logic
 * Integrates ElevenLabs Text-to-Speech API, Web Audio API Spectrum Visualizer,
 * Dynamic Code Snippet Generators (cURL, JS, Python, Node.js), and UI Controls
 */

(() => {
  'use strict';

  // --- Configuration & Constants ---
  const DEFAULT_API_KEY = 'sk_aa3b6221e06f3c5d38240d20aaf449d3144c9213b493bf0b';
  const STORAGE_KEY = 'elevenlabs_api_key';

  const MODEL_DESCRIPTIONS = {
    'eleven_multilingual_v2': 'State-of-the-art multilingual model with rich emotional nuance, natural cadence, and support for 29 languages.',
    'eleven_turbo_v2_5': 'Optimized for high-speed generation with natural expressiveness and low latency.',
    'eleven_flash_v2_5': 'Ultra-fast sub-100ms model, perfect for conversational responsiveness and instant narration.'
  };

  const PRESETS = {
    story: "The ancient library stood perched on the edge of the forgotten cliff. Its shelves, carved from pale stone, held thousands of luminescent scrolls whose whispers could only be heard under the silver light of a crescent moon.",
    tech: "Researchers have unveiled a major breakthrough in agentic AI. The new neural architecture enables autonomous systems to synthesize complex software solutions with unprecedented reliability and reasoning capabilities.",
    quote: "The master has failed more times than the beginner has even tried. True mastery is not the absence of errors, but the relentless refinement that transforms mistakes into wisdom.",
    dialogue: "Look closely at the data. If we trigger the sequence before calibrating the harmonic dampeners, the feedback loop will overload the core within seconds! We need to act now."
  };

  // --- DOM Elements ---
  const elements = {
    // Navigation Tabs
    tabStudio: document.getElementById('tabStudio'),
    tabConsole: document.getElementById('tabConsole'),
    studioView: document.getElementById('studioView'),
    consoleView: document.getElementById('consoleView'),

    // API Key
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
    eyeIcon: document.getElementById('eyeIcon'),
    saveKeyBtn: document.getElementById('saveKeyBtn'),
    clearKeyBtn: document.getElementById('clearKeyBtn'),
    keyBadge: document.getElementById('keyBadge'),
    statusPill: document.getElementById('statusPill'),
    statusLabel: document.getElementById('statusLabel'),

    // Input & Presets
    textInput: document.getElementById('textInput'),
    clearTextBtn: document.getElementById('clearTextBtn'),
    charCount: document.getElementById('charCount'),
    presetButtons: document.querySelectorAll('.preset-pill'),

    // Controls
    modelSelect: document.getElementById('modelSelect'),
    modelDescription: document.getElementById('modelDescription'),
    voiceSelect: document.getElementById('voiceSelect'),
    customVoiceContainer: document.getElementById('customVoiceContainer'),
    customVoiceId: document.getElementById('customVoiceId'),

    // Advanced Settings
    advancedToggle: document.getElementById('advancedToggle'),
    advancedChevron: document.getElementById('advancedChevron'),
    advancedContent: document.getElementById('advancedContent'),
    stabilityRange: document.getElementById('stabilityRange'),
    stabilityVal: document.getElementById('stabilityVal'),
    similarityRange: document.getElementById('similarityRange'),
    similarityVal: document.getElementById('similarityVal'),
    speakerBoostCheck: document.getElementById('speakerBoostCheck'),

    // Action Button
    playBtn: document.getElementById('playBtn'),
    playBtnText: document.getElementById('playBtnText'),
    playBtnIcon: document.getElementById('playBtnIcon'),
    playSpinner: document.getElementById('playSpinner'),

    // Audio Player & Spectrum Canvas
    playerCard: document.getElementById('playerCard'),
    audioElement: document.getElementById('audioElement'),
    spectrumCanvas: document.getElementById('spectrumCanvas'),
    audioWaves: document.getElementById('audioWaves'),
    currentVoiceName: document.getElementById('currentVoiceName'),
    currentAudioMeta: document.getElementById('currentAudioMeta'),
    audioPlayToggle: document.getElementById('audioPlayToggle'),
    audioToggleIcon: document.getElementById('audioToggleIcon'),
    currentTime: document.getElementById('currentTime'),
    durationTime: document.getElementById('durationTime'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    speedBtn: document.getElementById('speedBtn'),
    volumeBtn: document.getElementById('volumeBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    volumeIcon: document.getElementById('volumeIcon'),
    downloadLink: document.getElementById('downloadLink'),

    // History
    historyList: document.getElementById('historyList'),
    emptyHistory: document.getElementById('emptyHistory'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    // API Console Elements
    apiEndpointVoiceId: document.getElementById('apiEndpointVoiceId'),
    consoleExecuteBtn: document.getElementById('consoleExecuteBtn'),
    snippetTabs: document.querySelectorAll('.snippet-tab'),
    snippetCodeDisplay: document.getElementById('snippetCodeDisplay'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    copyBtnText: document.getElementById('copyBtnText'),
    requestJsonDisplay: document.getElementById('requestJsonDisplay'),
    responseStatusPill: document.getElementById('responseStatusPill'),
    metricStatus: document.getElementById('metricStatus'),
    metricLatency: document.getElementById('metricLatency'),
    metricSize: document.getElementById('metricSize'),

    // Toasts
    toastContainer: document.getElementById('toastContainer')
  };

  // --- App State ---
  const state = {
    apiKey: '',
    isGenerating: false,
    currentBlobUrl: null,
    playbackSpeeds: [1.0, 1.25, 1.5, 2.0, 0.75],
    speedIndex: 0,
    previousVolume: 1,
    activeSnippetLang: 'curl',
    history: [],
    // Web Audio API
    audioContext: null,
    analyserNode: null,
    audioSourceNode: null,
    visualizerActive: false
  };

  // --- Initialization ---
  function init() {
    loadApiKey();
    setupEventListeners();
    updateCharCount();
    updateModelDescription();
    syncApiConsole();
    initIdleSpectrum();
  }

  // --- Mode Navigation ---
  function switchMode(mode) {
    if (mode === 'studio') {
      elements.tabStudio.classList.add('active');
      elements.tabConsole.classList.remove('active');
      elements.studioView.classList.remove('hidden');
      elements.consoleView.classList.add('hidden');
    } else {
      elements.tabConsole.classList.add('active');
      elements.tabStudio.classList.remove('active');
      elements.consoleView.classList.remove('hidden');
      elements.studioView.classList.add('hidden');
      syncApiConsole();
    }
  }

  // --- API Key Management ---
  function loadApiKey() {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      state.apiKey = savedKey;
      elements.apiKeyInput.value = savedKey;
      elements.keyBadge.textContent = 'Saved in Browser';
    } else {
      state.apiKey = DEFAULT_API_KEY;
      elements.apiKeyInput.value = DEFAULT_API_KEY;
      localStorage.setItem(STORAGE_KEY, DEFAULT_API_KEY);
      elements.keyBadge.textContent = 'Default Key Active';
    }
  }

  function saveApiKey() {
    const key = elements.apiKeyInput.value.trim();
    if (!key) {
      showToast('Please enter a valid API key', 'warning');
      return;
    }
    state.apiKey = key;
    localStorage.setItem(STORAGE_KEY, key);
    elements.keyBadge.textContent = 'Saved in Browser';
    syncApiConsole();
    showToast('ElevenLabs API Key saved successfully', 'success');
  }

  function clearApiKey() {
    state.apiKey = '';
    elements.apiKeyInput.value = '';
    localStorage.removeItem(STORAGE_KEY);
    elements.keyBadge.textContent = 'No Key Saved';
    syncApiConsole();
    showToast('API key cleared from browser storage', 'warning');
  }

  function toggleApiKeyVisibility() {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.eyeIcon.innerHTML = isPassword
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
         <line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }

  // --- Voice & Payload Helpers ---
  function getSelectedVoice() {
    const voiceVal = elements.voiceSelect.value;
    if (voiceVal === 'custom') {
      const customId = elements.customVoiceId.value.trim() || 'Xb7hH8MSUJpSbSDYk0k2';
      return {
        id: customId,
        name: customId ? `Custom Voice (${customId.substring(0, 8)}...)` : 'Custom Voice'
      };
    }
    const selectedOption = elements.voiceSelect.options[elements.voiceSelect.selectedIndex];
    return {
      id: voiceVal,
      name: selectedOption.textContent.split('—')[0].trim()
    };
  }

  function getCurrentPayload() {
    const text = elements.textInput.value.trim() || 'Hello world from the ElevenLabs API!';
    const voice = getSelectedVoice();
    const modelId = elements.modelSelect.value;
    const stability = parseFloat(elements.stabilityRange.value);
    const similarity = parseFloat(elements.similarityRange.value);
    const useSpeakerBoost = elements.speakerBoostCheck.checked;

    return {
      voiceId: voice.id,
      voiceName: voice.name,
      modelId: modelId,
      body: {
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: stability,
          similarity_boost: similarity,
          use_speaker_boost: useSpeakerBoost
        }
      }
    };
  }

  // --- Developer API Console & Code Generator ---
  function syncApiConsole() {
    const { voiceId, body } = getCurrentPayload();
    const apiKey = elements.apiKeyInput.value.trim() || state.apiKey || 'YOUR_API_KEY';
    const jsonStr = JSON.stringify(body, null, 2);

    // Update endpoint display
    elements.apiEndpointVoiceId.textContent = voiceId;

    // Update Request JSON viewer
    elements.requestJsonDisplay.textContent = jsonStr;

    // Update Code snippet based on active tab
    renderCodeSnippet(state.activeSnippetLang, voiceId, body, apiKey);
  }

  function renderCodeSnippet(lang, voiceId, body, apiKey) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const safeText = body.text.replace(/"/g, '\\"').replace(/\n/g, ' ');

    let code = '';
    if (lang === 'curl') {
      code = `curl -X POST "${url}" \\
  -H "xi-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: audio/mpeg" \\
  -d '{
    "text": "${safeText}",
    "model_id": "${body.model_id}",
    "voice_settings": {
      "stability": ${body.voice_settings.stability},
      "similarity_boost": ${body.voice_settings.similarity_boost},
      "use_speaker_boost": ${body.voice_settings.use_speaker_boost}
    }
  }' \\
  --output narration.mp3`;
    } else if (lang === 'js') {
      code = `// Modern JavaScript (Fetch API)
const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "xi-api-key": "${apiKey}",
    "Content-Type": "application/json",
    "Accept": "audio/mpeg"
  },
  body: JSON.stringify({
    text: "${safeText}",
    model_id: "${body.model_id}",
    voice_settings: {
      stability: ${body.voice_settings.stability},
      similarity_boost: ${body.voice_settings.similarity_boost},
      use_speaker_boost: ${body.voice_settings.use_speaker_boost}
    }
  })
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);
new Audio(audioUrl).play();`;
    } else if (lang === 'python') {
      code = `# Python 3 (urllib - Zero Dependencies)
import urllib.request
import json

url = "${url}"
headers = {
    "xi-api-key": "${apiKey}",
    "Content-Type": "application/json",
    "Accept": "audio/mpeg"
}

payload = {
    "text": "${safeText}",
    "model_id": "${body.model_id}",
    "voice_settings": {
        "stability": ${body.voice_settings.stability},
        "similarity_boost": ${body.voice_settings.similarity_boost},
        "use_speaker_boost": ${body.voice_settings.use_speaker_boost ? 'True' : 'False'}
    }
}

req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
with urllib.request.urlopen(req) as resp:
    with open("narration.mp3", "wb") as f:
        f.write(resp.read())
print("Audio saved as narration.mp3!")`;
    } else if (lang === 'node') {
      code = `// Node.js (v18+ Native Fetch)
import fs from "node:fs/promises";

const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "xi-api-key": "${apiKey}",
    "Content-Type": "application/json",
    "Accept": "audio/mpeg"
  },
  body: JSON.stringify({
    text: "${safeText}",
    model_id: "${body.model_id}",
    voice_settings: {
      stability: ${body.voice_settings.stability},
      similarity_boost: ${body.voice_settings.similarity_boost},
      use_speaker_boost: ${body.voice_settings.use_speaker_boost}
    }
  })
});

const arrayBuffer = await response.arrayBuffer();
await fs.writeFile("narration.mp3", Buffer.from(arrayBuffer));
console.log("Saved narration.mp3!");`;
    }

    elements.snippetCodeDisplay.textContent = code;
  }

  function copyCodeSnippet() {
    const text = elements.snippetCodeDisplay.textContent;
    navigator.clipboard.writeText(text).then(() => {
      elements.copyCodeBtn.classList.add('copied');
      elements.copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        elements.copyCodeBtn.classList.remove('copied');
        elements.copyBtnText.textContent = 'Copy Code';
      }, 2000);
      showToast('Code snippet copied to clipboard', 'info');
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });
  }

  // --- Real-Time Web Audio API Spectrum Visualizer ---
  function setupAudioContext() {
    if (state.audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioCtx();
      state.analyserNode = state.audioContext.createAnalyser();
      state.analyserNode.fftSize = 64; // Produces 32 frequency bins
      state.analyserNode.smoothingTimeConstant = 0.8;

      state.audioSourceNode = state.audioContext.createMediaElementSource(elements.audioElement);
      state.audioSourceNode.connect(state.analyserNode);
      state.analyserNode.connect(state.audioContext.destination);

      startVisualizerLoop();
    } catch (e) {
      console.warn('Web Audio API setup notice:', e);
    }
  }

  function startVisualizerLoop() {
    const canvas = elements.spectrumCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = state.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Subtle background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!elements.audioElement.paused && elements.audioElement.currentTime > 0) {
        state.analyserNode.getByteFrequencyData(dataArray);

        const barCount = 32;
        const barWidth = (width / barCount) - 3;

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i] || 0;
          const barHeight = Math.max(4, (val / 255) * (height - 8));
          const x = i * (barWidth + 3) + 2;
          const y = height - barHeight;

          // Gradient for spectrum bar
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(0.5, '#a855f7');
          gradient.addColorStop(1, '#ec4899');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Glowing peak cap
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(x, y - 2, barWidth, 2);
        }
      } else {
        // Idle gentle waveform animation
        const time = performance.now() * 0.002;
        const barCount = 32;
        const barWidth = (width / barCount) - 3;

        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(time + i * 0.25) * 0.5 + 0.5;
          const barHeight = 6 + wave * 12;
          const x = i * (barWidth + 3) + 2;
          const y = height - barHeight;

          ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      }
    }

    draw();
  }

  function initIdleSpectrum() {
    const canvas = elements.spectrumCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // --- TTS Generation Engine ---
  async function generateSpeech() {
    if (state.isGenerating) return;

    const apiKey = elements.apiKeyInput.value.trim() || state.apiKey;
    if (!apiKey) {
      showToast('Please enter your ElevenLabs API Key first', 'error');
      elements.apiKeyInput.focus();
      return;
    }

    const { voiceId, voiceName, modelId, body } = getCurrentPayload();
    if (!elements.textInput.value.trim()) {
      showToast('Please paste or enter some text to narrate', 'warning');
      elements.textInput.focus();
      return;
    }

    // Set UI to generating state
    state.isGenerating = true;
    elements.playBtn.disabled = true;
    elements.playBtnText.textContent = 'Synthesizing Audio...';
    elements.playBtnIcon.classList.add('hidden');
    elements.playSpinner.classList.remove('hidden');
    setStatus('generating', 'Generating speech...');

    // Update Console Response status
    elements.responseStatusPill.className = 'status-pill-mini loading';
    elements.responseStatusPill.textContent = 'Loading...';
    elements.metricStatus.textContent = 'Processing...';

    const startTime = performance.now();

    try {
      // Direct call to ElevenLabs API endpoint
      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(body)
      });

      const durationMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        let errorDetail = 'API request failed';
        try {
          const errJson = await response.json();
          if (errJson.detail && errJson.detail.message) {
            errorDetail = errJson.detail.message;
          } else if (typeof errJson.detail === 'string') {
            errorDetail = errJson.detail;
          }
        } catch (_) {
          errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        }

        elements.responseStatusPill.className = 'status-pill-mini error';
        elements.responseStatusPill.textContent = `HTTP ${response.status}`;
        elements.metricStatus.textContent = `Error ${response.status}`;
        elements.metricLatency.textContent = `${durationMs} ms`;

        if (response.status === 401) {
          throw new Error(`Authentication Error: ${errorDetail}`);
        } else if (response.status === 402) {
          throw new Error(`Plan restriction: ${errorDetail}. Try selecting a standard premade voice like Alice or George.`);
        } else if (response.status === 429) {
          throw new Error(`Quota limit reached: ${errorDetail}`);
        } else {
          throw new Error(errorDetail);
        }
      }

      const audioBlob = await response.blob();
      const sizeKb = (audioBlob.size / 1024).toFixed(1);

      // Update API Console metrics
      elements.responseStatusPill.className = 'status-pill-mini ready';
      elements.responseStatusPill.textContent = '200 OK';
      elements.metricStatus.textContent = '200 OK';
      elements.metricLatency.textContent = `${durationMs} ms`;
      elements.metricSize.textContent = `${sizeKb} KB`;

      // Clean up previous blob URL
      if (state.currentBlobUrl) {
        URL.revokeObjectURL(state.currentBlobUrl);
      }
      state.currentBlobUrl = URL.createObjectURL(audioBlob);

      // Load & Play Audio
      loadAudioToPlayer(state.currentBlobUrl, {
        voiceName: voiceName,
        modelId: modelId,
        latencyMs: durationMs,
        sizeKb: sizeKb
      });

      // Add to Session History
      addToHistory({
        blobUrl: state.currentBlobUrl,
        voiceName: voiceName,
        modelId: modelId,
        text: body.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      showToast(`Narration generated in ${(durationMs / 1000).toFixed(2)}s (${sizeKb} KB)`, 'success');
      setStatus('ready', 'Ready');

    } catch (err) {
      console.error('TTS Generation Error:', err);
      showToast(err.message, 'error');
      setStatus('error', 'Error occurred');
    } finally {
      state.isGenerating = false;
      elements.playBtn.disabled = false;
      elements.playBtnText.textContent = 'Play Narration';
      elements.playBtnIcon.classList.remove('hidden');
      elements.playSpinner.classList.add('hidden');
    }
  }

  // --- Audio Player Controller ---
  function loadAudioToPlayer(blobUrl, meta) {
    const audio = elements.audioElement;
    audio.src = blobUrl;
    audio.playbackRate = state.playbackSpeeds[state.speedIndex];

    elements.currentVoiceName.textContent = `Narration: ${meta.voiceName}`;
    elements.currentAudioMeta.textContent = `Model: ${meta.modelId} • ${meta.latencyMs}ms • ${meta.sizeKb} KB`;

    // Enable download link
    const filename = `elevenlabs_${meta.voiceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.mp3`;
    elements.downloadLink.href = blobUrl;
    elements.downloadLink.download = filename;
    elements.downloadLink.classList.remove('disabled');

    // Setup Web Audio API Context on user trigger
    setupAudioContext();
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    // Automatically start playback
    audio.play().catch(err => {
      console.warn('Autoplay prevented by browser:', err);
    });
  }

  function toggleAudioPlayback() {
    const audio = elements.audioElement;
    if (!audio.src) return;

    setupAudioContext();
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  function updateAudioProgress() {
    const audio = elements.audioElement;
    if (!audio.duration || isNaN(audio.duration)) return;

    const progressPercent = (audio.currentTime / audio.duration) * 100;
    elements.progressBar.style.width = `${progressPercent}%`;
    elements.currentTime.textContent = formatTime(audio.currentTime);
  }

  function seekAudio(e) {
    const audio = elements.audioElement;
    if (!audio.duration || isNaN(audio.duration)) return;

    const rect = elements.progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekRatio = Math.max(0, Math.min(1, clickX / width));

    audio.currentTime = seekRatio * audio.duration;
  }

  function cyclePlaybackSpeed() {
    state.speedIndex = (state.speedIndex + 1) % state.playbackSpeeds.length;
    const speed = state.playbackSpeeds[state.speedIndex];
    elements.audioElement.playbackRate = speed;
    elements.speedBtn.textContent = `${speed.toFixed(speed % 1 === 0 ? 1 : 2)}x`;
  }

  function setAudioVolume(vol) {
    elements.audioElement.volume = vol;
    if (vol === 0) {
      elements.volumeIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>`;
    } else if (vol < 0.5) {
      elements.volumeIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
    } else {
      elements.volumeIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
    }
  }

  function toggleMute() {
    const audio = elements.audioElement;
    if (audio.volume > 0) {
      state.previousVolume = audio.volume;
      elements.volumeSlider.value = 0;
      setAudioVolume(0);
    } else {
      const restoreVol = state.previousVolume || 1;
      elements.volumeSlider.value = restoreVol;
      setAudioVolume(restoreVol);
    }
  }

  // --- Session History ---
  function addToHistory(item) {
    state.history.unshift(item);
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      elements.emptyHistory.classList.remove('hidden');
      return;
    }

    elements.emptyHistory.classList.add('hidden');
    elements.historyList.innerHTML = '';

    state.history.forEach((item, index) => {
      const historyEl = document.createElement('div');
      historyEl.className = 'history-item';
      
      const snippet = item.text.length > 70 ? item.text.substring(0, 70) + '...' : item.text;

      historyEl.innerHTML = `
        <div class="history-info">
          <div class="history-text" title="${escapeHtml(item.text)}">"${escapeHtml(snippet)}"</div>
          <div class="history-meta">
            <span><strong>${escapeHtml(item.voiceName)}</strong></span>
            <span class="badge-model">${escapeHtml(item.modelId)}</span>
            <span>${item.timestamp}</span>
          </div>
        </div>
        <div class="history-actions">
          <button type="button" class="history-btn play-history" data-index="${index}" title="Play Audio">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
          <a href="${item.blobUrl}" download="elevenlabs_${index + 1}.mp3" class="history-btn" title="Download MP3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
        </div>
      `;

      historyEl.querySelector('.play-history').addEventListener('click', () => {
        elements.audioElement.src = item.blobUrl;
        elements.audioElement.playbackRate = state.playbackSpeeds[state.speedIndex];
        elements.currentVoiceName.textContent = `Narration: ${item.voiceName}`;
        elements.currentAudioMeta.textContent = `Model: ${item.modelId} • Session History Clip`;
        elements.downloadLink.href = item.blobUrl;
        elements.downloadLink.classList.remove('disabled');
        setupAudioContext();
        elements.audioElement.play();
      });

      elements.historyList.appendChild(historyEl);
    });
  }

  function clearHistory() {
    state.history = [];
    renderHistory();
    showToast('Session generation history cleared', 'info');
  }

  // --- UI Helpers ---
  function updateCharCount() {
    const len = elements.textInput.value.length;
    elements.charCount.textContent = `${len.toLocaleString()} / 5,000 characters`;
    elements.charCount.style.color = len > 4800 ? 'var(--warning)' : 'var(--text-muted)';
    syncApiConsole();
  }

  function updateModelDescription() {
    const model = elements.modelSelect.value;
    elements.modelDescription.textContent = MODEL_DESCRIPTIONS[model] || 'ElevenLabs Neural Speech Model';
    syncApiConsole();
  }

  function setStatus(status, text) {
    elements.statusPill.className = `status-indicator ${status}`;
    elements.statusLabel.textContent = text;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 4500);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // --- Setup Event Listeners ---
  function setupEventListeners() {
    // Mode Switcher Tabs
    elements.tabStudio.addEventListener('click', () => switchMode('studio'));
    elements.tabConsole.addEventListener('click', () => switchMode('console'));

    // API Key
    elements.saveKeyBtn.addEventListener('click', saveApiKey);
    elements.clearKeyBtn.addEventListener('click', clearApiKey);
    elements.toggleKeyVisibility.addEventListener('click', toggleApiKeyVisibility);
    elements.apiKeyInput.addEventListener('input', syncApiConsole);

    // Textarea input
    elements.textInput.addEventListener('input', updateCharCount);
    elements.clearTextBtn.addEventListener('click', () => {
      elements.textInput.value = '';
      updateCharCount();
      elements.textInput.focus();
    });

    // Preset Pills
    elements.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        if (PRESETS[presetKey]) {
          elements.textInput.value = PRESETS[presetKey];
          updateCharCount();
          showToast(`Loaded ${btn.textContent.trim()} preset`, 'info');
        }
      });
    });

    // Model selection
    elements.modelSelect.addEventListener('change', updateModelDescription);

    // Voice selection
    elements.voiceSelect.addEventListener('change', () => {
      if (elements.voiceSelect.value === 'custom') {
        elements.customVoiceContainer.classList.remove('hidden');
        elements.customVoiceId.focus();
      } else {
        elements.customVoiceContainer.classList.add('hidden');
      }
      syncApiConsole();
    });

    elements.customVoiceId.addEventListener('input', syncApiConsole);

    // Advanced accordion toggle
    elements.advancedToggle.addEventListener('click', () => {
      const isHidden = elements.advancedContent.classList.contains('hidden');
      if (isHidden) {
        elements.advancedContent.classList.remove('hidden');
        elements.advancedChevron.classList.add('open');
      } else {
        elements.advancedContent.classList.add('hidden');
        elements.advancedChevron.classList.remove('open');
      }
    });

    // Sliders
    elements.stabilityRange.addEventListener('input', (e) => {
      elements.stabilityVal.textContent = `${Math.round(e.target.value * 100)}%`;
      syncApiConsole();
    });

    elements.similarityRange.addEventListener('input', (e) => {
      elements.similarityVal.textContent = `${Math.round(e.target.value * 100)}%`;
      syncApiConsole();
    });

    elements.speakerBoostCheck.addEventListener('change', syncApiConsole);

    // Play Buttons (both Studio and Console execute buttons)
    elements.playBtn.addEventListener('click', generateSpeech);
    elements.consoleExecuteBtn.addEventListener('click', generateSpeech);

    // Keyboard shortcut (Ctrl + Enter or Cmd + Enter)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateSpeech();
      }
    });

    // API Console Snippet Tabs
    elements.snippetTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.snippetTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeSnippetLang = tab.getAttribute('data-lang');
        syncApiConsole();
      });
    });

    elements.copyCodeBtn.addEventListener('click', copyCodeSnippet);

    // Custom Audio Player Events
    const audio = elements.audioElement;

    elements.audioPlayToggle.addEventListener('click', toggleAudioPlayback);

    audio.addEventListener('play', () => {
      elements.audioWaves.classList.add('playing');
      elements.audioToggleIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
      `;
      setStatus('ready', 'Playing narration...');
    });

    audio.addEventListener('pause', () => {
      elements.audioWaves.classList.remove('playing');
      elements.audioToggleIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      setStatus('ready', 'Ready');
    });

    audio.addEventListener('ended', () => {
      elements.audioWaves.classList.remove('playing');
      elements.audioToggleIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      setStatus('ready', 'Finished playing');
    });

    audio.addEventListener('timeupdate', updateAudioProgress);

    audio.addEventListener('loadedmetadata', () => {
      elements.durationTime.textContent = formatTime(audio.duration);
    });

    elements.progressContainer.addEventListener('click', seekAudio);

    elements.speedBtn.addEventListener('click', cyclePlaybackSpeed);

    elements.volumeSlider.addEventListener('input', (e) => {
      setAudioVolume(parseFloat(e.target.value));
    });

    elements.volumeBtn.addEventListener('click', toggleMute);

    // History
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
  }

  // Run initialization on DOM content ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
