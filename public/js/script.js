// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
          }
  
          form.classList.add('was-validated')
        }, false)
      })
  })()

window.addEventListener('load', function () {
  const pageLoader = document.getElementById('page-loader');
  if (pageLoader) {
    pageLoader.classList.add('hidden');
    setTimeout(function () {
      pageLoader.remove();
    }, 450);
  }

  const revealCards = document.querySelectorAll('.reveal-card');
  revealCards.forEach(function (card, index) {
    card.style.animationDelay = (index * 70) + 'ms';
  });

  const observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealCards.forEach(function (card) {
    observer.observe(card);
  });
});