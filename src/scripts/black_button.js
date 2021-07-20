((global) => {
  'use strict';
  chrome.extension.sendRequest({}, (res) => {});
  setup();
})(this.self || global);

var black_button_count = 0;

function addDarkButton(ygvr) {
  var thumbnail = ygvr.querySelector('#thumbnail');
  var overlay = ygvr.querySelector('#overlays');
  var dismiss = document.createElement('button');
  dismiss.className = "tj-kurakusuru";
  dismiss.width = "30px";
  dismiss.height = "30px";
  dismiss.textContent = "× 暗くする";
  dismiss.style.fontSize = "10px";
  dismiss.style.position = "absolute";
  dismiss.style.bottom = 0;
  dismiss.style.backgroundColor = "black";
  dismiss.style.color = "white";
  dismiss.addEventListener("click", (e) => { 
    e.preventDefault();
    e.stopPropagation();
    ygvr.style.opacity = "0.1";
    var a = ygvr.querySelector('a');
    console.log(a);
    if (a) {
      var titleView = ygvr.querySelector('#video-title');
      var title = true;
      if (titleView) {
        title = titleView.textContent;
      }
      localStorage.setItem('tj::' + a.href.split('&')[0].split('=')[1], title);
    }
    var bar = document.createElement('ytd-thumbnail-overlay-resume-playback-renderer');
    bar.className = "style-scope ytd-thumbnail";
    var progress = document.createElement('div');
    progress.id = "progress";
    progress.className = "style-scope ytd-thumbnail-overlay-resume-playback-renderer";
    bar.appendChild(progress);
    overlay.appendChild(bar);
  });
  thumbnail.appendChild(dismiss);
}

function setup() {
  var target = document.querySelector('body');
  if (!target) {
    window.setTimeout(setup, 5000);
    return;
  }
  var observer = new MutationObserver((mutations) => {
    if (black_button_count % 5 === 0) {
      [...document.querySelectorAll('ytd-grid-video-renderer'), ...document.querySelectorAll('ytd-video-renderer')]
      .filter((e) => {
        return !e.querySelector(".tj-kurakusuru");
      })
      .forEach((ygvr) => {
        addDarkButton(ygvr);
      });
    }
    black_button_count++;
  });
  observer.observe(target, {
    childList: true,
    subtree: true
  });
}