document.addEventListener('DOMContentLoaded', function () {
  // --- DOM Elements ---
  const entryData = document.getElementById('entryData');
  const gtrStringOutput = document.getElementById('gtrString');
  const stringFreqOutput = document.getElementById('stringFreq');
  const stringPositionOutput = document.getElementById('stringPosition');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const darkModeButton = document.getElementById('darkModeButton');
  const tuningSelect = document.getElementById('tuningSelect');
  const quickNotesGrid = document.getElementById('quickNotesGrid');
  const playAllStringsBtn = document.getElementById('playAllStringsBtn');

  // Metronome DOM Elements
  const bpmDisplay = document.getElementById('bpmDisplay');
  const bpmSlider = document.getElementById('bpmSlider');
  const toggleMetronomeBtn = document.getElementById('toggleMetronome');
  const metronomeIcon = document.getElementById('metronomeIcon');
  const metronomeText = document.getElementById('metronomeText');
  const tapTempoBtn = document.getElementById('tapTempoBtn');
  const beatDotsContainer = document.getElementById('beatDots');
  const bpmSub5 = document.getElementById('bpmSub5');
  const bpmSub1 = document.getElementById('bpmSub1');
  const bpmAdd1 = document.getElementById('bpmAdd1');
  const bpmAdd5 = document.getElementById('bpmAdd5');

  // --- Web Audio Context ---
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // --- Tuning Data Presets ---
  // Standard tuning frequencies: e4 (329.63Hz), B3 (246.94Hz), G3 (196.00Hz), D3 (146.83Hz), A2 (110.00Hz), E2 (82.41Hz)
  const TUNINGS = {
    standard: {
      name: 'Padrão (E A D G B e)',
      strings: [
        { num: 1, note: 'e', label: '1ª corda', freq: 329.63 },
        { num: 2, note: 'B', label: '2ª corda', freq: 246.94 },
        { num: 3, note: 'G', label: '3ª corda', freq: 196.00 },
        { num: 4, note: 'D', label: '4ª corda', freq: 146.83 },
        { num: 5, note: 'A', label: '5ª corda', freq: 110.00 },
        { num: 6, note: 'E', label: '6ª corda', freq: 82.41 }
      ]
    },
    dropD: {
      name: 'Drop D (D A D G B e)',
      strings: [
        { num: 1, note: 'e', label: '1ª corda', freq: 329.63 },
        { num: 2, note: 'B', label: '2ª corda', freq: 246.94 },
        { num: 3, note: 'G', label: '3ª corda', freq: 196.00 },
        { num: 4, note: 'D', label: '4ª corda', freq: 146.83 },
        { num: 5, note: 'A', label: '5ª corda', freq: 110.00 },
        { num: 6, note: 'D', label: '6ª corda', freq: 73.42 }
      ]
    },
    halfStep: {
      name: 'Meio Tom Abaixo (D# G# C# F# A# d#)',
      strings: [
        { num: 1, note: 'd#', label: '1ª corda', freq: 311.13 },
        { num: 2, note: 'A#', label: '2ª corda', freq: 233.08 },
        { num: 3, note: 'F#', label: '3ª corda', freq: 185.00 },
        { num: 4, note: 'C#', label: '4ª corda', freq: 138.59 },
        { num: 5, note: 'G#', label: '5ª corda', freq: 103.83 },
        { num: 6, note: 'D#', label: '6ª corda', freq: 77.78 }
      ]
    },
    openD: {
      name: 'Open D (D A D F# A d)',
      strings: [
        { num: 1, note: 'd', label: '1ª corda', freq: 293.66 },
        { num: 2, note: 'A', label: '2ª corda', freq: 220.00 },
        { num: 3, note: 'F#', label: '3ª corda', freq: 185.00 },
        { num: 4, note: 'D', label: '4ª corda', freq: 146.83 },
        { num: 5, note: 'A', label: '5ª corda', freq: 110.00 },
        { num: 6, note: 'D', label: '6ª corda', freq: 73.42 }
      ]
    }
  };

  let currentTuningKey = localStorage.getItem('gtr_tuning') || 'standard';
  if (!TUNINGS[currentTuningKey]) currentTuningKey = 'standard';
  tuningSelect.value = currentTuningKey;

  // --- Sound Synthesizer (Realistic Guitar Pluck) ---
  function playGuitarTone(freq) {
    if (!freq) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Combine triangle with a subtle sine harmonic for guitar-like timbre
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Fast attack, natural exponential decay
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.6, now + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.0);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Metronome Click Tone Generator
  function playMetronomeClick(isAccent = false) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = isAccent ? 1200 : 800; // Accent on beat 1

      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Metronome sound error:', e);
    }
  }

  // --- Render & Update Interface ---
  function updateFretboardUI() {
    const tuning = TUNINGS[currentTuningKey];
    if (!tuning) return;

    // Update Quick Note Chips
    quickNotesGrid.innerHTML = '';
    tuning.strings.forEach(str => {
      const btn = document.createElement('button');
      btn.className = 'note-chip';
      btn.dataset.note = str.note;
      btn.textContent = `${str.num}ª ${str.note}`;
      btn.addEventListener('click', () => {
        entryData.value = str.note;
        handleNoteSearch();
        triggerStringPluck(str.num);
      });
      quickNotesGrid.appendChild(btn);
    });

    // Update Fretboard String Elements
    tuning.strings.forEach(str => {
      const noteEl = document.getElementById(`note-string-${str.num}`);
      const freqEl = document.getElementById(`freq-string-${str.num}`);
      if (noteEl) noteEl.textContent = str.note;
      if (freqEl) freqEl.textContent = `${str.freq.toFixed(1)} Hz`;
    });
  }

  function handleNoteSearch() {
    const query = entryData.value.trim();
    const tuning = TUNINGS[currentTuningKey];
    if (!query) {
      gtrStringOutput.textContent = '__________';
      stringFreqOutput.textContent = '-- Hz';
      stringPositionOutput.textContent = 'Aguardando entrada';
      highlightActiveChip('');
      return;
    }

    // Match string case-sensitively or case-insensitively if single match
    let found = tuning.strings.find(s => s.note === query);
    if (!found) {
      found = tuning.strings.find(s => s.note.toLowerCase() === query.toLowerCase());
    }

    if (found) {
      gtrStringOutput.textContent = found.label;
      stringFreqOutput.textContent = `${found.freq.toFixed(1)} Hz`;
      stringPositionOutput.textContent = `Nota: ${found.note}`;
      highlightActiveChip(found.note);
    } else {
      gtrStringOutput.textContent = 'Corda não encontrada para esta afinação!';
      stringFreqOutput.textContent = '-- Hz';
      stringPositionOutput.textContent = 'Nota inválida';
      highlightActiveChip('');
    }
  }

  function highlightActiveChip(note) {
    const chips = quickNotesGrid.querySelectorAll('.note-chip');
    chips.forEach(chip => {
      if (note && chip.dataset.note.toLowerCase() === note.toLowerCase()) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function triggerStringPluck(stringNum) {
    const tuning = TUNINGS[currentTuningKey];
    const strObj = tuning.strings.find(s => s.num == stringNum);
    if (!strObj) return;

    // Visual string animation
    const rowEl = document.querySelector(`.guitar-string-row[data-string-index="${stringNum}"]`);
    if (rowEl) {
      rowEl.classList.remove('vibrating');
      void rowEl.offsetWidth; // Trigger reflow
      rowEl.classList.add('vibrating');
      setTimeout(() => rowEl.classList.remove('vibrating'), 600);
    }

    // Audio tone
    playGuitarTone(strObj.freq);
  }

  // Event Listener: Interactive Strings
  document.querySelectorAll('.guitar-string-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const stringNum = row.dataset.stringIndex;
      const tuning = TUNINGS[currentTuningKey];
      const strObj = tuning.strings.find(s => s.num == stringNum);
      if (strObj) {
        entryData.value = strObj.note;
        handleNoteSearch();
        triggerStringPluck(stringNum);
      }
    });
  });

  // Strum all strings in order
  playAllStringsBtn.addEventListener('click', () => {
    const tuning = TUNINGS[currentTuningKey];
    // Strum from 6th string to 1st string with small delay
    const orderedStrings = [...tuning.strings].sort((a, b) => b.num - a.num);
    orderedStrings.forEach((strObj, index) => {
      setTimeout(() => {
        triggerStringPluck(strObj.num);
      }, index * 120);
    });
  });

  // Tuning Change
  tuningSelect.addEventListener('change', (e) => {
    currentTuningKey = e.target.value;
    localStorage.setItem('gtr_tuning', currentTuningKey);
    updateFretboardUI();
    handleNoteSearch();
  });

  // Entry input events
  entryData.addEventListener('input', handleNoteSearch);
  clearInputBtn.addEventListener('click', () => {
    entryData.value = '';
    handleNoteSearch();
    entryData.focus();
  });

  // Theme Toggle with LocalStorage
  const savedTheme = localStorage.getItem('gtr_theme');
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.add('dark-mode');
  }

  darkModeButton.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('gtr_theme', isDark ? 'dark' : 'light');
  });

  // --- Metronome Engine ---
  let isMetronomeRunning = false;
  let bpm = 120;
  let currentBeat = 0;
  let metronomeTimer = null;
  const dots = beatDotsContainer.querySelectorAll('.dot');

  function updateBpm(newBpm) {
    bpm = Math.min(220, Math.max(40, newBpm));
    bpmDisplay.textContent = bpm;
    bpmSlider.value = bpm;
    if (isMetronomeRunning) {
      restartMetronomeTimer();
    }
  }

  function advanceBeat() {
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentBeat);
    });
    playMetronomeClick(currentBeat === 0);
    currentBeat = (currentBeat + 1) % 4;
  }

  function startMetronome() {
    isMetronomeRunning = true;
    metronomeIcon.textContent = '⏸';
    metronomeText.textContent = 'Pausar';
    toggleMetronomeBtn.classList.add('active');
    currentBeat = 0;
    advanceBeat();
    restartMetronomeTimer();
  }

  function stopMetronome() {
    isMetronomeRunning = false;
    metronomeIcon.textContent = '▶';
    metronomeText.textContent = 'Iniciar';
    toggleMetronomeBtn.classList.remove('active');
    if (metronomeTimer) clearInterval(metronomeTimer);
    dots.forEach(d => d.classList.remove('active'));
    dots[0].classList.add('active');
  }

  function restartMetronomeTimer() {
    if (metronomeTimer) clearInterval(metronomeTimer);
    const intervalMs = (60 / bpm) * 1000;
    metronomeTimer = setInterval(advanceBeat, intervalMs);
  }

  toggleMetronomeBtn.addEventListener('click', () => {
    getAudioContext(); // Ensure AudioContext is initialized
    if (isMetronomeRunning) {
      stopMetronome();
    } else {
      startMetronome();
    }
  });

  bpmSlider.addEventListener('input', (e) => updateBpm(parseInt(e.target.value, 10)));
  bpmSub5.addEventListener('click', () => updateBpm(bpm - 5));
  bpmSub1.addEventListener('click', () => updateBpm(bpm - 1));
  bpmAdd1.addEventListener('click', () => updateBpm(bpm + 1));
  bpmAdd5.addEventListener('click', () => updateBpm(bpm + 5));

  // Tap Tempo Logic
  let tapTimes = [];
  tapTempoBtn.addEventListener('click', () => {
    getAudioContext();
    const now = performance.now();
    tapTimes.push(now);

    // Keep only taps within the last 3 seconds
    tapTimes = tapTimes.filter(t => now - t < 3000);

    if (tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      updateBpm(calculatedBpm);
    }
  });

  // Footer year dynamic update
  const footerYear = document.getElementById('footerYear');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // Initial load calls
  updateFretboardUI();
  handleNoteSearch();
});
