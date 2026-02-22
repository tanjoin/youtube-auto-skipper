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
})(this.self || globalThis);
