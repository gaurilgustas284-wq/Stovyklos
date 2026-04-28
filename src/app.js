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

  const CAMP_THEMES = {
    bricks4kidz: [
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Birželio 15-19 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Birželio 15-19 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Birželio 8-12d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Birželio 15-19 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 20-24 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 13-17 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 27 - 31 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 20-24 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 27 - 31 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 13-17 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 20-24 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 27 - 31 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 7-11 d.  (4 dienos)",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 7-11 d.  (4 dienos)",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Birželio 8-12d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Liepos 20-24 d.",
    "LEGO® Žaidimų Pasaulis: Minecraft, Fortnite, Roblox, Super Mario!“\n5-9 metų vaikams – Birželio 8-12d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Birželio 8-12d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Birželio 8-12d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Birželio 15-19 d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Birželio 8-12d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Liepos 27 - 31 d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Liepos 20-24 d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Liepos 20-24 d.",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "Minecraft Manija su LEGO®\n5-9 metų vaikams – Liepos 7-11 d.  (4 dienos)",
    "LEGO® Detektyvas\n5-9 metų vaikams – Birželio 29-liepos 3 d.",
    "LEGO® Detektyvas\n5-9 metų vaikams – Birželio 29-liepos 3 d.",
    "LEGO® Detektyvas\n5-9 metų vaikams – Liepos 13-17 d.",
    "LEGO® Detektyvas\n5-9 metų vaikams – Liepos 7-11 d.  (4 dienos)",
    "LEGO® Detektyvas\n5-9 metų vaikams – Liepos 27 - 31 d.",
    "LEGO® Detektyvas\n5-9 metų vaikams – Rugpjūčio 3-7 d.",
    "LEGO® Detektyvas\n5-9 metų vaikams – Rugpjūčio 3-7 d.",
    "LEGO® Detektyvas\n5-9 metų vaikams – Birželio 15-19 d.",
    "LEGO® Detektyvas\n5-9 metų vaikams – Rugpjūčio 3-7 d.",
    "LEGO® Meistrai\n5-9 metų vaikams – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "LEGO® Meistrai\n5-9 metų vaikams – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "LEGO® Meistrai\n5-9 metų vaikams – Birželio 29-liepos 3 d.",
    "LEGO® Meistrai\n5-9 metų vaikams – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "LEGO® Meistrai\n5-9 metų vaikams – Liepos 7-11 d.  (4 dienos)",
    "Robotikos Nuotykiai\n5-9 metų vaikams – Liepos 7-11 d.  (4 dienos)",
    "Robotikos Nuotykiai\n5-9 metų vaikams – Liepos 13-17 d.",
    "Robotikos Nuotykiai\n5-9 metų vaikams – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "Robotikos Nuotykiai\n5-9 metų vaikams – Birželio 29-liepos 3 d.",
    "Robotikos Nuotykiai\n5-9 metų vaikams – Birželio 29-liepos 3 d.",
    "9-12 metų Ateities išradėjai: robotai, žaidimai ir AI – Birželio 15-19 d.",
    "9-12 metų Ateities išradėjai: robotai, žaidimai ir AI – Liepos 7-11 d.  (4 dienos)",
    "9-12 metų Ateities išradėjai: robotai, žaidimai ir AI – Birželio 29-liepos 3 d.",
    "9-12 metų Ateities išradėjai: robotai, žaidimai ir AI – Liepos 13-17 d.",
    "9-12 metų jaunųjų verslo ryklių stovykla – Birželio 29-liepos 3 d.",
    "9-12 metų jaunųjų verslo ryklių stovykla – Birželio 29-liepos 3 d.",
    "9-12 metų jaunųjų verslo ryklių stovykla – Liepos 20-24 d.",
    "9-12 metų jaunųjų verslo ryklių stovykla – Birželio 29-liepos 3 d.",
    "3-5,5 m. Keliauk su LEGO aplink pasaulį – Birželio 29-liepos 3 d.",
    "3-5,5 m. Keliauk su LEGO aplink pasaulį – Kaunas",
    "3-5,5 m. Keliauk su LEGO aplink pasaulį – Savanoriu pr. 130",
    "3-5,5 m . Magiška LEGO® stovykla – Liepos 7-11 d.  (4 dienos)",
    "3-5,5 m . Magiška LEGO® stovykla – Palanga",
    "3-5,5 m . Magiška LEGO® stovykla – Žuvėdros viešbutis, meilės al.11",
    "3-5,5 m. Sukurk savo zoologijos sodą su LEGO® – Liepos 13-17 d.",
    "3-5,5 m. Sukurk savo zoologijos sodą su LEGO® – Panevėžys",
    "3-5,5 m. Sukurk savo zoologijos sodą su LEGO® – Respublikos g. 34",
    "3-5,5 m. Superherojų nuotykiai su LEGO® – Liepos 20-24 d.",
    "3-5,5 m. Superherojų nuotykiai su LEGO® – Alytus",
    "3-5,5 m. Superherojų nuotykiai su LEGO® – Jaunimo g. 1"
  ],
  lms: [
    "Jaunasis Veterinaras 7-12 m – Birželio 15-19 d.",
    "Jaunasis Veterinaras 7-12 m – Birželio 8-12d.",
    "Jaunasis Veterinaras 7-12 m – Birželio 15-19 d.",
    "Jaunasis Veterinaras 7-12 m – Birželio 15-19 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 7-11 d.  (4 dienos)",
    "Jaunasis Veterinaras 7-12 m – Liepos 13-17 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 13-17 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 27 - 31 d.",
    "Jaunasis Veterinaras 7-12 m – Rugpjūčio 3-7 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 20-24 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 13-17 d.",
    "Jaunasis Veterinaras 7-12 m – Birželio 15-19 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 13-17 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 13-17 d.",
    "Jaunasis Veterinaras 7-12 m – Birželio 29-liepos 3 d.",
    "Jaunasis Veterinaras 7-12 m – Rugpjūčio 3-7 d.",
    "Jaunasis Veterinaras 7-12 m – Liepos 13-17 d.",
    "Jaunasis Veterinaras 7-12 m – Visos datos 2026",
    "Zoologijos sodo veterinaras 7-12 m. – Birželio 29-liepos 3 d.",
    "Zoologijos sodo veterinaras 7-12 m. – Birželio 29-liepos 3 d.",
    "Zoologijos sodo veterinaras 7-12 m. – Liepos 27 - 31 d.",
    "Zoologijos sodo veterinaras 7-12 m. – Rugpjūčio 3-7 d.",
    "Zoologijos sodo veterinaras 7-12 m. – Rugpjūčio 10-14 d. (4 dienos)",
    "Zoologijos sodo veterinaras 7-12 m. – Birželio 29-liepos 3 d.",
    "Pažink medikų profesijas  7-12 m – Liepos 7-11 d.  (4 dienos)",
    "Pažink medikų profesijas  7-12 m – Birželio 15-19 d.",
    "Pažink medikų profesijas  7-12 m – Birželio 8-12d.",
    "Pažink medikų profesijas  7-12 m – Birželio 29-liepos 3 d.",
    "Pažink medikų profesijas  7-12 m – Liepos 7-11 d.  (4 dienos)",
    "Pažink medikų profesijas  7-12 m – Liepos 27 - 31 d.",
    "Pažink medikų profesijas  7-12 m – Liepos 13-17 d.",
    "Pažink medikų profesijas  7-12 m – Liepos 27 - 31 d.",
    "Pažink medikų profesijas  7-12 m – Liepos 27 - 31 d.",
    "Išgyvenimo medicina  7-12 m – Birželio 8-12d.",
    "Išgyvenimo medicina  7-12 m – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "Išgyvenimo medicina  7-12 m – Liepos 13-17 d.",
    "Išgyvenimo medicina  7-12 m – Liepos 7-11 d.  (4 dienos)",
    "Išgyvenimo medicina  7-12 m – Liepos 20-24 d.",
    "Išgyvenimo medicina  7-12 m – Liepos 20-24 d.",
    "Jūros gelmių tyrinėtojas  7-12 m – Birželio 8-12d.",
    "Jūros gelmių tyrinėtojas  7-12 m – Rugpjūčio 3-7 d.",
    "Medicinos detektyvas  7-12 m – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "Medicinos detektyvas  7-12 m – Liepos 27 - 31 d.",
    "Medicinos detektyvas  7-12 m – Birželio 29-liepos 3 d.",
    "Medicinos detektyvas  7-12 m – Birželio 22- 26 d. (4 dienos, ne darbo 06.24)",
    "Medicinos detektyvas  7-12 m – Rugpjūčio 3-7 d.",
    "Medicinos detektyvas  7-12 m – Birželio 29-liepos 3 d.",
    "Medicinos detektyvas  7-12 m – Liepos 27 - 31 d.",
    "Medicinos detektyvas  7-12 m – Rugpjūčio 3-7 d.",
    "Medicinos detektyvas  7-12 m – Liepos 27 - 31 d.",
    "MEDICINOS ĮVADAS  JAUNIMUI  12-16 m – Liepos 20-24 d.",
    "MEDICINOS ĮVADAS  JAUNIMUI  12-16 m – Liepos 27 - 31 d.",
    "MEDICINOS ĮVADAS  JAUNIMUI  12-16 m – Liepos 27 - 31 d.",
    "Aš mažasis veterinaras 5-7 m – Liepos 13-17 d.",
    "Aš mažasis veterinaras 5-7 m – Liepos 13-17 d.",
    "Aš mažasis veterinaras 5-7 m – Liepos 7-11 d.  (4 dienos)",
    "Aš mažasis veterinaras 5-7 m – Liepos 13-17 d.",
    "Aš mažasis veterinaras 5-7 m – Liepos 13-17 d.",
    "Aš mažasis veterinaras 5-7 m – Vilnius Pasilaiciai",
    "Aš mažasis veterinaras 5-7 m – Gabijos g. 40",
    "Aš mažasis gydytojas 5-7 m – Liepos 7-11 d.  (4 dienos)",
    "Aš mažasis gydytojas 5-7 m – Liepos 7-11 d.  (4 dienos)",
    "Aš mažasis gydytojas 5-7 m – Rugpjūčio 10-14 d. (4 dienos)",
    "Aš mažasis gydytojas 5-7 m – Birželio 29-liepos 3 d.",
    "Aš mažasis gydytojas 5-7 m – Liepos 7-11 d.  (4 dienos)",
    "Aš mažasis gydytojas 5-7 m – Gargždai",
    "Aš mažasis gydytojas 5-7 m – Gargždų muzikos mokykla. Kvietinių g. 2, Gargždai"
  ],
};

  function initCampThemeDynamic() {
    const campSel = document.getElementById('camp');
    const themeSel = document.getElementById('theme');
    if (!campSel || !themeSel) return;

    campSel.addEventListener('change', () => {
      const themes = CAMP_THEMES[campSel.value] || [];
      themeSel.innerHTML = themes.length
        ? themes.map(t => `<option value="${t}">${t}</option>`).join('')
        : '<option value="">Pirmiau pasirinkite stovyklą</option>';
    });
  }

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
        // Reset theme dropdown after reset
        const themeSel = document.getElementById('theme');
        if (themeSel) themeSel.innerHTML = '<option value="">Pirmiau pasirinkite stovyklą</option>';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(() => {
        // Mailto fallback
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
    if (cta) cta.addEventListener('click', () => {
      try { sessionStorage.setItem('promoDismissed', '1'); } catch {}
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('is-open')) close();
    });
  }

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

    initCampThemeDynamic();
    initRegForm();
    initPromoPopup();
  });
})();
