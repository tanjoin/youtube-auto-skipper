class ViewedBlackSwitchLargeButton {
  constructor(element) {
    if (element) {
      this.element = element;
    } else {
      this.element = document.createElement("button");
      this.element.style.border = "0";
      this.element.style.color = "white";
      this.element.style.marginRight = "6px";
      this.element.style.width = "100%";
      this.element.id = "viewed_black_main";
    }
  }

  toElement() {
    return this.element;
  }

  apply(textContent, backgroundColor, onClick) {
    this.element.textContent = textContent;
    this.element.style.backgroundColor = backgroundColor;
    this.element.addEventListener("click", onClick);
  }

  applyAlready(clickHandler) {
    this.apply(`× 視聴済み（取得済み）`, "#6200EE", () => {
      this.element.remove();
      clickHandler();
    });
    return this;
  }

  applyNotWatched(clickHandler) {
    this.apply(`+ 未視聴（未取得）`, "#018786", () => {
      this.element.remove();
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
    console.log(`DeleteShortAreaController.deleteShortArea`);
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
    this.isRunning = false;
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
        ReloadConfirmDialog.clear();
        this.isRunning = false;
      }, 1000);
    });
  }

  performSkipAction() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    console.log(`DismissAdController.performSkipAction`);
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
        let params = new URLSearchParams(location.search);
        if (isFullscreen) {
          params.set("fullscreen", true);
        }
        if (this.currentTime > 0) {
          params.set("t", this.currentTime);
          location.search = params.toString();
        } else {
          ReloadConfirmDialog.clear();
          new ReloadConfirmDialog();
        }
      }
    }
    setTimeout(() => this.isRunning = false, 1000);
  }
};

class ReloadConfirmDialog {
  constructor(e) {
    if (e) {
      this.element = e;
    } else {
      this.addFadeInAnimation();
      this.addFadeOutAnimation();
      this.element = document.createElement("div");
      this.element.id = "tj_reload_confirm_dialog";
      this.element.style.position = "fixed";
      this.element.style.zIndex = "10000";
      this.element.style.top = "0";
      this.element.style.left = "0";
      this.element.style.width = "100%";
      this.element.style.height = "56px";
      this.element.style.backgroundColor = "rgb(207, 226, 255)";
      this.element.style.color = "rgb(5, 44, 101)";
      this.element.style.fontSize = "16px";
      this.element.style.fontWeight = "bold";
      this.element.style.cursor = "pointer";
      this.element.style.border = "1px solid rgb(158, 197, 254)";
      this.element.style.borderRadius = "6px";
      this.element.style.animation = "tj_reload_confirm_dialog_animation_fadein 0.5s";

      let flexBox = document.createElement("div");
      flexBox.style.display = "flex";
      flexBox.style.justifyContent = "center";
      flexBox.style.alignItems = "center";
      flexBox.style.height = "100%";
      this.element.appendChild(flexBox);

      let message = document.createElement("div");
      message.textContent = "リロードしますか？";
      message.style.textAlign = "center";
      message.style.paddingLeft = "12px";
      flexBox.appendChild(message);

      let buttons = document.createElement("div");
      buttons.style.display = "flex";
      buttons.style.justifyContent = "end";
      buttons.style.alignItems = "center";
      buttons.style.flexDirection = "row";
      buttons.style.marginLeft = "auto";
      buttons.style.paddingRight = "12px";
      buttons.style.height = "100%";
      flexBox.appendChild(buttons);

      let yes = document.createElement("button");
      yes.textContent = "はい";
      yes.style.backgroundColor = "rgb(207, 226, 255)";
      yes.style.color = "rgb(5, 44, 101)";
      yes.style.border = "0";
      yes.style.padding = "6px";
      yes.style.cursor = "pointer";
      yes.style.height = "100%";
      yes.style.minWidth = "100px";
      yes.style.fontSize = "16px";
      yes.addEventListener("click", () => {
        console.log(`ReloadConfirmDialog.yes.click`);
        location.reload();
      });
      buttons.appendChild(yes);

      let no = document.createElement("button");
      no.textContent = "いいえ";
      no.style.backgroundColor = "rgb(207, 226, 255)";
      no.style.color = "rgb(5, 44, 101)";
      no.style.border = "0";
      no.style.padding = "6px";
      no.style.cursor = "pointer";
      no.style.height = "100%";
      no.style.minWidth = "100px";
      no.style.fontSize = "16px";
      no.addEventListener("click", () => {
        console.log(`ReloadConfirmDialog.no.click`);
        this.hide();
      });
      buttons.appendChild(no);
      document.body.appendChild(this.element);
    }
  }

  static clear() {
    document.querySelector('#tj_reload_confirm_dialog')?.remove();
  }

  addFadeInAnimation() {
    if (document.getElementById("tj_reload_confirm_dialog_animation_fadein")) {
      return;
    }
    let style = document.createElement("style");
    style.id = "tj_reload_confirm_dialog_animation_fadein";
    document.head.appendChild(style);
    style.sheet.insertRule(
      `@keyframes tj_reload_confirm_dialog_animation_fadein {
        from { transform: translateY(-56px); }
        to   { transform: translateY(0); }
      }`
    );
  }

  addFadeOutAnimation() {
    if (document.getElementById("tj_reload_confirm_dialog_animation_fadeout")) {
      return;
    }
    let style = document.createElement("style");
    style.id = "tj_reload_confirm_dialog_animation_fadeout";
    document.head.appendChild(style);
    style.sheet.insertRule(
      `@keyframes tj_reload_confirm_dialog_animation_fadeout {
        from { transform: translateY(0); }
        to   { transform: translateY(-56px); }
      }`
    );
  }

  hide() {
    this.element.style.animationFillMode = "both";
    this.element.style.animation = "tj_reload_confirm_dialog_animation_fadeout 0.5s";
    this.element.addEventListener("animationend", () => {
      this.element.style.display = "none";
      this.element.remove();
    });
  }
};

class ShowViewedBlackLargeButtonController {
  constructor() {
    this.currentBelow = null;
  }

  onLoad() {
    window.addEventListener("showBelow", this.viewedBlack.bind(this));
    window.addEventListener("tabActivatedTJEvent", this.viewedBlack.bind(this));
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
    console.log(`ShowViewedBlackLargeButtonController.viewedBlack`);
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
    console.log(`UrlChangeController.urlChange`);
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
    this.updateIcon();
  }

  setup() {
    console.log(`ContentScriptController.setup`);
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

  updateIcon() {
    chrome.runtime.sendMessage({ action: "icon" });
  }
};

((global) => {
  "use strict";
  new ContentScriptController().onLoad();
})(this.self || global);
