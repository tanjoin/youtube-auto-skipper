((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});
  setup();
})(this.self || global);

function setup() {
  var target = document.querySelector('#movie_player > div.video-ads.ytp-ad-module');
  if (!target) {
    window.setTimeout(setup, 500);
    return;
  }
  var observer = new MutationObserver((mutations) => {
    mutations.forEach((mutationRecord) => {
      skip();
      close();
      // vote();
    });
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
};

// function vote() {
//   const div = document.querySelector('.ytp-ad-toggle-button.ytp-ad-instream-user-sentiment-dislike-button');;
//   if (div) {
//     if (label.parentElement.style.display === 'none') {
//       return;
//     }
//     div.click();
//     console.log("vote low.");
//     setTimeout(vote, 500);
//   }
// }

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
