/* ══════════════════════════════════════════════════════
   AWS Cloud Website — JavaScript
   ══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── DOM references ───────────────────────────────────
  const navbar       = document.getElementById('navbar');
  const navToggle    = document.getElementById('nav-toggle');
  const navMenu      = document.getElementById('nav-menu');
  const navLinks     = document.querySelectorAll('.nav-link');
  const contactForm  = document.getElementById('contact-form');
  const formStatus   = document.getElementById('form-status');
  const backToTop    = document.getElementById('back-to-top');
  const heroParticles = document.getElementById('hero-particles');

  // ══════════════════════════════════════════════════════
  //  1. NAVBAR — Scroll Styling
  // ══════════════════════════════════════════════════════
  function handleNavScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // initial check

  // ══════════════════════════════════════════════════════
  //  2. MOBILE MENU TOGGLE
  // ══════════════════════════════════════════════════════
  navToggle.addEventListener('click', function () {
    navToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // ══════════════════════════════════════════════════════
  //  3. ACTIVE NAV LINK on Scroll (Intersection Observer)
  // ══════════════════════════════════════════════════════
  const sections = document.querySelectorAll('section[id]');

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { rootMargin: '-30% 0px -70% 0px' }
  );

  sections.forEach(function (sec) {
    sectionObserver.observe(sec);
  });

  // ══════════════════════════════════════════════════════
  //  4. SCROLL ANIMATIONS (Intersection Observer)
  // ══════════════════════════════════════════════════════
  const animatedElements = document.querySelectorAll('[data-animate]');

  const animObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay, 10) || 0;
          setTimeout(function () {
            entry.target.classList.add('visible');
          }, delay);
          animObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  animatedElements.forEach(function (el) {
    animObserver.observe(el);
  });

  // ══════════════════════════════════════════════════════
  //  5. HERO COUNTER ANIMATION
  // ══════════════════════════════════════════════════════
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  let countersStarted = false;

  function animateCounters() {
    if (countersStarted) return;
    countersStarted = true;

    statNumbers.forEach(function (el) {
      const target = parseFloat(el.dataset.target);
      if (isNaN(target)) return;
      const isFloat = target % 1 !== 0;
      const duration = 2000;
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;

        if (isFloat) {
          el.textContent = current.toFixed(2);
        } else {
          el.textContent = Math.round(current);
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = isFloat ? target.toFixed(2) : target;
        }
      }

      requestAnimationFrame(step);
    });
  }

  // Trigger when hero is visible
  const heroSection = document.getElementById('hero');
  const heroObserver = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting) {
        animateCounters();
        heroObserver.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  if (heroSection) heroObserver.observe(heroSection);

  // ── Visitor tracking API ──────────────────────────────
  async function trackVisitor() {
    try {
      const res = await fetch('/api/visit', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const viewsEl = document.getElementById('hero-live-views');
        const uniqueEl = document.getElementById('hero-live-unique');
        if (viewsEl && data.totalVisitors) viewsEl.textContent = data.totalVisitors;
        if (uniqueEl && data.uniqueVisitors) uniqueEl.textContent = data.uniqueVisitors;
      }
    } catch (e) {
      console.log('Running in static mode or backend offline:', e.message);
    }
  }
  trackVisitor();

  // ══════════════════════════════════════════════════════
  //  6. CONTACT FORM (Connected to Backend API)
  // ══════════════════════════════════════════════════════
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name    = document.getElementById('contact-name').value.trim();
    const email   = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      formStatus.textContent = 'Please fill in all fields.';
      formStatus.className = 'form-status error';
      return;
    }

    formStatus.textContent = 'Sending message to backend server...';
    formStatus.className = 'form-status';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        formStatus.textContent = '✓ ' + (result.message || 'Message saved successfully! Check the Admin Dashboard.');
        formStatus.className = 'form-status success';
        contactForm.reset();
      } else {
        formStatus.textContent = '⚠ ' + (result.error || 'Failed to submit message.');
        formStatus.className = 'form-status error';
      }
    } catch (err) {
      // Graceful fallback for static preview mode
      formStatus.textContent = '✓ Message received! (Preview mode - server offline)';
      formStatus.className = 'form-status success';
      contactForm.reset();
    }

    setTimeout(function () {
      formStatus.textContent = '';
      formStatus.className = 'form-status';
    }, 6000);
  });

  // ══════════════════════════════════════════════════════
  //  7. BACK TO TOP BUTTON
  // ══════════════════════════════════════════════════════
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ══════════════════════════════════════════════════════
  //  8. FLOATING PARTICLE BACKGROUND (Canvas)
  // ══════════════════════════════════════════════════════
  function initParticles() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    heroParticles.appendChild(canvas);

    let width, height, particles;
    const PARTICLE_COUNT = 60;

    function resize() {
      width = canvas.width = heroParticles.offsetWidth;
      height = canvas.height = heroParticles.offsetHeight;
    }

    function createParticles() {
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.4 + 0.1
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(238, 9, 121,' + p.opacity + ')';
        ctx.fill();

        // Draw connections
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx = p.x - p2.x;
          var dy = p.y - p2.y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(123, 47, 247,' + (0.08 * (1 - dist / 140)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawParticles);
    }

    resize();
    createParticles();
    drawParticles();

    window.addEventListener('resize', function () {
      resize();
      createParticles();
    });
  }

  initParticles();

  // ══════════════════════════════════════════════════════
  //  9. SMOOTH SCROLL POLYFILL (for older browsers)
  // ══════════════════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var targetId = this.getAttribute('href');
      var targetEl = document.querySelector(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
