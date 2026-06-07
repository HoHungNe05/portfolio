document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();



  // 2. Interactive Like / Dislike Count
  const likeBtn = document.getElementById('like-btn');
  const likeCountSpan = document.getElementById('like-count');
  let likeCount = parseInt(likeCountSpan.textContent);
  let hasLiked = false;

  likeBtn.addEventListener('click', () => {
    if (!hasLiked) {
      likeCount++;
      likeCountSpan.textContent = likeCount;
      likeBtn.classList.add('animated-bounce');
      hasLiked = true;
      
      // Small visual feedback: pop heart
      const heartIcon = likeBtn.querySelector('i');
      heartIcon.style.transform = 'scale(1.4)';
      setTimeout(() => {
        heartIcon.style.transform = 'scale(1)';
        likeBtn.classList.remove('animated-bounce');
      }, 300);
    } else {
      likeCount--;
      likeCountSpan.textContent = likeCount;
      hasLiked = false;
    }
  });

  const dislikeBtn = document.getElementById('dislike-btn');
  const dislikeCountSpan = document.getElementById('dislike-count');
  let dislikeCount = parseInt(dislikeCountSpan.textContent);
  let hasDisliked = false;

  dislikeBtn.addEventListener('click', () => {
    if (!hasDisliked) {
      dislikeCount++;
      dislikeCountSpan.textContent = dislikeCount;
      hasDisliked = true;
      
      const thumbsDown = dislikeBtn.querySelector('i');
      thumbsDown.style.transform = 'scale(1.4)';
      setTimeout(() => {
        thumbsDown.style.transform = 'scale(1)';
      }, 300);
    } else {
      dislikeCount--;
      dislikeCountSpan.textContent = dislikeCount;
      hasDisliked = false;
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
      alert('Notifications turned ON for Jazzlyn Trisha!');
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
  const mediaImages = ['media.png', 'main.png'];
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
    
    alert('Thank you for interacting with Jazzlyn Trisha\'s Profile! ✨');
  });
});
