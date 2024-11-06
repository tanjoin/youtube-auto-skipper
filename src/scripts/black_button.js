class VideoGridItem {
  constructor(element) {
    this.element = element;
  }

  get meta() {
    return this.element.querySelector("#meta");
  }

  get details() {
    return this.element.querySelector("#details");
  }

  get overlay() {
    return this.element.querySelector("#overlays");
  }

  get a() {
    return this.element.querySelector("a");
  }

  get href() { 
    return this.a.href;
  }

  get videoTitle() {
    return this.element.querySelector("#video-title");
  }

  get id() {
    if (this.isShort()) {
      return this.href.split("shorts/").pop();
    }
    return new URLSearchParams(new URL(this.href).search).get("v");
  }

  isShort() {
    return this.href.includes("shorts/");
  }

  createButton(textContent, backgroundColor, color, onClick) {
    const button = document.createElement("button");
    button.className = "tj-kurakusuru";
    button.width = "30px";
    button.height = "30px";
    button.textContent = textContent;
    button.style.fontSize = "10px";
    button.style.position = "absolute";
    button.style.bottom = 0;
    button.style.right = 0;
    button.style.backgroundColor = backgroundColor;
    button.style.color = color;
    button.style.opacity = 1.0;
    button.addEventListener("click", onClick);
    this.details?.appendChild(button);
    button.style.removeProperty("position");
    button.style.removeProperty("bottom");
    button.style.removeProperty("right");
    this.meta?.appendChild(button);
    return button;
  }

  createRemoveDarkButton() {
    this.createButton("取り消す", "white", "black", this.onClickRemoveDark.bind(this));
  }

  createAddDarkButton() {
    this.createButton("× 暗くする", "black", "white", this.onClickAddDark.bind(this));
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
    console.log(`VideoGridItem.onClickRemoveDark`);
    this.onClickBefore(button);
    this.element.style.opacity = "1.0";
    this.removeDark();
    this.createAddDarkButton();
    this.onClickAfter(button);
  }

  onClickAddDark(button) {
    console.log(`VideoGridItem.onClickAddDark`);
    this.onClickBefore(button);
    this.element.style.opacity = "0.1";
    this.addDark();
    this.createRemoveDarkButton();
    this.onClickAfter(button);
  }
};

class BlackButtonController {

  constructor() {
    this.movieCount = 0;
  }

  onLoad() {
    window.addEventListener('load', this.setup.bind(this));
    window.addEventListener('movieCountChange', this.updateBlackButton.bind(this));
  }

  setup() {
    console.log(`BlackButtonController.setup`);
    if (!document.body) {
      window.setTimeout(this.setup, 5000);
      return;
    }
    let observer = new MutationObserver((mutations) => {
      if (this.movieCount !== this.getAllVideoGridItems().length) {
        this.movieCount = this.getAllVideoGridItems().length;
        window.dispatchEvent(new Event("movieCountChange"));
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  updateBlackButton() {
    console.log(`BlackButtonController.updateBlackButton`);
    this.addDarkButton();
  }

  addDarkButton() {
    this.getNotDarkedVideoGridItems().forEach((ygvr) => {
      new VideoGridItem(ygvr).createAddDarkButton();
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
    ];
  }
};


((global) => {
  "use strict";
  new BlackButtonController().onLoad();
})(this.self || global);