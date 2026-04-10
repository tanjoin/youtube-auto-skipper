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

  get buttonsContainer() {
    return (
      this.element.querySelector(":scope > #content ytd-rich-grid-media #buttons") ||
      this.element.querySelector(":scope > #content #buttons") ||
      this.element.querySelector("#buttons")
    );
  }

  get detailsContainer() {
    return (
      this.element.querySelector(":scope > #content ytd-rich-grid-media #details") ||
      this.element.querySelector(":scope > #content #details") ||
      this.element.querySelector("#details")
    );
  }

  get metaContainer() {
    return this.element.querySelector(":scope > #content #meta") || this.element.querySelector("#meta");
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

  isPlaylistVideo() {
    return this.element.tagName.toLowerCase() === "ytd-playlist-video-renderer";
  }

  isInPlaylistVideoListContents() {
    if (!this.isPlaylistVideo()) {
      return false;
    }
    const contents = this.element.closest(
      "ytd-playlist-video-list-renderer #contents",
    );
    return contents !== null;
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

    if (this.isInPlaylistVideoListContents()) {
      button.style.display = "inline-block";
      button.style.width = "auto";
      button.style.marginTop = "6px";
      button.style.marginLeft = "0";
      button.style.padding = "2px 6px";
      button.style.whiteSpace = "nowrap";
      button.style.flexShrink = "0";
    }

    button.addEventListener("click", onClick);

    if (this.isInPlaylistVideoListContents() && this.metaContainer) {
      this.metaContainer.appendChild(button);
    } else if (this.buttonsContainer) {
      this.buttonsContainer.appendChild(button);
    } else if (this.metadataContainer?.parentElement) {
      this.metadataContainer.parentElement.insertBefore(
        button,
        this.metadataContainer.nextSibling,
      );
    } else if (this.detailsContainer) {
      this.detailsContainer.appendChild(button);
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
    const title = this.videoTitle?.textContent?.trim();
    localStorage.setItem("tj::" + this.id, title);
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
    this.observe([]);
  }

  observe(records = []) {
    tjLog(`BlackButtonController.updateBlackButton`);
    this.hideFeedAdRichItems(records);
    this.addDarkButton(this.getTargetVideoGridItems(records));
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

  addDarkButton(elements = this.getAllVideoGridItems()) {
    elements
      .filter((element) => !new VideoGridItem(element).hasButton())
      .forEach((ygvr) => {
      new VideoGridItem(ygvr).applyDarkButton();
    });
  }

  getTargetVideoGridItems(records = []) {
    return this.filterValidVideoGridItems([
      ...globalThis.tjMutationHelper.findElements(records, "ytd-grid-video-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "ytd-video-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "ytd-playlist-video-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "ytd-rich-item-renderer"),
      ...globalThis.tjMutationHelper.findElements(records, "#contents > yt-lockup-view-model"),
    ]);
  }

  getAllVideoGridItems() {
    return this.filterValidVideoGridItems([
      ...document.querySelectorAll("ytd-grid-video-renderer"),
      ...document.querySelectorAll("ytd-video-renderer"),
      ...document.querySelectorAll("ytd-playlist-video-renderer"),
      ...document.querySelectorAll("ytd-rich-item-renderer"),
      ...document.querySelectorAll("#contents > yt-lockup-view-model"),
    ]);
  }

  filterValidVideoGridItems(elements) {
    return [...new Set(elements)].filter(
      (e) => e instanceof Element && !e.querySelector("feed-ad-metadata-view-model"),
    );
  }
}

((global) => {
  "use strict";

  if (global.__tjBlackButtonInitialized) {
    return;
  }
  global.__tjBlackButtonInitialized = true;

  new BlackButtonController().onLoad();
})(this.self || global);
