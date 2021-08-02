// content_script.js からリクエストを受け取り、アドレスバーにアイコンを表示する.
((global) => {
  'use strict';
  chrome.extension.onRequest.addListener((request, sender, sendResponse) => {
    chrome.pageAction.show(sender.tab.id);
    sendResponse({});
  });

  chrome.pageAction.onClicked.addListener((tab) => {
    chrome.tabs.executeScript(tab.id, {
      file: 'scripts/action.js'
    });
  });
})(this.self || global);
