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
      const skip = document.querySelector('#movie_player > div.video-ads > div > div > div.videoAdUiSkipContainer.html5-stop-propagation > button');
      if (skip) {
        skip.click();
        console.log("YoutubeAutoSkipper skip ads!");
      }
      const close = document.querySelector('div.close-padding');
      if (close) {
        close.click();
        console.log("YoutubeAutoSkipper closes ads!");
      }
    });
  });
  observer.observe(target, { childList: true });
};
