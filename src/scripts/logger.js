((global) => {
  "use strict";

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

    const flush = () => {
      isScheduled = false;
      listeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          global.tjLog(`tjMutationHub.flush: ${error}`);
        }
      });
    };

    const schedule = () => {
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
      observer = new MutationObserver(schedule);
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
})(this.self || globalThis);
