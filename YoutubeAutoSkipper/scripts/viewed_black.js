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
    const selector = '#overlays > ytd-thumbnail-overlay-playback-status-renderer > yt-formatted-string';
    [...document.querySelectorAll(selector)]
      .map((e) => e.parentElement.parentElement.parentElement.parentElement.parentElement)
      .forEach((e) => e.style.opacity = 0.1);
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
}
