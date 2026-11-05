(function () {
  const map = L.map('map', {
    center: [9.4008, -0.8393],
    zoom: 13,
    scrollWheelZoom: true,
    zoomControl: true,
    attributionControl: true,
    zoomAnimation: true,
    fadeAnimation: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · GeoConsult'
  }).addTo(map);

  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<i class="fas fa-map-marker-alt" aria-hidden="true"></i>',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });

  const marker = L.marker([9.4008, -0.8393], { icon: customIcon }).addTo(map);
  marker.bindPopup(`
    <div style="padding: 5px 0;">
      <i class="fas fa-building"></i> <strong>GeoConsult HQ</strong><br>
      <span style="font-size:0.9rem; color:#1e3a5f;"> Tamale, Northern Region, Ghana</span><br>
      <span style="font-size:0.8rem; color:#4a5b6b;">Lat: 9.4008, Lng: -0.8393</span>
    </div>
  `).openPopup();

  L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);
  map.attributionControl.setPrefix('GeoConsult · Tamale');

  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const fileInput = document.getElementById('contact-files');
  const fileUpload = document.getElementById('file-upload');
  const fileList = document.getElementById('file-list');
  const selectedFiles = [];
  const maxFiles = 10;
  const maxFileSize = 25 * 1024 * 1024;
  const allowedFileTypes = /^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument|application\/vnd\.ms-excel|text\/csv|application\/zip|application\/x-zip-compressed)/i;
  const allowedFileExtensions = /\.(jpe?g|png|gif|webp|heic|pdf|docx?|xlsx?|csv|zip)$/i;

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFiles = () => {
    if (!fileList) return;
    fileList.replaceChildren();

    selectedFiles.forEach((file, index) => {
      const item = document.createElement('li');
      item.className = 'file-list-item';

      const details = document.createElement('span');
      details.className = 'file-details';
      details.textContent = `${file.name} (${formatFileSize(file.size)})`;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'file-remove';
      removeButton.setAttribute('aria-label', `Remove ${file.name}`);
      removeButton.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
      removeButton.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        syncFileInput();
        renderFiles();
      });

      item.append(details, removeButton);

      if (file.type.startsWith('image/')) {
        const preview = document.createElement('img');
        preview.className = 'file-preview';
        preview.alt = `Preview of ${file.name}`;
        preview.src = URL.createObjectURL(file);
        preview.addEventListener('load', () => URL.revokeObjectURL(preview.src), { once: true });
        item.prepend(preview);
      }

      fileList.appendChild(item);
    });
  };

  const syncFileInput = () => {
    if (!fileInput || typeof DataTransfer === 'undefined') return;
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach((file) => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
  };

  const addFiles = (files) => {
    const errors = [];
    Array.from(files).forEach((file) => {
      if (selectedFiles.length >= maxFiles) {
        errors.push(`You can attach up to ${maxFiles} files.`);
        return;
      }
      if (file.size > maxFileSize) {
        errors.push(`${file.name} is larger than 25 MB.`);
        return;
      }
      if (!allowedFileTypes.test(file.type) && !allowedFileExtensions.test(file.name)) {
        errors.push(`${file.name} is not a supported file type.`);
        return;
      }
      if (!selectedFiles.some((selectedFile) => (
        selectedFile.name === file.name
        && selectedFile.size === file.size
        && selectedFile.lastModified === file.lastModified
      ))) {
        selectedFiles.push(file);
      }
    });
    syncFileInput();
    renderFiles();
    if (errors.length && formStatus) {
      formStatus.className = 'form-status error';
      formStatus.textContent = errors.join(' ');
    }
  };

  fileInput?.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  fileUpload?.addEventListener('dragover', (event) => {
    event.preventDefault();
    fileUpload.classList.add('is-dragging');
  });
  fileUpload?.addEventListener('dragleave', () => fileUpload.classList.remove('is-dragging'));
  fileUpload?.addEventListener('drop', (event) => {
    event.preventDefault();
    fileUpload.classList.remove('is-dragging');
    addFiles(event.dataTransfer.files);
  });

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', () => {
      syncFileInput();
      formStatus.className = 'form-status success';
      formStatus.textContent = 'Sending your enquiry and attachments...';
    });
  }

  const gallerySlides = Array.from(document.querySelectorAll('.gallery-slide'));
  const prevButton = document.querySelector('[data-gallery="prev"]');
  const nextButton = document.querySelector('[data-gallery="next"]');
  const galleryDots = document.querySelector('.gallery-dots');
  const galleryCounter = document.querySelector('.gallery-counter');
  const galleryTrack = document.querySelector('.gallery-track');

  if (galleryTrack && gallerySlides.length) {
    let currentIndex = 0;
    let autoAdvance;
    let touchStartX = 0;

    const showSlide = (index) => {
      currentIndex = (index + gallerySlides.length) % gallerySlides.length;

      gallerySlides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === currentIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });

      Array.from(galleryDots?.children || []).forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === currentIndex);
        dot.setAttribute('aria-selected', String(dotIndex === currentIndex));
      });

      if (galleryCounter) {
        galleryCounter.textContent = `${currentIndex + 1} / ${gallerySlides.length}`;
      }
    };

    const stopAutoAdvance = () => window.clearInterval(autoAdvance);
    const startAutoAdvance = () => {
      stopAutoAdvance();
      autoAdvance = window.setInterval(() => showSlide(currentIndex + 1), 6000);
    };

    gallerySlides.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Show gallery slide ${index + 1}`);
      dot.addEventListener('click', () => {
        showSlide(index);
        startAutoAdvance();
      });
      galleryDots?.appendChild(dot);
    });

    prevButton?.addEventListener('click', () => {
      showSlide(currentIndex - 1);
      startAutoAdvance();
    });

    nextButton?.addEventListener('click', () => {
      showSlide(currentIndex + 1);
      startAutoAdvance();
    });

    galleryTrack.addEventListener('mouseenter', stopAutoAdvance);
    galleryTrack.addEventListener('mouseleave', startAutoAdvance);
    galleryTrack.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].screenX;
      stopAutoAdvance();
    }, { passive: true });
    galleryTrack.addEventListener('touchend', (event) => {
      const distance = event.changedTouches[0].screenX - touchStartX;
      if (Math.abs(distance) > 45) {
        showSlide(currentIndex + (distance < 0 ? 1 : -1));
      }
      startAutoAdvance();
    }, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') showSlide(currentIndex - 1);
      if (event.key === 'ArrowRight') showSlide(currentIndex + 1);
    });

    showSlide(0);
    startAutoAdvance();
  }
})();
