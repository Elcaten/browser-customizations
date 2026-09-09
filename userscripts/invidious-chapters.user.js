// ==UserScript==
// @name         Invidious Chapters
// @namespace    https://github.com/Elcaten/userscripts
// @version      0.2.2
// @description  Adds a Chapters button to Invidious videos.
// @author       Elcaten
// @match        https://example.invalid/*
// @downloadURL  https://raw.githubusercontent.com/Elcaten/userscripts/refs/heads/main/invidious-chapters.user.js
// @updateURL    https://raw.githubusercontent.com/Elcaten/userscripts/refs/heads/main/invidious-chapters.user.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (location.pathname !== "/watch") return;

  function parseTimestamp(timestamp) {
    const parts = timestamp.split(":").map(Number);
    const hasHours = parts.length === 3;
    const seconds = parts.pop();
    const minutes = parts.pop();
    const hours = parts.pop() || 0;

    if (seconds > 59 || (hasHours && minutes > 59)) {
      return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
  }

  function parseChapters(description) {
    const chapters = [];
    const seenTimes = new Set();
    const chapterPattern = /^\s*(?:[-*]\s*)?((?:\d+:)?\d{1,2}:\d{2})\s*(?:[-|:]\s*)?(.+?)\s*$/;

    for (const line of description.innerText.split("\n")) {
      const match = line.match(chapterPattern);
      if (!match) continue;

      const seconds = parseTimestamp(match[1]);
      if (seconds === null || seenTimes.has(seconds)) continue;

      seenTimes.add(seconds);
      chapters.push({ timestamp: match[1], title: match[2], seconds });
    }

    return chapters.sort((a, b) => a.seconds - b.seconds);
  }

  function addStyles() {
    if (document.querySelector("#invidious-chapters-styles")) return;

    const style = document.createElement("style");
    style.id = "invidious-chapters-styles";
    style.textContent = `
      .invidious-chapters-popup {
        position: absolute;
        left: 12px;
        bottom: 48px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        width: min(420px, calc(100% - 24px));
        max-height: calc(100% - 72px);
        overflow: hidden;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 4px;
        background: rgba(18, 18, 18, 0.94);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        color: #fff;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.35;
      }

      .invidious-chapters-popup[hidden] {
        display: none;
      }

      .video-js .vjs-chapters-button svg {
        display: block;
        width: 2em;
        height: 2em;
        margin: auto;
        fill: currentColor;
      }

      .invidious-chapters-heading {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        font-size: 16px;
        font-weight: 600;
      }

      .invidious-chapters-list {
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .video-js .invidious-chapters-row {
        display: flex;
        width: 100%;
        gap: 16px;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        padding: 10px 16px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .invidious-chapters-row:hover,
      .invidious-chapters-row[aria-current="true"] {
        background: rgba(255, 255, 255, 0.14);
      }

      .invidious-chapters-row:focus-visible {
        background: rgba(255, 255, 255, 0.2);
        outline: 2px solid #fff;
        outline-offset: -2px;
      }

      .invidious-chapters-row:focus:not(:focus-visible) {
        outline: none;
      }

      .invidious-chapters-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .invidious-chapters-time {
        flex: none;
        color: rgba(255, 255, 255, 0.8);
        font-variant-numeric: tabular-nums;
      }

      .invidious-chapters-empty {
        padding: 16px;
        color: rgba(255, 255, 255, 0.72);
      }
    `;
    document.head.appendChild(style);
  }

  function createPopup(player, chapters, video) {
    const popup = document.createElement("section");
    popup.id = "invidious-chapters-popup";
    popup.className = "invidious-chapters-popup";
    popup.hidden = true;
    popup.setAttribute("aria-label", "Chapters");
    popup.addEventListener("click", (event) => event.stopPropagation());

    const heading = document.createElement("div");
    heading.className = "invidious-chapters-heading";
    heading.textContent = "Chapters";
    popup.appendChild(heading);

    const list = document.createElement("div");
    list.className = "invidious-chapters-list";
    popup.appendChild(list);

    if (chapters.length === 0) {
      const empty = document.createElement("div");
      empty.className = "invidious-chapters-empty";
      empty.textContent = "No chapters found in the description.";
      list.appendChild(empty);
    }

    const rows = chapters.map((chapter) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "invidious-chapters-row";
      row.addEventListener("click", () => {
        video.currentTime = chapter.seconds;
      });

      const title = document.createElement("span");
      title.className = "invidious-chapters-title";
      title.textContent = chapter.title;
      row.appendChild(title);

      const time = document.createElement("span");
      time.className = "invidious-chapters-time";
      time.textContent = chapter.timestamp;
      row.appendChild(time);

      list.appendChild(row);
      return row;
    });

    if (rows.length > 0) {
      const updateActiveChapter = () => {
        let activeIndex = -1;
        for (let index = 0; index < chapters.length; index += 1) {
          if (chapters[index].seconds > video.currentTime) break;
          activeIndex = index;
        }

        rows.forEach((row, index) => {
          if (index === activeIndex) row.setAttribute("aria-current", "true");
          else row.removeAttribute("aria-current");
        });
      };

      video.addEventListener("timeupdate", updateActiveChapter);
      updateActiveChapter();
    }

    player.appendChild(popup);
    return popup;
  }

  function addButton() {
    const controls = document.querySelector("#player .vjs-control-bar");
    if (!controls || controls.querySelector(".vjs-chapters-button")) {
      return Boolean(controls);
    }

    const player = controls.closest(".video-js");
    const video = player?.querySelector("video");
    const description = document.querySelector("#descriptionWrapper");
    if (!player || !video || !description) return false;

    addStyles();
    const popup = createPopup(player, parseChapters(description), video);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "vjs-chapters-button vjs-control vjs-button";
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h3v3H4V5zm5 0h11v3H9V5zM4 10.5h3v3H4v-3zm5 0h11v3H9v-3zM4 16h3v3H4v-3zm5 0h11v3H9v-3z" />
      </svg>
    `;
    button.title = "Chapters";
    button.setAttribute("aria-label", "Chapters");
    button.setAttribute("aria-controls", popup.id);
    button.setAttribute("aria-expanded", "false");

    const setPopupOpen = (open) => {
      popup.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    };

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setPopupOpen(popup.hidden);
    });

    const handleKeydown = (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        setPopupOpen(false);
        button.focus();
      }
    };
    button.addEventListener("keydown", handleKeydown);
    popup.addEventListener("keydown", handleKeydown);
    document.addEventListener("click", () => {
      setPopupOpen(false);
    });

    controls.insertBefore(
      button,
      controls.querySelector(".vjs-fullscreen-control"),
    );
    return true;
  }

  if (addButton()) return;

  const observer = new MutationObserver(() => {
    if (addButton()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
