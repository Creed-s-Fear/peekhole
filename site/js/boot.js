// Runs synchronously in <head> so the age gate never flashes for visitors who already
// confirmed this session. Kept tiny on purpose: it blocks first paint.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    if (window.sessionStorage.getItem('ph_age_ok') === '1') root.classList.add('age-ok');
  } catch (e) {
    /* storage blocked (private mode, policies): gate shows every time, which is fine */
  }
})();
