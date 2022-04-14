chrome.storage.local.get({
  tj_switch_contrast: false
}, (value) => {
  chrome.storage.local.set({
    tj_switch_contrast: !value.tj_switch_contrast
  }, () => {
    apply(!value.tj_switch_contrast);
  });
});

// もともとあった関数を消す
delete apply;
function apply(tj_switch_contrast) {
  [...document.querySelectorAll('ytd-grid-video-renderer')]
  .forEach((e) => {
    if (e.querySelector('a').href.split('&')[0].split('=')[1] && localStorage.getItem("tj::" + e.querySelector('a').href.split('&')[0].split('=')[1])) {
      e.style.opacity = tj_switch_contrast ? "1.0" : "0.1";
      e.style.display = tj_switch_contrast ? undefined : "none";
    } else if (e.querySelector('a').href.split('&')[0].split("shorts/")[1] && localStorage.getItem("tj::" + e.querySelector('a').href.split('&')[0].split("shorts/")[1])) {
      e.style.opacity = tj_switch_contrast ? "1.0" : "0.1";
      e.style.display = tj_switch_contrast ? undefined : "none";
    } else if (e.querySelector('#progress')) {
      e.style.opacity = "0.3";
    } else {
      e.style.opacity = tj_switch_contrast ? "0.1" : "1.0";
    }
  });
}