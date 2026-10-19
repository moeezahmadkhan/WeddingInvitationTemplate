/* ============================================================
   IRSA & JUNAID — DIGITAL WEDDING INVITATION
   Paginated Mobile Core Logic & Interactive Features
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const audio = document.getElementById('weddingAudio');
  const audioBtn = document.getElementById('audioToggleBtn');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  
  const envelopeOverlay = document.getElementById('envelopeOverlay');
  const envelopeVideoWrap = document.getElementById('envelopeVideoWrap');
  const envelopeVideo = document.getElementById('envelopeVideo');
  const pageIndicators = document.getElementById('pageIndicators');
  const scrollContainer = document.getElementById('invitationContent');
  const dots = document.querySelectorAll('.page-indicators .dot');

  let audioUnlocked = false;
  let envelopeOpened = false;

  /* ============================================================
     1. ENVELOPE OPENING & AUDIO ORCHESTRATION
     ============================================================ */
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    const promise = audio.play();
    if (promise && promise.then) {
      promise.then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }
  }

  function openEnvelope() {
    if (envelopeOpened) return;
    envelopeOpened = true;

    // Trigger audio
    audio.volume = 1;
    audio.play().catch(() => {});

    // Fade out initial static envelope overlay
    envelopeOverlay.style.opacity = '0';
    envelopeOverlay.style.pointerEvents = 'none';
    setTimeout(() => {
      envelopeOverlay.style.display = 'none';
    }, 1200);

    // Fade in 3D envelope opening video & play
    envelopeVideoWrap.classList.add('is-active');
    envelopeVideo.currentTime = 0;
    envelopeVideo.play().catch(() => {});

    // Transition smoothly into invitation content near end of video
    envelopeVideo.addEventListener('timeupdate', function onTimeUpdate() {
      if (envelopeVideo.duration && envelopeVideo.currentTime >= envelopeVideo.duration - 0.7) {
        envelopeVideo.removeEventListener('timeupdate', onTimeUpdate);
        finishEnvelopeOpening();
      }
    });

    // Fallback timer
    setTimeout(finishEnvelopeOpening, 8500);
  }

  function finishEnvelopeOpening() {
    envelopeVideoWrap.classList.remove('is-active');
    envelopeVideoWrap.classList.add('fade-out');
    setTimeout(() => {
      envelopeVideoWrap.style.display = 'none';
      try { envelopeVideo.pause(); } catch(e) {}
    }, 1200);

    // Show floating audio toggle & page indicator dots
    audioBtn.classList.add('is-visible');
    pageIndicators.classList.add('is-visible');

    // Trigger initial scratch card resize
    window.dispatchEvent(new Event('resize'));
  }

  envelopeOverlay.addEventListener('touchstart', unlockAudio, { passive: true });
  envelopeOverlay.addEventListener('click', openEnvelope);

  // Audio Play/Pause Toggle
  audioBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        iconPause.classList.remove('is-hidden');
        iconPlay.classList.add('is-hidden');
      }).catch(() => {});
    } else {
      audio.pause();
      iconPause.classList.add('is-hidden');
      iconPlay.classList.remove('is-hidden');
    }
  });


  /* ============================================================
     2. PAGINATION & NAVIGATION
     ============================================================ */
  const pages = document.querySelectorAll('.page-screen');

  window.goToNextPage = function() {
    const currentScroll = scrollContainer.scrollTop;
    const pageHeight = scrollContainer.clientHeight;
    const currentPageIndex = Math.round(currentScroll / pageHeight);
    const nextIndex = Math.min(currentPageIndex + 1, pages.length - 1);
    
    scrollContainer.scrollTo({
      top: nextIndex * pageHeight,
      behavior: 'smooth'
    });
  };

  window.goToPage = function(index) {
    const pageHeight = scrollContainer.clientHeight;
    scrollContainer.scrollTo({
      top: index * pageHeight,
      behavior: 'smooth'
    });
  };

  // Keyboard Navigation for Desktop Testing
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      goToNextPage();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const currentScroll = scrollContainer.scrollTop;
      const pageHeight = scrollContainer.clientHeight;
      const prevIndex = Math.max(Math.round(currentScroll / pageHeight) - 1, 0);
      goToPage(prevIndex);
    }
  });

  // Track active page and update indicators
  scrollContainer.addEventListener('scroll', () => {
    const currentScroll = scrollContainer.scrollTop;
    const pageHeight = scrollContainer.clientHeight;
    const activeIndex = Math.round(currentScroll / pageHeight);

    dots.forEach((dot, idx) => {
      if (idx === activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // If navigated to scratch card page, make sure canvases are painted
    if (activeIndex === 1) {
      window.dispatchEvent(new Event('resize'));
    }
  }, { passive: true });


  /* ============================================================
     3. INTERACTIVE SCRATCH CARDS
     ============================================================ */
  const scratchCards = [
    { boxId: 'cardDay', canvasId: 'canvasDay' },
    { boxId: 'cardMonth', canvasId: 'canvasMonth' },
    { boxId: 'cardYear', canvasId: 'canvasYear' }
  ];

  let scratchedCount = 0;
  let allCardsRevealed = false;

  function paintChampagneFoil(ctx, w, h) {
    if (!w || !h) return;
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#FFFDF7');
    base.addColorStop(0.24, '#F9EEDC');
    base.addColorStop(0.52, '#EED8B8');
    base.addColorStop(0.78, '#D7B67F');
    base.addColorStop(1, '#B98238');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.42, h * 0.25, 0, w * 0.42, h * 0.25, w * 0.82);
    glow.addColorStop(0, 'rgba(255, 255, 252, 0.98)');
    glow.addColorStop(0.30, 'rgba(255, 247, 229, 0.58)');
    glow.addColorStop(0.67, 'rgba(245, 222, 185, 0.12)');
    glow.addColorStop(1, 'rgba(245, 222, 185, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.085;
    for (let i = -h; i < w + h; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h * 0.72, h);
      ctx.strokeStyle = '#FFF9EC';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    ctx.globalAlpha = 0.045;
    for (let i = -h + 10; i < w + h; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h * 0.72, h);
      ctx.strokeStyle = '#A66C20';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.globalAlpha = 0.35;
    const sparkleCoords = [
      [w * 0.14, h * 0.18], [w * 0.50, h * 0.10], [w * 0.84, h * 0.22],
      [w * 0.22, h * 0.78], [w * 0.72, h * 0.82], [w * 0.88, h * 0.58]
    ];

    sparkleCoords.forEach(([dx, dy], idx) => {
      const radius = idx % 2 === 0 ? 5 : 4;
      const rg = ctx.createRadialGradient(dx, dy, 0, dx, dy, radius);
      rg.addColorStop(0, 'rgba(255, 255, 250, 1)');
      rg.addColorStop(0.4, 'rgba(255, 239, 206, 0.42)');
      rg.addColorStop(1, 'rgba(255, 230, 183, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255, 253, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  scratchCards.forEach(({ boxId, canvasId }) => {
    const box = document.getElementById(boxId);
    const cvs = document.getElementById(canvasId);
    if (!cvs || !box) return;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });

    let isDone = false;
    let isDown = false;

    function resize() {
      const rect = box.getBoundingClientRect();
      if (rect.width <= 0) return;
      cvs.width = Math.round(rect.width);
      cvs.height = Math.round(rect.height);
      if (!isDone) {
        paintChampagneFoil(ctx, cvs.width, cvs.height);
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function getCoords(clientX, clientY) {
      const rect = cvs.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (cvs.width / rect.width),
        y: (clientY - rect.top) * (cvs.height / rect.height)
      };
    }

    function scratchAt(x, y) {
      if (isDone) return;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      checkThreshold();
    }

    function checkThreshold() {
      if (Math.random() > 0.15) return;
      const d = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
      let visible = 0, total = 0;
      for (let i = 3; i < d.length; i += 16) {
        total++;
        if (d[i] > 10) visible++;
      }
      if ((total - visible) / total > 0.38) {
        finishCard();
      }
    }

    function finishCard() {
      if (isDone) return;
      isDone = true;
      cvs.style.opacity = '0';
      setTimeout(() => {
        cvs.style.display = 'none';
      }, 400);

      scratchedCount++;
      if (scratchedCount === 3 && !allCardsRevealed) {
        allCardsRevealed = true;
        setTimeout(celebrateAllRevealed, 350);
      }
    }

    cvs.revealCard = finishCard;

    cvs.addEventListener('mousedown', (e) => {
      isDown = true;
      const p = getCoords(e.clientX, e.clientY);
      scratchAt(p.x, p.y);
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const p = getCoords(e.clientX, e.clientY);
      scratchAt(p.x, p.y);
    });
    window.addEventListener('mouseup', () => { isDown = false; });

    cvs.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDown = true;
      const t = e.touches[0];
      const p = getCoords(t.clientX, t.clientY);
      scratchAt(p.x, p.y);
    }, { passive: false });

    cvs.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!isDown) return;
      const t = e.touches[0];
      const p = getCoords(t.clientX, t.clientY);
      scratchAt(p.x, p.y);
    }, { passive: false });

    cvs.addEventListener('touchend', (e) => {
      e.preventDefault();
      isDown = false;
    }, { passive: false });
  });

  const btnRevealAll = document.getElementById('btnRevealAll');
  if (btnRevealAll) {
    btnRevealAll.addEventListener('click', () => {
      scratchCards.forEach(({ canvasId }) => {
        const cvs = document.getElementById(canvasId);
        if (cvs && cvs.revealCard) cvs.revealCard();
      });
      btnRevealAll.style.opacity = '0.4';
      btnRevealAll.style.pointerEvents = 'none';
    });
  }

  function celebrateAllRevealed() {
    launchCelebrationConfetti(80);
  }


  /* ============================================================
     4. CELEBRATION CONFETTI ENGINE
     ============================================================ */
  function launchCelebrationConfetti(count = 70) {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const goldPalette = [
      '#B98238', '#D7B67F', '#EED8B8', '#F9EEDC',
      '#FFFDF7', '#966C22', '#C69E58', '#E2BE76'
    ];

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 2.2,
      vy: Math.random() * 2.5 + 1.8,
      w: Math.random() * 8 + 4,
      h: Math.random() * 5 + 3,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.1,
      color: goldPalette[Math.floor(Math.random() * goldPalette.length)],
      opacity: 1
    }));

    let animId;
    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.vAngle;
        if (p.y > canvas.height * 0.8) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0 && p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animId);
      }
    }
    renderConfetti();
  }


  /* ============================================================
     5. LIVE COUNTDOWN TIMER
     ============================================================ */
  const weddingDate = new Date('2026-12-05T19:00:00+05:00');

  const elDays = document.getElementById('days');
  const elHours = document.getElementById('hours');
  const elMins = document.getElementById('minutes');
  const elSecs = document.getElementById('seconds');

  function updateCountdown() {
    const now = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
      if (elDays) elDays.textContent = '000';
      if (elHours) elHours.textContent = '00';
      if (elMins) elMins.textContent = '00';
      if (elSecs) elSecs.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);

    if (elDays) elDays.textContent = String(d).padStart(3, '0');
    if (elHours) elHours.textContent = String(h).padStart(2, '0');
    if (elMins) elMins.textContent = String(m).padStart(2, '0');
    if (elSecs) elSecs.textContent = String(s).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);


  /* ============================================================
     6. ADD TO CALENDAR (.ICS GENERATION)
     ============================================================ */
  const btnCalendar = document.getElementById('btnAddToCalendar');
  if (btnCalendar) {
    btnCalendar.addEventListener('click', () => {
      const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Irsa & Junaid Wedding//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'SUMMARY:Wedding Ceremony — Irsa & Junaid',
        'DESCRIPTION:Join us for the Wedding Ceremony of Irsa Khan & Junaid Aly at Topaz Marquee, Johar Town, Lahore.',
        'LOCATION:Topaz Marquee, Behind LDA Sports Complex, Block D-2, M.A. Johar Town, Lahore, Pakistan',
        'DTSTART:20261205T140000Z',
        'DTEND:20261205T200000Z',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'Irsa_Junaid_Wedding.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }


  /* ============================================================
     7. INTERACTIVE RSVP FORM
     ============================================================ */
  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpSuccess = document.getElementById('rsvpSuccessMessage');
  const rsvpSuccessText = document.getElementById('rsvpSuccessText');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const guestName = document.getElementById('guestName').value.trim();
      const attending = document.querySelector('input[name="attending"]:checked').value;
      const guestsCount = document.getElementById('guestsCount').value;
      const guestMessage = document.getElementById('guestMessage').value.trim();

      const rsvpData = {
        name: guestName,
        attending: attending === 'yes',
        guests: attending === 'yes' ? guestsCount : 0,
        message: guestMessage,
        submittedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('irsa_junaid_rsvp', JSON.stringify(rsvpData));
      } catch (err) {}

      rsvpForm.style.display = 'none';
      rsvpSuccess.classList.remove('is-hidden');

      if (attending === 'yes') {
        rsvpSuccessText.textContent = `Dearest ${guestName}, we are overjoyed that you will be joining us to celebrate our wedding! See you in Lahore! 🤍`;
        launchCelebrationConfetti(90);
      } else {
        rsvpSuccessText.textContent = `Dear ${guestName}, thank you for letting us know. You will be dearly missed in Lahore, and we warmly cherish your prayers and duas! 🤍`;
      }
    });
  }

});
