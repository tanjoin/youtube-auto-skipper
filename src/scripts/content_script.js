class ViewedBlackSwitchLargeButton {
  constructor(e) {
    if (e) {
      this.e = e;
    } else {
      this.e = document.createElement("button");
      this.e.style.border = "0";
      this.e.style.color = "white";
      this.e.style.marginRight = "6px";
      this.e.style.width = "100%";
      this.e.id = "viewed_black_main";
    }
  }

  toElement() {
    return this.e;
  }

  apply(textContent, backgroundColor, onClick) {
    this.e.textContent = textContent;
    this.e.style.backgroundColor = backgroundColor;
    this.e.addEventListener("click", onClick);
  }

  applyAlready(clickHandler) {
    this.apply(`× 視聴済み（取得済み）`, "#6200EE", () => {
      this.e.remove();
      clickHandler();
    });
    return this;
  }

  applyNotWatched(clickHandler) {
    this.apply(`+ 未視聴（未取得）`, "#018786", () => {
      this.e.remove();
      clickHandler();
    });
    return this;
  }
};

class DeleteShortAreaController {
  constructor() {
    this.shortAreaCount = 0;
  }

  onLoad() {
    window.addEventListener("shortAreaCountChange", this.deleteShortArea.bind(this));
  }

  observe() {
    if (this.shortAreaCount !== this.getShortArea().length) {
      this.shortAreaCount = this.getShortArea().length;
      window.dispatchEvent(new Event("shortAreaCountChange"));
    }
  }


  // ショート動画削除
  deleteShortArea() {
    this.getShortArea()
      .filter((d) => !d.innerText.includes("新しい順"))
      .forEach((d) => (d.style.display = "none"));
  }

  getShortArea() {
    return [
      ...document.querySelectorAll("div#contents ytd-rich-section-renderer"),
    ];
  }
};

class DismissAdController {
  constructor() {
  }

  onLoad() {
    window.addEventListener("showAd", this.performSkipAction.bind(this));
  }

  observe() {
    if (this.getAdInterruptingElement()) {
      window.dispatchEvent(new Event("showAd"));
    }
  }

  urlChange() {
    this.performSkipAction();
  }

  // Getter & Setter

  getAdInterruptingElement() {
    return document.querySelector(".ad-interrupting");
  }

  getSkipButton() {
    return document.querySelector(
      ".ytp-skip-ad-button, .ytp-ad-skip-button-modern"
    );
  }

  getTimeDuration() {
    return document.querySelector(".ytp-time-duration");
  }

  getTimeCurrent() {
    return document.querySelector(
      "#movie_player:not(.ad-interrupting) .ytp-time-current"
    );
  }

  // Boolean Methods

  isVideoPage() {
    return location.href.includes("/watch?v=");
  }

  // Methods

  checkCurrentTime() {
    if (!this.isVideoPage()) {
      this.currentTime = 0;
      return;
    }
    const timeCurrent = this.getTimeCurrent();
    if (timeCurrent) {
      this.currentTime = 0;
      return;
    }
    let seconds = parseInt(
      timeCurrent?.textContent?.split(":")[0] * 60 +
        timeCurrent?.textContent?.split(":")[1]
    );
    this.currentTime = seconds;
  }

  runtimeAdSkip(x, y, callback) {
    chrome.runtime.sendMessage({ action: "skip", x, y }, callback);
  }

  performSkip(button) {
    let isFullscreen = document.fullscreenElement != null;
    let oX = button.getBoundingClientRect().x;
    let oY = button.getBoundingClientRect().y;
    if (oX <= 0 || oY <= 0) {
      is_skipping = 0;
      setTimeout(this.performSkipAction.bind(this), 5000);
      return;
    }
    this.runtimeAdSkip(oX, oY, (response) => {
      setTimeout(() => {
        document.querySelector("video").play();
        if (isFullscreen && document.fullscreenElement == null) {
          document.documentElement.requestFullscreen();
        }
      }, 1000);
    });
  }

  performSkipAction() {
    const button = this.getSkipButton();
    if (button) {
      button.style.display = "";
      this.performSkip(button);
      return;
    }

    const adInterruptingElement = this.getAdInterruptingElement();
    const timeDuration = this.getTimeDuration();
    if (adInterruptingElement && timeDuration) {
      let seconds = parseInt(
        timeDuration?.textContent?.split(":")[0] * 60 +
          timeDuration?.textContent?.split(":")[1]
      );
      let isFullscreen = document.fullscreenElement != null;
      if (seconds > 10) {
        this.checkCurrentTime();
        if (this.currentTime > 0) {
          let params = new URLSearchParams(location.search);
          params.set("t", this.currentTime);
          if (isFullscreen) {
            params.set("fullscreen", true);
          }
          location.search = params.toString();
        } else {
          let params = new URLSearchParams(location.search);
          if (isFullscreen) {
            params.set("fullscreen", true);
          }
          location.search = params.toString();
          location.reload();
        }
      }
    }
  }
};

class ShowViewedBlackLargeButtonController {
  constructor() {
    this.currentBelow = null;
  }

  onLoad() {
    window.addEventListener("showBelow", this.viewedBlack.bind(this));
  }
  
  observe() {
    let below = this.getBelow();
    if (below && below !== this.currentBelow) {
      this.currentBelow = this.getBelow();
      window.dispatchEvent(new Event("showBelow"));
    }
  }

  urlChange() {
    this.viewedBlack();
  }

  // Getter & Setter

  getBelow() {
    return document.getElementById("below");
  }

  getViewedBlackMain() {
    return document.getElementById("viewed_black_main");
  }

  getVideoId() {
    let params = new URLSearchParams(location.search);
    return params.get("v");
  }

  getShortVideoId() {
    if (!this.isShorts()) {
      return null;
    }
    return location.pathname.split("shorts/").pop();
  }

  // Boolean Methods

  isSavedBlack() {
    let videoId = this.getVideoId();
    if (!videoId) {
      return false;
    }
    return localStorage.getItem("tj::" + videoId);
  }

  isShorts() {
    return location.pathname.includes("shorts/");
  }

  isShortSavedBlack() {
    let videoId = this.getShortVideoId();
    if (!videoId) {
      return false;
    }
    return localStorage.getItem("tj::" + videoId);
  }

  // Methods

  setViewedblack(id) {
    localStorage.setItem("tj::" + id, document.title);
  }

  removeViewedBlack(id) {
    localStorage.removeItem("tj::" + id);
  }

  createNotWatchedViewedBlackButton(id) {
    return new ViewedBlackSwitchLargeButton().applyNotWatched(() => {
      this.setViewedblack(id);
      this.viewedBlack();
    }).toElement();
  }

  createAlreadyWatchedViewedBlackButton(id) {
    return new ViewedBlackSwitchLargeButton().applyAlready(() => {
      this.removeViewedBlack(id);
      this.viewedBlack();
    }).toElement();
  }

  viewedBlack() {
    if (this.getViewedBlackMain()) {
      this.getViewedBlackMain().remove();
    }
    let below = this.getBelow();
    if (!below) {
      return;
    }
    below.removeAttribute("is-empty");
    if (this.isSavedBlack()) {
      below.prepend(this.createAlreadyWatchedViewedBlackButton(this.getVideoId()));
    } else {
      below.prepend(this.createNotWatchedViewedBlackButton(this.getVideoId()));
    }
    // shorts
    if (this.isShorts()) {
      if (this.isShortSavedBlack()) {
        below.prepend(this.createAlreadyWatchedViewedBlackButton(this.getShortVideoId()));
      } else {
        below.prepend(this.createNotWatchedViewedBlackButton(this.getShortVideoId()));
      }
    }
  }
};

class UrlChangeController {
  constructor() {
    this.oldUrl = "";
    this.onUrlDidChangedToWatch = undefined;
  }

  registerOnUrlDidChangedToWatchListener(onUrlDidChangedToWatch) {
    this.onUrlDidChangedToWatch = onUrlDidChangedToWatch;
  }

  onLoad() {
    window.addEventListener("urlChange", this.urlChange.bind(this));
  }

  observe() {
    if (this.oldUrl !== location.href) {
      this.oldUrl = location.href;
      window.dispatchEvent(new Event("urlChange"));
    }
  }

  urlChange() {
    if (location.href.includes("/watch?v=") && this.onUrlDidChangedToWatch) {
      this.onUrlDidChangedToWatch();
    }
  }
}

class ContentScriptController {
  constructor() {
    this.oldUrl = "";
    this.urlChangeController = new UrlChangeController();
    this.showViewedBlackLargeButtonController = new ShowViewedBlackLargeButtonController();
    this.deleteShortAreaController = new DeleteShortAreaController();
    this.dismissAdController = new DismissAdController();
  }

  onLoad() {
    window.addEventListener("load", this.setup.bind(this));
    this.urlChangeController.registerOnUrlDidChangedToWatchListener(this.onUrlDidChangedToWatch.bind(this));
    this.urlChangeController.onLoad();
    this.dismissAdController.onLoad();
    this.showViewedBlackLargeButtonController.onLoad();
    this.deleteShortAreaController.onLoad();
  }

  setup() {
    if (!document.body) {
      window.setTimeout(this.setup.bind(this), 500);
      return;
    }
    let observer = new MutationObserver((mutations) => {
      this.urlChangeController.observe();
      this.dismissAdController.observe();
      this.showViewedBlackLargeButtonController.observe();
      this.deleteShortAreaController.observe();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    let params = new URLSearchParams(location.search);
    if (params.get("fullscreen")) {
      document.documentElement.requestFullscreen();
    }
  }

  onUrlDidChangedToWatch() {
    this.showViewedBlackLargeButtonController.urlChange();
    this.dismissAdController.urlChange();
  }
};

((global) => {
  "use strict";
  new ContentScriptController().onLoad();
})(this.self || global);
