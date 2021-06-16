((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});
  setup();
})(this.self || global);

var viewed_black_count = 0;

function setup() {
  var target = document.querySelector('body');
  if (!target) {
    window.setTimeout(setup, 5000);
    return;
  }
  var observer = new MutationObserver((mutations) => {
    if (viewed_black_count % 5 === 0) {
      [...document.querySelectorAll('ytd-grid-video-renderer')].forEach((e) => {
        if (e.querySelector('#progress') || localStorage.getItem("tj::" + e.querySelector('a').href.split('&')[0].split('=')[1])) {
          e.style.opacity = "0.1"
        } else {
          e.style.opacity = "1.0";
        }
      });
    }
    viewed_black_count++;
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
}
