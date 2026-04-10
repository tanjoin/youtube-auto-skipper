((global) => {
  "use strict";

  if (global.__tjLoggerInitialized) {
    return;
  }
  global.__tjLoggerInitialized = true;

  function isLogEnabled() {
    return localStorage.getItem("tj::logEnabled") === "1";
  }

  global.tjLog = function(message) {
    if (!isLogEnabled()) {
      return;
    }
    console.log(message);
  };

  if (!global.tjMutationHub) {
    const listeners = new Set();
    let observer = null;
    let isScheduled = false;
    let pendingRecords = [];

    const appendRecords = (records) => {
      if (!Array.isArray(records) || records.length === 0) {
        return;
      }
      pendingRecords.push(...records);
    };

    const flush = () => {
      isScheduled = false;
      const records = pendingRecords;
      pendingRecords = [];
      listeners.forEach((listener) => {
        try {
          listener(records);
        } catch (error) {
          global.tjLog(`tjMutationHub.flush: ${error}`);
        }
      });
    };

    const schedule = (records = []) => {
      appendRecords(records);
      if (isScheduled) {
        return;
      }
      isScheduled = true;
      if (typeof global.requestAnimationFrame === "function") {
        global.requestAnimationFrame(flush);
      } else {
        global.setTimeout(flush, 16);
      }
    };

    const startObserver = () => {
      if (observer || !document.body) {
        return;
      }
      observer = new MutationObserver((records) => schedule(records));
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      schedule();
    };

    const ensureStarted = () => {
      if (document.body) {
        startObserver();
        return;
      }
      const startOnReady = () => startObserver();
      global.addEventListener("DOMContentLoaded", startOnReady, { once: true });
      global.addEventListener("load", startOnReady, { once: true });
    };

    global.tjMutationHub = {
      subscribe(listener) {
        listeners.add(listener);
        ensureStarted();
        return () => listeners.delete(listener);
      },
      trigger() {
        schedule();
      }
    };
  }

  if (!global.tjMutationHelper) {
    global.tjMutationHelper = {
      findElements(records, selector) {
        if (!Array.isArray(records) || records.length === 0) {
          return [...document.querySelectorAll(selector)];
        }

        const elements = new Set();
        const collect = (node) => {
          if (!(node instanceof Element)) {
            return;
          }
          if (node.matches(selector)) {
            elements.add(node);
          }
          const closest = node.closest(selector);
          if (closest) {
            elements.add(closest);
          }
          node.querySelectorAll(selector).forEach((element) => elements.add(element));
        };

        records.forEach((record) => {
          if (record.type !== "childList") {
            return;
          }
          collect(record.target);
          record.addedNodes.forEach(collect);
        });

        return [...elements];
      },
    };
  }
})(this.self || globalThis);
