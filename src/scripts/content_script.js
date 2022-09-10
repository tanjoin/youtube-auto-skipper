((global) => {
  'use strict';
  setup();
})(this.self || global);

var ad_count = 0;

function setup() {
  var target = document.querySelector('body');
  if (!target) {
    window.setTimeout(setup, 500);
    return;
  }
  var observer = new MutationObserver((mutations) => {
    if (ad_count % 3 === 0) {
      skip();
      close();
      viewedBlack();
    }
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

function viewedBlack() {
  if (location.href.split('&')[0].split('=')[1]) {
    var id = location.href.split('&')[0].split('=')[1];
    if (localStorage.getItem("tj::" + location.href.split('&')[0].split('=')[1])) { // blacked
      let area = document.querySelector('#super-title');
      let button = document.createElement('button');
      button.textContent = "✓";
      button.style.border = undefined;
      button.style.color = "white";
      button.style.backgroundColor = "black";
      button.addEventListener("click", () => {
        localStorage.setItem("tj::" + id, document.title);
        button.remove();
        viewedBlack();
      });
      area.prepend(button);
    } else {
      let area = document.querySelector('#super-title');
      let button = document.createElement('button');
      button.textContent = "✗";
      button.style.border = undefined;
      button.style.color = "white";
      button.style.backgroundColor = "black";
      button.addEventListener("click", () => {
        localStorage.removeItem("tj::" + id, document.title);
        button.remove();
        viewedBlack();
      });
      area.prepend(button);
    }
    return;
  }
  if (location.href.split('&')[0].split("shorts/")[1]) {
    var id = location.href.split('&')[0].split("shorts/")[1];
    if (localStorage.getItem("tj::" + location.href.split('&')[0].split("shorts/")[1])) { // short blacked
      let area = document.querySelector('#super-title');
      let button = document.createElement('button');
      button.textContent = "✓";
      button.style.border = undefined;
      button.style.color = "white";
      button.style.backgroundColor = "black";
      button.addEventListener("click", () => {
        localStorage.setItem("tj::" + id, document.title);
        button.remove();
        viewedBlack();
      });
      area.prepend(button);
    } else {
      let area = document.querySelector('#super-title');
      let button = document.createElement('button');
      button.textContent = "✗";
      button.style.border = undefined;
      button.style.color = "white";
      button.style.backgroundColor = "black";
      button.addEventListener("click", () => {
        localStorage.setItem("tj::" + id, document.title);
        button.remove();
        viewedBlack();
      });
      area.prepend(button);
    }
    return;
  }
}