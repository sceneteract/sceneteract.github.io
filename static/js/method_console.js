document.addEventListener('DOMContentLoaded', () => {
  // Navigation Logic
  const navItems = document.querySelectorAll('.nav-item');
  const stageContents = document.querySelectorAll('.stage-content');

  if (navItems.length && stageContents.length) {
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        
        stageContents.forEach(content => {
          if (content.id === targetId) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
  }

  // True Carousel Logic (Transform-based)
  const track = document.getElementById('action-library-scroll');
  const prevBtn = document.getElementById('library-prev');
  const nextBtn = document.getElementById('library-next');

  if (track && prevBtn && nextBtn) {
    // 250px (card width) + 24px (1.5rem gap) = 274px per slide
    const slideWidth = 274; 
    let currentIndex = 0;
    
    const getMaxIndex = () => {
      const containerWidth = track.parentElement.clientWidth;
      const totalWidth = track.scrollWidth;
      // How many pixels are currently hidden on the right
      const hiddenWidth = totalWidth - containerWidth;
      if (hiddenWidth <= 0) return 0;
      // Max index is how many slideWidths we can shift before reaching the end
      return Math.ceil(hiddenWidth / slideWidth);
    };

    const updateCarousel = () => {
      const maxIndex = getMaxIndex();
      if (currentIndex > maxIndex) currentIndex = maxIndex;

      track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      
      prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '1';
      prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
      
      nextBtn.style.opacity = currentIndex >= maxIndex ? '0.3' : '1';
      nextBtn.style.pointerEvents = currentIndex >= maxIndex ? 'none' : 'auto';
    };

    window.addEventListener('resize', updateCarousel);
    updateCarousel();

    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });

    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const maxIndex = getMaxIndex();
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
      }
    });
  }

  // Input Carousel Logic
  const inputTrack = document.getElementById('input-scroll');
  const inputPrevBtn = document.getElementById('input-prev');
  const inputNextBtn = document.getElementById('input-next');

  if (inputTrack && inputPrevBtn && inputNextBtn) {
    const cards = inputTrack.querySelectorAll('.bento-box');
    let inputCurrentIndex = 0;
    
    const getInputMaxIndex = () => {
      // Find the last index where a card's right edge is beyond the container's right edge
      const containerWidth = inputTrack.parentElement.clientWidth;
      let lastVisibleIndex = 0;
      for (let i = 0; i < cards.length; i++) {
        const cardRight = cards[i].offsetLeft + cards[i].offsetWidth - cards[0].offsetLeft;
        if (cardRight > containerWidth) {
          // If this card (or any after it) starts after the first card, it's a potential stop
          lastVisibleIndex = i;
        }
      }
      // If the entire track fits, maxIndex is 0
      if (inputTrack.scrollWidth <= containerWidth) return 0;
      
      // We want to be able to click 'next' as long as the last card is not fully in view at the right edge
      // But for simplicity with index-based navigation:
      return cards.length - 1;
    };

    const updateInputCarousel = () => {
      const inputMaxIndex = getInputMaxIndex();
      if (inputCurrentIndex > inputMaxIndex) inputCurrentIndex = inputMaxIndex;

      // Calculate the offset to the current card
      let offset = 0;
      if (inputCurrentIndex > 0 && cards[inputCurrentIndex]) {
        offset = cards[inputCurrentIndex].offsetLeft - cards[0].offsetLeft;
        
        // Prevent scrolling past the end of the track
        const maxScroll = inputTrack.scrollWidth - inputTrack.parentElement.clientWidth;
        if (offset > maxScroll) {
            offset = maxScroll > 0 ? maxScroll : 0;
        }
      }

      inputTrack.style.transform = `translateX(-${offset}px)`;
      
      inputPrevBtn.style.opacity = inputCurrentIndex === 0 ? '0.3' : '1';
      inputPrevBtn.style.pointerEvents = inputCurrentIndex === 0 ? 'none' : 'auto';
      
      const maxScroll = inputTrack.scrollWidth - inputTrack.parentElement.clientWidth;
      const isAtEnd = maxScroll <= 0 || offset >= maxScroll - 5; // 5px tolerance
      
      inputNextBtn.style.opacity = isAtEnd ? '0.3' : '1';
      inputNextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
    };

    window.addEventListener('resize', updateInputCarousel);
    setTimeout(updateInputCarousel, 100);

    inputPrevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (inputCurrentIndex > 0) {
        inputCurrentIndex--;
        updateInputCarousel();
      }
    });

    inputNextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const inputMaxIndex = getInputMaxIndex();
      if (inputCurrentIndex < inputMaxIndex) {
        inputCurrentIndex++;
        updateInputCarousel();
      }
    });
  }

  // Generated Plan Accordion Logic
  const generatedPlanHeader = document.getElementById('generated-plan-header');
  const generatedPlanBody = document.getElementById('generated-plan-body');
  const generatedPlanBox = document.getElementById('generated-plan-box');

  if (generatedPlanHeader && generatedPlanBody && generatedPlanBox) {
    generatedPlanHeader.addEventListener('click', () => {
      generatedPlanBox.classList.toggle('active');
      const expandIcon = generatedPlanHeader.querySelector('.expand-icon');
      
      if (generatedPlanBox.classList.contains('active')) {
        generatedPlanBody.style.display = 'block';
        if (expandIcon) expandIcon.style.transform = 'rotate(180deg)';
      } else {
        generatedPlanBody.style.display = 'none';
        if (expandIcon) expandIcon.style.transform = 'rotate(0deg)';
      }
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const propHeaders = document.querySelectorAll('.prop-header');
  const propDetails = document.querySelectorAll('.prop-detail');

  if (propHeaders.length && propDetails.length) {
    propHeaders.forEach(header => {
      header.addEventListener('click', () => {
        // Remove active class from all headers
        propHeaders.forEach(h => h.classList.remove('active'));
        
        // Add active class to clicked header
        header.classList.add('active');
        
        // Get the target property ID
        const targetProp = header.getAttribute('data-prop');
        const targetId = 'prop-' + targetProp;
        
        // Hide all details, show the target one
        propDetails.forEach(detail => {
          if (detail.id === targetId) {
            detail.classList.add('active');
          } else {
            detail.classList.remove('active');
          }
        });
      });
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
  // Nav Property Inner Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const navContents = document.querySelectorAll('.nav-step-content');
  const navVisuals = document.querySelectorAll('.nav-step-visual');

  if (navTabs.length) {
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const parentDetail = tab.closest('.prop-detail');
        if (parentDetail) {
          // Toggle Active Tab (ONLY within this property detail panel)
          const detailTabs = parentDetail.querySelectorAll('.nav-tab');
          detailTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          const targetStep = tab.getAttribute('data-step');
          
          // Toggle Content (scoped to parent)
          const detailContents = parentDetail.querySelectorAll('.nav-step-content');
          detailContents.forEach(c => {
            if (c.id === 'nav-step-' + targetStep) c.classList.add('active');
            else c.classList.remove('active');
          });

          // Toggle Visuals (scoped to parent)
          const detailVisuals = parentDetail.querySelectorAll('.nav-step-visual');
          detailVisuals.forEach(v => {
            if (v.id === 'nav-vis-' + targetStep) v.classList.add('active');
            else v.classList.remove('active');
          });
        }
      });
    });
  }

  // Simple auto-playing slideshow for visual carousels
  const visualCarousels = document.querySelectorAll('.visual-carousel');
  visualCarousels.forEach(carousel => {
    const images = carousel.querySelectorAll('img');
    const parent = carousel.closest('.nav-step-visual');
    const captionEl = parent ? parent.querySelector('.current-visual-caption') : null;

    if (images.length > 1) {
      let currentIndex = 0;
      
      // Initialize first caption
      if (captionEl && images[currentIndex].hasAttribute('data-caption')) {
        captionEl.textContent = images[currentIndex].getAttribute('data-caption');
      }

      setInterval(() => {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');

        // Update caption if it exists
        if (captionEl && images[currentIndex].hasAttribute('data-caption')) {
          captionEl.textContent = images[currentIndex].getAttribute('data-caption');
        }
      }, 3000); // Swap every 3 seconds
    }
  });
});


document.addEventListener('DOMContentLoaded', () => {
  // Stage 4 Accordion
  const traceHeaders = document.querySelectorAll('.trace-header');
  traceHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const step = header.closest('.trace-step');
      const details = step.querySelector('.trace-details');
      
      if (details) {
        if (step.classList.contains('active')) {
          step.classList.remove('active');
          details.style.display = 'none';
        } else {
          step.classList.add('active');
          details.style.display = 'block';
        }
      }
    });
  });
});


document.addEventListener('DOMContentLoaded', () => {
  // Next Stage Button Logic
  const nextStageBtns = document.querySelectorAll('.next-stage-btn');
  const consoleWrapper = document.querySelector('.method-console-wrapper');
  
  if (nextStageBtns.length && consoleWrapper) {
    nextStageBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        
        // Find the corresponding nav item and trigger its click event
        const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (targetNav) {
          targetNav.click();
          
          // Smooth scroll back to the top of the console wrapper
          const yOffset = -50; 
          const y = consoleWrapper.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({top: y, behavior: 'smooth'});
        }
      });
    });
  }
});

