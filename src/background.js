// content_script.js からリクエストを受け取り、アドレスバーにアイコンを表示する.
((global) => {
  "use strict";

  const BADGE_TEXT = ["黒", "隠", "逆", "正", "シ", "2", "2隠", "2逆"];
  const BADGE_COLOR = ["#000000", "#EF4444", "#F59E0B", "#84CC16", "#14B8A6", "#3B82F6", "#6366F1", "#D946EF"];
  const DEFAULT_CONTRAST = 0;

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
        chrome.action.setBadgeText({ text: BADGE_TEXT[value.tj_switch_contrast] });
        chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR[value.tj_switch_contrast] });
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
      let newValue = (value.tj_switch_contrast + 1) % BADGE_TEXT.length;
      chrome.storage.local.set({
        tj_switch_contrast: newValue
      }, () => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.dispatchEvent(new Event("clickActionTJEvent"))
        });
        chrome.action.setBadgeText({ text: BADGE_TEXT[newValue] });
        chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR[newValue] });
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