document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Dynamic Real-time Welcome Greeting
  const welcomeGreeting = document.getElementById('welcome-greeting');
  if (welcomeGreeting) {
    const hours = new Date().getHours();
    let greeting = "Xin chào! Mình là";
    if (hours >= 5 && hours < 12) {
      greeting = "Xin chào buổi sáng! Mình là";
    } else if (hours >= 12 && hours < 14) {
      greeting = "Xin chào buổi trưa! Mình là";
    } else if (hours >= 14 && hours < 18) {
      greeting = "Xin chào buổi chiều! Mình là";
    } else {
      greeting = "Xin chào buổi tối! Mình là";
    }
    welcomeGreeting.textContent = greeting;
  }

  // Sun/Moon Theme Toggler Switch Logic
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

  // 2. Interactive Like / Dislike Count (Server-based)
  const likeBtn = document.getElementById('like-btn');
  const likeCountSpan = document.getElementById('like-count');
  const dislikeBtn = document.getElementById('dislike-btn');
  const dislikeCountSpan = document.getElementById('dislike-count');

  let hasLiked = localStorage.getItem('has-liked-hohung') === 'true';
  let hasDisliked = localStorage.getItem('has-disliked-hohung') === 'true';

  // Fetch initial counts from server
  async function fetchCounts() {
    try {
      const likesRes = await fetch('https://abacus.jasoncameron.dev/get/hohung_portfolio/likes');
      const likesData = await likesRes.json();
      likeCountSpan.textContent = likesData.value || 0;

      const dislikesRes = await fetch('https://abacus.jasoncameron.dev/get/hohung_portfolio/dislikes');
      const dislikesData = await dislikesRes.json();
      dislikeCountSpan.textContent = dislikesData.value || 0;
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  }

  fetchCounts();

  // Highlight if already liked/disliked
  if (hasLiked) {
    likeBtn.classList.add('active');
  }
  if (hasDisliked) {
    dislikeBtn.classList.add('active');
  }

  likeBtn.addEventListener('click', async () => {
    if (hasLiked) {
      alert('Bạn đã thích trang này rồi! Cảm ơn bạn nhé! ❤️');
      return;
    }
    
    if (hasDisliked) {
      alert('Bạn đang dislike trang này, hãy tải lại trang nếu muốn đổi ý nhé!');
      return;
    }

    try {
      likeBtn.classList.add('animated-bounce');
      // Increment on server
      const res = await fetch('https://abacus.jasoncameron.dev/hit/hohung_portfolio/likes');
      const data = await res.json();
      likeCountSpan.textContent = data.value;
      
      hasLiked = true;
      localStorage.setItem('has-liked-hohung', 'true');
      likeBtn.classList.add('active');

      // Small visual feedback: pop heart
      const heartIcon = likeBtn.querySelector('i');
      heartIcon.style.transform = 'scale(1.4)';
      setTimeout(() => {
        heartIcon.style.transform = 'scale(1)';
        likeBtn.classList.remove('animated-bounce');
      }, 300);
    } catch (err) {
      console.error('Error sending like:', err);
    }
  });

  dislikeBtn.addEventListener('click', async () => {
    if (hasDisliked) {
      alert('Bạn đã dislike trang này rồi! 😢');
      return;
    }

    if (hasLiked) {
      alert('Bạn đang thích trang này rồi, cảm ơn bạn nhé!');
      return;
    }

    try {
      // Increment on server
      const res = await fetch('https://abacus.jasoncameron.dev/hit/hohung_portfolio/dislikes');
      const data = await res.json();
      dislikeCountSpan.textContent = data.value;

      hasDisliked = true;
      localStorage.setItem('has-disliked-hohung', 'true');
      dislikeBtn.classList.add('active');

      const thumbsDown = dislikeBtn.querySelector('i');
      thumbsDown.style.transform = 'scale(1.4)';
      setTimeout(() => {
        thumbsDown.style.transform = 'scale(1)';
      }, 300);
    } catch (err) {
      console.error('Error sending dislike:', err);
    }
  });

  // Bell Notification Toggle
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
    lucide.createIcons(); // Refresh icons
  });

  // 3. YouTube Audio Player Integration
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

  // Load YouTube IFrame Player API
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('youtube-player', {
      height: '0',
      width: '0',
      videoId: 'ERABWON9Qck',
      playerVars: {
        'playsinline': 1,
        'controls': 0,
        'disablekb': 1,
        'rel': 0
      },
      events: {
        'onReady': () => {
          isPlayerReady = true;
          const duration = player.getDuration();
          if (duration) {
            totalTimeSpan.textContent = formatTime(duration);
          }
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
      
      if (event.data === YT.PlayerState.ENDED) {
        progressFill.style.width = '0%';
        currentTimeSpan.textContent = "0:00";
      }
    }
  }

  function startProgressTimer() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      if (player && isPlayerReady) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration() || 225;
        const percent = (currentTime / duration) * 100;
        progressFill.style.width = `${percent}%`;
        currentTimeSpan.textContent = formatTime(currentTime);
        totalTimeSpan.textContent = formatTime(duration);
      }
    }, 250);
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function togglePlayPause() {
    if (!player || !isPlayerReady) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  playPauseBtn.addEventListener('click', togglePlayPause);

  progressBarContainer.addEventListener('click', (e) => {
    if (!player || !isPlayerReady) return;
    const rect = progressBarContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickedPercentage = clickX / width;
    const duration = player.getDuration() || 225;
    const newTime = clickedPercentage * duration;
    player.seekTo(newTime, true);
    
    progressFill.style.width = `${clickedPercentage * 100}%`;
    currentTimeSpan.textContent = formatTime(newTime);
  });

  if (prevTrackBtn) {
    prevTrackBtn.addEventListener('click', () => {
      if (player && isPlayerReady) {
        player.seekTo(0, true);
      }
    });
  }

  if (nextTrackBtn) {
    nextTrackBtn.addEventListener('click', () => {
      if (player && isPlayerReady) {
        player.seekTo(0, true);
      }
    });
  }

  // 4. Media Carousel Slide Simulator
  const mediaImg = document.getElementById('media-img');
  const mediaPrev = document.getElementById('media-prev');
  const mediaNext = document.getElementById('media-next');
  
  // Carousel images array
  const mediaImages = ['media1.jpg', 'media2.jpg', 'media3.jpg'];
  let currentMediaIndex = 0;

  function switchMedia(direction) {
    if (direction === 'next') {
      currentMediaIndex = (currentMediaIndex + 1) % mediaImages.length;
    } else {
      currentMediaIndex = (currentMediaIndex - 1 + mediaImages.length) % mediaImages.length;
    }
    
    // Add simple fade effect
    mediaImg.style.opacity = '0';
    setTimeout(() => {
      mediaImg.src = mediaImages[currentMediaIndex];
      mediaImg.style.opacity = '1';
    }, 200);
  }

  mediaPrev.addEventListener('click', () => switchMedia('prev'));
  mediaNext.addEventListener('click', () => switchMedia('next'));



  // 6. Pulse Touch Button Ripple Effect
  const pulseTouchBtn = document.getElementById('pulse-touch-btn');
  pulseTouchBtn.addEventListener('click', (e) => {
    // Create custom ripple effect
    const ripple = document.createElement('span');
    ripple.classList.add('btn-ripple');
    pulseTouchBtn.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 1000);
    
    alert('Thank you for interacting with Hồ Văn Hùng\'s Profile! ✨');
  });

  // Lightbox Modal for Media Carousel Images
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img-large');
  const closeBtn = document.querySelector('.modal-close');

  mediaImg.addEventListener('click', () => {
    modal.classList.add('show');
    modalImg.src = mediaImg.src;
  });

  // Close modal when clicking on the close button or outside the image
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === closeBtn) {
      modal.classList.remove('show');
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
    }
  });

  // Mobile menu toggle logic
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar-left');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('menu-open');
      const isOpen = sidebar.classList.contains('menu-open');
      
      // Query the icon dynamically to avoid stale references after Lucide updates the DOM
      const currentMenuIcon = document.getElementById('menu-icon');
      if (currentMenuIcon) {
        if (isOpen) {
          currentMenuIcon.setAttribute('data-lucide', 'x');
        } else {
          currentMenuIcon.setAttribute('data-lucide', 'menu');
        }
      }
      lucide.createIcons(); // Re-render Lucide icons
    });
  }



  // --- Single Page Navigation ---
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  const sections = document.querySelectorAll('.page-section');

  function animateSkillsProgress() {
    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach(fill => {
      const target = fill.getAttribute('data-target') || '0';
      fill.style.width = '0%';
      setTimeout(() => {
        fill.style.width = `${target}%`;
      }, 150);
    });
  }

  function resetSkillsProgress() {
    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach(fill => {
      fill.style.width = '0%';
    });
  }

  function switchPage(pageId) {
    sections.forEach(sec => sec.classList.remove('active'));

    const targetSection = document.getElementById(`page-${pageId}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    navItems.forEach(item => {
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (pageId === 'home') {
      animateSkillsProgress();
    } else {
      resetSkillsProgress();
    }

    const bgIndex = document.querySelector('.bg-index');
    if (bgIndex) {
      const indexes = { home: '01', star: '02', gallery: '03', projects: '04' };
      bgIndex.textContent = indexes[pageId] || '01';
    }

    // Collapse mobile sidebar
    if (sidebar && sidebar.classList.contains('menu-open')) {
      sidebar.classList.remove('menu-open');
      const currentMenuIcon = document.getElementById('menu-icon');
      if (currentMenuIcon) {
        currentMenuIcon.setAttribute('data-lucide', 'menu');
      }
      lucide.createIcons();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.getAttribute('data-page');
      switchPage(pageId);
    });
  });

  // Notch back to Home
  const backToHomeBtn = document.querySelector('.top-left-notch .btn-notch-action');
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
      switchPage('home');
    });
  }

  // Home actions
  const exploreProjectsBtn = document.getElementById('btn-explore-projects');
  if (exploreProjectsBtn) {
    exploreProjectsBtn.addEventListener('click', () => {
      switchPage('projects');
    });
  }

  const contactFbBtn = document.getElementById('btn-contact-fb');
  if (contactFbBtn) {
    contactFbBtn.addEventListener('click', () => {
      window.open('https://www.facebook.com/vanhung.ho.75685962', '_blank');
    });
  }

  // Back home button from placeholders
  const backHomeButtons = document.querySelectorAll('.btn-back-home');
  backHomeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchPage('home');
    });
  });

  // Trigger animations on load if Home page is active
  const initialActiveNav = document.querySelector('.nav-item.active[data-page]');
  if (initialActiveNav && initialActiveNav.getAttribute('data-page') === 'home') {
    animateSkillsProgress();
  }
});
