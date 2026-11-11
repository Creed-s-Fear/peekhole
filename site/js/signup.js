(function () {
  var f = document.getElementById('signup-form');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = document.getElementById('signup-ok');
    var row = f.querySelector('.signup-row');
    var fine = f.querySelector('.signup-fine');
    if (row) row.hidden = true;
    if (fine) fine.hidden = true;
    if (ok) ok.hidden = false;
  });
})();
