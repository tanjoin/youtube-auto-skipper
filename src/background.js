// content_script.js からリクエストを受け取り、アドレスバーにアイコンを表示する.
((global) => {
  "use strict";
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
        tj_switch_contrast: 0
      }, (value) => {
        chrome.action.setBadgeText({ text: ["黒", "隠", "逆", "正"][value.tj_switch_contrast] });
        chrome.action.setBadgeBackgroundColor({ color: ["#000000", "#008000", "#0000FF", "#FFFFFF"][value.tj_switch_contrast] });
      });
    } else {
      chrome.action.show(sender.tab.id);
      sendResponse({});
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get({
      tj_switch_contrast: 0
    }, (value) => {
      let newValue = (value.tj_switch_contrast + 1) % 4;
      chrome.storage.local.set({
        tj_switch_contrast: newValue
      }, () => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.dispatchEvent(new Event("clickActionTJEvent"))
        });
        chrome.action.setBadgeText({ text: ["黒", "隠", "逆", "正"][newValue] });
        chrome.action.setBadgeBackgroundColor({ color: ["#000000", "#008000", "#0000FF", "#FFFFFF"][newValue] });
      });
    });
  });
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.scripting.executeScript({
      target: { tabId: activeInfo.tabId },
      func: () => window.dispatchEvent(new Event("tabActivatedTJEvent"))
    });
  });
})(this.self || global);