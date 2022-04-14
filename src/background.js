// content_script.js からリクエストを受け取り、アドレスバーにアイコンを表示する.
((global) => {
  'use strict';
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.action.show(sender.tab.id);
    sendResponse({});
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['scripts/action.js']
    });
  });
})(this.self || global);