((global) => {
  'use strict';
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
      try {
        chrome.storage.local.get({
          tj_switch_contrast: false
        }, (value) => {
          tj_switch_contrast = value.tj_switch_contrast;
          apply(value.tj_switch_contrast);
        });
      } catch (error) {
        // console.error(error);
      }
    }
    viewed_black_count++;
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
}

function apply(tj_switch_contrast) {
  // ショート動画削除
  [...document.querySelectorAll('div#contents ytd-rich-section-renderer')]
    .filter((d) => !d.innerText.includes('新しい順'))
    .forEach((d) => d.style.display = 'none');
  
  [...document.querySelectorAll('ytd-grid-video-renderer'), ...document.querySelectorAll('ytd-rich-item-renderer'), ...document.querySelectorAll('ytd-playlist-video-renderer')]
  .forEach((e) => {
    if (e.querySelector('a').href.split('&')[0].split('=')[1] && localStorage.getItem("tj::" + e.querySelector('a').href.split('&')[0].split('=')[1])) {
      if (e.tagName.toLowerCase() === "ytd-playlist-video-renderer") {
        if (e.querySelector('#progress')) {
          e.style.opacity = "0.5";
        } else {
          e.style.opacity = "0.7";
        }
      } else {
        e.style.opacity = "0.1";
      }
    } else if (e.querySelector('a').href.split('&')[0].split("shorts/")[1] && localStorage.getItem("tj::" + e.querySelector('a').href.split('&')[0].split("shorts/")[1])) {
      if (e.tagName.toLowerCase() === "ytd-playlist-video-renderer") {
        if (e.querySelector('#progress')) {
          e.style.opacity = "0.5";
        } else {
          e.style.opacity = "0.7";
        }
      } else {
        e.style.opacity = "0.1";
      }
    } else if (e.querySelector('#progress')) {
      e.style.opacity = "0.5";
    } else {
      e.style.opacity = "1.0";
    }
  });
}