class VideoGridItem {
  constructor(element) {
    this.element = element;
  }

  get metadataContainer() {
    return (
      this.element.querySelector(":scope > #content > yt-lockup-view-model yt-lockup-metadata-view-model") ||
      this.element.querySelector("yt-lockup-metadata-view-model")
    );
  }

  get overlay() {
    return this.element.querySelector("#overlays");
  }

  get a() {
    return this.element.querySelector("a");
  }

  get href() {
    return this.a?.href;
  }

  /*
   * タイトルがうまく取得できていない場合は以下のコードをブラウザのコンソールで実行して再度実行して取得できるか確かめてください。
   * const I = 5; Object.keys(localStorage).filter((key) => localStorage.getItem(key) === "undefined").map((key) => `https://www.youtube.com/watch?v=${key.replace('tj::', '')}`).reverse().filter((url, i, arr) => (console.log("target length:", arr.length), true)).slice(I, I+1).forEach((url) => location.href = url);
   */
  get videoTitle() {
    let title = this.element.querySelector(
      "#video-title, [class$='__title'], h3[title]",
    );
    if (!title) {
      console.warn("videoTitle not found", this.element);
      alert("videoTitle not found. Please report to the developer.");
    }
    return title;
  }

  get id() {
    if (!this.href) {
      return null;
    }
    if (this.isShort()) {
      return this.href.split("shorts/").pop();
    }
    if (this.isLive()) {
      return this.href.split("live/").pop();
    }
    return new URLSearchParams(new URL(this.href).search).get("v");
  }

  isDark() {
    return localStorage.getItem("tj::" + this.id) !== null;
  }

  isLive() {
    return this.href?.includes("live/") || false;
  }

  isShort() {
    return this.href?.includes("shorts/") || false;
  }

  hasButton() {
    return this.element.querySelector(".tj-kurakusuru") !== null;
  }

  removeButton() {
    if (this.hasButton()) {
      this.element.querySelector(".tj-kurakusuru").remove();
    }
  }

  createButton(textContent, backgroundColor, color, onClick) {
    const button = document.createElement("button");
    button.className = "tj-kurakusuru";
    button.textContent = textContent;
    button.style.fontSize = "10px";
    button.style.display = "block";
    button.style.width = "100%";
    button.style.marginTop = "8px";
    button.style.boxSizing = "border-box";
    button.style.backgroundColor = backgroundColor;
    button.style.color = color;
    button.style.opacity = 1.0;
    button.addEventListener("click", onClick);

    if (this.metadataContainer?.parentElement) {
      this.metadataContainer.parentElement.insertBefore(
        button,
        this.metadataContainer.nextSibling,
      );
    } else {
      this.element.appendChild(button);
    }

    return button;
  }

  createRemoveDarkButton() {
    this.createButton(
      "取り消す",
      "white",
      "black",
      this.onClickRemoveDark.bind(this),
    );
  }

  createAddDarkButton() {
    this.createButton(
      "× 暗くする",
      "black",
      "white",
      this.onClickAddDark.bind(this),
    );
  }

  applyDarkButton() {
    this.removeButton();
    if (this.isDark()) {
      this.createRemoveDarkButton();
    } else {
      this.createAddDarkButton();
    }
  }

  removeDark() {
    localStorage.removeItem("tj::" + this.id);
  }

  addDark() {
    localStorage.setItem("tj::" + this.id, this.videoTitle?.textContent);
  }

  onClickBefore(button) {
    button.preventDefault();
    button.stopPropagation();
  }

  onClickAfter(event) {
    event.target.remove();
    window.dispatchEvent(new Event("clickViewedBlackButtonTJEvent"));
  }

  onClickRemoveDark(button) {
    tjLog(`VideoGridItem.onClickRemoveDark`);
    this.onClickBefore(button);
    this.element.style.opacity = "1.0";
    this.removeDark();
    this.createAddDarkButton();
    this.onClickAfter(button);
  }

  onClickAddDark(button) {
    tjLog(`VideoGridItem.onClickAddDark`);
    this.onClickBefore(button);
    this.element.style.opacity = "0.1";
    this.addDark();
    this.createRemoveDarkButton();
    this.onClickAfter(button);
  }
}

class BlackButtonController {
  constructor() {
    this.movieCount = 0;
    this.mutationUnsubscribe = null;
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
    window.addEventListener(
      "movieCountChange",
      this.updateBlackButton.bind(this),
    );
  }

  setup() {
    tjLog(`BlackButtonController.setup`);
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
    const allVideoGridItems = this.getAllVideoGridItems();
    if (this.movieCount !== allVideoGridItems.length) {
      this.movieCount = allVideoGridItems.length;
      window.dispatchEvent(new Event("movieCountChange"));
      return;
    }
    if (allVideoGridItems.some((e) => !e.querySelector(".tj-kurakusuru"))) {
      window.dispatchEvent(new Event("movieCountChange"));
    }
  }

  updateBlackButton() {
    tjLog(`BlackButtonController.updateBlackButton`);
    this.hideFeedAdRichItems();
    this.addDarkButton();
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

  addDarkButton() {
    this.getNotDarkedVideoGridItems().forEach((ygvr) => {
      new VideoGridItem(ygvr).applyDarkButton();
    });
  }

  getNotDarkedVideoGridItems() {
    return this.getAllVideoGridItems().filter((e) => {
      return !e.querySelector(".tj-kurakusuru");
    });
  }

  getAllVideoGridItems() {
    return [
      ...document.querySelectorAll("ytd-grid-video-renderer"),
      ...document.querySelectorAll("ytd-video-renderer"),
      ...document.querySelectorAll("ytd-playlist-video-renderer"),
      ...document.querySelectorAll("ytd-rich-item-renderer"),
      ...document.querySelectorAll("#contents > yt-lockup-view-model"),
    ].filter((e) => !e.querySelector("feed-ad-metadata-view-model"));
  }
}

((global) => {
  "use strict";
  new BlackButtonController().onLoad();
})(this.self || global);
