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
    let lastFlushAt = 0;
    let scheduleHandle = null;
    let scheduleKind = null;

    const VISIBLE_MIN_INTERVAL = 350;
    const HIDDEN_MIN_INTERVAL = 2000;

    const now = () => {
      if (global.performance?.now) {
        return global.performance.now();
      }
      return Date.now();
    };

    const getMinInterval = () => {
      if (document.visibilityState === "hidden") {
        return HIDDEN_MIN_INTERVAL;
      }
      return VISIBLE_MIN_INTERVAL;
    };

    const clearScheduledHandle = () => {
      if (scheduleHandle === null) {
        return;
      }
      if (scheduleKind === "animationFrame") {
        global.cancelAnimationFrame(scheduleHandle);
      } else {
        global.clearTimeout(scheduleHandle);
      }
      scheduleHandle = null;
      scheduleKind = null;
    };

    const appendRecords = (records) => {
      if (!Array.isArray(records) || records.length === 0) {
        return;
      }
      pendingRecords.push(...records);
    };

    const flush = () => {
      isScheduled = false;
      scheduleHandle = null;
      scheduleKind = null;
      lastFlushAt = now();
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

      const minInterval = getMinInterval();
      const elapsed = now() - lastFlushAt;
      const delay = Math.max(0, minInterval - elapsed);

      isScheduled = true;
      if (delay === 0 && document.visibilityState !== "hidden" && typeof global.requestAnimationFrame === "function") {
        scheduleKind = "animationFrame";
        scheduleHandle = global.requestAnimationFrame(flush);
      } else {
        scheduleKind = "timeout";
        scheduleHandle = global.setTimeout(flush, delay);
      }
    };

    const rescheduleForVisibilityState = () => {
      if (!isScheduled) {
        return;
      }
      clearScheduledHandle();
      isScheduled = false;
      schedule();
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

    document.addEventListener("visibilitychange", rescheduleForVisibilityState);

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
