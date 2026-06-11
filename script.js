document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // ============================================================
  //  CONSTANTS & REFERENCES
  // ============================================================
  const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
  const MATCH_THRESHOLD = 0.55;
  const EDITABLE_KEYS = ['name', 'birth-day', 'birth-month', 'birth-year', 'welcome-name', 'welcome-sub', 'bio1', 'bio2'];
  const MEDIA_IMAGES_DEFAULT = ['media1.jpg', 'media2.jpg', 'media3.jpg'];

  // ============================================================
  //  STATE
  // ============================================================
  let adminUnlocked = sessionStorage.getItem('admin-unlocked') === 'true';
  let mediaImages = JSON.parse(localStorage.getItem('portfolio-media-images') || 'null') || [...MEDIA_IMAGES_DEFAULT];
  let currentMediaIndex = 0;
  let scannerStream = null;
  let scannerInterval = null;
  let referenceDescriptor = null;
  let modelsLoaded = false;
  let matchCount = 0;

  // ============================================================
  //  TOAST UTILITY
  // ============================================================
  function showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  // ============================================================
  //  LOAD SAVED DATA FROM localStorage
  // ============================================================
  function loadSavedData() {
    // Text fields
    EDITABLE_KEYS.forEach(key => {
      const saved = localStorage.getItem(`portfolio-${key}`);
      if (saved) {
        const el = document.querySelector(`[data-key="${key}"]`);
        if (el) el.textContent = saved;
      }
    });

    // Avatar
    const savedAvatar = localStorage.getItem('portfolio-avatar');
    if (savedAvatar) {
      document.querySelectorAll('.avatar-img').forEach(img => img.src = savedAvatar);
      const cvAv = document.getElementById('cv-avatar-img');
      if (cvAv) cvAv.src = savedAvatar;
    }

    // Hero photo
    const savedHero = localStorage.getItem('portfolio-hero');
    if (savedHero) {
      const heroPhoto = document.getElementById('hero-photo');
      if (heroPhoto) heroPhoto.src = savedHero;
    }

    // Media images
    mediaImages.forEach((src, idx) => {
      if (idx === 0) {
        const mediaImg = document.getElementById('media-img');
        if (mediaImg) mediaImg.src = src;
      }
    });
  }

  loadSavedData();

  // ============================================================
  //  APPLY ADMIN STATE ON LOAD
  // ============================================================
  if (adminUnlocked) {
    enableAdminMode(false);
  }

  // ============================================================
  //  DYNAMIC GREETING
  // ============================================================
  const welcomeGreeting = document.getElementById('welcome-greeting');
  if (welcomeGreeting) {
    const hours = new Date().getHours();
    let greeting = "Xin chào! Mình là";
    if (hours >= 5 && hours < 12) greeting = "Xin chào buổi sáng! Mình là";
    else if (hours >= 12 && hours < 14) greeting = "Xin chào buổi trưa! Mình là";
    else if (hours >= 14 && hours < 18) greeting = "Xin chào buổi chiều! Mình là";
    else greeting = "Xin chào buổi tối! Mình là";
    welcomeGreeting.textContent = greeting;
  }

  // ============================================================
  //  THEME TOGGLE
  // ============================================================
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedThemeMode = localStorage.getItem('theme-mode') || 'dark';
  if (savedThemeMode === 'light') {
    document.body.setAttribute('data-theme-style', 'light');
  } else {
    document.body.removeAttribute('data-theme-style');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.getAttribute('data-theme-style') === 'light';
      if (isLight) {
        document.body.removeAttribute('data-theme-style');
        localStorage.setItem('theme-mode', 'dark');
      } else {
        document.body.setAttribute('data-theme-style', 'light');
        localStorage.setItem('theme-mode', 'light');
      }
    });
  }

  // ============================================================
  //  LIKE / DISLIKE
  // ============================================================
  const likeBtn = document.getElementById('like-btn');
  const likeCountSpan = document.getElementById('like-count');
  const dislikeBtn = document.getElementById('dislike-btn');
  const dislikeCountSpan = document.getElementById('dislike-count');
  const statLikes = document.getElementById('stat-likes');

  let hasLiked = localStorage.getItem('has-liked-hohung') === 'true';
  let hasDisliked = localStorage.getItem('has-disliked-hohung') === 'true';

  async function fetchCounts() {
    try {
      const likesRes = await fetch('https://abacus.jasoncameron.dev/get/hohung_portfolio/likes');
      const likesData = await likesRes.json();
      const count = likesData.value || 0;
      likeCountSpan.textContent = count;
      if (statLikes) statLikes.textContent = count;

      const dislikesRes = await fetch('https://abacus.jasoncameron.dev/get/hohung_portfolio/dislikes');
      const dislikesData = await dislikesRes.json();
      dislikeCountSpan.textContent = dislikesData.value || 0;
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  }

  fetchCounts();

  if (hasLiked) likeBtn.classList.add('active');
  if (hasDisliked) dislikeBtn.classList.add('active');

  likeBtn.addEventListener('click', async () => {
    if (hasLiked) { alert('Thích rồi mà đòi rút lại à :))))'); return; }
    if (hasDisliked) { alert('Ok Mình đã ghim... Dỗi'); return; }
    try {
      likeBtn.classList.add('animated-bounce');
      const res = await fetch('https://abacus.jasoncameron.dev/hit/hohung_portfolio/likes');
      const data = await res.json();
      likeCountSpan.textContent = data.value;
      if (statLikes) statLikes.textContent = data.value;
      hasLiked = true;
      localStorage.setItem('has-liked-hohung', 'true');
      likeBtn.classList.add('active');
      const heartIcon = likeBtn.querySelector('i');
      heartIcon.style.transform = 'scale(1.4)';
      setTimeout(() => { heartIcon.style.transform = 'scale(1)'; likeBtn.classList.remove('animated-bounce'); }, 300);
    } catch (err) { console.error('Error sending like:', err); }
  });

  dislikeBtn.addEventListener('click', async () => {
    if (hasDisliked) { alert('Mình ghim bạn rồi đấy'); return; }
    if (hasLiked) { alert('Biết thích rồi, thích 1 lần thôi'); return; }
    try {
      const res = await fetch('https://abacus.jasoncameron.dev/hit/hohung_portfolio/dislikes');
      const data = await res.json();
      dislikeCountSpan.textContent = data.value;
      hasDisliked = true;
      localStorage.setItem('has-disliked-hohung', 'true');
      dislikeBtn.classList.add('active');
      const thumbsDown = dislikeBtn.querySelector('i');
      thumbsDown.style.transform = 'scale(1.4)';
      setTimeout(() => { thumbsDown.style.transform = 'scale(1)'; }, 300);
    } catch (err) { console.error('Error sending dislike:', err); }
  });

  // Bell
  const bellBtn = document.getElementById('bell-btn');
  let bellActive = false;
  bellBtn.addEventListener('click', () => {
    bellActive = !bellActive;
    if (bellActive) {
      bellBtn.style.color = 'var(--primary-color)';
      bellBtn.innerHTML = '<i data-lucide="bell-ring"></i>';
      alert('Notifications turned ON for Hồ Văn Hùng!');
    } else {
      bellBtn.style.color = 'var(--text-muted)';
      bellBtn.innerHTML = '<i data-lucide="bell"></i>';
    }
    lucide.createIcons();
  });

  // ============================================================
  //  YOUTUBE AUDIO PLAYER
  // ============================================================
  const playPauseBtn = document.getElementById('play-pause-btn');
  const musicWidget = document.querySelector('.music-widget');
  const progressFill = document.getElementById('progress-fill');
  const currentTimeSpan = document.getElementById('current-time');
  const totalTimeSpan = document.getElementById('total-time');
  const progressBarContainer = document.getElementById('progress-bar-container');
  const prevTrackBtn = document.getElementById('prev-track');
  const nextTrackBtn = document.getElementById('next-track');

  let isPlaying = false;
  let player = null;
  let isPlayerReady = false;
  let progressTimer = null;

  function formatTime(secs) {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('youtube-player', {
      height: '0', width: '0', videoId: 'ERABWON9Qck',
      playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1, 'rel': 0 },
      events: {
        'onReady': () => {
          isPlayerReady = true;
          const duration = player.getDuration();
          if (duration) totalTimeSpan.textContent = formatTime(duration);
        },
        'onStateChange': onPlayerStateChange
      }
    });
  };

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      isPlaying = true;
      playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
      musicWidget.classList.add('playing');
      lucide.createIcons();
      startProgressTimer();
    } else {
      isPlaying = false;
      playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
      musicWidget.classList.remove('playing');
      lucide.createIcons();
      stopProgressTimer();
      if (event.data === YT.PlayerState.ENDED) { progressFill.style.width = '0%'; currentTimeSpan.textContent = "0:00"; }
    }
  }

  function startProgressTimer() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      if (player && isPlayerReady) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration() || 225;
        progressFill.style.width = `${(currentTime / duration) * 100}%`;
        currentTimeSpan.textContent = formatTime(currentTime);
        totalTimeSpan.textContent = formatTime(duration);
      }
    }, 250);
  }

  function stopProgressTimer() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  }

  function togglePlayPause() {
    if (!player || !isPlayerReady) return;
    isPlaying ? player.pauseVideo() : player.playVideo();
  }

  playPauseBtn.addEventListener('click', togglePlayPause);

  progressBarContainer.addEventListener('click', (e) => {
    if (!player || !isPlayerReady) return;
    const rect = progressBarContainer.getBoundingClientRect();
    const clickedPercentage = (e.clientX - rect.left) / rect.width;
    const newTime = clickedPercentage * (player.getDuration() || 225);
    player.seekTo(newTime, true);
    progressFill.style.width = `${clickedPercentage * 100}%`;
    currentTimeSpan.textContent = formatTime(newTime);
  });

  if (prevTrackBtn) prevTrackBtn.addEventListener('click', () => { if (player && isPlayerReady) player.seekTo(0, true); });
  if (nextTrackBtn) nextTrackBtn.addEventListener('click', () => { if (player && isPlayerReady) player.seekTo(0, true); });

  // ============================================================
  //  MEDIA CAROUSEL
  // ============================================================
  const mediaImg = document.getElementById('media-img');
  const mediaPrev = document.getElementById('media-prev');
  const mediaNext = document.getElementById('media-next');

  function switchMedia(direction) {
    if (direction === 'next') currentMediaIndex = (currentMediaIndex + 1) % mediaImages.length;
    else currentMediaIndex = (currentMediaIndex - 1 + mediaImages.length) % mediaImages.length;
    mediaImg.style.opacity = '0';
    setTimeout(() => { mediaImg.src = mediaImages[currentMediaIndex]; mediaImg.style.opacity = '1'; }, 200);
  }

  mediaPrev.addEventListener('click', () => switchMedia('prev'));
  mediaNext.addEventListener('click', () => switchMedia('next'));

  // ============================================================
  //  PULSE TOUCH BUTTON
  // ============================================================
  const pulseTouchBtn = document.getElementById('pulse-touch-btn');
  pulseTouchBtn.addEventListener('click', (e) => {
    const ripple = document.createElement('span');
    ripple.classList.add('btn-ripple');
    pulseTouchBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
    alert('Chào bạn mình là Hùm đâyy');
  });

  // ============================================================
  //  LIGHTBOX MODAL
  // ============================================================
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img-large');
  const closeBtn = document.querySelector('.modal-close');

  mediaImg.addEventListener('click', () => {
    if (document.body.classList.contains('admin-active')) return;
    modal.classList.add('show');
    modalImg.src = mediaImg.src;
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === closeBtn) modal.classList.remove('show');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) modal.classList.remove('show');
  });

  // ============================================================
  //  MOBILE MENU
  // ============================================================
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar-left');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('menu-open');
      const isOpen = sidebar.classList.contains('menu-open');
      const currentMenuIcon = document.getElementById('menu-icon');
      if (currentMenuIcon) {
        currentMenuIcon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
      }
      lucide.createIcons();
    });
  }

  // ============================================================
  //  SINGLE PAGE NAVIGATION
  // ============================================================
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  const sections = document.querySelectorAll('.page-section');

  function animateSkillsProgress() {
    document.querySelectorAll('.progress-fill').forEach(fill => {
      const target = fill.getAttribute('data-target') || '0';
      fill.style.width = '0%';
      setTimeout(() => { fill.style.width = `${target}%`; }, 150);
    });
  }

  function resetSkillsProgress() {
    document.querySelectorAll('.progress-fill').forEach(fill => { fill.style.width = '0%'; });
  }

  function switchPage(pageId) {
    sections.forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(`page-${pageId}`);
    if (targetSection) targetSection.classList.add('active');
    navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });
    if (pageId === 'home') animateSkillsProgress();
    else resetSkillsProgress();

    const bgIndex = document.querySelector('.bg-index');
    if (bgIndex) {
      const indexes = { home: '01', star: '02', gallery: '03', projects: '04', cv: '05' };
      bgIndex.textContent = indexes[pageId] || '01';
    }

    if (sidebar && sidebar.classList.contains('menu-open')) {
      sidebar.classList.remove('menu-open');
      const currentMenuIcon = document.getElementById('menu-icon');
      if (currentMenuIcon) currentMenuIcon.setAttribute('data-lucide', 'menu');
      lucide.createIcons();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage(item.getAttribute('data-page'));
    });
  });

  const backToHomeBtn = document.querySelector('.top-left-notch .btn-notch-action');
  if (backToHomeBtn) backToHomeBtn.addEventListener('click', () => switchPage('home'));

  const exploreProjectsBtn = document.getElementById('btn-explore-projects');
  if (exploreProjectsBtn) exploreProjectsBtn.addEventListener('click', () => switchPage('projects'));

  const contactFbBtn = document.getElementById('btn-contact-fb');
  if (contactFbBtn) contactFbBtn.addEventListener('click', () => window.open('https://www.facebook.com/vanhung.ho.75685962', '_blank'));

  document.querySelectorAll('.btn-back-home').forEach(btn => btn.addEventListener('click', () => switchPage('home')));

  const initialActiveNav = document.querySelector('.nav-item.active[data-page]');
  if (initialActiveNav && initialActiveNav.getAttribute('data-page') === 'home') animateSkillsProgress();

  const downloadCvBtn = document.getElementById('btn-download-cv');
  if (downloadCvBtn) downloadCvBtn.addEventListener('click', () => window.print());

  // ============================================================
  //  FACE ID BUTTON -> OPEN SCANNER
  // ============================================================
  const faceIdBtn = document.getElementById('face-id-btn');
  const scannerOverlay = document.getElementById('face-scanner-overlay');
  const scannerCloseBtn = document.getElementById('scanner-close-btn');

  faceIdBtn.addEventListener('click', () => {
    if (adminUnlocked) {
      showToast('ℹ️ Bạn đã xác thực rồi. Dùng nút Thoát Admin để khóa.', 'warning');
      return;
    }
    openScanner();
  });

  scannerCloseBtn.addEventListener('click', () => closeScanner());

  // ============================================================
  //  FACE SCANNER LOGIC
  // ============================================================
  async function openScanner() {
    scannerOverlay.classList.add('active');
    resetScannerUI();
    await runScannerPipeline();
  }

  function closeScanner() {
    stopCamera();
    scannerOverlay.classList.remove('active');
    if (scannerInterval) { clearInterval(scannerInterval); scannerInterval = null; }
  }

  function resetScannerUI() {
    // Reset all log entries
    ['log-model', 'log-camera', 'log-reference', 'log-scanning'].forEach(id => {
      const entry = document.getElementById(id);
      if (entry) {
        entry.className = 'log-entry';
        const dot = entry.querySelector('.log-dot');
        if (dot) dot.className = 'log-dot pending';
      }
    });
    // Reset result
    const result = document.getElementById('scanner-result');
    if (result) { result.className = 'scanner-result'; result.textContent = ''; }
    // Reset laser
    const laser = document.getElementById('laser-sweep');
    if (laser) laser.classList.remove('active');
    // Reset face target
    const faceTarget = document.getElementById('face-target-box');
    if (faceTarget) faceTarget.classList.remove('visible');
    // Reset subtitle
    document.querySelector('.scanner-subtitle').textContent = 'Hệ thống nhận diện AI đang khởi động...';
    setVideoStatus('Đang khởi động...');
    matchCount = 0;
  }

  function setLogState(logId, state, label) {
    const entry = document.getElementById(logId);
    if (!entry) return;
    entry.className = `log-entry ${state}`;
    const dot = entry.querySelector('.log-dot');
    if (dot) dot.className = `log-dot ${state}`;
    if (label) entry.querySelector('.log-text').textContent = label;
  }

  function setVideoStatus(text) {
    const el = document.getElementById('scanner-video-status');
    if (el) el.innerHTML = `<span>${text}</span>`;
  }

  async function runScannerPipeline() {
    // Step 1: Load models
    setLogState('log-model', 'loading');
    try {
      if (!modelsLoaded) {
        document.querySelector('.scanner-subtitle').textContent = 'Đang tải mô hình AI...';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        modelsLoaded = true;
      }
      setLogState('log-model', 'done', 'Tải mô hình AI nhận diện khuôn mặt ✓');
    } catch (err) {
      setLogState('log-model', 'error', 'Lỗi: Không tải được mô hình AI');
      showScannerError('❌ Không thể tải mô hình AI. Kiểm tra kết nối mạng và thử lại.');
      return;
    }

    // Step 2: Start camera
    setLogState('log-camera', 'loading');
    document.querySelector('.scanner-subtitle').textContent = 'Đang kết nối camera...';
    const video = document.getElementById('scanner-video');
    try {
      scannerStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      video.srcObject = scannerStream;
      await new Promise((resolve) => { video.onloadedmetadata = () => { video.play(); resolve(); }; });
      setLogState('log-camera', 'done', 'Kết nối camera ✓');
      setVideoStatus('Camera đang hoạt động');
    } catch (err) {
      setLogState('log-camera', 'error', 'Lỗi: Không thể truy cập camera');
      showScannerError('❌ Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.');
      return;
    }

    // Step 3: Load reference face from avatar.jpg
    setLogState('log-reference', 'loading');
    document.querySelector('.scanner-subtitle').textContent = 'Đọc dữ liệu khuôn mặt tham chiếu...';
    try {
      const avatarSrc = localStorage.getItem('portfolio-avatar') || 'avatar.jpg';
      const img = await faceapi.fetchImage(avatarSrc);
      const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setLogState('log-reference', 'error', 'Lỗi: Không tìm thấy khuôn mặt trong avatar');
        showScannerError('❌ Không tìm thấy khuôn mặt trong ảnh avatar. Vui lòng dùng ảnh rõ khuôn mặt.');
        stopCamera();
        return;
      }
      referenceDescriptor = detection.descriptor;
      setLogState('log-reference', 'done', 'Đọc dữ liệu khuôn mặt tham chiếu ✓');
    } catch (err) {
      setLogState('log-reference', 'error', 'Lỗi khi đọc ảnh tham chiếu');
      showScannerError('❌ Lỗi đọc ảnh tham chiếu: ' + err.message);
      stopCamera();
      return;
    }

    // Step 4: Start scanning loop
    setLogState('log-scanning', 'scanning', 'Đang quét & so khớp khuôn mặt...');
    document.querySelector('.scanner-subtitle').textContent = 'Vui lòng nhìn thẳng vào camera...';
    const laser = document.getElementById('laser-sweep');
    laser.classList.add('active');

    const canvas = document.getElementById('scanner-canvas');
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    let scanTimeout = setTimeout(() => {
      if (scannerInterval) { clearInterval(scannerInterval); scannerInterval = null; }
      stopCamera();
      laser.classList.remove('active');
      setLogState('log-scanning', 'error', 'Không nhận diện được — hết thời gian');
      showScannerError('⏱️ Hết thời gian! Không nhận diện được khuôn mặt. Hãy thử lại và đảm bảo ánh sáng đủ.');
    }, 18000);

    scannerInterval = setInterval(async () => {
      if (!video.videoWidth) return;

      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
          .withFaceLandmarks().withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const faceTarget = document.getElementById('face-target-box');

        if (detections.length === 0) {
          faceTarget.classList.remove('visible');
          setVideoStatus('Không thấy khuôn mặt...');
          return;
        }

        // Draw face box
        const box = resizedDetections[0].detection.box;
        const videoEl = document.getElementById('scanner-video');
        const rect = videoEl.getBoundingClientRect();
        const scaleX = rect.width / (video.videoWidth || 640);
        const scaleY = rect.height / (video.videoHeight || 480);
        // Mirror the box (scaleX(-1))
        const mirroredX = rect.width - (box.x + box.width) * scaleX;
        faceTarget.style.left = `${mirroredX}px`;
        faceTarget.style.top = `${box.y * scaleY}px`;
        faceTarget.style.width = `${box.width * scaleX}px`;
        faceTarget.style.height = `${box.height * scaleY}px`;
        faceTarget.classList.add('visible');

        // Compare with reference
        const descriptor = detections[0].descriptor;
        const distance = faceapi.euclideanDistance(descriptor, referenceDescriptor);

        if (distance < MATCH_THRESHOLD) {
          matchCount++;
          setVideoStatus(`Đang xác nhận... (${matchCount}/3)`);
          if (matchCount >= 3) {
            clearInterval(scannerInterval);
            scannerInterval = null;
            clearTimeout(scanTimeout);
            laser.classList.remove('active');
            faceTarget.style.border = '2px solid #00ff88';
            await new Promise(r => setTimeout(r, 400));
            stopCamera();
            onFaceMatched();
          }
        } else {
          matchCount = 0;
          setVideoStatus(`Đang tìm kiếm... (${Math.round((1 - distance) * 100)}%)`);
        }
      } catch (e) {
        // silently continue
      }
    }, 200);
  }

  function stopCamera() {
    if (scannerStream) {
      scannerStream.getTracks().forEach(t => t.stop());
      scannerStream = null;
    }
    const video = document.getElementById('scanner-video');
    if (video) video.srcObject = null;
  }

  function showScannerError(msg) {
    const result = document.getElementById('scanner-result');
    if (result) {
      result.className = 'scanner-result error';
      result.textContent = msg;
    }
    document.querySelector('.scanner-subtitle').textContent = 'Xác thực thất bại';
  }

  function onFaceMatched() {
    setLogState('log-scanning', 'done', 'Khuôn mặt khớp — Xác thực thành công! ✓');
    document.querySelector('.scanner-subtitle').textContent = 'Đang mở khóa Admin...';
    setVideoStatus('✅ Xác thực thành công!');

    const result = document.getElementById('scanner-result');
    result.className = 'scanner-result success';
    result.textContent = '✅ Xác thực thành công! Chào mừng trở lại, Hồ Văn Hùng! Đang mở chế độ Admin...';

    setTimeout(() => {
      closeScanner();
      adminUnlocked = true;
      sessionStorage.setItem('admin-unlocked', 'true');
      enableAdminMode(true);
    }, 1800);
  }

  // ============================================================
  //  ADMIN MODE ENABLE / DISABLE
  // ============================================================
  function enableAdminMode(showWelcome = false) {
    document.body.classList.add('admin-active');
    const toolbar = document.getElementById('admin-toolbar');
    toolbar.classList.add('active');
    lucide.createIcons();

    // Make text fields editable
    EDITABLE_KEYS.forEach(key => {
      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) el.contentEditable = 'true';
    });

    // Update face-id btn
    faceIdBtn.classList.add('unlocked');

    if (showWelcome) showToast('🔓 Chào mừng Admin! Bạn có thể chỉnh sửa nội dung.', 'success', 4000);
  }

  function disableAdminMode() {
    document.body.classList.remove('admin-active');
    const toolbar = document.getElementById('admin-toolbar');
    toolbar.classList.remove('active');

    // Remove editable
    EDITABLE_KEYS.forEach(key => {
      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) el.removeAttribute('contenteditable');
    });

    adminUnlocked = false;
    sessionStorage.removeItem('admin-unlocked');
    faceIdBtn.classList.remove('unlocked');
    showToast('🔒 Đã thoát chế độ Admin.', 'warning');
  }

  // ============================================================
  //  ADMIN TOOLBAR BUTTONS
  // ============================================================
  const adminSaveBtn = document.getElementById('admin-save-btn');
  const adminResetBtn = document.getElementById('admin-reset-btn');
  const adminExitBtn = document.getElementById('admin-exit-btn');

  adminSaveBtn.addEventListener('click', () => {
    // Save text fields
    EDITABLE_KEYS.forEach(key => {
      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) localStorage.setItem(`portfolio-${key}`, el.textContent.trim());
    });
    // Save media images list
    localStorage.setItem('portfolio-media-images', JSON.stringify(mediaImages));
    showToast('💾 Đã lưu tất cả thay đổi!', 'success');
  });

  adminResetBtn.addEventListener('click', () => {
    if (!confirm('⚠️ Bạn có chắc muốn xóa toàn bộ chỉnh sửa và quay về dữ liệu gốc không?')) return;

    // Clear all saved portfolio keys
    const allKeys = [...EDITABLE_KEYS.map(k => `portfolio-${k}`), 'portfolio-avatar', 'portfolio-hero', 'portfolio-media-images'];
    allKeys.forEach(k => localStorage.removeItem(k));

    // Reset text
    const defaults = {
      'name': 'Hồ Văn Hùng',
      'birth-day': '14',
      'birth-month': 'Tháng 5',
      'birth-year': '2005',
      'welcome-name': 'HỒ VĂN HÙNG',
      'welcome-sub': 'Đại Học Kinh Tế Huế - K57B Thương Mại Điện Tử',
      'bio1': 'Mình sinh năm 2005 đến từ Quảng Trị, Việt Nam. Hiện tại đang là sinh viên năm 3 tại trường Đại Học Kinh Tế Đại Học Huế.',
      'bio2': 'Mình đang học khóa K57B Nghành Thương Mại Điện Tử thuộc khoa Marketing và Thương Mại.'
    };
    Object.entries(defaults).forEach(([key, val]) => {
      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) el.textContent = val;
    });

    // Reset images
    document.querySelectorAll('.avatar-img').forEach(img => img.src = 'avatar.jpg');
    const cvAv = document.getElementById('cv-avatar-img');
    if (cvAv) cvAv.src = 'avatar.jpg';
    const heroPhoto = document.getElementById('hero-photo');
    if (heroPhoto) heroPhoto.src = 'avatar.jpg';
    mediaImages = [...MEDIA_IMAGES_DEFAULT];
    if (mediaImg) mediaImg.src = mediaImages[0];
    currentMediaIndex = 0;

    showToast('↩️ Đã khôi phục về dữ liệu gốc!', 'warning');
  });

  adminExitBtn.addEventListener('click', () => disableAdminMode());

  // ============================================================
  //  IMAGE UPLOAD HANDLERS
  // ============================================================

  // Helper: read file as base64 DataURL
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Avatar upload (desktop + mobile)
  function setupAvatarUpload(triggerId, inputId) {
    const trigger = document.getElementById(triggerId);
    const input = document.getElementById(inputId);
    if (!trigger || !input) return;

    trigger.addEventListener('click', () => {
      if (!adminUnlocked) return;
      input.click();
    });

    // Also click on the overlay directly
    const container = trigger.closest('.avatar-container');
    if (container) {
      const overlay = container.querySelector('.avatar-edit-overlay');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          e.stopPropagation();
          if (adminUnlocked) input.click();
        });
      }
    }

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataURL(file);
        document.querySelectorAll('.avatar-img').forEach(img => img.src = dataUrl);
        const cvAv = document.getElementById('cv-avatar-img');
        if (cvAv) cvAv.src = dataUrl;
        localStorage.setItem('portfolio-avatar', dataUrl);
        showToast('🖼️ Đã cập nhật ảnh đại diện!', 'success');
        input.value = '';
      } catch (err) { showToast('❌ Lỗi tải ảnh!', 'error'); }
    });
  }

  setupAvatarUpload('desktop-avatar-container', 'upload-avatar');
  setupAvatarUpload('mobile-avatar-container', 'upload-avatar');

  // Hero photo upload
  const heroPhotoOverlay = document.getElementById('hero-photo-edit-overlay');
  const uploadHeroInput = document.getElementById('upload-hero-photo');
  if (heroPhotoOverlay && uploadHeroInput) {
    heroPhotoOverlay.addEventListener('click', () => {
      if (adminUnlocked) uploadHeroInput.click();
    });
    uploadHeroInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataURL(file);
        const heroPhoto = document.getElementById('hero-photo');
        if (heroPhoto) heroPhoto.src = dataUrl;
        localStorage.setItem('portfolio-hero', dataUrl);
        showToast('🖼️ Đã cập nhật ảnh chính!', 'success');
        uploadHeroInput.value = '';
      } catch (err) { showToast('❌ Lỗi tải ảnh!', 'error'); }
    });
  }

  // Media images upload
  const mediaEditOverlay = document.getElementById('media-edit-overlay');
  if (mediaEditOverlay) {
    mediaEditOverlay.addEventListener('click', () => {
      if (!adminUnlocked) return;
      const inputId = `upload-media${currentMediaIndex + 1}`;
      const input = document.getElementById(inputId);
      if (input) input.click();
      else {
        // fallback to upload-media1
        document.getElementById('upload-media1').click();
      }
    });

    [1, 2, 3].forEach(i => {
      const input = document.getElementById(`upload-media${i}`);
      if (!input) return;
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const dataUrl = await readFileAsDataURL(file);
          mediaImages[currentMediaIndex] = dataUrl;
          if (mediaImg) mediaImg.src = dataUrl;
          showToast(`🖼️ Đã cập nhật ảnh ${currentMediaIndex + 1}!`, 'success');
          input.value = '';
        } catch (err) { showToast('❌ Lỗi tải ảnh!', 'error'); }
      });
    });
  }

});
