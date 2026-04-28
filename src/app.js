(() => {
  const prefersReduced = () => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  };

  class SimpleCarousel {
    constructor(root) {
      this.root = root;
      this.track = root.querySelector('.carousel__track');
      this.slides = Array.from(root.querySelectorAll('.carousel__slide'));
      this.prevBtn = root.querySelector('.carousel__btn--prev');
      this.nextBtn = root.querySelector('.carousel__btn--next');
      this.dotsWrap = root.querySelector('.carousel__dots');
      this.bar = root.querySelector('.carousel__bar');

      this.index = 0;
      this.isDragging = false;
      this.startX = 0;
      this.currentX = 0;
      this.startTranslate = 0;
      this.width = 0;

      this.autoplay = root.dataset.autoplay === 'true' && !prefersReduced();
      this.intervalMs = Number(root.dataset.interval || 4000);
      this.timer = null;
      this.raf = null;
      this.progressStart = 0;

      this._buildDots();
      this._bind();
      this._measure();
      this.goTo(0, false);
      this._start();
    }

    _measure() {
      this.width = this.root.getBoundingClientRect().width;
    }

    _buildDots() {
      if (!this.dotsWrap) return;
      this.dotsWrap.innerHTML = '';
      this.dots = this.slides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.goTo(i);
        });
        this.dotsWrap.appendChild(b);
        return b;
      });
    }

    _setActiveDot() {
      if (!this.dots) return;
      this.dots.forEach((d, i) => d.classList.toggle('is-active', i === this.index));
    }

    _translateFor(index) {
      return -index * this.width;
    }

    goTo(index, animate = true) {
      this._measure();
      this.index = (index + this.slides.length) % this.slides.length;
      this.track.style.transition = animate ? 'transform 420ms ease' : 'none';
      this.track.style.transform = `translateX(${this._translateFor(this.index)}px)`;
      this._setActiveDot();
      this._resetProgress();
    }

    next() { this.goTo(this.index + 1); }
    prev() { this.goTo(this.index - 1); }

    _stopTimers() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    _resetProgress() {
      if (!this.bar || !this.autoplay) return;
      this.progressStart = performance.now();
      this.bar.style.transform = 'scaleX(0)';
    }

    _tickProgress = () => {
      if (!this.bar || !this.autoplay) return;
      const now = performance.now();
      const p = Math.min(1, (now - this.progressStart) / this.intervalMs);
      this.bar.style.transform = `scaleX(${p})`;
      this.raf = requestAnimationFrame(this._tickProgress);
    };

    _start() {
      this._stopTimers();
      if (!this.autoplay) return;
      this._resetProgress();
      this.raf = requestAnimationFrame(this._tickProgress);
      this.timer = setInterval(() => { this.next(); }, this.intervalMs);
    }

    _pause() { this._stopTimers(); }

    _bind() {
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation(); this.prev(); this._start();
        });
      }
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation(); this.next(); this._start();
        });
      }

      this.root.addEventListener('mouseenter', () => this._pause());
      this.root.addEventListener('mouseleave', () => this._start());

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this._pause();
        else this._start();
      });

      window.addEventListener('resize', () => {
        const prevIndex = this.index;
        this._measure();
        this.goTo(prevIndex, false);
      });

      const onDown = (e) => {
        this.isDragging = true;
        this._pause();
        this.track.style.transition = 'none';
        this.startX = (e.touches ? e.touches[0].clientX : e.clientX);
        this.currentX = this.startX;
        const m = /translateX\(([-0-9.]+)px\)/.exec(this.track.style.transform || '');
        this.startTranslate = m ? Number(m[1]) : this._translateFor(this.index);
      };

      const onMove = (e) => {
        if (!this.isDragging) return;
        this.currentX = (e.touches ? e.touches[0].clientX : e.clientX);
        const dx = this.currentX - this.startX;
        this.track.style.transform = `translateX(${this.startTranslate + dx}px)`;
      };

      const onUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        const dx = this.currentX - this.startX;
        const threshold = Math.min(120, this.width * 0.18);
        if (dx > threshold) this.prev();
        else if (dx < -threshold) this.next();
        else this.goTo(this.index);
        this._start();
      };

      this.root.addEventListener('mousedown', onDown);
      this.root.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);

      this.root.addEventListener('touchstart', onDown, { passive: true });
      this.root.addEventListener('touchmove', onMove, { passive: true });
      this.root.addEventListener('touchend', onUp);

      this.root.tabIndex = 0;
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); this._start(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); this._start(); }
      });
    }
  }

  // ── CAMP DATA (city-indexed, from CSV schedule) ─────────────────────────────
  // Structure: CAMP_DATA[campKey][cityKey] = ['Theme name – Date', ...]
  const CAMP_DATA = {
    bricks4kidz: {
      kaunas: [
        'Žaidimų Pasaulis (5–9 m.) – Birželio 15-19 d.',
        'Žaidimų Pasaulis (5–9 m.) – Liepos 13-17 d.',
        'Žaidimų Pasaulis (5–9 m.) – Rugpjūčio 10-14 d. (4 dienos)',
        'Minecraft Manija (5–9 m.) – Birželio 8-12 d.',
        'Minecraft Manija (5–9 m.) – Liepos 20-24 d.',
        'Minecraft Manija (5–9 m.) – Rugpjūčio 3-7 d.',
        'LEGO® Detektyvas (5–9 m.) – Birželio 29–liepos 3 d.',
        'LEGO® Detektyvas (5–9 m.) – Liepos 27-31 d.',
        'LEGO® Meistrai (5–9 m.) – Birželio 22-26 d. (4 dienos)',
        'LEGO® Meistrai (5–9 m.) – Rugpjūčio 24-28 d.',
        'Robotikos Nuotykiai (5–9 m.) – Liepos 7-11 d. (4 dienos)',
        'Robotikos Nuotykiai (5–9 m.) – Rugpjūčio 17-21 d.',
        'Ateities Išradėjai (9–12 m.) – Birželio 15-19 d.',
        'Ateities Išradėjai (9–12 m.) – Liepos 13-17 d.',
        'Ateities Išradėjai (9–12 m.) – Liepos 27-31 d.',
        'Ateities Išradėjai (9–12 m.) – Rugpjūčio 17-21 d.',
        'Keliauk su LEGO aplink pasaulį (3–5,5 m.) – Birželio 29–liepos 3 d.',
        'Keliauk su LEGO aplink pasaulį (3–5,5 m.) – Liepos 27-31 d.',
        'Keliauk su LEGO aplink pasaulį (3–5,5 m.) – Rugpjūčio 24-28 d.',
        'Magiška LEGO® stovykla (3–5,5 m.) – Liepos 7-11 d. (4 dienos)',
        'Magiška LEGO® stovykla (3–5,5 m.) – Rugpjūčio 3-7 d.',
        'Zoologijos sodas su LEGO® (3–5,5 m.) – Liepos 13-17 d.',
        'Zoologijos sodas su LEGO® (3–5,5 m.) – Rugpjūčio 10-14 d. (4 dienos)',
        'Superherojų nuotykiai (3–5,5 m.) – Liepos 20-24 d.',
        'Superherojų nuotykiai (3–5,5 m.) – Rugpjūčio 17-21 d.',
      ],
      vilnius_zverynas: [
        'Žaidimų Pasaulis (5–9 m.) – Birželio 15-19 d.',
        'Žaidimų Pasaulis (5–9 m.) – Liepos 27-31 d.',
        'Žaidimų Pasaulis (5–9 m.) – Rugpjūčio 24-28 d.',
        'Minecraft Manija (5–9 m.) – Birželio 8-12 d.',
        'Minecraft Manija (5–9 m.) – Liepos 7-11 d. (4 dienos)',
        'Minecraft Manija (5–9 m.) – Rugpjūčio 17-21 d.',
        'LEGO® Detektyvas (5–9 m.) – Birželio 29–liepos 3 d.',
        'LEGO® Detektyvas (5–9 m.) – Liepos 20-24 d.',
        'LEGO® Detektyvas (5–9 m.) – Rugpjūčio 3-7 d.',
        'LEGO® Meistrai (5–9 m.) – Birželio 22-26 d. (4 dienos)',
        'LEGO® Meistrai (5–9 m.) – Rugpjūčio 10-14 d. (4 dienos)',
        'Robotikos Nuotykiai (5–9 m.) – Liepos 13-17 d.',
        'Ateities Išradėjai (9–12 m.) – Liepos 13-17 d.',
      ],
      vilnius_gabijos: [
        'Žaidimų Pasaulis (5–9 m.) – Birželio 8-12 d.',
        'Žaidimų Pasaulis (5–9 m.) – Liepos 7-11 d. (4 dienos)',
        'Žaidimų Pasaulis (5–9 m.) – Liepos 27-31 d.',
        'Minecraft Manija (5–9 m.) – Birželio 15-19 d.',
        'Minecraft Manija (5–9 m.) – Rugpjūčio 3-7 d.',
        'Minecraft Manija (5–9 m.) – Rugpjūčio 24-28 d.',
        'LEGO® Detektyvas (5–9 m.) – Liepos 13-17 d.',
        'LEGO® Detektyvas (5–9 m.) – Rugpjūčio 10-14 d. (4 dienos)',
        'LEGO® Meistrai (5–9 m.) – Birželio 29–liepos 3 d.',
        'LEGO® Meistrai (5–9 m.) – Rugpjūčio 17-21 d.',
        'Robotikos Nuotykiai (5–9 m.) – Birželio 22-26 d. (4 dienos)',
        'Robotikos Nuotykiai (5–9 m.) – Liepos 20-24 d.',
        'Ateities Išradėjai (9–12 m.) – Liepos 7-11 d. (4 dienos)',
        'Ateities Išradėjai (9–12 m.) – Liepos 20-24 d.',
      ],
      klaipeda: [
        'Žaidimų Pasaulis (5–9 m.) – Birželio 15-19 d.',
        'Žaidimų Pasaulis (5–9 m.) – Liepos 13-17 d.',
        'Žaidimų Pasaulis (5–9 m.) – Rugpjūčio 17-21 d.',
        'Minecraft Manija (5–9 m.) – Birželio 8-12 d.',
        'Minecraft Manija (5–9 m.) – Liepos 20-24 d.',
        'LEGO® Detektyvas (5–9 m.) – Liepos 7-11 d. (4 dienos)',
        'LEGO® Detektyvas (5–9 m.) – Rugpjūčio 3-7 d.',
        'LEGO® Meistrai (5–9 m.) – Birželio 22-26 d. (4 dienos)',
        'LEGO® Meistrai (5–9 m.) – Liepos 27-31 d.',
        'LEGO® Meistrai (5–9 m.) – Rugpjūčio 10-14 d. (4 dienos)',
        'Robotikos Nuotykiai (5–9 m.) – Birželio 29–liepos 3 d.',
        'Robotikos Nuotykiai (5–9 m.) – Rugpjūčio 24-28 d.',
        'Ateities Išradėjai (9–12 m.) – Birželio 29–liepos 3 d.',
        'Ateities Išradėjai (9–12 m.) – Liepos 13-17 d.',
      ],
      palanga: [
        'Žaidimų Pasaulis (5–9 m.) – Birželio 29–liepos 3 d.',
        'Minecraft Manija (5–9 m.) – Liepos 13-17 d.',
        'LEGO® Detektyvas (5–9 m.) – Liepos 27-31 d.',
      ],
      kretinga: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 20-24 d.',
      ],
      gargzdai: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 13-17 d.',
      ],
      silute: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 27-31 d.',
      ],
      nida: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 20-24 d.',
        'Minecraft Manija (5–9 m.) – Liepos 27-31 d.',
        'LEGO® Detektyvas (5–9 m.) – Rugpjūčio 3-7 d.',
      ],
      mazeikiai: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 27-31 d.',
      ],
      plunge: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 13-17 d.',
      ],
      telsiai: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 20-24 d.',
      ],
      kedainiai: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 27-31 d.',
      ],
      alytus: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 7-11 d. (4 dienos)',
        'Minecraft Manija (5–9 m.) – Liepos 20-24 d.',
      ],
      marijampole: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 7-11 d. (4 dienos)',
        'Minecraft Manija (5–9 m.) – Liepos 20-24 d.',
        'LEGO® Detektyvas (5–9 m.) – Rugpjūčio 3-7 d.',
      ],
      panevezys: [
        'Žaidimų Pasaulis (5–9 m.) – Birželio 8-12 d.',
        'Žaidimų Pasaulis (5–9 m.) – Liepos 13-17 d.',
        'Žaidimų Pasaulis (5–9 m.) – Rugpjūčio 3-7 d.',
        'Minecraft Manija (5–9 m.) – Birželio 22-26 d. (4 dienos)',
        'Minecraft Manija (5–9 m.) – Liepos 20-24 d.',
        'Minecraft Manija (5–9 m.) – Rugpjūčio 24-28 d.',
        'LEGO® Detektyvas (5–9 m.) – Birželio 15-19 d.',
        'LEGO® Detektyvas (5–9 m.) – Rugpjūčio 10-14 d. (4 dienos)',
        'LEGO® Meistrai (5–9 m.) – Liepos 7-11 d. (4 dienos)',
        'LEGO® Meistrai (5–9 m.) – Rugpjūčio 17-21 d.',
        'Robotikos Nuotykiai (5–9 m.) – Birželio 29–liepos 3 d.',
        'Ateities Išradėjai (9–12 m.) – Liepos 13-17 d.',
        'Ateities Išradėjai (9–12 m.) – Rugpjūčio 3-7 d.',
      ],
      siauliai: [
        'Žaidimų Pasaulis (5–9 m.) – Liepos 20-24 d.',
      ],
    },

    lms: {
      kaunas: [
        'Jaunasis Veterinaras (7–12 m.) – Birželio 15-19 d.',
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Jaunasis Veterinaras (7–12 m.) – Rugpjūčio 17-21 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Birželio 29–liepos 3 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Liepos 27-31 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 7-11 d.',
        'Pažink medikų profesijas (7–12 m.) – Rugpjūčio 10-14 d.',
        'Išgyvenimo medicina (7–12 m.) – Birželio 8-12 d.',
        'Išgyvenimo medicina (7–12 m.) – Rugpjūčio 3-7 d.',
        'Medicinos detektyvas (7–12 m.) – Birželio 22-26 d.',
        'Medicinos detektyvas (7–12 m.) – Liepos 20-24 d.',
        'Medicinos įvadas jaunimui (12–16 m.) – Liepos 20-24 d.',
        'Mažasis veterinaras (5–7 m.) – Liepos 13-17 d.',
        'Mažasis veterinaras (5–7 m.) – Liepos 27-31 d.',
        'Mažasis veterinaras (5–7 m.) – Rugpjūčio 17-21 d.',
        'Mažasis gydytojas (5–7 m.) – Liepos 7-11 d.',
        'Mažasis gydytojas (5–7 m.) – Rugpjūčio 10-14 d.',
      ],
      vilnius_zverynas: [
        'Jaunasis Veterinaras (7–12 m.) – Birželio 8-12 d.',
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Birželio 29–liepos 3 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Rugpjūčio 3-7 d.',
        'Pažink medikų profesijas (7–12 m.) – Birželio 15-19 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 7-11 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 20-24 d.',
        'Išgyvenimo medicina (7–12 m.) – Birželio 22-26 d.',
        'Išgyvenimo medicina (7–12 m.) – Rugpjūčio 17-21 d.',
        'Medicinos detektyvas (7–12 m.) – Liepos 27-31 d.',
        'Medicinos detektyvas (7–12 m.) – Rugpjūčio 10-14 d.',
        'Medicinos įvadas jaunimui (12–16 m.) – Liepos 20-24 d.',
        'Mažasis veterinaras (5–7 m.) – Liepos 13-17 d.',
        'Mažasis veterinaras (5–7 m.) – Rugpjūčio 3-7 d.',
        'Mažasis gydytojas (5–7 m.) – Liepos 7-11 d.',
      ],
      vilnius_gabijos: [
        'Jaunasis Veterinaras (7–12 m.) – Birželio 15-19 d.',
        'Jaunasis Veterinaras (7–12 m.) – Liepos 7-11 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Liepos 27-31 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Rugpjūčio 17-21 d.',
        'Pažink medikų profesijas (7–12 m.) – Birželio 8-12 d.',
        'Pažink medikų profesijas (7–12 m.) – Rugpjūčio 10-14 d.',
        'Išgyvenimo medicina (7–12 m.) – Liepos 13-17 d.',
        'Išgyvenimo medicina (7–12 m.) – Rugpjūčio 3-7 d.',
        'Medicinos detektyvas (7–12 m.) – Birželio 29–liepos 3 d.',
        'Medicinos detektyvas (7–12 m.) – Liepos 20-24 d.',
        'Mažasis veterinaras (5–7 m.) – Liepos 7-11 d.',
        'Mažasis veterinaras (5–7 m.) – Liepos 27-31 d.',
        'Mažasis veterinaras (5–7 m.) – Rugpjūčio 17-21 d.',
        'Mažasis gydytojas (5–7 m.) – Rugpjūčio 10-14 d.',
      ],
      klaipeda: [
        'Jaunasis Veterinaras (7–12 m.) – Birželio 15-19 d.',
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Jaunasis Veterinaras (7–12 m.) – Rugpjūčio 17-21 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Rugpjūčio 3-7 d.',
        'Pažink medikų profesijas (7–12 m.) – Birželio 29–liepos 3 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 27-31 d.',
        'Išgyvenimo medicina (7–12 m.) – Liepos 7-11 d.',
        'Išgyvenimo medicina (7–12 m.) – Liepos 20-24 d.',
        'Jūros gelmių tyrinėtojas (7–12 m.) – Birželio 8-12 d.',
        'Medicinos detektyvas (7–12 m.) – Birželio 22-26 d.',
        'Medicinos detektyvas (7–12 m.) – Rugpjūčio 10-14 d.',
        'Medicinos įvadas jaunimui (12–16 m.) – Liepos 27-31 d.',
        'Mažasis veterinaras (5–7 m.) – Liepos 13-17 d.',
        'Mažasis veterinaras (5–7 m.) – Rugpjūčio 3-7 d.',
        'Mažasis veterinaras (5–7 m.) – Rugpjūčio 17-21 d.',
        'Mažasis gydytojas (5–7 m.) – Birželio 29–liepos 3 d.',
      ],
      palanga: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 7-11 d.',
        'Išgyvenimo medicina (7–12 m.) – Liepos 20-24 d.',
        'Jūros gelmių tyrinėtojas (7–12 m.) – Rugpjūčio 3-7 d.',
      ],
      gargzdai: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Medicinos detektyvas (7–12 m.) – Rugpjūčio 3-7 d.',
      ],
      silute: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
      ],
      kretinga: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 27-31 d.',
      ],
      mazeikiai: [
        'Jaunasis Veterinaras (7–12 m.) – Rugpjūčio 3-7 d.',
      ],
      plunge: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 20-24 d.',
      ],
      telsiai: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
      ],
      panevezys: [
        'Jaunasis Veterinaras (7–12 m.) – Birželio 15-19 d.',
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Jaunasis Veterinaras (7–12 m.) – Rugpjūčio 3-7 d.',
        'Zoologijos sodo veterinaras (7–12 m.) – Rugpjūčio 10-14 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 7-11 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 27-31 d.',
        'Išgyvenimo medicina (7–12 m.) – Liepos 20-24 d.',
        'Medicinos detektyvas (7–12 m.) – Birželio 29–liepos 3 d.',
        'Medicinos detektyvas (7–12 m.) – Rugpjūčio 17-21 d.',
        'Medicinos įvadas jaunimui (12–16 m.) – Liepos 27-31 d.',
        'Mažasis veterinaras (5–7 m.) – Liepos 13-17 d.',
        'Mažasis veterinaras (5–7 m.) – Rugpjūčio 3-7 d.',
        'Mažasis veterinaras (5–7 m.) – Rugpjūčio 10-14 d.',
        'Mažasis gydytojas (5–7 m.) – Liepos 7-11 d.',
      ],
      siauliai: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Medicinos detektyvas (7–12 m.) – Liepos 27-31 d.',
      ],
      alytus: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 27-31 d.',
        'Medicinos detektyvas (7–12 m.) – Rugpjūčio 3-7 d.',
      ],
      marijampole: [
        'Jaunasis Veterinaras (7–12 m.) – Birželio 29–liepos 3 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 13-17 d.',
        'Medicinos detektyvas (7–12 m.) – Liepos 27-31 d.',
      ],
      kedainiai: [
        'Jaunasis Veterinaras (7–12 m.) – Rugpjūčio 3-7 d.',
      ],
      utena: [
        'Jaunasis Veterinaras (7–12 m.) – Liepos 13-17 d.',
        'Pažink medikų profesijas (7–12 m.) – Liepos 27-31 d.',
      ],
    },

    businesskids: {
      kaunas: [
        'Jaunųjų verslo ryklių stovykla – Birželio 29–liepos 3 d.',
        'Jaunųjų verslo ryklių stovykla – Liepos 20-24 d.',
        'Jaunųjų verslo ryklių stovykla – Rugpjūčio 3-7 d.',
      ],
      vilnius_zverynas: [
        'Jaunųjų verslo ryklių stovykla – Liepos 20-24 d.',
        'Jaunųjų verslo ryklių stovykla – Rugpjūčio 3-7 d.',
      ],
      vilnius_gabijos: [
        'Jaunųjų verslo ryklių stovykla – Birželio 29–liepos 3 d.',
        'Jaunųjų verslo ryklių stovykla – Liepos 13-17 d.',
      ],
      klaipeda: [
        'Jaunųjų verslo ryklių stovykla – Liepos 20-24 d.',
        'Jaunųjų verslo ryklių stovykla – Rugpjūčio 3-7 d.',
      ],
      panevezys: [
        'Jaunųjų verslo ryklių stovykla – Birželio 29–liepos 3 d.',
        'Jaunųjų verslo ryklių stovykla – Liepos 27-31 d.',
      ],
    },
  };

  // ── CAMP THEME DYNAMIC (camp+city → themes → dates) ────────────────────────
  function initCampThemeDynamic() {
    const campSel  = document.getElementById('camp');
    const citySel  = document.getElementById('city');
    const themeSel = document.getElementById('theme');
    const dateSel  = document.getElementById('date');
    if (!campSel || !citySel || !themeSel) return;

    // Parse flat 'Theme – Date' entries into { theme: [dates] }
    function groupByTheme(entries) {
      const map = {};
      for (const entry of entries) {
        const idx = entry.indexOf(' – ');
        if (idx === -1) continue;
        const theme = entry.slice(0, idx);
        const date  = entry.slice(idx + 3);
        if (!map[theme]) map[theme] = [];
        map[theme].push(date);
      }
      return map;
    }

    let grouped = {};

    function resetDates() {
      if (!dateSel) return;
      dateSel.innerHTML = '<option value="">Pirmiau pasirinkite temą</option>';
    }

    function updateThemes() {
      const campKey = campSel.value;
      const cityKey = citySel.value;
      grouped = {};
      resetDates();

      if (!campKey || !cityKey) {
        themeSel.innerHTML = '<option value="">Pirmiau pasirinkite stovyklą ir miestą</option>';
        return;
      }

      const entries = (CAMP_DATA[campKey] || {})[cityKey];
      if (!entries || entries.length === 0) {
        themeSel.innerHTML = '<option value="">Šiame mieste šios stovyklos nėra</option>';
        return;
      }

      grouped = groupByTheme(entries);
      themeSel.innerHTML = '<option value="">— Pasirinkite temą —</option>' +
        Object.keys(grouped).map(t => `<option value="${t}">${t}</option>`).join('');
    }

    function updateDates() {
      if (!dateSel) return;
      const dates = grouped[themeSel.value] || [];
      if (!dates.length) { resetDates(); return; }
      dateSel.innerHTML = '<option value="">— Pasirinkite datą —</option>' +
        dates.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    campSel.addEventListener('change', updateThemes);
    citySel.addEventListener('change', updateThemes);
    themeSel.addEventListener('change', updateDates);
    updateThemes();
  }

  // ── REGISTRATION FORM SUBMIT ─────────────────────────────────────────────────
  function initRegForm() {
    const form = document.getElementById('regForm');
    const success = document.getElementById('regSuccess');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      })
      .then(() => {
        if (success) { success.style.display = 'block'; }
        form.reset();
        const themeSel = document.getElementById('theme');
        const dateSel  = document.getElementById('date');
        if (themeSel) themeSel.innerHTML = '<option value="">Pirmiau pasirinkite stovyklą ir miestą</option>';
        if (dateSel)  dateSel.innerHTML  = '<option value="">Pirmiau pasirinkite temą</option>';
        if (success) success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(() => {
        const d = Object.fromEntries(data.entries());
        const body = [
          `Stovykla: ${d.stovykla || ''}`,
          `Miestas: ${d.miestas || ''}`,
          `Amžius: ${d.amzius || ''}`,
          `Tema ir data: ${d.tema || ''}`,
          ``,
          `Vaiko vardas pavardė: ${d.vaiko_vardas_pavarde || ''}`,
          `Klasė / grupė: ${d.klase_grupe || ''}`,
          ``,
          `Mamos vardas pavardė: ${d.mamos_vardas_pavarde || ''}`,
          `Mamos telefonas: ${d.mamos_telefonas || ''}`,
          `Mamos el. paštas: ${d.mamos_epastas || ''}`,
          ``,
          `Tėvo vardas pavardė: ${d.tevo_vardas_pavarde || ''}`,
          `Tėvo telefonas: ${d.tevo_telefonas || ''}`,
          `Tėvo el. paštas: ${d.tevo_epastas || ''}`,
        ].join('\n');
        window.location.href = `mailto:info@steamedukacija.lt?subject=${encodeURIComponent('Registracija į stovyklą – ' + (d.stovykla || ''))}&body=${encodeURIComponent(body)}`;
      });
    });
  }

  // ── PROMO POPUP ──────────────────────────────────────────────────────────────
  function initPromoPopup() {
    const popup = document.getElementById('promoPopup');
    if (!popup) return;
    try {
      if (sessionStorage.getItem('promoDismissed') === '1') return;
    } catch {}

    const open = () => {
      popup.classList.add('is-open');
      popup.setAttribute('aria-hidden', 'false');
    };
    const close = () => {
      popup.classList.remove('is-open');
      popup.setAttribute('aria-hidden', 'true');
      try { sessionStorage.setItem('promoDismissed', '1'); } catch {}
    };

    setTimeout(open, 1600);

    const closeBtn = popup.querySelector('.promo-popup-close');
    const backdrop = popup.querySelector('.promo-popup-backdrop');
    const cta = popup.querySelector('.promo-popup-cta');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    if (cta) cta.addEventListener('click', close); // close AND follow href to #registracija

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('is-open')) close();
    });
  }

  // ── HASH ROUTER (registration as separate page) ──────────────────────────────
  function initRegRoute() {
    const mainContent = document.getElementById('mainContent');
    const regPage = document.getElementById('regPage');
    const backBtn = document.querySelector('.reg-back-btn');
    if (!mainContent || !regPage) return;

    function applyRoute() {
      const isReg = window.location.hash === '#registracija';
      mainContent.style.display = isReg ? 'none' : '';
      regPage.style.display = isReg ? 'block' : 'none';
      if (isReg) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }

    window.addEventListener('hashchange', applyRoute);
    applyRoute();

    // Back button → go to main page
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState('', document.title, window.location.pathname + window.location.search);
        applyRoute();
      });
    }

    // All "Registruokis" links that point to #registracija
    document.querySelectorAll('a[href="#registracija"]').forEach(link => {
      link.addEventListener('click', () => {
        // hashchange will fire and applyRoute will handle the rest
      });
    });
  }

  // ── INIT ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (!prefersReduced()) {
      requestAnimationFrame(() => {
        body.classList.remove('preload');
        body.classList.add('loaded');
      });
    } else {
      body.classList.remove('preload');
      body.classList.add('loaded');
    }

    document.querySelectorAll('.carousel').forEach((el) => new SimpleCarousel(el));

    initRegRoute();
    initCampThemeDynamic();
    initRegForm();
    initPromoPopup();
  });
})();
