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

// その他のトピック を削除
class DeleteOtherTopicsController {
  onLoad() {}

  observe(records = []) {
    this.deleteOtherTopics(records);
  }

  // その他のトピック削除
  deleteOtherTopics(records = []) {
    tjLog(`DeleteOtherTopicsController.deleteOtherTopics`);
    this.getOtherTopics(records)
      .forEach((d) => d.style.setProperty("display", "none", "important"));
  }

  getOtherTopics(records = []) {
    return globalThis.tjMutationHelper.findElements(records, "ytd-rich-section-renderer")
        .filter((d) => d?.querySelector('#title')?.textContent.includes("その他のトピック"));
  }
};

class DeleteNewsAreaController {
  onLoad() {}

  observe(records = []) {
    this.deleteNewsArea(records);
  }

  // お知らせ削除
  deleteNewsArea(records = []) {
    tjLog(`DeleteNewsAreaController.deleteNewsArea`);
    this.getNewsArea(records)
      .forEach((d) => d.style.setProperty("display", "none", "important"));
  }

  getNewsArea(records = []) {
    return globalThis.tjMutationHelper.findElements(records, "ytd-rich-section-renderer")
        .filter((d) => d?.querySelector('#title')?.textContent.includes("ニュース速報"));
  }
};

class DeleteRelatedAreaController {
  onLoad() {}

  observe(records = []) {
    this.deleteRelatedArea(records);
  }

  // 関連動画削除
  deleteRelatedArea(records = []) {
    tjLog(`DeleteRelatedAreaController.deleteRelatedArea`);
    this.getRelatedArea(records)
      .forEach((d) => d.style.setProperty("display", "none", "important"));
  }

  getRelatedArea(records = []) {
    return globalThis.tjMutationHelper.findElements(records, "ytd-rich-section-renderer")
        .filter((d) => d?.querySelector('#title')?.textContent.includes("関連が強い"));
  }
};

class DeleteShortAreaController {
  onLoad() {}

  observe(records = []) {
    this.deleteShortArea(records);
  }

  // ショート動画削除
  deleteShortArea(records = []) {
    tjLog(`DeleteShortAreaController.deleteShortArea`);
    this.getShortArea(records)
      .forEach((d) => d.style.setProperty("display", "none", "important"));
  }

  getShortArea(records = []) {
    return globalThis.tjMutationHelper.findElements(records, "ytd-rich-section-renderer")
      .filter((d) => d.querySelector('a[href*="/shorts/"]'));
  }
};

class DismissAdController {
  constructor() {
    this.isRunning = false;
  }

  onLoad() {
    window.addEventListener("showAd", this.performSkipAction.bind(this));
    window.addEventListener("hideAd", this.dismissReloadConfirmDialog.bind(this));
  }

  observe() {
    if (this.getAdInterruptingElement()) {
      window.dispatchEvent(new Event("showAd"));
    } else if (ReloadConfirmDialog.isExist()) {
      window.dispatchEvent(new Event("hideAd"));
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
    tjLog(`DismissAdController.checkCurrentTime`);
    if (!this.isVideoPage()) {
      this.currentTime = 0;
      return;
    }
    const timeCurrent = this.getTimeCurrent();
    if (!timeCurrent) {
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
    try {
      chrome.runtime?.sendMessage({ action: "skip", x, y }, callback);
    } catch (e) {
      tjLog(`DismissAdController.runtimeAdSkip: ${e}`);
    }
  }

  performSkip(button) {
    let isFullscreen = document.fullscreenElement != null;
    let oX = button.getBoundingClientRect().x;
    let oY = button.getBoundingClientRect().y;
    if (oX <= 0 || oY <= 0) {
      setTimeout(this.performSkipAction.bind(this), 5000);
      tjLog(`DismissAdController.performSkip: skip button not found`);
      return;
    } else {
      tjLog(`DismissAdController.performSkip: skip button found at (${oX}, ${oY})`);
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
    tjLog(`DismissAdController.performSkipAction`);
    const button = this.getSkipButton();
    if (button) {
      button.style.display = "";
      this.performSkip(button);
      tjLog(`DismissAdController.performSkipAction: skip button found`);
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
      tjLog(`DismissAdController.performSkipAction: ${seconds} seconds`);
      if (seconds > 10) {
        this.checkCurrentTime();
        let params = new URLSearchParams(location.search);
        if (isFullscreen) {
          params.set("fullscreen", true);
        }
        tjLog(`DismissAdController.performSkipAction: currentTime -> ${this.currentTime} seconds`);
        if (this.currentTime > 0) {
          tjLog(`DismissAdController.performSkipAction: skip to ${this.currentTime} seconds`);
          params.set("t", this.currentTime);
          location.search = params.toString();
        } else {
          this.showReloadConfirmation();
        }
      }
    }
    tjLog(`DismissAdController.performSkipAction: skip button not found`);
    setTimeout(() => this.isRunning = false, 1000);
  }

  showReloadConfirmation() {
    tjLog(`DismissAdController.showReloadConfirmation`);
    if (ReloadConfirmDialog.isExist()) {
      return;
    }
    ReloadConfirmDialog.clear();
    new ReloadConfirmDialog();
  }

  dismissReloadConfirmDialog() {
    ReloadConfirmDialog.clear();
  }
};

class ReloadConfirmDialog {
  constructor(e) {
    if (e) {
      this.element = e;
    } else {
      this.onKeyDown = this.handleKeyDown.bind(this);
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
      flexBox.style.justifyContent = "space-between";
      flexBox.style.alignItems = "center";
      flexBox.style.height = "100%";
      flexBox.style.paddingLeft = "12px";
      this.element.appendChild(flexBox);

      let message = document.createElement("div");
      message.textContent = "リロードしますか？";
      message.style.textAlign = "center";
      message.style.paddingRight = "12px";
      flexBox.appendChild(message);

      let buttons = document.createElement("div");
      buttons.style.display = "flex";
      buttons.style.justifyContent = "end";
      buttons.style.alignItems = "center";
      buttons.style.flexDirection = "row";
      buttons.style.marginLeft = "auto";
      buttons.style.gap = "4px";
      buttons.style.paddingRight = "8px";
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
      yes.style.minWidth = "180px";
      yes.style.fontSize = "16px";
      yes.style.fontWeight = "bold";
      yes.addEventListener("click", () => {
        tjLog(`ReloadConfirmDialog.yes.click`);
        this.confirmReload();
      });
      buttons.appendChild(yes);
      this.yes = yes;

      let close = document.createElement("button");
      close.textContent = "×";
      close.style.backgroundColor = "rgb(207, 226, 255)";
      close.style.color = "rgb(5, 44, 101)";
      close.style.border = "0";
      close.style.padding = "6px";
      close.style.cursor = "pointer";
      close.style.height = "100%";
      close.style.width = "48px";
      close.style.fontSize = "20px";
      close.addEventListener("click", () => {
        tjLog(`ReloadConfirmDialog.no.click`);
        this.hide();
      });
      buttons.appendChild(close);

      flexBox.addEventListener("click", (event) => {
        if (event.target === close || event.target === yes) {
          return;
        }
        tjLog(`ReloadConfirmDialog.yes.click`);
        this.confirmReload();
      });

      document.body.appendChild(this.element);
      document.addEventListener("keydown", this.onKeyDown);
      setTimeout(() => this.yes?.focus(), 0);
    }
  }

  static isExist() { 
    return document.querySelector('#tj_reload_confirm_dialog') ? true : false;
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

  handleKeyDown(event) {
    if (!this.element || !document.body.contains(this.element)) {
      return;
    }
    if (event.key === "Enter" || event.key === "y" || event.key === "Y") {
      event.preventDefault();
      tjLog(`ReloadConfirmDialog.yes.click`);
      this.confirmReload();
      return;
    }
    if (event.key === "Escape" || event.key === "n" || event.key === "N") {
      event.preventDefault();
      tjLog(`ReloadConfirmDialog.no.click`);
      this.hide();
    }
  }

  confirmReload() {
    this.removeKeyDownListener();
    location.reload();
  }

  removeKeyDownListener() {
    if (!this.onKeyDown) {
      return;
    }
    document.removeEventListener("keydown", this.onKeyDown);
  }

  hide() {
    this.removeKeyDownListener();
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
    this.isRenderScheduled = false;
  }

  onLoad() {
    window.addEventListener("tabActivatedTJEvent", this.viewedBlack.bind(this));
  }

  scheduleViewedBlack() {
    if (this.isRenderScheduled) {
      return;
    }
    this.isRenderScheduled = true;
    const flush = () => {
      this.isRenderScheduled = false;
      this.viewedBlack();
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(flush);
    } else {
      window.setTimeout(flush, 16);
    }
  }
  
  observe(records = []) {
    let below = this.getBelow();
    if (!below) {
      this.currentBelow = null;
      return;
    }

    const currentBelowDetached =
      this.currentBelow && !document.body.contains(this.currentBelow);
    const buttonMissing = this.getViewedBlackMain() === null;
    const belowChanged = below !== this.currentBelow || currentBelowDetached;
    const belowAffected = this.isBelowAffected(records, below);

    if (belowChanged || (buttonMissing && (records.length === 0 || belowAffected))) {
      this.currentBelow = below;
      this.scheduleViewedBlack();
    }
  }

  urlChange() {
    this.currentBelow = null;
    this.scheduleViewedBlack();
  }

  // Getter & Setter

  getBelow() {
    return document.getElementById("below");
  }

  getViewedBlackMain() {
    return document.getElementById("viewed_black_main");
  }

  isBelowAffected(records, below) {
    if (!Array.isArray(records) || records.length === 0) {
      return true;
    }

    return records.some((record) => {
      if (!(record.target instanceof Node)) {
        return false;
      }

      if (record.target === below) {
        return true;
      }

      if (record.target instanceof Element && record.target.contains(below)) {
        return true;
      }

      return [...record.addedNodes].some((node) => {
        if (!(node instanceof Node)) {
          return false;
        }
        return node === below || (node instanceof Element && node.contains(below));
      });
    });
  }

  getVideoId() {
    let params = new URLSearchParams(location.search);
    return params.get("v");
  }

  getLiveChatId() {
    if (!this.isLive()) {
      return null;
    }
    return location.pathname.split("live/").pop();
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

  isLive() {
    return location.pathname.includes('live/');
  }

  isShorts() {
    return location.pathname.includes("shorts/");
  }

  isLiveSavedBlack() {
    let liveChatId = this.getLiveChatId();
    if (!liveChatId) {
      return false;
    }
    return localStorage.getItem("tj::" + liveChatId);
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
    tjLog(`ShowViewedBlackLargeButtonController.viewedBlack`);
    if (this.getViewedBlackMain()) {
      this.getViewedBlackMain().remove();
    }
    let below = this.getBelow();
    if (!below) {
      return;
    }
    below.removeAttribute("is-empty");
    
    // shorts
    if (this.isShorts()) {
      if (this.isShortSavedBlack()) {
        below.prepend(this.createAlreadyWatchedViewedBlackButton(this.getShortVideoId()));
      } else {
        below.prepend(this.createNotWatchedViewedBlackButton(this.getShortVideoId()));
      }
      return;
    }
    // live
    if (this.isLive()) {
      if (this.isLiveSavedBlack()) {
        below.prepend(this.createAlreadyWatchedViewedBlackButton(this.getLiveChatId()));
      } else {
        below.prepend(this.createNotWatchedViewedBlackButton(this.getLiveChatId()));
      }
      return;
    }

    if (this.isSavedBlack()) {
      below.prepend(this.createAlreadyWatchedViewedBlackButton(this.getVideoId()));
    } else {
      below.prepend(this.createNotWatchedViewedBlackButton(this.getVideoId()));
    }
  }
};

class UrlChangeController {
  constructor() {
    this.oldUrl = location.href;
    this.onUrlDidChangedToWatch = undefined;
  }

  registerOnUrlDidChangedToWatchListener(onUrlDidChangedToWatch) {
    this.onUrlDidChangedToWatch = onUrlDidChangedToWatch;
  }

  onLoad() {
    window.addEventListener("urlChange", this.urlChange.bind(this));
    window.addEventListener("popstate", this.popState.bind(this));
    window.addEventListener("pagehide", this.pageHide.bind(this));
  }

  popState() {
    this.observe();
  }

  pageHide() {
    this.oldUrl = location.href;
  }

  observe() {
    if (this.oldUrl !== location.href) {
      this.oldUrl = location.href;
      window.dispatchEvent(new Event("urlChange"));
    }
  }

  urlChange() {
    tjLog(`UrlChangeController.urlChange`);
    if (location.href.includes("/watch?v=") && this.onUrlDidChangedToWatch) {
      this.onUrlDidChangedToWatch();
    }
  }
}

class SkipMembersOnlyController {

  isMembersOnly() {
    return document.querySelector('#movie_player').textContent.includes('メンバー限定コンテンツ');
  }

  getPlaylistPanels() {
    return [...document.querySelectorAll('ytd-playlist-panel-video-renderer')];
  }

  getCurrentPlaylistPanel() {
    return this.getPlaylistPanels()
        .find((panel) => this.extractSpanFromPlaylistPanel(panel).textContent.includes('▶'));
  }

  extractSpanFromPlaylistPanel(panel) {
    return panel.querySelector('span#index.style-scope.ytd-playlist-panel-video-renderer');
  }

  skip({ isVerifyLater }) {
    tjLog(`SkipMembersOnlyController.skip`);
    if (this.isMembersOnly()) {
        const result = this.getCurrentPlaylistPanel();
        if (result) { 
          location.href = result.nextElementSibling.querySelector('a').href;
        }
    }
    if (isVerifyLater) {
      this.onUrlDidChangedToWatchAfter10();
    }
  }

  onUrlDidChangedToWatchAfter10() {
    setTimeout(() => {
      this.skip({
        isVerifyLater: document.querySelector('ytd-playlist-panel-renderer.ytd-watch-flexy') === null
      });
    }, 10000);
  }
}

class PressNextButtonController {

  getConfirmDialogList() {
    return [...document.querySelectorAll('yt-confirm-dialog-renderer')]
        .filter((y) => y.textContent.includes('続きを視聴しますか？'));
  }

  observe() {
    const confirmDialogList = this.getConfirmDialogList();
    if (confirmDialogList?.length > 0) {
      confirmDialogList        
        .map((y) => y.querySelector('#confirm-button > yt-button-shape > button'))
        .forEach((b) => b.click());
    }
  }

  urlChange() {
    this.observe();
  }

  onLoad() {
    window.addEventListener("showNextButton", this.press.bind(this));
  }

  press() {
    tjLog(`PressNextButtonController.press`);
    this.getNextButton().click();
  }
}

class VersionOverlayController {
  constructor() {
    this.sequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    this.index = 0;
    this.overlayId = "tj_version_overlay";
  }

  onLoad() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  handleKeyDown(event) {
    if (this.isTypingTarget(event.target)) {
      return;
    }

    const key = this.normalizeKey(event.key);
    if (!key) {
      return;
    }

    const expected = this.sequence[this.index];
    if (key === expected) {
      this.index += 1;
      if (this.index === this.sequence.length) {
        this.index = 0;
        this.showVersion();
      }
      return;
    }

    this.index = key === this.sequence[0] ? 1 : 0;
  }

  normalizeKey(key) {
    if (!key) {
      return null;
    }
    if (key.startsWith("Arrow")) {
      return key;
    }
    if (key.length === 1) {
      return key.toLowerCase();
    }
    return null;
  }

  isTypingTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    const tag = target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      return true;
    }
    return target.isContentEditable;
  }

  getVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch (error) {
      return "unknown";
    }
  }

  showVersion() {
    const text = `youtube-auto-skipper: ${this.getVersion()}`;
    let overlay = document.getElementById(this.overlayId);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = this.overlayId;
      overlay.style.position = "fixed";
      overlay.style.top = "8px";
      overlay.style.left = "8px";
      overlay.style.zIndex = "2147483647";
      overlay.style.padding = "6px 8px";
      overlay.style.borderRadius = "4px";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      overlay.style.color = "#fff";
      overlay.style.fontSize = "12px";
      overlay.style.fontFamily = "monospace";
      overlay.style.pointerEvents = "none";
      document.body.appendChild(overlay);
    }
    overlay.textContent = text;
    overlay.style.display = "block";
  }
}

class ContentScriptController {
  constructor() {
    this.oldUrl = "";
    this.mutationUnsubscribe = null;
    this.urlChangeController = new UrlChangeController();
    this.showViewedBlackLargeButtonController = new ShowViewedBlackLargeButtonController();
    this.deleteShortAreaController = new DeleteShortAreaController();
    this.deleteRelatedAreaController = new DeleteRelatedAreaController();
    this.deleteNewsAreaController = new DeleteNewsAreaController();
    this.deleteOtherTopicsController = new DeleteOtherTopicsController();
    this.dismissAdController = new DismissAdController();
    this.skipMembersOnlyController = new SkipMembersOnlyController();
    this.pressNextButtonController = new PressNextButtonController();
    this.versionOverlayController = new VersionOverlayController();
  }

  onLoad() {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      this.setup();
    } else {
      window.addEventListener("load", this.setup.bind(this), { once: true });
    }
    this.urlChangeController.registerOnUrlDidChangedToWatchListener(this.onUrlDidChangedToWatch.bind(this));
    this.urlChangeController.onLoad();
    this.dismissAdController.onLoad();
    this.showViewedBlackLargeButtonController.onLoad();
    this.deleteShortAreaController.onLoad();
    this.deleteRelatedAreaController.onLoad();
    this.deleteNewsAreaController.onLoad();
    this.deleteOtherTopicsController.onLoad();
    this.pressNextButtonController.onLoad();
    this.versionOverlayController.onLoad();
    this.updateIcon();
  }

  setup() {
    tjLog(`ContentScriptController.setup`);
    if (this.mutationUnsubscribe) {
      return;
    }
    if (!document.body) {
      window.setTimeout(this.setup.bind(this), 500);
      return;
    }
    this.mutationUnsubscribe = globalThis.tjMutationHub.subscribe(this.observe.bind(this));
    this.observe();
    let params = new URLSearchParams(location.search);
    if (params.get("fullscreen")) {
      document.documentElement.requestFullscreen();
    }
  }

  isWatchLikePage() {
    if (location.pathname.includes("/shorts/")) {
      return true;
    }
    if (location.pathname.includes("/live/")) {
      return true;
    }
    return location.href.includes("/watch?v=");
  }

  observe(records = []) {
    this.urlChangeController.observe();

    if (this.isWatchLikePage()) {
      this.dismissAdController.observe();
      this.showViewedBlackLargeButtonController.observe(records);
      this.pressNextButtonController.observe(records);
      return;
    }

    this.deleteShortAreaController.observe(records);
    this.deleteRelatedAreaController.observe(records);
    this.deleteNewsAreaController.observe(records);
    this.deleteOtherTopicsController.observe(records);
  }

  onUrlDidChangedToWatch() {
    this.showViewedBlackLargeButtonController.urlChange();
    this.dismissAdController.urlChange();
    this.pressNextButtonController.urlChange();
    this.skipMembersOnlyController.skip({ isVerifyLater: true });
  }

  updateIcon() {
    chrome.runtime.sendMessage({ action: "icon" });
  }
};

((global) => {
  "use strict";

  if (global.__tjContentScriptInitialized) {
    return;
  }
  global.__tjContentScriptInitialized = true;

  new ContentScriptController().onLoad();
})(this.self || global);
