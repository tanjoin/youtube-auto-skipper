// content_script.js からリクエストを受け取り、アドレスバーにアイコンを表示する.
((global) => {
  "use strict";

  const BADGE = [
    { text: "黒", color: "#000000", textColor: "#FFFFFF" },
    { text: "隠", color: "#16A34A", textColor: "#FFFFFF" },
    { text: "逆", color: "#DC2626", textColor: "#FFFFFF" },
    { text: "正", color: "#FFFFFF", textColor: "#000000" },
    { text: "シ", color: "#2563EB", textColor: "#FFFFFF" },
    { text: "2黒", color: "#6B7280", textColor: "#FFFFFF" },
    { text: "2隠", color: "#4ADE80", textColor: "#000000" },
    { text: "2逆", color: "#F87171", textColor: "#FFFFFF" }
  ];
  const DEFAULT_CONTRAST = 0;

  function applyBadge(tabId, contrast) {
    let badge = BADGE[contrast] || BADGE[DEFAULT_CONTRAST];
    let details = { tabId: tabId };
    chrome.action.setBadgeText({ ...details, text: badge.text });
    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({ ...details, color: badge.textColor });
    }
    chrome.action.setBadgeBackgroundColor({ ...details, color: badge.color });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "skip") {
      let xC = request.x; 
      let yC = request.y;
      chrome.debugger.attach({ tabId: sender.tab.id }, "1.3", () => {
        chrome.debugger.sendCommand(
          { tabId: sender.tab.id },
          "Input.dispatchMouseEvent",
          {
            type: "mousePressed",
            x: xC + 10,
            y: yC + 10,
            button: "left",
            clickCount: 1,
          }
        );
        chrome.debugger.sendCommand(
          { tabId: sender.tab.id },
          "Input.dispatchMouseEvent",
          {
            type: "mouseReleased",
            x: xC + 10,
            y: yC + 10,
            button: "left",
            clickCount: 1,
          }
        );
        chrome.debugger.detach({ tabId: sender.tab.id });
        sendResponse({ x: xC, y: yC });
      });
    } else if (request.action === "icon") {
      chrome.storage.local.get({
        tj_switch_contrast: DEFAULT_CONTRAST
      }, (value) => {
        applyBadge(sender.tab.id, value.tj_switch_contrast);
      });
    } else {
      chrome.action.show(sender.tab.id);
      sendResponse({});
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get({
      tj_switch_contrast: DEFAULT_CONTRAST
    }, (value) => {
      let newValue = (value.tj_switch_contrast + 1) % BADGE.length;
      chrome.storage.local.set({
        tj_switch_contrast: newValue
      }, () => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.dispatchEvent(new Event("clickActionTJEvent"))
        });
        applyBadge(tab.id, newValue);
      });
    });
  });
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url.startsWith("https://www.youtube.com/")) {
        chrome.scripting.executeScript({
          target: { tabId: activeInfo.tabId },
          func: () => window.dispatchEvent(new Event("tabActivatedTJEvent"))
        });
      }
    });
  });
})(this.self || global);