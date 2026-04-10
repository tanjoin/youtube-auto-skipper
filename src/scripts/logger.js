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
    const PROTECTION_VISIBLE_MIN_INTERVAL = 1500;
    const PROTECTION_HIDDEN_MIN_INTERVAL = 5000;
    const FLUSH_OVERLOAD_THRESHOLD_MS = 40;
    const FLUSH_OVERLOAD_SCORE_MAX = 6;

    let overloadScore = 0;
    let isProtectionMode = false;
    let lastFlushDurationMs = 0;

    const now = () => {
      if (global.performance?.now) {
        return global.performance.now();
      }
      return Date.now();
    };

    const getMinInterval = () => {
      if (isProtectionMode) {
        if (document.visibilityState === "hidden") {
          return PROTECTION_HIDDEN_MIN_INTERVAL;
        }
        return PROTECTION_VISIBLE_MIN_INTERVAL;
      }
      if (document.visibilityState === "hidden") {
        return HIDDEN_MIN_INTERVAL;
      }
      return VISIBLE_MIN_INTERVAL;
    };

    const updateProtectionMode = (flushDurationMs) => {
      lastFlushDurationMs = flushDurationMs;
      if (flushDurationMs >= FLUSH_OVERLOAD_THRESHOLD_MS) {
        overloadScore = Math.min(FLUSH_OVERLOAD_SCORE_MAX, overloadScore + 2);
      } else {
        overloadScore = Math.max(0, overloadScore - 1);
      }

      if (!isProtectionMode && overloadScore >= FLUSH_OVERLOAD_SCORE_MAX) {
        isProtectionMode = true;
        global.tjLog(`tjMutationHub: enter protection mode (${flushDurationMs.toFixed(1)}ms)`);
      } else if (isProtectionMode && overloadScore === 0) {
        isProtectionMode = false;
        global.tjLog("tjMutationHub: exit protection mode");
      }
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
      const startedAt = now();
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
      updateProtectionMode(now() - startedAt);
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

    const stopObserver = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      clearScheduledHandle();
      isScheduled = false;
      pendingRecords = [];
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
    document.addEventListener("pagehide", stopObserver);
    document.addEventListener("pageshow", () => {
      if (listeners.size > 0) {
        ensureStarted();
      }
    });

    global.tjMutationHub = {
      subscribe(listener) {
        listeners.add(listener);
        ensureStarted();
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0) {
            stopObserver();
          }
        };
      },
      trigger() {
        schedule();
      },
      status() {
        return {
          listenerCount: listeners.size,
          isProtectionMode,
          lastFlushDurationMs,
          overloadScore,
        };
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
