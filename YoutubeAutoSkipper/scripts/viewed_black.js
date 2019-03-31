((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});
  setup();
})(this.self || global);

function setup() {
  var target = document.querySelector('body');
  if (!target) {
    window.setTimeout(setup, 5000);
    return;
  }
  var observer = new MutationObserver(records => {
    [...document.querySelectorAll('ytd-grid-video-renderer')].filter((e) => e.querySelector('#progress')).forEach((e) => e.style.opacity = "0.1");
    [...document.querySelectorAll('ytd-grid-video-renderer')].filter((e) => !e.querySelector('#progress')).forEach((e) => e.style.opacity = "1.0");
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
}
