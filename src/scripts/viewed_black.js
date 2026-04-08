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
    this.movieCount = 0;
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
    try {
      chrome.storage.local.get({ tj_switch_contrast: 0 }, (value) => {
        this.switchContrast = value.tj_switch_contrast;
      });
    } catch (error) {}
    window.addEventListener(
      "movieCountChange",
      this.movieCountChanged.bind(this),
    );
    window.addEventListener(
      "clickActionTJEvent",
      this.updateViewedBlackOpacity.bind(this),
    );
    window.addEventListener(
      "clickViewedBlackButtonTJEvent",
      this.updateViewedBlackOpacity.bind(this),
    );
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
    this.observe();
  }

  observe() {
    this.hideFeedAdRichItems();
    const allMovies = this.getAllMovies();
    if (this.movieCount !== allMovies.length) {
      this.movieCount = allMovies.length;
      window.dispatchEvent(new Event("movieCountChange"));
    }
  }

  updateViewedBlackOpacity() {
    tjLog(`ViewedBlackController.updateViewedBlackOpacity`);
    this.hideFeedAdRichItems();
    try {
      chrome.storage.local.get({ tj_switch_contrast: false }, (value) => {
        this.switchContrast = value.tj_switch_contrast;
        this.applyOpacity();
      });
    } catch (error) {}
  }

  movieCountChanged() {
    tjLog(`ViewedBlackController.movieCountChanged`);
    this.hideFeedAdRichItems();
    if (this.switchContrast !== undefined) {
      this.applyOpacity();
    } else {
      this.updateViewedBlackOpacity();
    }
  }

  applyOpacity() {
    tjLog(
      `applyOpacity: ${Object.keys(ViewedBlackController.SWITCH_CONTRAST_TYPE)[this.switchContrast]}`,
    );
    this.getAllMovies().forEach((e) => {
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

  getAllMovies() {
    return [
      ...document.querySelectorAll("ytd-grid-video-renderer"),
      ...document.querySelectorAll("ytd-rich-item-renderer"),
      ...document.querySelectorAll("ytd-playlist-video-renderer"),
      ...document.querySelectorAll("ytd-video-renderer"),
      ...document.querySelectorAll("#contents > yt-lockup-view-model"),
    ].filter((e) => !e.querySelector("feed-ad-metadata-view-model"));
  }

  hideFeedAdRichItems() {
    this.getFeedAdRichItems().forEach((e) => {
      e.style.setProperty("display", "none", "important");
    });
  }

  getFeedAdRichItems() {
    return [...document.querySelectorAll("ytd-rich-item-renderer")].filter(
      (e) => e.querySelector("feed-ad-metadata-view-model"),
    );
  }
}

((global) => {
  "use strict";
  new ViewedBlackController().onLoad();
})(this.self || global);
