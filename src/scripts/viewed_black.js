class VideoItem {
  constructor(e) {
    this.e = e;
  }

  // Getter & Setter

  get href() {
    return this.e.querySelector('a')?.href;
  }

  get id() {
    if (this.isShort()) {
      return this.href.split("shorts/").pop();
    }
    return new URLSearchParams(new URL(this.href).search).get("v");
  }

  // Boolean Methods

  isPlaylistVideo() {
    return this.e.tagName.toLowerCase() === "ytd-playlist-video-renderer";
  }

  isProgress() {
    return this.e.querySelector("#progress") !== null;
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
};

class ViewedBlackController {
  constructor() {
    this.movieCount = 0;
  }

  static get SWITCH_CONTRAST_TYPE() {
    return {
      BLACK: 0,
      HIDDEN: 1,
      INVERT: 2,
      STANDARD: 3
    };
  }

  onLoad() {
    window.addEventListener("load", this.setup.bind(this));
    window.addEventListener("movieCountChange", this.updateViewedBlackOpacity.bind(this));
    window.addEventListener("clickActionTJEvent", this.updateViewedBlackOpacity.bind(this));
    window.addEventListener("clickViewedBlackButtonTJEvent", this.updateViewedBlackOpacity.bind(this));
  }

  setup() {
    if (!document.body) {
      window.setTimeout(this.setup, 5000);
      return;
    }
    let observer = new MutationObserver((mutations) => {
      if (this.movieCount !== this.getAllMovies().length) {
        this.movieCount = this.getAllMovies().length;
        window.dispatchEvent(new Event("movieCountChange"));
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  updateViewedBlackOpacity() {
    try {
      chrome.storage.local.get({ tj_switch_contrast: false }, (value) => {
        this.switchContrast = value.tj_switch_contrast;
        this.applyOpacity();
      });
    } catch (error) {
      console.error(error);
    }
  }

  applyOpacity() {
    console.log(`applyOpacity: ${Object.keys(ViewedBlackController.SWITCH_CONTRAST_TYPE)[this.switchContrast]}`);
    this.getAllMovies().forEach((e) => {
      let videoItem = new VideoItem(e);
      switch(this.switchContrast) {
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
          break;
        case ViewedBlackController.SWITCH_CONTRAST_TYPE.STANDARD:
          videoItem.applyResetOpacity();
          videoItem.applyResetDisplay();
          break;
      }
    });
  }

  getAllMovies() {
    return [
      ...document.querySelectorAll("ytd-grid-video-renderer"),
      ...document.querySelectorAll("ytd-rich-item-renderer"),
      ...document.querySelectorAll("ytd-playlist-video-renderer"),
    ];
  }
};

((global) => {
  "use strict";
  new ViewedBlackController().onLoad();
})(this.self || global);
