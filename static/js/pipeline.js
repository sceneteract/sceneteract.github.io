document.addEventListener('DOMContentLoaded', () => {
  const wrappers = document.querySelectorAll('.interactive-pipeline-wrapper');

  wrappers.forEach(wrapper => {
    const zones = wrapper.querySelectorAll('.pipeline-zone');
    const textContainer = wrapper.querySelector('.pipeline-text-container');
    const infoBlocks = wrapper.querySelectorAll('.pipeline-info-block');

    if (!textContainer || !zones.length) {
      return;
    }

    const setActiveInfo = (targetId) => {
      textContainer.setAttribute('data-active', targetId);
      
      infoBlocks.forEach(block => {
        // use dataset.id or id to match targetId
        if (block.id === targetId || block.dataset.id === targetId) {
          block.classList.add('active');
          block.style.opacity = '1';
          block.style.pointerEvents = 'auto';
          block.style.zIndex = '2';
        } else {
          block.classList.remove('active');
          block.style.opacity = '0';
          block.style.pointerEvents = 'none';
          block.style.zIndex = '1';
        }
      });
    };

    zones.forEach(zone => {
      zone.addEventListener('mouseenter', () => {
        const target = zone.getAttribute('data-target');
        if (target) setActiveInfo(target);
      });
    });

    const visuals = wrapper.querySelector('.pipeline-visuals');
    if (visuals) {
      visuals.addEventListener('mouseleave', () => {
        setActiveInfo('info-default');
      });
    }
  });
});