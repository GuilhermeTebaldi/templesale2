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
    var root = document.getElementById('root');
    if (!ready && (event.target instanceof HTMLScriptElement || (event.target === window && (!root || !root.hasChildNodes() || root.querySelector('[data-startup-loading="true"]'))))) recover();
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
