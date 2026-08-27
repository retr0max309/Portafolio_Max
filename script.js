/* =============================================
   PORTAFOLIO — Maximiliano Turdera Colque
   script.js — Interactividad y animaciones
   ============================================= */

/* ==========================================
   0. CANVAS — Red hacker / Watch Dogs 2
   ========================================== */
(function initHackerCanvas() {
  const canvas = document.getElementById('hack-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const WHITE   = '#f0f0f4';
  const PURPLE  = '#7c3aed';
  const NODE_COUNT = 60;
  const MAX_DIST    = 140;

  let W, H, nodes = [], mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.85 ? PURPLE : WHITE,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Actualizar posiciones
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy; n.pulse += 0.02;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    // Dibujar conexiones
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = a.color === PURPLE ? `rgba(124,58,237,${alpha})` : `rgba(240,240,244,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Dibujar nodos
    nodes.forEach(n => {
      const glow = Math.sin(n.pulse) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * glow, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = n.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Reacción al mouse: atraer nodos cercanos
    nodes.forEach(n => {
      const dx = mouse.x - n.x, dy = mouse.y - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        n.vx += dx * 0.0006;
        n.vy += dy * 0.0006;
        // Limitar velocidad
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 2) { n.vx = (n.vx / speed) * 2; n.vy = (n.vy / speed) * 2; }
      }
    });

    requestAnimationFrame(drawFrame);
  }

  window.addEventListener('resize', () => { resize(); createNodes(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  resize();
  createNodes();
  drawFrame();
})();

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================
     1. NAVBAR: scroll + active link
     ========================================== */
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateActiveNavLink();
  }, { passive: true });

  function updateActiveNavLink() {
    const sections = document.querySelectorAll('header[id], section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollY  = window.scrollY + 120;

    sections.forEach(section => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  /* ==========================================
     2. SMOOTH SCROLL (nav links)
     ========================================== */
  document.querySelectorAll('.nav-link, .contact-btn[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (!target) return;
        const navH = navbar ? navbar.offsetHeight : 0;
        const y = target.getBoundingClientRect().top + window.pageYOffset - (navH + 8);
        window.scrollTo({ top: y, behavior: 'smooth' });
        // Cerrar menú mobile si está abierto
        closeMobileMenu();
      }
    });
  });

  /* ==========================================
     3. HAMBURGER MENU (mobile)
     ========================================== */
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('nav-links');

  function closeMobileMenu() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    navLinksContainer.classList.remove('open');
  }

  if (hamburger && navLinksContainer) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      navLinksContainer.classList.toggle('open', isOpen);
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target)) closeMobileMenu();
    });
  }

  /* ==========================================
     4. TYPING ANIMATION (hero)
     ========================================== */
  const typedEl = document.getElementById('typed-text');
  const phrases = [
    'Full Stack',
    'Junior Dev',
    'Backend Dev',
    'ML & IA',
  ];
  let phraseIndex = 0;
  let charIndex   = 0;
  let isDeleting  = false;
  let typingTimer;

  function typeLoop() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typedEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typedEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let speed = isDeleting ? 60 : 110;

    if (!isDeleting && charIndex === currentPhrase.length) {
      speed = 1800; // pausa al final de la frase
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      speed = 400; // pausa antes de la siguiente frase
    }

    typingTimer = setTimeout(typeLoop, speed);
  }

  if (typedEl) {
    setTimeout(typeLoop, 800);
  }

  /* ==========================================
     5. SCROLL REVEAL (IntersectionObserver)
     ========================================== */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => revealObs.observe(el));
  } else {
    // Fallback: mostrar todo
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ==========================================
     6. SKILL BARS (animación al viewport)
     ========================================== */
  const progresses = document.querySelectorAll('.skill-progress');

  if ('IntersectionObserver' in window) {
    const barObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target.getAttribute('data-width') || '0%';
          entry.target.style.width = target;
          barObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    progresses.forEach(p => barObs.observe(p));
  } else {
    progresses.forEach(p => { p.style.width = p.getAttribute('data-width') || '0%'; });
  }

  /* ==========================================
     7. COUNTER ANIMATION (stats en profile)
     ========================================== */
  function animateCounter(el, target, duration = 1400) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start);
      }
    }, 16);
  }

  const statNumbers = document.querySelectorAll('.stat-number');
  let countersStarted = false;

  if ('IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          statNumbers.forEach(el => {
            const target = parseInt(el.getAttribute('data-count') || '0', 10);
            animateCounter(el, target);
          });
          counterObs.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const profileCard = document.querySelector('.profile-card');
    if (profileCard) counterObs.observe(profileCard);
  }

  /* ==========================================
     8. UPLOAD DE FOTO DE PERFIL
     ========================================== */
  const photoUpload  = document.getElementById('photoUpload');
  const profileImage = document.getElementById('profileImage');

  if (photoUpload && profileImage) {
    photoUpload.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = event => { profileImage.src = event.target.result; };
      reader.readAsDataURL(file);
    });
  }

  /* ==========================================
     9. EFECTO TILT en project cards
     ========================================== */
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const centerX = rect.width  / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) *  5;
      card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ==========================================
     10. CISCO ACCORDION (bloque colapsable)
     ========================================== */
  const ciscoBlock    = document.getElementById('cisco-block');
  const ciscoToggle   = document.getElementById('cisco-toggle');
  const ciscoExpanded = document.getElementById('cisco-expanded');
  const ciscoCollapse = document.getElementById('cisco-collapse');

  function openCisco() {
    ciscoBlock.setAttribute('data-open', 'true');
    ciscoToggle.setAttribute('aria-expanded', 'true');
    ciscoExpanded.setAttribute('aria-hidden', 'false');
  }

  function closeCisco() {
    ciscoBlock.setAttribute('data-open', 'false');
    ciscoToggle.setAttribute('aria-expanded', 'false');
    ciscoExpanded.setAttribute('aria-hidden', 'true');
  }

  if (ciscoToggle && ciscoExpanded) {
    ciscoToggle.addEventListener('click', () => {
      const isOpen = ciscoToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeCisco() : openCisco();
    });

    // Soporte teclado
    ciscoToggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ciscoToggle.click();
      }
    });
  }

  if (ciscoCollapse) {
    ciscoCollapse.addEventListener('click', () => {
      closeCisco();
      // Scroll suave de vuelta al bloque
      ciscoBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ==========================================
     11. PIXEL SCRAMBLE REVEAL (jhey.dev style X-mask)
     ========================================== */
  const CHARS = 'X█▒░#%/\\_?:;@&$!*+~';

  function createXMask(targetLength) {
    return 'X'.repeat(targetLength);
  }

  const pixelRows = document.querySelectorAll('.pixel-contact-row');

  pixelRows.forEach(row => {
    const textSpan = row.querySelector('.pixel-text');
    if (!textSpan) return;

    const finalText = row.getAttribute('data-text') || textSpan.textContent;
    const len = finalText.length;
    let intervalId = null;
    let isRevealed = false;

    // Estado inicial de X's
    textSpan.textContent = createXMask(len);

    function scrambleTo(targetText, callback) {
      clearInterval(intervalId);
      let iteration = 0;
      const totalSteps = len;

      intervalId = setInterval(() => {
        textSpan.textContent = targetText
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            if (char === ' ') return ' ';
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');

        if (iteration >= totalSteps) {
          clearInterval(intervalId);
          textSpan.textContent = targetText;
          if (callback) callback();
        }
        iteration += 1 / 2; // velocidad de revelación
      }, 30);
    }

    row.addEventListener('mouseenter', () => {
      if (!isRevealed) {
        scrambleTo(finalText, () => { isRevealed = true; });
      }
    });

    row.addEventListener('mouseleave', () => {
      if (isRevealed) {
        const xMask = createXMask(len);
        scrambleTo(xMask, () => { isRevealed = false; });
      }
    });

    // Auto-revelar si entra en pantalla por scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isRevealed) {
          setTimeout(() => {
            scrambleTo(finalText, () => { isRevealed = true; });
          }, 300);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(row);
  });

});

