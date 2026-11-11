(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    if (window.sessionStorage.getItem('ph_age_ok') === '1') root.classList.add('age-ok');
  } catch (e) {}
})();
