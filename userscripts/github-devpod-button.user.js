// ==UserScript==
// @name         GitHub Open in DevPod
// @namespace    homelab
// @version      1.1.0
// @description  Purple DevPod button next to GitHub's Code button
// @match        https://github.com/*
// @run-at       document-idle
// @inject-into  content
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // --- edit these ---
  const CONFIG = {
    // Leave "" to auto-find the green Code button. Or paste a CSS selector.
    // The button is inserted AFTER this node (or appended if insert === "append").
    anchorSelector: "",
    insert: "after", // "after" | "append"
    provider: "homelab", // DevPod provider name; "" to omit
    ide: "zed", // "zed" | "cursor" | "vscode" | "" to omit
    debug: true, // set false to silence [DevPod] console logs
  };
  // -------------------

  const BTN_ID = "homelab-devpod-btn";
  const STYLE_ID = "homelab-devpod-style";
  const LOG = "[DevPod]";

  function log(...args) {
    if (CONFIG.debug) console.log(LOG, ...args);
  }

  function warn(...args) {
    if (CONFIG.debug) console.warn(LOG, ...args);
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BTN_ID} {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 8px;
        padding: 5px 12px;
        border: 0;
        border-radius: 6px;
        background: #a855f7;
        color: #fff !important;
        font: 600 14px/20px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        text-decoration: none !important;
        white-space: nowrap;
        vertical-align: middle;
        cursor: pointer;
      }
      #${BTN_ID}:hover { background: #9333ea; color: #fff !important; }
      #${BTN_ID} svg { width: 16px; height: 16px; flex: none; }
    `;
    document.head.appendChild(style);
  }

  function parseRepo() {
    const parts = location.pathname.split("/").filter(Boolean);
    const reserved = new Set([
      "settings", "notifications", "marketplace", "explore", "topics",
      "login", "signup", "orgs", "organizations", "account", "new",
      "dashboard", "search", "codespaces", "copilot", "issues", "pulls",
      "stars", "trending", "collections", "events", "sponsors",
    ]);
    if (parts.length < 2 || reserved.has(parts[0])) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    let ref = "";

    if (parts[2] === "pull" && parts[3] && /^\d+$/.test(parts[3])) {
      ref = `pull/${parts[3]}/head`;
    } else if (parts[2] === "tree" || parts[2] === "blob") {
      ref = parts.slice(3).join("/") || "";
    }

    const source = ref
      ? `https://github.com/${owner}/${repo}@${ref}`
      : `https://github.com/${owner}/${repo}`;
    return { owner, repo, ref, source };
  }

  function openUrl(source) {
    const params = new URLSearchParams();
    params.set("source", source);
    if (CONFIG.provider) params.set("provider", CONFIG.provider);
    if (CONFIG.ide) params.set("ide", CONFIG.ide);
    return `devpod://open?${params.toString()}`;
  }


  function findCodeButton() {
    if (CONFIG.anchorSelector) {
      return document.querySelector(CONFIG.anchorSelector);
    }

    const matches = [];
    document.querySelectorAll("a, button, summary").forEach((el) => {
      const t = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (t === "Code" || t === "<> Code" || /^<>?\s*Code$/.test(t)) matches.push(el);
    });

    return (
      matches.find((el) => el.matches("button[data-variant='primary']")) ||
      matches.find((el) => el.tagName === "BUTTON" || el.tagName === "SUMMARY") ||
      matches.at(-1) ||
      null
    );
  }

  function makeButton(href) {
    const a = document.createElement("a");
    a.id = BTN_ID;
    a.href = href;
    a.title = "Open in DevPod";
    a.rel = "noopener noreferrer";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.2 6.5 3.6v7.4L12 19.2 5.5 15.2V7.8L12 4.2zm-1 5.3v5l4.5-2.5L11 9.5z",
    );
    svg.appendChild(path);
    a.append(svg, document.createTextNode("DevPod"));
    return a;
  }

  function placeButton(btn, anchor) {
    if (CONFIG.insert === "append") {
      if (btn.parentElement !== anchor) anchor.appendChild(btn);
      return;
    }
    if (btn.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement("afterend", btn);
    }
  }

  function inject() {
    ensureStyle();
    const repo = parseRepo();
    const existing = document.getElementById(BTN_ID);

    if (!repo) {
      if (existing) {
        log("not a repo page, removing button", location.pathname);
        existing.remove();
      }
      return;
    }

    const href = openUrl(repo.source);
    const anchor = findCodeButton();
    if (!anchor) {
      if (existing) existing.remove();
      log("repo page, but no clone Code button yet", location.pathname);
      return;
    }

    const btn = existing ?? makeButton(href);
    btn.href = href;
    placeButton(btn, anchor);
    log("button placed after", anchor, "href", href);
  }

  let scheduled = 0;
  function scheduleInject() {
    if (scheduled) return;
    scheduled = requestAnimationFrame(() => {
      scheduled = 0;
      try {
        inject();
      } catch (err) {
        warn("inject failed", err);
      }
    });
  }

  log("loaded", location.href);
  try {
    inject();
  } catch (err) {
    warn("initial inject failed", err);
  }

  const mo = new MutationObserver(scheduleInject);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("turbo:load", scheduleInject);
  document.addEventListener("pjax:end", scheduleInject);
  window.addEventListener("popstate", scheduleInject);
})();
