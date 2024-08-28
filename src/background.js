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
    } else {
      chrome.action.show(sender.tab.id);
      sendResponse({});
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["scripts/action.js"],
    });
  });
})(this.self || global);
