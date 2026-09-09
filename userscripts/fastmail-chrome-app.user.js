// ==UserScript==
// @name         Fastmail title-bar color
// @namespace    local.fastmail
// @version      1.1
// @description  Match the title-bar color to system appearance.
// @match        https://app.fastmail.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const appearance = window.matchMedia("(prefers-color-scheme: dark)");

  const lightColor = "rgb(255, 236, 243)";
  const darkColor = "#664752";

  function applyColor() {
    const color = appearance.matches ? darkColor : lightColor;
    const tags = document.querySelectorAll('meta[name="theme-color"]');

    if (!tags.length) {
      const tag = document.createElement("meta");
      tag.name = "theme-color";
      tag.content = color;
      document.head.appendChild(tag);
      return;
    }

    for (const tag of tags) {
      // Apply our selected color regardless of existing media conditions.
      if (tag.hasAttribute("media")) tag.removeAttribute("media");
      if (tag.content !== color) tag.content = color;
    }
  }

  applyColor();
  appearance.addEventListener("change", applyColor);

  new MutationObserver(applyColor).observe(document.head, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["content", "name", "media"],
  });
})();
