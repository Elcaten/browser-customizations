// ==UserScript==
// @name         GitHub Open in DevPod
// @namespace    homelab
// @version      1.0.0
// @description  Purple DevPod button next to GitHub's Code button
// @match        https://github.com/*
// @run-at       document-idle
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
  };
  // -------------------

  const BTN_ID = "homelab-devpod-btn";
  const STYLE_ID = "homelab-devpod-style";

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
      ref = parts[3] || "";
    }

    const source = ref
      ? `https://github.com/${owner}/${repo}@${ref}`
      : `https://github.com/${owner}/${repo}`;
    return { owner, repo, ref, source };
  }

  function openUrl(source) {
    const extra = [];
    if (CONFIG.provider) extra.push(`provider=${encodeURIComponent(CONFIG.provider)}`);
    if (CONFIG.ide) extra.push(`ide=${encodeURIComponent(CONFIG.ide)}`);
    const suffix = extra.length ? `&${extra.join("&")}` : "";
    return `https://devpod.sh/open#${source}${suffix}`;
  }

  function visibleText(el) {
    return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function findCodeButton() {
    if (CONFIG.anchorSelector) {
      return document.querySelector(CONFIG.anchorSelector);
    }

    const candidates = document.querySelectorAll(
      'get-repo, [data-testid="code-button"], button, a, summary',
    );
    for (const el of candidates) {
      const t = visibleText(el);
      if (t === "Code" || t === "<> Code" || /^<>?\s*Code$/.test(t)) {
        return el;
      }
    }
    return null;
  }

  function makeButton(href) {
    const a = document.createElement("a");
    a.id = BTN_ID;
    a.href = href;
    a.title = "Open in DevPod";
    a.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.2 6.5 3.6v7.4L12 19.2 5.5 15.2V7.8L12 4.2zm-1 5.3v5l4.5-2.5L11 9.5z"/>
      </svg>
      DevPod
    `;
    return a;
  }

  function inject() {
    ensureStyle();
    const repo = parseRepo();
    const existing = document.getElementById(BTN_ID);

    if (!repo) {
      existing?.remove();
      return;
    }

    const href = openUrl(repo.source);
    if (existing) {
      existing.href = href;
      if (document.body.contains(existing)) return;
    }

    const anchor = findCodeButton();
    if (!anchor) return;

    const btn = existing ?? makeButton(href);
    btn.href = href;

    if (CONFIG.insert === "append") {
      anchor.appendChild(btn);
    } else {
      anchor.insertAdjacentElement("afterend", btn);
    }
  }

  inject();
  const mo = new MutationObserver(() => inject());
  mo.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("turbo:load", inject);
  document.addEventListener("pjax:end", inject);
  window.addEventListener("popstate", inject);
})();
