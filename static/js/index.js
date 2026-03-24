window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

$(document).ready(function() {
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

})


// Experiments Tabs Functionality
function setupExperimentsTabs() {
  const tabs = document.querySelectorAll('.experiments-tabs li');
  const panes = document.querySelectorAll('.exp-pane');

  if (tabs.length === 0 || panes.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('is-active'));
      // Add active class to clicked tab
      tab.classList.add('is-active');

      // Get target pane ID
      const targetId = tab.getAttribute('data-tab');

      // Hide all panes
      panes.forEach(pane => {
        pane.classList.remove('is-active');
      });

      // Show target pane
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('is-active');
      }
    });
  });
}

// Initialize tabs when document is ready
document.addEventListener('DOMContentLoaded', () => {
    setupExperimentsTabs();
});


// Metric Headers Interaction
document.addEventListener('DOMContentLoaded', () => {
  const metricHeaders = document.querySelectorAll('.metric-header');
  const metricDetails = document.querySelectorAll('.metric-detail');

  if (metricHeaders.length && metricDetails.length) {
    metricHeaders.forEach(header => {
      header.addEventListener('click', () => {
        // Remove active class from all headers
        metricHeaders.forEach(h => h.classList.remove('active'));
        
        // Add active class to clicked header
        header.classList.add('active');
        
        // Get the target property ID
        const targetMetric = header.getAttribute('data-metric');
        const targetId = 'metric-' + targetMetric;
        
        // Hide all details, show the target one
        metricDetails.forEach(detail => {
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

// Table Cluster Interaction Logic
document.addEventListener('DOMContentLoaded', () => {
  const clusters = document.querySelectorAll('.model-cluster');
  const insightPanel = document.getElementById('cluster-insight-panel');
  const hintText = document.getElementById('default-table-hint');
  
  if (clusters.length === 0 || !insightPanel) return;

  const insights = {
    'flash': {
      title: 'State-of-the-Art via Decomposition',
      text: 'Gemini 3 Flash benefits immensely from decomposition across all metrics, yielding state-of-the-art performances. The granular step-by-step grounding bridges the gap between its semantic priors and physical reality.'
    },
    'pro': {
      title: 'Conservative & Inclusive',
      text: 'Gemini 3.1 Pro shows minimal embodiment bias (lowest InGap) and emerges as the most cautious model, aggressively minimizing false positives at the cost of overall task accuracy.'
    },
    'sonnet': {
      title: 'Native Consistency',
      text: 'Claude 4.6 Sonnet exhibits remarkably high consistency across both direct and decomposed settings, suggesting strong native, internal decomposition and spatial reasoning capabilities.'
    },
    'open_models': {
      title: 'Open Models: The Reasoning Gap',
      text: 'Red cells indicate MCC values near zero, exposing poor discrimination power despite seemingly reasonable raw accuracies. Among open-weight models, Qwen3 clearly distinguishes itself with robust physical reasoning, even in its smaller 4B variant.'
    },
    'grpo': {
      title: 'Improving VLMs via Geometric Rewards',
      text: 'GRPO-driven post-training on SceneTeract reports significantly strengthens functional reasoning. It more than doubles spatial classification quality (MCC) and sharply reduces physical hallucinations (FP) in the lightweight Qwen3-4B model.'
    }
  };

  const themeMap = {
    'flash': 'blue',
    'pro': 'blue',
    'sonnet': 'blue',
    'open_models': 'red',
    'grpo': 'green'
  };

  document.addEventListener('mousemove', (e) => {
    if (insightPanel.classList.contains('visible')) {
      const panelWidth = insightPanel.offsetWidth;
      const panelHeight = insightPanel.offsetHeight;
      
      let left = e.clientX - (panelWidth / 2);
      let top = e.clientY - panelHeight - 20; 
      
      if (left < 10) left = 10;
      if (left + panelWidth > window.innerWidth - 10) left = window.innerWidth - panelWidth - 10;
      if (top < 10) top = e.clientY + 20; 
      
      insightPanel.style.left = `${left}px`;
      insightPanel.style.top = `${top}px`;
    }
  });

  clusters.forEach(cluster => {
    const targetCells = cluster.querySelectorAll('.target-cell');
    if (targetCells.length === 0) return;

    targetCells.forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const modelId = cluster.getAttribute('data-model');
        cluster.classList.add('is-active');

        if (insights[modelId]) {
          insightPanel.querySelector('h4').textContent = insights[modelId].title;
          insightPanel.querySelector('p').textContent = insights[modelId].text;
          
          // Apply theme
          insightPanel.className = `cluster-insight-panel visible ${themeMap[modelId]}`;
          
          if (hintText) hintText.style.opacity = '0.3';
        }
      });

      cell.addEventListener('mouseleave', () => {
        setTimeout(() => {
          const anyHoveredInCluster = Array.from(targetCells).some(c => c.matches(':hover'));
          if (!anyHoveredInCluster) {
            cluster.classList.remove('is-active');
            
            // Only hide the panel if we haven't entered another cluster's target cell
            const anyTargetCellHovered = document.querySelector('.target-cell:hover');
            if (!anyTargetCellHovered) {
              insightPanel.classList.remove('visible');
              if (hintText) hintText.style.opacity = '1';
            }
          }
        }, 50);
      });
    });
  });
});

// Scene Auditing Spider Chart
function initAuditingChart() {
  const ctx = document.getElementById('auditingSpiderChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Close', 'Look At', 'Navigate To', 'Open', 'Pick Up From', 'Release On', 'Sit On', 'Take Out Of'],
      datasets: [
        {
          label: 'Adult',
          data: [47.7, 98.7, 90.0, 50.7, 85.9, 92.4, 72.2, 60.7],
          backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500
          borderColor: 'rgba(59, 130, 246, 1)',
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        {
          label: 'Child',
          data: [44.9, 97.8, 93.5, 48.9, 92.4, 95.2, 78.9, 56.6],
          backgroundColor: 'rgba(16, 185, 129, 0.2)', // emerald-500
          borderColor: 'rgba(16, 185, 129, 1)',
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        },
        {
          label: 'Wheelchair User',
          data: [41.1, 97.7, 79.4, 45.2, 76.3, 79.3, 57.2, 55.0],
          backgroundColor: 'rgba(249, 115, 22, 0.2)', // orange-500
          borderColor: 'rgba(249, 115, 22, 1)',
          pointBackgroundColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { 
            stepSize: 20,
            callback: function(value) {
                return value + '%';
            }
          },
          pointLabels: {
            font: { size: 12, family: "'Fira Code', monospace", weight: '600' },
            color: '#475569'
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: "'Inter', sans-serif", size: 13, weight: '500' },
            padding: 20,
            usePointStyle: true,
          }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    return context.dataset.label + ': ' + context.raw + '%';
                }
            }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
    initAuditingChart();
});

// GRPO Sub-tabs Functionality
function setupGrpoTabs() {
  const tabs = document.querySelectorAll('#grpo-subtabs li');
  const panes = document.querySelectorAll('.grpo-subpane');

  if (tabs.length === 0 || panes.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('is-active'));
      // Add active class to clicked tab
      tab.classList.add('is-active');

      // Get target pane ID
      const targetId = tab.getAttribute('data-target');

      // Hide all panes, show target
      panes.forEach(pane => {
        if (pane.id === targetId) {
          pane.style.display = 'block';
          pane.style.animation = 'fadeIn 0.3s ease-in-out';
        } else {
          pane.style.display = 'none';
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
    setupGrpoTabs();
});
