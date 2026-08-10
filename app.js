(function () {
  'use strict';

  const timeTextEl = document.getElementById('timeText');
  const youtubePlaylistLink = document.getElementById('youtubePlaylistLink');
  
  const floatingPlayerEl = document.getElementById('floatingPlayer');
  const trackArtworkEl = document.getElementById('trackArtwork');
  const trackTitleEl = document.getElementById('trackTitle');
  const trackArtistEl = document.getElementById('trackArtist');
  
  const currentTimeEl = document.getElementById('currentTime');
  const totalDurationEl = document.getElementById('totalDuration');
  const progressBarContainer = document.getElementById('progressBarContainer');
  const progressFillEl = document.getElementById('progressFill');
  const progressHandleEl = document.getElementById('progressHandle');

  const playPauseBtn = document.getElementById('playPauseBtn');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const volumeBtn = document.getElementById('volumeBtn');
  const iconVolumeHigh = document.getElementById('iconVolumeHigh');
  const iconVolumeMuted = document.getElementById('iconVolumeMuted');
  const volumeSlider = document.getElementById('volumeSlider');

  const rainAudioBtn = document.getElementById('rainAudioBtn');
  const trainAudioBtn = document.getElementById('trainAudioBtn');

  const sleepTimerContainer = document.getElementById('sleepTimerContainer');
  const sleepTimerBtn = document.getElementById('sleepTimerBtn');
  const sleepTimerPopup = document.getElementById('sleepTimerPopup');
  const sleepPopupVal = document.getElementById('sleepPopupVal');
  const sleepSlider = document.getElementById('sleepSlider');
  const timerToggleBtn = document.getElementById('timerToggleBtn');
  const sleepTimerBadge = document.getElementById('sleepTimerBadge');
  const presetBtns = document.querySelectorAll('.preset-btn');

  const viewFramingToggle = document.getElementById('viewFramingToggle');
  const zenModeToggle = document.getElementById('zenModeToggle');
  const zenExitBtn = document.getElementById('zenExitBtn');

  const moodContainer = document.getElementById('moodContainer');
  const moodQuoteEl = document.getElementById('moodQuote');
  const moodSubEl = document.getElementById('moodSub');

  const sceneBackground = document.getElementById('sceneBackground');
  const rainCanvas = document.getElementById('rainCanvas');

  if (trackArtworkEl) {
    trackArtworkEl.addEventListener('error', () => {
      trackArtworkEl.src = 'assets/bg-train-window.png';
    });
  }

  let ytPlayer = null;
  let isPlayerReady = false;
  let isPlaying = false;
  let currentQuoteIndex = 0;
  let progressInterval = null;
  let isSeeking = false;
  let isMuted = false;
  let currentVolume = (typeof CONFIG !== 'undefined' && CONFIG.defaultVolume) ? CONFIG.defaultVolume : 80;

  let framingIndex = 0;
  const framingClasses = ['', 'framing-panoramic', 'framing-cabin'];
  const framingTitles = ['View: Window Focus', 'View: Panoramic', 'View: Full Cabin'];

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const isAm = hours < 12;
    
    hours = hours % 12;
    if (hours === 0) hours = 12;

    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const period = isAm ? 'am' : 'pm';

    if (timeTextEl) {
      timeTextEl.textContent = `${hours}:${formattedMinutes} ${period}`;
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  if (youtubePlaylistLink && typeof CONFIG !== 'undefined' && CONFIG.playlistUrl) {
    youtubePlaylistLink.href = CONFIG.playlistUrl;
  }

  function cycleQuote() {
    if (typeof CONFIG === 'undefined' || !CONFIG.quotes || CONFIG.quotes.length === 0) return;
    currentQuoteIndex = (currentQuoteIndex + 1) % CONFIG.quotes.length;
    const quote = CONFIG.quotes[currentQuoteIndex];

    if (moodQuoteEl && moodSubEl) {
      moodQuoteEl.style.opacity = '0';
      moodSubEl.style.opacity = '0';

      setTimeout(() => {
        moodQuoteEl.textContent = quote.hindi;
        moodSubEl.textContent = quote.english;
        moodQuoteEl.style.opacity = '';
        moodSubEl.style.opacity = '';
      }, 300);
    }
  }

  if (moodContainer) {
    moodContainer.addEventListener('click', cycleQuote);
  }

  setInterval(cycleQuote, 75000);

  function toggleFraming() {
    framingIndex = (framingIndex + 1) % framingClasses.length;
    if (sceneBackground) {
      sceneBackground.classList.remove('framing-panoramic', 'framing-cabin');
      if (framingClasses[framingIndex]) {
        sceneBackground.classList.add(framingClasses[framingIndex]);
      }
    }
    if (viewFramingToggle) {
      viewFramingToggle.title = framingTitles[framingIndex];
      viewFramingToggle.classList.toggle('active', framingIndex !== 0);
    }
  }

  if (viewFramingToggle) {
    viewFramingToggle.addEventListener('click', toggleFraming);
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function setPlayState(playing) {
    isPlaying = playing;
    if (playing) {
      if (iconPlay) iconPlay.classList.add('hidden');
      if (iconPause) iconPause.classList.remove('hidden');
      if (floatingPlayerEl) floatingPlayerEl.classList.add('is-playing');
      if (sceneBackground) sceneBackground.classList.add('swaying');
    } else {
      if (iconPlay) iconPlay.classList.remove('hidden');
      if (iconPause) iconPause.classList.add('hidden');
      if (floatingPlayerEl) floatingPlayerEl.classList.remove('is-playing');
      if (sceneBackground) sceneBackground.classList.remove('swaying');
    }
  }

  if (typeof CONFIG !== 'undefined' && CONFIG.defaultTrack) {
    if (trackTitleEl) trackTitleEl.textContent = CONFIG.defaultTrack.title;
    if (trackArtistEl) trackArtistEl.textContent = CONFIG.defaultTrack.artist;
    if (trackArtworkEl && CONFIG.defaultTrack.artwork) {
      trackArtworkEl.src = CONFIG.defaultTrack.artwork;
    }
  }

  function getCleanPlaylistId(input) {
    if (!input) return '';
    if (input.includes('list=')) {
      const match = input.match(/[?&]list=([^&#]+)/);
      if (match) return match[1];
    }
    return input.trim();
  }

  function loadYouTubeIframeAPI() {
    if (window.YT && window.YT.Player) {
      initYTPlayer();
      return;
    }
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }

  window.onYouTubeIframeAPIReady = function () {
    initYTPlayer();
  };

  function initYTPlayer() {
    if (ytPlayer) return;

    try {
      const activePlaylistId = (typeof CONFIG !== 'undefined') 
        ? getCleanPlaylistId(CONFIG.playlistId || CONFIG.playlistUrl) 
        : 'PLMNU4btdRJc8';

      const playerVars = {
        listType: 'playlist',
        list: activePlaylistId,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      };

      if (window.location.protocol.startsWith('http')) {
        playerVars.origin = window.location.origin;
      }

      ytPlayer = new YT.Player('youtubePlayerTarget', {
        height: '200',
        width: '320',
        playerVars: playerVars,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    } catch (e) {
      console.warn('Player init notice:', e);
    }
  }

  function onPlayerReady(event) {
    isPlayerReady = true;
    ytPlayer = event.target;

    try {
      ytPlayer.setVolume(currentVolume);
    } catch (err) {}

    startProgressTracker();
  }

  function onPlayerStateChange(event) {
    if (event.data === 1) {
      setPlayState(true);
      fetchLiveTrackMetadata();
    } else if (event.data === 2) {
      setPlayState(false);
    } else if (event.data === 0) {
      playNextTrack();
    } else if (event.data === 5 || event.data === 3) {
      fetchLiveTrackMetadata();
    }
  }

  function onPlayerError(event) {
    if (event.data === 150 || event.data === 101 || event.data === 100) {
      if (trackTitleEl) trackTitleEl.textContent = 'Track restricted on embedded players';
      if (trackArtistEl) trackArtistEl.textContent = 'Click Next (→) to play next song';
      setPlayState(false);
    }
  }

  function fetchLiveTrackMetadata() {
    if (!ytPlayer || typeof ytPlayer.getVideoData !== 'function') return;
    try {
      const data = ytPlayer.getVideoData();
      if (data) {
        if (data.title && trackTitleEl) {
          trackTitleEl.textContent = data.title;
        }
        if (data.author && trackArtistEl) {
          trackArtistEl.textContent = data.author;
        }
        if (data.video_id && trackArtworkEl) {
          trackArtworkEl.src = `https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`;
        }
      }
      const dur = ytPlayer.getDuration();
      if (dur && dur > 0 && totalDurationEl) {
        totalDurationEl.textContent = formatTime(dur);
      }
    } catch (e) {}
  }

  function togglePlayPause() {
    if (ytPlayer && isPlayerReady && typeof ytPlayer.playVideo === 'function') {
      try {
        const state = (typeof ytPlayer.getPlayerState === 'function') ? ytPlayer.getPlayerState() : -1;
        if (state === 1 || state === 3) {
          ytPlayer.pauseVideo();
          setPlayState(false);
        } else {
          ytPlayer.playVideo();
          setPlayState(true);
        }
      } catch (e) {
        try {
          ytPlayer.playVideo();
          setPlayState(true);
        } catch (err) {}
      }
    } else {
      setPlayState(!isPlaying);
      if (isPlaying && !progressInterval) {
        startProgressTracker();
      }
    }
  }

  function playNextTrack() {
    if (ytPlayer && isPlayerReady && typeof ytPlayer.nextVideo === 'function') {
      try {
        ytPlayer.nextVideo();
        setPlayState(true);
      } catch (e) {}
    }
  }

  function playPrevTrack() {
    if (ytPlayer && isPlayerReady && typeof ytPlayer.previousVideo === 'function') {
      try {
        ytPlayer.previousVideo();
        setPlayState(true);
      } catch (e) {}
    }
  }

  function startProgressTracker() {
    if (progressInterval) clearInterval(progressInterval);

    progressInterval = setInterval(() => {
      if (isSeeking) return;

      let currentTime = 0;
      let duration = 0;

      if (ytPlayer && isPlayerReady && typeof ytPlayer.getCurrentTime === 'function') {
        currentTime = ytPlayer.getCurrentTime() || 0;
        duration = ytPlayer.getDuration() || 0;
      }

      if (duration > 0) {
        const percent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
        if (progressFillEl) progressFillEl.style.width = `${percent}%`;
        if (progressHandleEl) progressHandleEl.style.left = `${percent}%`;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
        if (totalDurationEl) totalDurationEl.textContent = formatTime(duration);
      }
    }, 400);
  }

  function handleSeek(e) {
    if (!progressBarContainer) return;
    const rect = progressBarContainer.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    const percent = ratio * 100;

    if (progressFillEl) progressFillEl.style.width = `${percent}%`;
    if (progressHandleEl) progressHandleEl.style.left = `${percent}%`;

    let duration = 0;
    if (ytPlayer && isPlayerReady && typeof ytPlayer.getDuration === 'function') {
      duration = ytPlayer.getDuration() || 0;
      if (duration > 0) {
        const seekSeconds = ratio * duration;
        ytPlayer.seekTo(seekSeconds, true);
        if (currentTimeEl) currentTimeEl.textContent = formatTime(seekSeconds);
      }
    }
  }

  if (progressBarContainer) {
    progressBarContainer.addEventListener('click', handleSeek);
  }

  function updateVolume(val) {
    currentVolume = parseInt(val, 10);
    if (volumeSlider) volumeSlider.value = currentVolume;

    if (ytPlayer && isPlayerReady && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(currentVolume);
      if (currentVolume === 0) {
        ytPlayer.mute();
        setMuteIcon(true);
      } else if (isMuted) {
        ytPlayer.unMute();
        setMuteIcon(false);
      }
    } else {
      setMuteIcon(currentVolume === 0);
    }
  }

  function setMuteIcon(muted) {
    isMuted = muted;
    if (muted) {
      if (iconVolumeHigh) iconVolumeHigh.classList.add('hidden');
      if (iconVolumeMuted) iconVolumeMuted.classList.remove('hidden');
    } else {
      if (iconVolumeHigh) iconVolumeHigh.classList.remove('hidden');
      if (iconVolumeMuted) iconVolumeMuted.classList.add('hidden');
    }
  }

  function toggleMute() {
    if (isMuted) {
      if (ytPlayer && isPlayerReady && typeof ytPlayer.unMute === 'function') {
        ytPlayer.unMute();
        ytPlayer.setVolume(currentVolume || 80);
      }
      setMuteIcon(false);
      if (volumeSlider) volumeSlider.value = currentVolume || 80;
    } else {
      if (ytPlayer && isPlayerReady && typeof ytPlayer.mute === 'function') {
        ytPlayer.mute();
      }
      setMuteIcon(true);
    }
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value));
  }
  if (volumeBtn) {
    volumeBtn.addEventListener('click', toggleMute);
  }

  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
  if (nextBtn) nextBtn.addEventListener('click', playNextTrack);
  if (prevBtn) prevBtn.addEventListener('click', playPrevTrack);

  let audioCtx = null;
  let rainNoiseNode = null;
  let rainGainNode = null;
  let isRainAudioActive = false;

  let trainGainNode = null;
  let trainContinuousOsc = null;
  let trainContinuousGain = null;
  let trainInterval = null;
  let isTrainAudioActive = false;

  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function initRainSound() {
    try {
      const ctx = ensureAudioContext();
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      rainNoiseNode = ctx.createBufferSource();
      rainNoiseNode.buffer = noiseBuffer;
      rainNoiseNode.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 920;
      filter.Q.value = 1.0;

      rainGainNode = ctx.createGain();
      rainGainNode.gain.setValueAtTime(0.001, ctx.currentTime);

      rainNoiseNode.connect(filter);
      filter.connect(rainGainNode);
      rainGainNode.connect(ctx.destination);
      rainNoiseNode.start();
    } catch (err) {
      console.warn('Rain audio error:', err);
    }
  }

  function toggleRainAtmosphere() {
    if (!rainNoiseNode) {
      initRainSound();
    }
    const ctx = ensureAudioContext();
    isRainAudioActive = !isRainAudioActive;

    if (isRainAudioActive) {
      if (rainAudioBtn) rainAudioBtn.classList.add('active');
      if (rainGainNode && ctx) {
        rainGainNode.gain.cancelScheduledValues(ctx.currentTime);
        rainGainNode.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 1.2);
      }
    } else {
      if (rainAudioBtn) rainAudioBtn.classList.remove('active');
      if (rainGainNode && ctx) {
        rainGainNode.gain.cancelScheduledValues(ctx.currentTime);
        rainGainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      }
    }
  }

  function initTrainRumble() {
    try {
      const ctx = ensureAudioContext();
      trainGainNode = ctx.createGain();
      trainGainNode.gain.setValueAtTime(0.001, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;

      trainGainNode.connect(filter);
      filter.connect(ctx.destination);

      trainContinuousOsc = ctx.createOscillator();
      trainContinuousGain = ctx.createGain();
      trainContinuousOsc.type = 'triangle';
      trainContinuousOsc.frequency.setValueAtTime(46, ctx.currentTime);
      trainContinuousGain.gain.setValueAtTime(0.12, ctx.currentTime);
      trainContinuousOsc.connect(trainContinuousGain);
      trainContinuousGain.connect(trainGainNode);
      trainContinuousOsc.start();

      function triggerClickClack() {
        if (!isTrainAudioActive || !audioCtx) return;
        const now = ctx.currentTime;
        
        [0, 0.13, 0.48, 0.61].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          osc.type = 'sine';
          const freq = (idx % 2 === 0) ? 80 : 68;
          osc.frequency.setValueAtTime(freq, now + offset);
          osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.09);

          const vol = (idx % 2 === 0) ? 0.26 : 0.18;
          clickGain.gain.setValueAtTime(vol, now + offset);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

          osc.connect(clickGain);
          clickGain.connect(trainGainNode);
          osc.start(now + offset);
          osc.stop(now + offset + 0.11);
        });
      }

      trainInterval = setInterval(triggerClickClack, 1700);
    } catch (err) {
      console.warn('Train audio error:', err);
    }
  }

  function toggleTrainAtmosphere() {
    if (!trainGainNode) {
      initTrainRumble();
    }
    const ctx = ensureAudioContext();
    isTrainAudioActive = !isTrainAudioActive;

    if (isTrainAudioActive) {
      if (trainAudioBtn) trainAudioBtn.classList.add('active');
      if (trainGainNode && ctx) {
        trainGainNode.gain.cancelScheduledValues(ctx.currentTime);
        trainGainNode.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 1.2);
      }
    } else {
      if (trainAudioBtn) trainAudioBtn.classList.remove('active');
      if (trainGainNode && ctx) {
        trainGainNode.gain.cancelScheduledValues(ctx.currentTime);
        trainGainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      }
    }
  }

  if (rainAudioBtn) rainAudioBtn.addEventListener('click', toggleRainAtmosphere);
  if (trainAudioBtn) trainAudioBtn.addEventListener('click', toggleTrainAtmosphere);

  let sleepTimerRunning = false;
  let sleepTimerCountdown = null;
  let sleepSecondsRemaining = 0;
  let selectedSleepMinutes = 30;

  function toggleSleepPopup(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!sleepTimerPopup) return;
    const isOpen = sleepTimerPopup.classList.contains('is-open');
    if (isOpen) {
      closeSleepPopup();
    } else {
      openSleepPopup();
    }
  }

  function openSleepPopup() {
    if (sleepTimerPopup) sleepTimerPopup.classList.add('is-open');
    if (sleepTimerBtn) sleepTimerBtn.classList.add('is-open');
  }

  function closeSleepPopup() {
    if (sleepTimerPopup) sleepTimerPopup.classList.remove('is-open');
    if (sleepTimerBtn) sleepTimerBtn.classList.remove('is-open');
  }

  if (sleepTimerBtn) {
    sleepTimerBtn.addEventListener('click', toggleSleepPopup);
  }

  document.addEventListener('click', (e) => {
    if (sleepTimerContainer && !sleepTimerContainer.contains(e.target)) {
      closeSleepPopup();
    }
  });

  if (sleepTimerPopup) {
    sleepTimerPopup.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  function updateSleepSliderDisplay(val) {
    selectedSleepMinutes = parseInt(val, 10);
    if (sleepPopupVal) sleepPopupVal.textContent = `${selectedSleepMinutes} min`;
    if (sleepSlider) sleepSlider.value = selectedSleepMinutes;

    presetBtns.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.min, 10) === selectedSleepMinutes);
    });
  }

  if (sleepSlider) {
    sleepSlider.addEventListener('input', (e) => {
      updateSleepSliderDisplay(e.target.value);
    });
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateSleepSliderDisplay(btn.dataset.min);
    });
  });

  function startCustomSleepTimer() {
    if (sleepTimerCountdown) clearInterval(sleepTimerCountdown);

    sleepTimerRunning = true;
    sleepSecondsRemaining = selectedSleepMinutes * 60;

    if (sleepTimerBtn) sleepTimerBtn.classList.add('active');
    if (sleepTimerBadge) {
      sleepTimerBadge.classList.remove('hidden');
      sleepTimerBadge.textContent = `${selectedSleepMinutes}m`;
    }
    if (timerToggleBtn) {
      timerToggleBtn.textContent = 'Cancel Timer';
      timerToggleBtn.classList.add('active-running');
    }

    sleepTimerCountdown = setInterval(() => {
      sleepSecondsRemaining -= 1;

      const minsLeft = Math.ceil(sleepSecondsRemaining / 60);
      if (sleepTimerBadge) sleepTimerBadge.textContent = `${minsLeft}m`;

      if (sleepSecondsRemaining <= 30 && sleepSecondsRemaining > 0) {
        const fadeRatio = sleepSecondsRemaining / 30;
        const fadeVol = Math.floor(currentVolume * fadeRatio);
        if (ytPlayer && isPlayerReady && typeof ytPlayer.setVolume === 'function') {
          ytPlayer.setVolume(fadeVol);
        }
      }

      if (sleepSecondsRemaining <= 0) {
        clearInterval(sleepTimerCountdown);
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
          ytPlayer.pauseVideo();
        }
        setPlayState(false);
        cancelCustomSleepTimer();
      }
    }, 1000);

    closeSleepPopup();
  }

  function cancelCustomSleepTimer() {
    if (sleepTimerCountdown) clearInterval(sleepTimerCountdown);
    sleepTimerRunning = false;

    if (sleepTimerBtn) sleepTimerBtn.classList.remove('active');
    if (sleepTimerBadge) sleepTimerBadge.classList.add('hidden');
    if (timerToggleBtn) {
      timerToggleBtn.textContent = 'Start Timer';
      timerToggleBtn.classList.remove('active-running');
    }
  }

  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sleepTimerRunning) {
        cancelCustomSleepTimer();
      } else {
        startCustomSleepTimer();
      }
    });
  }

  function toggleZenMode() {
    document.body.classList.toggle('zen-mode');
    const isZen = document.body.classList.contains('zen-mode');
    if (zenExitBtn) {
      if (isZen) {
        zenExitBtn.classList.remove('hidden');
      } else {
        zenExitBtn.classList.add('hidden');
      }
    }
  }

  if (zenModeToggle) zenModeToggle.addEventListener('click', toggleZenMode);
  if (zenExitBtn) zenExitBtn.addEventListener('click', toggleZenMode);

  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      playNextTrack();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      playPrevTrack();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      toggleRainAtmosphere();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      toggleTrainAtmosphere();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFraming();
    } else if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      toggleZenMode();
    } else if (e.key === 'Escape' && document.body.classList.contains('zen-mode')) {
      e.preventDefault();
      toggleZenMode();
    }
  });

  function initRainCanvas() {
    if (!rainCanvas) return;
    const ctx = rainCanvas.getContext('2d');
    let width, height;

    function resizeCanvas() {
      width = rainCanvas.width = window.innerWidth;
      height = rainCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const staticDrops = [];
    const numStaticDrops = Math.floor((width * height) / 12000);
    for (let i = 0; i < numStaticDrops; i++) {
      staticDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.4 + 0.2
      });
    }

    const runningDrops = [];
    const numRunningDrops = 24;
    for (let i = 0; i < numRunningDrops; i++) {
      runningDrops.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        speed: Math.random() * 1.6 + 0.8,
        length: Math.random() * 14 + 6,
        r: Math.random() * 1.5 + 1.0,
        alpha: Math.random() * 0.35 + 0.25
      });
    }

    function renderRain() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < staticDrops.length; i++) {
        const d = staticDrops[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 235, 255, ${d.alpha * 0.4})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.7})`;
        ctx.fill();
      }

      for (let i = 0; i < runningDrops.length; i++) {
        const d = runningDrops[i];
        d.y += d.speed;

        if (d.y > height + 20) {
          d.y = -20;
          d.x = Math.random() * width;
          d.speed = Math.random() * 1.6 + 0.8;
        }

        const gradient = ctx.createLinearGradient(d.x, d.y - d.length, d.x, d.y);
        gradient.addColorStop(0, 'rgba(180, 210, 255, 0)');
        gradient.addColorStop(1, `rgba(215, 235, 255, ${d.alpha})`);

        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.length);
        ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = d.r;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 248, 255, ${d.alpha * 0.9})`;
        ctx.fill();
      }

      requestAnimationFrame(renderRain);
    }

    requestAnimationFrame(renderRain);
  }

  initRainCanvas();
  loadYouTubeIframeAPI();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startProgressTracker();
    });
  } else {
    startProgressTracker();
  }

})();
