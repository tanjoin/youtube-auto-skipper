class VideoItem {
  constructor(e) {
    this.e = e;
  }

  // Getter & Setter

  get href() {
    return this.e.querySelector("a")?.href;
  }

  get id() {
    if (this.isShort()) {
      return this.href.split("shorts/").pop();
    }
    if (this.isLive()) {
      return this.href.split("live/").pop();
    }
    return new URLSearchParams(new URL(this.href).search).get("v");
  }

  // Boolean Methods

  isPlaylistVideo() {
    return this.e.tagName.toLowerCase() === "ytd-playlist-video-renderer";
  }

  isLockupViewModel() {
    return this.e.tagName.toLowerCase() === "yt-lockup-view-model";
  }

  isProgress() {
    return this.e.querySelector("#progress") !== null;
  }

  isLive() {
    return this.href.includes("live/");
  }

  isShort() {
    return this.href.includes("shorts/");
  }

  isViewedBlack() {
    if (!this.id) {
      return false;
    }
    return localStorage.getItem("tj::" + this.id) !== null;
  }

  // Opacity Methods

  viewedBlackOpacity() {
    if (this.isPlaylistVideo()) {
      if (this.isProgress()) {
        return "0.5";
      }
      return "0.7";
    } else {
      return "0.1";
    }
  }

  progressOpacity() {
    return "0.5";
  }

  resetOpacity() {
    return "1.0";
  }

  // Display Methods

  applyNoneDisplay() {
    this.e.style.display = "none";
  }

  applyResetDisplay() {
    this.e.style.display = "";
  }

  // Opacity Methods

  applyViewedBlackOpacity() {
    this.e.style.opacity = this.viewedBlackOpacity();
  }

  applyProgressOpacity() {
    this.e.style.opacity = this.progressOpacity();
  }

  applyResetOpacity() {
    this.e.style.opacity = this.resetOpacity();
  }

  // Width Methods
  applyWidth200() {
    if (this.isLockupViewModel()) {
      return;
    }
    this.e.style.width = "200px";
  }

  applyWidthReset() {
    this.e.style.width = "";
  }
}

class ViewedBlackController {
  constructor() {
    this.mutationUnsubscribe = null;
    this.switchContrast = undefined;
  }

  static get SWITCH_CONTRAST_TYPE() {
    return {
      BLACK: 0,
      HIDDEN: 1,
      INVERT: 2,
      STANDARD: 3,
      SHORT_HIDDEN: 4,
      SIZE_WITDH_200: 5,
      SIZE_WITDH_200_HIDDEN: 6,
      SIZE_WITDH_200_INVERT: 7,
    };
  }

  onLoad() {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      this.setup();
    } else {
      window.addEventListener("load", this.setup.bind(this), { once: true });
    }
    window.addEventListener("pagehide", this.pageHide.bind(this));
    window.addEventListener("pageshow", this.pageShow.bind(this));
    try {
      chrome.storage.local.get({ tj_switch_contrast: 0 }, (value) => {
        this.switchContrast = value.tj_switch_contrast;
        this.applyOpacity();
      });
    } catch (error) {}
    window.addEventListener(
      "clickActionTJEvent",
      this.updateViewedBlackOpacity.bind(this),
    );
    window.addEventListener(
      "clickViewedBlackButtonTJEvent",
      this.updateViewedBlackOpacity.bind(this),
    );
  }

  pageHide() {
    if (this.mutationUnsubscribe) {
      this.mutationUnsubscribe();
      this.mutationUnsubscribe = null;
    }
  }

  pageShow() {
    this.setup();
  }

  setup() {
    tjLog(`ViewedBlackController.setup`);
    if (this.mutationUnsubscribe) {
      return;
    }
    if (!document.body) {
      window.setTimeout(this.setup.bind(this), 5000);
      return;
    }
    this.mutationUnsubscribe = globalThis.tjMutationHub.subscribe(
      this.observe.bind(this),
    );
    this.observe([]);
  }

  observe(records = []) {
    this.hideFeedAdRichItems(records);
    if (this.switchContrast === undefined) {
      return;
    }
    this.applyOpacity(this.getTargetMovies(records));
  }

  updateViewedBlackOpacity() {
    tjLog(`ViewedBlackController.updateViewedBlackOpacity`);
    this.hideFeedAdRichItems([]);
    try {
      chrome.storage.local.get({ tj_switch_contrast: false }, (value) => {
        this.switchContrast = value.tj_switch_contrast;
        this.applyOpacity();
      });
    } catch (error) {}
  }

  applyOpacity(elements = this.getAllMovies()) {
    tjLog(
      `applyOpacity: ${Object.keys(ViewedBlackController.SWITCH_CONTRAST_TYPE)[this.switchContrast]}`,
    );
    elements.forEach((e) => {
      let videoItem = new VideoItem(e);
      switch (this.switchContrast) {
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.BLACK:
          if (videoItem.isViewedBlack()) {
            videoItem.applyViewedBlackOpacity();
          } else {
            if (videoItem.isProgress()) {
              videoItem.applyProgressOpacity();
            } else {
              videoItem.applyResetOpacity();
            }
          }
          videoItem.applyResetDisplay();
          videoItem.applyWidthReset();
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.HIDDEN:
          videoItem.applyResetOpacity();
          if (videoItem.isViewedBlack()) {
            videoItem.applyNoneDisplay();
          } else {
            if (videoItem.isProgress()) {
              videoItem.applyProgressOpacity();
            } else {
              videoItem.applyResetOpacity();
            }
            videoItem.applyResetDisplay();
          }
          videoItem.applyWidthReset();
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.INVERT:
          if (videoItem.isViewedBlack()) {
            if (videoItem.isProgress()) {
              videoItem.applyProgressOpacity();
            } else {
              videoItem.applyResetOpacity();
            }
          } else {
            videoItem.applyViewedBlackOpacity();
          }
          videoItem.applyResetDisplay();
          videoItem.applyWidthReset();
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.STANDARD:
          videoItem.applyResetOpacity();
          videoItem.applyResetDisplay();
          videoItem.applyWidthReset();
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.SHORT_HIDDEN:
          if (videoItem.isShort()) {
            videoItem.applyNoneDisplay();
          } else {
            videoItem.applyResetOpacity();
            videoItem.applyResetDisplay();
          }
          videoItem.applyWidthReset();
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.SIZE_WITDH_200:
          if (videoItem.isViewedBlack()) {
            videoItem.applyViewedBlackOpacity();
          }
          videoItem.applyResetDisplay();
          videoItem.applyWidth200();
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.SIZE_WITDH_200_HIDDEN:
          videoItem.applyResetOpacity();
          if (videoItem.isViewedBlack()) {
            videoItem.applyNoneDisplay();
          }
          videoItem.applyWidth200();
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.SIZE_WITDH_200_INVERT:
          if (videoItem.isViewedBlack()) {
            if (videoItem.isProgress()) {
              videoItem.applyProgressOpacity();
            } else {
              videoItem.applyResetOpacity();
            }
          } else {
            videoItem.applyViewedBlackOpacity();
          }
          videoItem.applyResetDisplay();
          videoItem.applyWidth200();
          break;
      }
    });
  }

  getTargetMovies(records = []) {
    return this.filterValidMovies([
      ...globalThis.tjMutationHelper.findElements(records, "ytd-grid-video-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "ytd-rich-item-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "ytd-playlist-video-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "ytd-video-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "#contents > yt-lockup-view-model"),
    ]);
  }

  getAllMovies() {
    return this.filterValidMovies([
      ...document.querySelectorAll("ytd-grid-video-renderer"),
      ...document.querySelectorAll("ytd-rich-item-renderer"),
      ...document.querySelectorAll("ytd-playlist-video-renderer"),
      ...document.querySelectorAll("ytd-video-renderer"),
      ...document.querySelectorAll("#contents > yt-lockup-view-model"),
    ]);
  }

  hideFeedAdRichItems(records = []) {
    this.getFeedAdRichItems(records).forEach((e) => {
      e.style.setProperty("display", "none", "important");
    });
  }

  getFeedAdRichItems(records = []) {
    return globalThis.tjMutationHelper.findElements(
      records,
      "ytd-rich-item-renderer",
    ).filter(
      (e) => e.querySelector("feed-ad-metadata-view-model"),
    );
  }

  filterValidMovies(elements) {
    return [...new Set(elements)].filter(
      (e) => e instanceof Element && !e.querySelector("feed-ad-metadata-view-model"),
    );
  }
}

((global) => {
  "use strict";

  if (global.__tjViewedBlackInitialized) {
    return;
  }
  global.__tjViewedBlackInitialized = true;

  new ViewedBlackController().onLoad();
})(this.self || global);
