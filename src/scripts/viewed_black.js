((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});
  setup();
})(this.self || global);

var viewed_black_count = 0;
var tj_switch_contrast = false;

function setup() {
  var target = document.querySelector('body');
  if (!target) {
    window.setTimeout(setup, 5000);
    return;
  }
  var observer = new MutationObserver((mutations) => {
    if (viewed_black_count % 5 === 0) {
      chrome.storage.local.get({
        tj_switch_contrast: false
      }, (value) => {
        tj_switch_contrast = value.tj_switch_contrast;
        apply(value.tj_switch_contrast);
      });
    }
    viewed_black_count++;
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
}

function apply(tj_switch_contrast) {
  [...document.querySelectorAll('ytd-grid-video-renderer')]
  .forEach((e) => {
    if (localStorage.getItem("tj::" + e.querySelector('a').href.split('&')[0].split('=')[1])) {
      e.style.opacity = "0.1";
    } else if (e.querySelector('#progress')) {
      e.style.opacity = "0.3";
    } else {
      e.style.opacity = "1.0";
    }
  });
}