((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});
  setup();
})(this.self || global);

function setup() {
  var target = document.querySelector('body');
  if (!target) {
    window.setTimeout(setup, 500);
    return;
  }
  var observer = new MutationObserver((mutations) => {
    mutations.forEach((mutationRecord) => {
      skip();
      close();
    });
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
};

function skip() {
  const div = document.querySelector('.ytp-ad-skip-button-container');
  if (div) {
    div.click();
    console.log("YoutubeAutoSkipper skip ads!");
    setTimeout(skip, 500);
  }
};

function close() {
  const div = document.querySelector('.ytp-ad-overlay-close-container > button');
  if (div) {
    div.click();
    console.log("YoutubeAutoSkipper closes ads!");
  }
};
