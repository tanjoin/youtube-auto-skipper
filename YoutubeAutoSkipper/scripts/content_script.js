((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});
  setup();
})(this.self || global);

function setup() {
  var target = document.querySelector('#movie_player > div.video-ads > div.ad-container');
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
  observer.observe(target, { childList: true });
};

function skip() {
  const div = document.querySelector('div.videoAdUiSkipContainer > button');
  if (div) {
    div.click();
    console.log("YoutubeAutoSkipper skip ads!");
    setTimeout(skip, 500);
  }
};

function close() {
  const div = document.querySelector('div.close-padding');
  if (div) {
    div.click();
    console.log("YoutubeAutoSkipper closes ads!");
  }
};
