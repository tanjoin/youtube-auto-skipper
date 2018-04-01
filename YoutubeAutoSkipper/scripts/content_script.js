((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});

  setInterval(() => {
    const skip = document.querySelector('#movie_player > div.video-ads > div > div > div.videoAdUiSkipContainer.html5-stop-propagation > button');
    if (skip) {
      skip.click();
      console.log("YoutubeAutoSkipper skip ads!");
    }
    const close = document.querySelector('div.close-padding').click();
    if (close) {
      close.click();
      console.log("YoutubeAutoSkipper closes ads!");
    }
  }, 1000);
})(this.self || global);
