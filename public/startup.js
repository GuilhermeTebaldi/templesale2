// Independent of the app bundle: recover a stale entry without a blank screen.
(function () {
  var ready = false;
  var recovering = false;
  var retryKey = '_ts_startup_retry';
  function recover() {
    if (recovering) return;
    var url = new URL(window.location.href);
    if (url.searchParams.has(retryKey)) {
      return;
    }
    recovering = true;
    url.searchParams.set(retryKey, String(Date.now()));
    window.location.replace(url.href);
  }
  window.addEventListener('error', function (event) {
    if (!ready && (event.target instanceof HTMLScriptElement || !document.getElementById('root').hasChildNodes())) recover();
  }, true);
  window.addEventListener('vite:preloadError', function (event) {
    event.preventDefault();
    recover();
  });
  window.addEventListener('templesale:ready', function () {
    ready = true;
    var url = new URL(window.location.href);
    if (url.searchParams.has(retryKey)) {
      url.searchParams.delete(retryKey);
      window.history.replaceState(window.history.state, '', url.href);
    }
  }, { once: true });
}());
