((global) => {
  "use strict";
  setup();
})(this.self || global);

var ad_count = 0;
let is_skipping = 0;

function setup() {
  var target = document.querySelector("body");
  if (!target) {
    window.setTimeout(setup, 500);
    return;
  }
  var observer = new MutationObserver((mutations) => {
    if (ad_count % 3 === 0) {
      skip();
      close();
    }
    if (ad_count % 10 === 0) {
      viewedBlack();
    }
  });
  observer.observe(target, {
    childList: true,
    subtree: true,
  });
}

function runtimeAdSkip(x, y, callback) {
  chrome.runtime.sendMessage({ action: "skip", x, y }, callback);
}

function skip() {
  if (is_skipping > 0) {
    console.log("is skipping");
    if (is_skipping > 10) {
      is_skipping = 0;
    } else {
      is_skipping++;
    }
    return;
  }
  const previewArea = document.querySelector(".ytp-preview-ad");
  const timeDuration = document.querySelector(".ytp-time-duration");
  if (previewArea) {
    let seconds = parseInt(timeDuration?.textContent?.split(":")[0] * 60 + timeDuration?.textContent?.split(":")[1]);
    if (seconds > 10) {
      let t = document
        ?.querySelector("#time-status")
        ?.textContent.trim()
        ?.split(":")
        ?.reverse()
        ?.map((t, i) => {
          t = parseInt(t);
          if (i == 0) {
            return t;
          } else {
            var tmp = t;
            for (var j = 0; j < i; j++) {
              tmp = tmp * 60;
            }
            return tmp;
          }
        })
        ?.reduce((c, v) => c + v, 0);

      if (t) {
        location.href = location.href + "&t=" + t;
      } else {
        location.reload();
      }
      return;
    }
  }
  const button = document.querySelector(".ytp-skip-ad-button");
  if (button) {
    is_skipping = 1;
    let oX = button.getBoundingClientRect().x;
    let oY = button.getBoundingClientRect().y;
    if (oX <= 0 || oY <= 0) {
      is_skipping = 0;
      return;
    }
    runtimeAdSkip(oX, oY, (response) => {
      console.log("youtubeAutoSkipper skip ads!");
      is_skipping = 0;
      setTimeout(() => {
        document.querySelector("video").play();
      }, 1000);
    });
  }
}

function close() {
  const div = document.querySelector(
    ".ytp-ad-overlay-close-container > button"
  );
  if (div) {
    div.click();
    console.log("YoutubeAutoSkipper closes ads!");
  }
}

let nowUrl = undefined;
function viewedBlack() {
  if (nowUrl == location.href && document.getElementById("viewed_black_main")) {
    return;
  }
  if (document.querySelector("#viewed_black_main")) {
    document.querySelector("#viewed_black_main").remove();
  }
  let area = document.querySelector("#below");
  if (!area) {
    return;
  }
  area.removeAttribute("is-empty");
  nowUrl = location.href;
  if (location.href.split("&")[0].split("=")[1]) {
    var id = location.href.split("&")[0].split("=")[1];
    if (!localStorage.getItem("tj::" + id)) {
      // blacked
      console.log("viewedBlack : " + localStorage.getItem("tj::" + id));
      let button = document.createElement("button");
      button.textContent = "+ 未視聴（未取得）";
      button.style.border = "0";
      button.style.color = "white";
      button.style.marginRight = "6px";
      button.style.backgroundColor = "#018786";
      // button.style.borderRadius = "10%";
      button.style.width = "100%";
      button.id = "viewed_black_main";
      button.addEventListener("click", () => {
        localStorage.setItem("tj::" + id, document.title);
        button.remove();
        nowUrl = undefined;
        viewedBlack();
      });
      area.prepend(button);
    } else {
      console.log("viewedBlack : " + localStorage.getItem("tj::" + id));
      let button = document.createElement("button");
      button.textContent = "× 視聴済み（取得済み）";
      button.style.border = "0";
      button.style.color = "white";
      button.style.marginRight = "6px";
      button.style.backgroundColor = "#6200EE";
      // button.style.borderRadius = "10%";
      button.style.width = "100%";
      button.id = "viewed_black_main";
      button.addEventListener("click", () => {
        localStorage.removeItem("tj::" + id, document.title);
        button.remove();
        nowUrl = undefined;
        viewedBlack();
      });
      area.prepend(button);
    }
    return;
  }
  if (location.href.split("&")[0].split("shorts/")[1]) {
    var id = location.href.split("&")[0].split("shorts/")[1];
    if (!localStorage.getItem("tj::" + id)) {
      // short blacked
      let button = document.createElement("button");
      button.textContent = "+ 未視聴（未取得）";
      button.style.border = "0";
      button.style.color = "white";
      button.style.marginRight = "6px";
      button.style.backgroundColor = "#018786";
      // button.style.borderRadius = "10%";
      button.style.width = "100%";
      button.id = "viewed_black_main";
      button.addEventListener("click", () => {
        localStorage.setItem("tj::" + id, document.title);
        button.remove();
        nowUrl = undefined;
        viewedBlack();
      });
      area.prepend(button);
    } else {
      let button = document.createElement("button");
      button.textContent = "× 視聴済み（取得済み）";
      button.style.border = "0";
      button.style.color = "white";
      button.style.marginRight = "6px";
      button.style.backgroundColor = "#6200EE";
      // button.style.borderRadius = "10%";
      button.style.width = "100%";
      button.id = "viewed_black_main";
      button.addEventListener("click", () => {
        localStorage.setItem("tj::" + id, document.title);
        button.remove();
        nowUrl = undefined;
        viewedBlack();
      });
      area.prepend(button);
    }
  }
}
