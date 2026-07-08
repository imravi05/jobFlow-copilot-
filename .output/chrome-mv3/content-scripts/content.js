var content = (function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  function defineContentScript(definition2) {
    return definition2;
  }
  class LinkedInScraper {
    isSupported(url) {
      return url.includes("linkedin.com/jobs");
    }
    async extractJobDetails() {
      const jobUrl = this.getCanonicalJobUrl();
      const titleSelectors = [
        ".job-details-jobs-unified-top-card__job-title",
        ".jobs-unified-top-card__job-title",
        "h1.t-24",
        ".jobs-details-top-card__job-title",
        "h2.jobs-details-top-card__job-title",
        ".topcard__title"
      ];
      let title = this.getTextFromSelectors(titleSelectors) || "Unknown Role";
      const companySelectors = [
        ".job-details-jobs-unified-top-card__company-name a",
        ".jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name",
        ".jobs-details-top-card__company-name a",
        ".jobs-details-top-card__company-name",
        ".topcard__flavor--metadata a",
        ".topcard__flavor a"
      ];
      let company = this.getTextFromSelectors(companySelectors) || "Unknown Company";
      if (title === "Unknown Role") {
        const firstH1 = document.querySelector("h1");
        if (firstH1 && firstH1.textContent) {
          title = firstH1.textContent.trim().replace(/\s+/g, " ");
        }
      }
      if (title === "Unknown Role" || company === "Unknown Company") {
        const fallback = this.parseDocumentTitle();
        if (title === "Unknown Role" && fallback.title) {
          title = fallback.title;
        }
        if (company === "Unknown Company" && fallback.company) {
          company = fallback.company;
        }
      }
      const locationSelectors = [
        ".job-details-jobs-unified-top-card__primary-description",
        ".jobs-unified-top-card__bullet",
        ".jobs-details-top-card__bullet",
        ".topcard__flavor--metadata",
        ".topcard__flavor"
      ];
      let locationText = this.getTextFromSelectors(locationSelectors) || "Unknown Location";
      const location2 = this.cleanLocationText(locationText, company);
      const descriptionSelectors = [
        "#job-details",
        ".jobs-description-content__text",
        ".jobs-description__content",
        ".jobs-box__html-content",
        ".description__text"
      ];
      const jobDescription = this.getHtmlFromSelectors(descriptionSelectors) || "No description available.";
      const workMode = this.detectWorkMode(locationText, jobDescription);
      const employmentType = this.detectEmploymentType(jobDescription);
      return {
        company,
        title,
        location: location2,
        jobUrl,
        jobDescription,
        employmentType,
        workMode,
        portal: "LinkedIn"
      };
    }
    getCanonicalJobUrl() {
      const url = window.location.href;
      try {
        const parsed = new URL(url);
        const jobIdMatch = parsed.pathname.match(/\/jobs\/view\/(\d+)/);
        if (jobIdMatch) {
          return `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}/`;
        }
        const currentJobId = parsed.searchParams.get("currentJobId");
        if (currentJobId) {
          return `https://www.linkedin.com/jobs/view/${currentJobId}/`;
        }
        const activeJobCard = document.querySelector(".jobs-search-results-list__list-item--active, [data-job-id]");
        if (activeJobCard) {
          const jobId = activeJobCard.getAttribute("data-job-id") || activeJobCard.getAttribute("data-occludable-job-id");
          if (jobId) {
            return `https://www.linkedin.com/jobs/view/${jobId}/`;
          }
        }
      } catch (e) {
        console.error("Error parsing Job URL:", e);
      }
      return url;
    }
    getTextFromSelectors(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim().replace(/\s+/g, " ");
        }
      }
      return null;
    }
    getHtmlFromSelectors(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.innerHTML.trim();
        }
      }
      return null;
    }
    cleanLocationText(text, company) {
      let cleaned = text;
      if (company && cleaned.startsWith(company)) {
        cleaned = cleaned.substring(company.length).trim();
      }
      cleaned = cleaned.replace(/^[•·\s\r\n\-\u00B7]+/, "").trim();
      const parts = cleaned.split(/[·\u00B7\n]/);
      if (parts.length > 0) {
        cleaned = parts[0].trim();
      }
      return cleaned || "Unknown Location";
    }
    detectWorkMode(locationText, description) {
      const textToCheck = `${locationText} ${description}`.toLowerCase();
      if (textToCheck.includes("remote")) {
        return "Remote";
      } else if (textToCheck.includes("hybrid")) {
        return "Hybrid";
      } else if (textToCheck.includes("on-site") || textToCheck.includes("onsite") || textToCheck.includes("in-office")) {
        return "On-site";
      }
      return "On-site";
    }
    detectEmploymentType(description) {
      var _a;
      const descLower = description.toLowerCase();
      const jobDetailsCard = document.querySelector(".job-details-jobs-unified-top-card__job-insight");
      const cardText = ((_a = jobDetailsCard == null ? void 0 : jobDetailsCard.textContent) == null ? void 0 : _a.toLowerCase()) || "";
      const textToSearch = `${cardText} ${descLower}`;
      if (textToSearch.includes("full-time") || textToSearch.includes("full time")) {
        return "Full-time";
      } else if (textToSearch.includes("part-time") || textToSearch.includes("part time")) {
        return "Part-time";
      } else if (textToSearch.includes("contract")) {
        return "Contract";
      } else if (textToSearch.includes("internship") || textToSearch.includes("intern")) {
        return "Internship";
      } else if (textToSearch.includes("temporary")) {
        return "Temporary";
      }
      return "Full-time";
    }
    parseDocumentTitle() {
      const docTitle = document.title;
      const cleanTitle = docTitle.replace(/^\(\d+\)\s+/, "").trim();
      const hiringMatch = cleanTitle.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+/i);
      if (hiringMatch) {
        return {
          company: hiringMatch[1].trim(),
          title: hiringMatch[2].trim()
        };
      }
      const atMatch = cleanTitle.match(/^(.+?)\s+at\s+(.+?)(?:\s+\||$)/i);
      if (atMatch) {
        return {
          title: atMatch[1].trim(),
          company: atMatch[2].trim()
        };
      }
      const parts = cleanTitle.split("|")[0].split(" - ");
      if (parts.length >= 2) {
        return {
          title: parts[0].trim(),
          company: parts[1].trim()
        };
      }
      const commaParts = cleanTitle.split("|")[0].split(",");
      if (commaParts.length >= 2) {
        return {
          title: commaParts[0].trim(),
          company: commaParts[1].trim()
        };
      }
      return {
        title: cleanTitle.split("|")[0].trim(),
        company: "LinkedIn Company"
      };
    }
  }
  content;
  const definition = defineContentScript({
    matches: [
      "https://www.linkedin.com/jobs/*",
      "https://www.linkedin.com/jobs/view/*"
    ],
    runAt: "document_end",
    main() {
      const scraper = new LinkedInScraper();
      let currentUrl = "";
      let activeOverlay = null;
      const sessionTrackedUrls = /* @__PURE__ */ new Set();
      const logoUrl = chrome.runtime.getURL("icons/icon48.png");
      function initUrlObserver() {
        currentUrl = window.location.href;
        setInterval(() => {
          if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            removeOverlay();
          }
          if (scraper.isSupported(window.location.href)) {
            bindApplyButtonListeners();
            bindSubmitButtonListener();
            checkEasyApplySuccess();
          }
        }, 1e3);
      }
      function bindApplyButtonListeners() {
        const applyButtons = findApplyButtons();
        applyButtons.forEach((button) => {
          var _a;
          if (button.getAttribute("data-jobflow-listened") === "true") {
            return;
          }
          button.setAttribute("data-jobflow-listened", "true");
          const text = ((_a = button.textContent) == null ? void 0 : _a.trim().toLowerCase()) || "";
          const isEasyApply = text.includes("easy apply");
          if (isEasyApply) {
            console.log("JobFlow: Easy Apply button detected. Monitoring modal...");
          } else {
            button.addEventListener("click", () => {
              console.log("JobFlow: External Apply button clicked. Saving...");
              triggerSaveWorkflow();
            });
          }
        });
      }
      function findApplyButtons() {
        const buttons = [];
        const selectors = [
          ".jobs-apply-button",
          ".jobs-s-apply button",
          "button.jobs-apply-button--top-card",
          '[data-control-name="job_apply"]',
          ".jobs-apply-button--top-card button"
        ];
        selectors.forEach((sel) => {
          document.querySelectorAll(sel).forEach((el) => {
            if (el instanceof HTMLElement) {
              buttons.push(el);
            }
          });
        });
        document.querySelectorAll("button").forEach((btn) => {
          var _a;
          const text = ((_a = btn.textContent) == null ? void 0 : _a.trim().toLowerCase()) || "";
          if ((text === "apply" || text === "easy apply" || text.includes("apply now")) && !buttons.includes(btn)) {
            buttons.push(btn);
          }
        });
        return buttons;
      }
      function bindSubmitButtonListener() {
        const submitButtons = document.querySelectorAll("button");
        submitButtons.forEach((button) => {
          var _a, _b;
          const text = ((_a = button.textContent) == null ? void 0 : _a.trim().toLowerCase()) || "";
          const ariaLabel = ((_b = button.getAttribute("aria-label")) == null ? void 0 : _b.toLowerCase()) || "";
          if ((text === "submit application" || ariaLabel === "submit application") && button.getAttribute("data-jobflow-listened") !== "true") {
            button.setAttribute("data-jobflow-listened", "true");
            button.addEventListener("click", () => {
              console.log("JobFlow: Submit application button clicked! Saving...");
              triggerSaveWorkflow();
            });
          }
        });
      }
      function checkEasyApplySuccess() {
        const modal = document.querySelector('.jobs-easy-apply-modal, [role="dialog"], .artdeco-modal');
        if (!modal) return;
        const modalText = modal.textContent || "";
        const successPhrases = [
          "application sent",
          "application submitted",
          "your application was sent",
          "successfully applied"
        ];
        const hasSuccess = successPhrases.some((phrase) => modalText.toLowerCase().includes(phrase));
        if (hasSuccess) {
          const currentJobUrl = window.location.href;
          if (!sessionTrackedUrls.has(currentJobUrl)) {
            sessionTrackedUrls.add(currentJobUrl);
            console.log("JobFlow: Detected Easy Apply success screen! Saving...");
            triggerSaveWorkflow();
          }
        }
      }
      async function triggerSaveWorkflow() {
        if (!scraper.isSupported(window.location.href)) {
          return;
        }
        setTimeout(async () => {
          try {
            const details = await scraper.extractJobDetails();
            if (!details || !details.jobUrl) {
              console.warn("JobFlow: Scraper returned incomplete details.");
              return;
            }
            if (!details.title || details.title === "Unknown Role") {
              details.title = "Job Application";
            }
            if (!details.company || details.company === "Unknown Company") {
              details.company = "LinkedIn";
            }
            chrome.runtime.sendMessage(
              { action: "CHECK_DUPLICATE", payload: { url: details.jobUrl } },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.warn("JobFlow duplicate check error:", chrome.runtime.lastError);
                  return;
                }
                const isTracked = response && response.exists;
                const trackedApp = response && response.app;
                injectOverlay(details, isTracked, trackedApp);
              }
            );
          } catch (e) {
            console.error("JobFlow trigger error:", e);
          }
        }, 300);
      }
      function removeOverlay() {
        if (activeOverlay) {
          activeOverlay.remove();
          activeOverlay = null;
        }
      }
      function injectOverlay(details, isTracked, trackedApp) {
        removeOverlay();
        const host = document.createElement("div");
        host.id = "jobflow-tracker-root";
        host.style.position = "fixed";
        host.style.bottom = "20px";
        host.style.right = "20px";
        host.style.zIndex = "999999";
        document.body.appendChild(host);
        activeOverlay = host;
        const shadow = host.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = `
        .jobflow-card {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          width: 320px;
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .jobflow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 8px;
        }
        .jobflow-title {
          font-size: 14px;
          font-weight: 600;
          color: #818cf8;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .jobflow-close {
          cursor: pointer;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          padding: 4px;
        }
        .jobflow-close:hover {
          color: #f1f5f9;
        }
        .job-info {
          font-size: 12px;
          margin-bottom: 12px;
        }
        .job-role {
          font-weight: 600;
          font-size: 13px;
          color: #f1f5f9;
          margin-bottom: 2px;
        }
        .job-company {
          color: #94a3b8;
        }
        .form-group {
          margin-bottom: 10px;
        }
        .form-label {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-select, .form-input, .form-textarea {
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #f1f5f9;
          padding: 8px;
          font-size: 12px;
          box-sizing: border-box;
        }
        .form-select:focus, .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #6366f1;
        }
        .form-textarea {
          height: 50px;
          resize: vertical;
        }
        .btn-container {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }
        .btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          border: none;
        }
        .btn-primary {
          background: #4f46e5;
          color: #ffffff;
        }
        .btn-primary:hover {
          background: #4338ca;
        }
        .btn-secondary {
          background: #334155;
          color: #cbd5e1;
        }
        .btn-secondary:hover {
          background: #475569;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          background: #22c55e20;
          color: #22c55e;
          border: 1px solid #22c55e40;
        }
        .badge-tracked {
          background: #6366f120;
          color: #818cf8;
          border: 1px solid #6366f140;
        }
        .success-msg {
          color: #22c55e;
          font-size: 12px;
          text-align: center;
          margin-top: 8px;
        }
      `;
        shadow.appendChild(style);
        const card = document.createElement("div");
        card.className = "jobflow-card";
        if (isTracked) {
          renderTrackedState(card, details, trackedApp);
        } else {
          saveAutomatically(card, details);
        }
        shadow.appendChild(card);
      }
      function renderTrackedState(card, details, app) {
        var _a, _b;
        card.innerHTML = `
        <div class="jobflow-header">
          <div class="jobflow-title">
            <img src="${logoUrl}" style="width: 14px; height: 14px; object-fit: contain; margin-right: 4px;" alt="Logo" />
            JobFlow Tracker
          </div>
          <button class="jobflow-close">&times;</button>
        </div>
        <div class="job-info">
          <div class="job-role">${details.title}</div>
          <div class="job-company">${details.company}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <span class="badge badge-tracked">Tracked as: ${app.status}</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
          Applied on ${new Date(app.appliedDate).toLocaleDateString()} using resume:<br/>
          <strong style="color: #f1f5f9;">${app.resumeName || "None Selected"}</strong>
        </div>
        <div class="btn-container">
          <button class="btn btn-secondary close-btn">Close Tracker</button>
        </div>
      `;
        (_a = card.querySelector(".jobflow-close")) == null ? void 0 : _a.addEventListener("click", removeOverlay);
        (_b = card.querySelector(".close-btn")) == null ? void 0 : _b.addEventListener("click", removeOverlay);
      }
      function saveAutomatically(card, details) {
        var _a;
        const now = /* @__PURE__ */ new Date();
        const appliedDate = now.toISOString().split("T")[0];
        const appliedTime = now.toTimeString().split(" ")[0].substring(0, 5);
        const appData = {
          company: details.company,
          title: details.title,
          location: details.location,
          jobUrl: details.jobUrl,
          jobDescription: details.jobDescription,
          employmentType: details.employmentType,
          workMode: details.workMode,
          portal: details.portal,
          resumeId: void 0,
          resumeName: void 0,
          status: "Applied",
          notes: "",
          appliedDate,
          appliedTime,
          reminderSent: false
        };
        card.innerHTML = `
        <div class="jobflow-header">
          <div class="jobflow-title">
            <img src="${logoUrl}" style="width: 14px; height: 14px; object-fit: contain; margin-right: 4px;" alt="Logo" />
            JobFlow Tracker
          </div>
          <button class="jobflow-close">&times;</button>
        </div>
        <div class="job-info">
          <div class="job-role">${details.title}</div>
          <div class="job-company">${details.company} — <span style="font-style: italic;">${details.workMode}</span></div>
        </div>
        <div style="text-align: center; padding: 12px 0;">
          <div style="color: #818cf8; font-size: 12px; font-weight: 500; margin-bottom: 8px;">Saving application automatically...</div>
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" style="margin: 0 auto; display: inline-block;"></div>
        </div>
      `;
        (_a = card.querySelector(".jobflow-close")) == null ? void 0 : _a.addEventListener("click", removeOverlay);
        chrome.runtime.sendMessage(
          { action: "SAVE_APPLICATION", payload: { application: appData } },
          (response) => {
            var _a2, _b, _c;
            if (chrome.runtime.lastError) {
              console.error("JobFlow save error:", chrome.runtime.lastError);
              card.innerHTML = `
              <div class="jobflow-header">
                <div class="jobflow-title">
                  <img src="${logoUrl}" style="width: 14px; height: 14px; object-fit: contain; margin-right: 4px;" alt="Logo" />
                  JobFlow Tracker
                </div>
                <button class="jobflow-close">&times;</button>
              </div>
              <div style="text-align: center; padding: 12px 0; color: #ef4444; font-size: 11px;">
                Error: ${chrome.runtime.lastError.message}
              </div>
            `;
              (_a2 = card.querySelector(".jobflow-close")) == null ? void 0 : _a2.addEventListener("click", removeOverlay);
              return;
            }
            if (response && response.success) {
              card.innerHTML = `
              <div class="jobflow-header">
                <div class="jobflow-title">
                  <img src="${logoUrl}" style="width: 14px; height: 14px; object-fit: contain; margin-right: 4px;" alt="Logo" />
                  JobFlow Tracker
                </div>
                <button class="jobflow-close">&times;</button>
              </div>
              <div style="text-align: center; padding: 12px 0;">
                <div class="job-role">${details.title}</div>
                <div class="job-company">${details.company}</div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 10px auto;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <div class="success-msg">Application Tracked Automatically!</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Follow-up alarm set for 6 days.</div>
                <div style="font-size: 10px; color: #818cf8; margin-top: 6px;">Edit notes or resume in the dashboard.</div>
              </div>
            `;
              (_b = card.querySelector(".jobflow-close")) == null ? void 0 : _b.addEventListener("click", removeOverlay);
              setTimeout(removeOverlay, 3500);
            } else {
              card.innerHTML = `
              <div class="jobflow-header">
                <div class="jobflow-title">
                  <img src="${logoUrl}" style="width: 14px; height: 14px; object-fit: contain; margin-right: 4px;" alt="Logo" />
                  JobFlow Tracker
                </div>
                <button class="jobflow-close">&times;</button>
              </div>
              <div style="text-align: center; padding: 12px 0; color: #ef4444; font-size: 11px;">
                Error: ${response.error || "Failed to save"}
              </div>
            `;
              (_c = card.querySelector(".jobflow-close")) == null ? void 0 : _c.addEventListener("click", removeOverlay);
            }
          }
        );
      }
      initUrlObserver();
    }
  });
  content;
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var browserPolyfill$1 = { exports: {} };
  var browserPolyfill = browserPolyfill$1.exports;
  var hasRequiredBrowserPolyfill;
  function requireBrowserPolyfill() {
    if (hasRequiredBrowserPolyfill) return browserPolyfill$1.exports;
    hasRequiredBrowserPolyfill = 1;
    (function(module, exports) {
      (function(global, factory) {
        {
          factory(module);
        }
      })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : browserPolyfill, function(module2) {
        if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
          throw new Error("This script should only be loaded in a browser extension.");
        }
        if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
          const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
          const wrapAPIs = (extensionAPIs) => {
            const apiMetadata = {
              "alarms": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "clearAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "bookmarks": {
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getChildren": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getRecent": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getSubTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTree": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "browserAction": {
                "disable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "enable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "getBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "openPopup": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "browsingData": {
                "remove": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "removeCache": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCookies": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeDownloads": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFormData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeHistory": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeLocalStorage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePasswords": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePluginData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "settings": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "commands": {
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "contextMenus": {
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "cookies": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAllCookieStores": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "devtools": {
                "inspectedWindow": {
                  "eval": {
                    "minArgs": 1,
                    "maxArgs": 2,
                    "singleCallbackArg": false
                  }
                },
                "panels": {
                  "create": {
                    "minArgs": 3,
                    "maxArgs": 3,
                    "singleCallbackArg": true
                  },
                  "elements": {
                    "createSidebarPane": {
                      "minArgs": 1,
                      "maxArgs": 1
                    }
                  }
                }
              },
              "downloads": {
                "cancel": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "download": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "erase": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFileIcon": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "open": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "pause": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFile": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "resume": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "extension": {
                "isAllowedFileSchemeAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "isAllowedIncognitoAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "history": {
                "addUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "deleteRange": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getVisits": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "i18n": {
                "detectLanguage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAcceptLanguages": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "identity": {
                "launchWebAuthFlow": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "idle": {
                "queryState": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "management": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getSelf": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setEnabled": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "uninstallSelf": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "notifications": {
                "clear": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPermissionLevel": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "pageAction": {
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "hide": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "permissions": {
                "contains": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "request": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "runtime": {
                "getBackgroundPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPlatformInfo": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "openOptionsPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "requestUpdateCheck": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "sendMessage": {
                  "minArgs": 1,
                  "maxArgs": 3
                },
                "sendNativeMessage": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "setUninstallURL": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "sessions": {
                "getDevices": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getRecentlyClosed": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "restore": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "storage": {
                "local": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                },
                "managed": {
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  }
                },
                "sync": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                }
              },
              "tabs": {
                "captureVisibleTab": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "detectLanguage": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "discard": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "duplicate": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "executeScript": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getZoom": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getZoomSettings": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goBack": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goForward": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "highlight": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "insertCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "query": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "reload": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "sendMessage": {
                  "minArgs": 2,
                  "maxArgs": 3
                },
                "setZoom": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "setZoomSettings": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "update": {
                  "minArgs": 1,
                  "maxArgs": 2
                }
              },
              "topSites": {
                "get": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "webNavigation": {
                "getAllFrames": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFrame": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "webRequest": {
                "handlerBehaviorChanged": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "windows": {
                "create": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getLastFocused": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              }
            };
            if (Object.keys(apiMetadata).length === 0) {
              throw new Error("api-metadata.json has not been included in browser-polyfill");
            }
            class DefaultWeakMap extends WeakMap {
              constructor(createItem, items = void 0) {
                super(items);
                this.createItem = createItem;
              }
              get(key) {
                if (!this.has(key)) {
                  this.set(key, this.createItem(key));
                }
                return super.get(key);
              }
            }
            const isThenable = (value) => {
              return value && typeof value === "object" && typeof value.then === "function";
            };
            const makeCallback = (promise, metadata) => {
              return (...callbackArgs) => {
                if (extensionAPIs.runtime.lastError) {
                  promise.reject(new Error(extensionAPIs.runtime.lastError.message));
                } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
                  promise.resolve(callbackArgs[0]);
                } else {
                  promise.resolve(callbackArgs);
                }
              };
            };
            const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
            const wrapAsyncFunction = (name, metadata) => {
              return function asyncFunctionWrapper(target, ...args) {
                if (args.length < metadata.minArgs) {
                  throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
                }
                if (args.length > metadata.maxArgs) {
                  throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
                }
                return new Promise((resolve, reject) => {
                  if (metadata.fallbackToNoCallback) {
                    try {
                      target[name](...args, makeCallback({
                        resolve,
                        reject
                      }, metadata));
                    } catch (cbError) {
                      console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
                      target[name](...args);
                      metadata.fallbackToNoCallback = false;
                      metadata.noCallback = true;
                      resolve();
                    }
                  } else if (metadata.noCallback) {
                    target[name](...args);
                    resolve();
                  } else {
                    target[name](...args, makeCallback({
                      resolve,
                      reject
                    }, metadata));
                  }
                });
              };
            };
            const wrapMethod = (target, method, wrapper) => {
              return new Proxy(method, {
                apply(targetMethod, thisObj, args) {
                  return wrapper.call(thisObj, target, ...args);
                }
              });
            };
            let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
            const wrapObject = (target, wrappers = {}, metadata = {}) => {
              let cache = /* @__PURE__ */ Object.create(null);
              let handlers = {
                has(proxyTarget2, prop) {
                  return prop in target || prop in cache;
                },
                get(proxyTarget2, prop, receiver) {
                  if (prop in cache) {
                    return cache[prop];
                  }
                  if (!(prop in target)) {
                    return void 0;
                  }
                  let value = target[prop];
                  if (typeof value === "function") {
                    if (typeof wrappers[prop] === "function") {
                      value = wrapMethod(target, target[prop], wrappers[prop]);
                    } else if (hasOwnProperty(metadata, prop)) {
                      let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                      value = wrapMethod(target, target[prop], wrapper);
                    } else {
                      value = value.bind(target);
                    }
                  } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
                    value = wrapObject(value, wrappers[prop], metadata[prop]);
                  } else if (hasOwnProperty(metadata, "*")) {
                    value = wrapObject(value, wrappers[prop], metadata["*"]);
                  } else {
                    Object.defineProperty(cache, prop, {
                      configurable: true,
                      enumerable: true,
                      get() {
                        return target[prop];
                      },
                      set(value2) {
                        target[prop] = value2;
                      }
                    });
                    return value;
                  }
                  cache[prop] = value;
                  return value;
                },
                set(proxyTarget2, prop, value, receiver) {
                  if (prop in cache) {
                    cache[prop] = value;
                  } else {
                    target[prop] = value;
                  }
                  return true;
                },
                defineProperty(proxyTarget2, prop, desc) {
                  return Reflect.defineProperty(cache, prop, desc);
                },
                deleteProperty(proxyTarget2, prop) {
                  return Reflect.deleteProperty(cache, prop);
                }
              };
              let proxyTarget = Object.create(target);
              return new Proxy(proxyTarget, handlers);
            };
            const wrapEvent = (wrapperMap) => ({
              addListener(target, listener, ...args) {
                target.addListener(wrapperMap.get(listener), ...args);
              },
              hasListener(target, listener) {
                return target.hasListener(wrapperMap.get(listener));
              },
              removeListener(target, listener) {
                target.removeListener(wrapperMap.get(listener));
              }
            });
            const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onRequestFinished(req) {
                const wrappedReq = wrapObject(req, {}, {
                  getContent: {
                    minArgs: 0,
                    maxArgs: 0
                  }
                });
                listener(wrappedReq);
              };
            });
            const onMessageWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onMessage(message, sender, sendResponse) {
                let didCallSendResponse = false;
                let wrappedSendResponse;
                let sendResponsePromise = new Promise((resolve) => {
                  wrappedSendResponse = function(response) {
                    didCallSendResponse = true;
                    resolve(response);
                  };
                });
                let result2;
                try {
                  result2 = listener(message, sender, wrappedSendResponse);
                } catch (err) {
                  result2 = Promise.reject(err);
                }
                const isResultThenable = result2 !== true && isThenable(result2);
                if (result2 !== true && !isResultThenable && !didCallSendResponse) {
                  return false;
                }
                const sendPromisedResult = (promise) => {
                  promise.then((msg) => {
                    sendResponse(msg);
                  }, (error) => {
                    let message2;
                    if (error && (error instanceof Error || typeof error.message === "string")) {
                      message2 = error.message;
                    } else {
                      message2 = "An unexpected error occurred";
                    }
                    sendResponse({
                      __mozWebExtensionPolyfillReject__: true,
                      message: message2
                    });
                  }).catch((err) => {
                    console.error("Failed to send onMessage rejected reply", err);
                  });
                };
                if (isResultThenable) {
                  sendPromisedResult(result2);
                } else {
                  sendPromisedResult(sendResponsePromise);
                }
                return true;
              };
            });
            const wrappedSendMessageCallback = ({
              reject,
              resolve
            }, reply) => {
              if (extensionAPIs.runtime.lastError) {
                if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                  resolve();
                } else {
                  reject(new Error(extensionAPIs.runtime.lastError.message));
                }
              } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
                reject(new Error(reply.message));
              } else {
                resolve(reply);
              }
            };
            const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
              if (args.length < metadata.minArgs) {
                throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
              }
              if (args.length > metadata.maxArgs) {
                throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
              }
              return new Promise((resolve, reject) => {
                const wrappedCb = wrappedSendMessageCallback.bind(null, {
                  resolve,
                  reject
                });
                args.push(wrappedCb);
                apiNamespaceObj.sendMessage(...args);
              });
            };
            const staticWrappers = {
              devtools: {
                network: {
                  onRequestFinished: wrapEvent(onRequestFinishedWrappers)
                }
              },
              runtime: {
                onMessage: wrapEvent(onMessageWrappers),
                onMessageExternal: wrapEvent(onMessageWrappers),
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 1,
                  maxArgs: 3
                })
              },
              tabs: {
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 2,
                  maxArgs: 3
                })
              }
            };
            const settingMetadata = {
              clear: {
                minArgs: 1,
                maxArgs: 1
              },
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              set: {
                minArgs: 1,
                maxArgs: 1
              }
            };
            apiMetadata.privacy = {
              network: {
                "*": settingMetadata
              },
              services: {
                "*": settingMetadata
              },
              websites: {
                "*": settingMetadata
              }
            };
            return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
          };
          module2.exports = wrapAPIs(chrome);
        } else {
          module2.exports = globalThis.browser;
        }
      });
    })(browserPolyfill$1);
    return browserPolyfill$1.exports;
  }
  var browserPolyfillExports = requireBrowserPolyfill();
  const originalBrowser = /* @__PURE__ */ getDefaultExportFromCjs(browserPolyfillExports);
  const browser = originalBrowser;
  function print$1(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger$1 = {
    debug: (...args) => print$1(console.debug, ...args),
    log: (...args) => print$1(console.log, ...args),
    warn: (...args) => print$1(console.warn, ...args),
    error: (...args) => print$1(console.error, ...args)
  };
  const _WxtLocationChangeEvent = class _WxtLocationChangeEvent extends Event {
    constructor(newUrl, oldUrl) {
      super(_WxtLocationChangeEvent.EVENT_NAME, {});
      this.newUrl = newUrl;
      this.oldUrl = oldUrl;
    }
  };
  __publicField(_WxtLocationChangeEvent, "EVENT_NAME", getUniqueEventName("wxt:locationchange"));
  let WxtLocationChangeEvent = _WxtLocationChangeEvent;
  function getUniqueEventName(eventName) {
    var _a;
    return `${(_a = browser == null ? void 0 : browser.runtime) == null ? void 0 : _a.id}:${"content"}:${eventName}`;
  }
  function createLocationWatcher(ctx) {
    let interval;
    let oldUrl;
    return {
      /**
       * Ensure the location watcher is actively looking for URL changes. If it's already watching,
       * this is a noop.
       */
      run() {
        if (interval != null) return;
        oldUrl = new URL(location.href);
        interval = ctx.setInterval(() => {
          let newUrl = new URL(location.href);
          if (newUrl.href !== oldUrl.href) {
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
            oldUrl = newUrl;
          }
        }, 1e3);
      }
    };
  }
  const _ContentScriptContext = class _ContentScriptContext {
    constructor(contentScriptName, options) {
      __publicField(this, "isTopFrame", window.self === window.top);
      __publicField(this, "abortController");
      __publicField(this, "locationWatcher", createLocationWatcher(this));
      __publicField(this, "receivedMessageIds", /* @__PURE__ */ new Set());
      this.contentScriptName = contentScriptName;
      this.options = options;
      this.abortController = new AbortController();
      if (this.isTopFrame) {
        this.listenForNewerScripts({ ignoreFirstEvent: true });
        this.stopOldScripts();
      } else {
        this.listenForNewerScripts();
      }
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(reason) {
      return this.abortController.abort(reason);
    }
    get isInvalid() {
      if (browser.runtime.id == null) {
        this.notifyInvalidated();
      }
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    /**
     * Add a listener that is called when the content script's context is invalidated.
     *
     * @returns A function to remove the listener.
     *
     * @example
     * browser.runtime.onMessage.addListener(cb);
     * const removeInvalidatedListener = ctx.onInvalidated(() => {
     *   browser.runtime.onMessage.removeListener(cb);
     * })
     * // ...
     * removeInvalidatedListener();
     */
    onInvalidated(cb) {
      this.signal.addEventListener("abort", cb);
      return () => this.signal.removeEventListener("abort", cb);
    }
    /**
     * Return a promise that never resolves. Useful if you have an async function that shouldn't run
     * after the context is expired.
     *
     * @example
     * const getValueFromStorage = async () => {
     *   if (ctx.isInvalid) return ctx.block();
     *
     *   // ...
     * }
     */
    block() {
      return new Promise(() => {
      });
    }
    /**
     * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
     */
    setInterval(handler, timeout) {
      const id = setInterval(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearInterval(id));
      return id;
    }
    /**
     * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
     */
    setTimeout(handler, timeout) {
      const id = setTimeout(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearTimeout(id));
      return id;
    }
    /**
     * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
     * invalidated.
     */
    requestAnimationFrame(callback) {
      const id = requestAnimationFrame((...args) => {
        if (this.isValid) callback(...args);
      });
      this.onInvalidated(() => cancelAnimationFrame(id));
      return id;
    }
    /**
     * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
     * invalidated.
     */
    requestIdleCallback(callback, options) {
      const id = requestIdleCallback((...args) => {
        if (!this.signal.aborted) callback(...args);
      }, options);
      this.onInvalidated(() => cancelIdleCallback(id));
      return id;
    }
    addEventListener(target, type, handler, options) {
      var _a;
      if (type === "wxt:locationchange") {
        if (this.isValid) this.locationWatcher.run();
      }
      (_a = target.addEventListener) == null ? void 0 : _a.call(
        target,
        type.startsWith("wxt:") ? getUniqueEventName(type) : type,
        handler,
        {
          ...options,
          signal: this.signal
        }
      );
    }
    /**
     * @internal
     * Abort the abort controller and execute all `onInvalidated` listeners.
     */
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      logger$1.debug(
        `Content script "${this.contentScriptName}" context invalidated`
      );
    }
    stopOldScripts() {
      window.postMessage(
        {
          type: _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
          contentScriptName: this.contentScriptName,
          messageId: Math.random().toString(36).slice(2)
        },
        "*"
      );
    }
    verifyScriptStartedEvent(event) {
      var _a, _b, _c;
      const isScriptStartedEvent = ((_a = event.data) == null ? void 0 : _a.type) === _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE;
      const isSameContentScript = ((_b = event.data) == null ? void 0 : _b.contentScriptName) === this.contentScriptName;
      const isNotDuplicate = !this.receivedMessageIds.has((_c = event.data) == null ? void 0 : _c.messageId);
      return isScriptStartedEvent && isSameContentScript && isNotDuplicate;
    }
    listenForNewerScripts(options) {
      let isFirst = true;
      const cb = (event) => {
        if (this.verifyScriptStartedEvent(event)) {
          this.receivedMessageIds.add(event.data.messageId);
          const wasFirst = isFirst;
          isFirst = false;
          if (wasFirst && (options == null ? void 0 : options.ignoreFirstEvent)) return;
          this.notifyInvalidated();
        }
      };
      addEventListener("message", cb);
      this.onInvalidated(() => removeEventListener("message", cb));
    }
  };
  __publicField(_ContentScriptContext, "SCRIPT_STARTED_MESSAGE_TYPE", getUniqueEventName(
    "wxt:content-script-started"
  ));
  let ContentScriptContext = _ContentScriptContext;
  const nullKey = Symbol("null");
  let keyCounter = 0;
  class ManyKeysMap extends Map {
    constructor(...arguments_) {
      super();
      this._objectHashes = /* @__PURE__ */ new WeakMap();
      this._symbolHashes = /* @__PURE__ */ new Map();
      this._publicKeys = /* @__PURE__ */ new Map();
      const [pairs] = arguments_;
      if (pairs === null || pairs === void 0) {
        return;
      }
      if (typeof pairs[Symbol.iterator] !== "function") {
        throw new TypeError(typeof pairs + " is not iterable (cannot read property Symbol(Symbol.iterator))");
      }
      for (const [keys, value] of pairs) {
        this.set(keys, value);
      }
    }
    _getPublicKeys(keys, create = false) {
      if (!Array.isArray(keys)) {
        throw new TypeError("The keys parameter must be an array");
      }
      const privateKey = this._getPrivateKey(keys, create);
      let publicKey;
      if (privateKey && this._publicKeys.has(privateKey)) {
        publicKey = this._publicKeys.get(privateKey);
      } else if (create) {
        publicKey = [...keys];
        this._publicKeys.set(privateKey, publicKey);
      }
      return { privateKey, publicKey };
    }
    _getPrivateKey(keys, create = false) {
      const privateKeys = [];
      for (const key of keys) {
        const keyToPass = key === null ? nullKey : key;
        let hashes;
        if (typeof keyToPass === "object" || typeof keyToPass === "function") {
          hashes = "_objectHashes";
        } else if (typeof keyToPass === "symbol") {
          hashes = "_symbolHashes";
        } else {
          hashes = false;
        }
        if (!hashes) {
          privateKeys.push(keyToPass);
        } else if (this[hashes].has(keyToPass)) {
          privateKeys.push(this[hashes].get(keyToPass));
        } else if (create) {
          const privateKey = `@@mkm-ref-${keyCounter++}@@`;
          this[hashes].set(keyToPass, privateKey);
          privateKeys.push(privateKey);
        } else {
          return false;
        }
      }
      return JSON.stringify(privateKeys);
    }
    set(keys, value) {
      const { publicKey } = this._getPublicKeys(keys, true);
      return super.set(publicKey, value);
    }
    get(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.get(publicKey);
    }
    has(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.has(publicKey);
    }
    delete(keys) {
      const { publicKey, privateKey } = this._getPublicKeys(keys);
      return Boolean(publicKey && super.delete(publicKey) && this._publicKeys.delete(privateKey));
    }
    clear() {
      super.clear();
      this._symbolHashes.clear();
      this._publicKeys.clear();
    }
    get [Symbol.toStringTag]() {
      return "ManyKeysMap";
    }
    get size() {
      return super.size;
    }
  }
  new ManyKeysMap();
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  const result = (async () => {
    try {
      initPlugins();
      const { main, ...options } = definition;
      const ctx = new ContentScriptContext("content", options);
      return await main(ctx);
    } catch (err) {
      logger.error(
        `The content script "${"content"}" crashed on startup!`,
        err
      );
      throw err;
    }
  })();
  return result;
})();
content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI2LjEuMF9yb2xsdXBANC42Mi4yL25vZGVfbW9kdWxlcy93eHQvZGlzdC9zYW5kYm94L2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9zcmMvc2VydmljZXMvc2NyYXBlci9MaW5rZWRJblNjcmFwZXIudHMiLCIuLi8uLi8uLi9zcmMvZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93ZWJleHRlbnNpb24tcG9seWZpbGxAMC4xMi4wL25vZGVfbW9kdWxlcy93ZWJleHRlbnNpb24tcG9seWZpbGwvZGlzdC9icm93c2VyLXBvbHlmaWxsLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI2LjEuMF9yb2xsdXBANC42Mi4yL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyL2luZGV4Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4xOS4yOV9AdHlwZXMrbm9kZUAyNi4xLjBfcm9sbHVwQDQuNjIuMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3Qvc2FuZGJveC91dGlscy9sb2dnZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI2LjEuMF9yb2xsdXBANC42Mi4yL25vZGVfbW9kdWxlcy93eHQvZGlzdC9jbGllbnQvY29udGVudC1zY3JpcHRzL2N1c3RvbS1ldmVudHMubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI2LjEuMF9yb2xsdXBANC42Mi4yL25vZGVfbW9kdWxlcy93eHQvZGlzdC9jbGllbnQvY29udGVudC1zY3JpcHRzL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI2LjEuMF9yb2xsdXBANC42Mi4yL25vZGVfbW9kdWxlcy93eHQvZGlzdC9jbGllbnQvY29udGVudC1zY3JpcHRzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL21hbnkta2V5cy1tYXBAMy4wLjMvbm9kZV9tb2R1bGVzL21hbnkta2V5cy1tYXAvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQDFuYXRzdSt3YWl0LWVsZW1lbnRANC4yLjAvbm9kZV9tb2R1bGVzL0AxbmF0c3Uvd2FpdC1lbGVtZW50L2Rpc3QvaW5kZXgubWpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBkZWZpbmVDb250ZW50U2NyaXB0KGRlZmluaXRpb24pIHtcbiAgcmV0dXJuIGRlZmluaXRpb247XG59XG4iLCJpbXBvcnQgeyBKb2JQb3J0YWxTY3JhcGVyLCBTY3JhcGVkSm9iRGV0YWlscyB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTGlua2VkSW5TY3JhcGVyIGltcGxlbWVudHMgSm9iUG9ydGFsU2NyYXBlciB7XG4gIGlzU3VwcG9ydGVkKHVybDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHVybC5pbmNsdWRlcygnbGlua2VkaW4uY29tL2pvYnMnKTtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RKb2JEZXRhaWxzKCk6IFByb21pc2U8U2NyYXBlZEpvYkRldGFpbHM+IHtcbiAgICAvLyAxLiBFeHRyYWN0IEpvYiBJRCAmIFVSTFxuICAgIGNvbnN0IGpvYlVybCA9IHRoaXMuZ2V0Q2Fub25pY2FsSm9iVXJsKCk7XG5cbiAgICAvLyAyLiBFeHRyYWN0IFRpdGxlXG4gICAgY29uc3QgdGl0bGVTZWxlY3RvcnMgPSBbXG4gICAgICAnLmpvYi1kZXRhaWxzLWpvYnMtdW5pZmllZC10b3AtY2FyZF9fam9iLXRpdGxlJyxcbiAgICAgICcuam9icy11bmlmaWVkLXRvcC1jYXJkX19qb2ItdGl0bGUnLFxuICAgICAgJ2gxLnQtMjQnLFxuICAgICAgJy5qb2JzLWRldGFpbHMtdG9wLWNhcmRfX2pvYi10aXRsZScsXG4gICAgICAnaDIuam9icy1kZXRhaWxzLXRvcC1jYXJkX19qb2ItdGl0bGUnLFxuICAgICAgJy50b3BjYXJkX190aXRsZScsXG4gICAgXTtcbiAgICBsZXQgdGl0bGUgPSB0aGlzLmdldFRleHRGcm9tU2VsZWN0b3JzKHRpdGxlU2VsZWN0b3JzKSB8fCAnVW5rbm93biBSb2xlJztcblxuICAgIC8vIDMuIEV4dHJhY3QgQ29tcGFueVxuICAgIGNvbnN0IGNvbXBhbnlTZWxlY3RvcnMgPSBbXG4gICAgICAnLmpvYi1kZXRhaWxzLWpvYnMtdW5pZmllZC10b3AtY2FyZF9fY29tcGFueS1uYW1lIGEnLFxuICAgICAgJy5qb2JzLXVuaWZpZWQtdG9wLWNhcmRfX2NvbXBhbnktbmFtZSBhJyxcbiAgICAgICcuam9iLWRldGFpbHMtam9icy11bmlmaWVkLXRvcC1jYXJkX19jb21wYW55LW5hbWUnLFxuICAgICAgJy5qb2JzLXVuaWZpZWQtdG9wLWNhcmRfX2NvbXBhbnktbmFtZScsXG4gICAgICAnLmpvYnMtZGV0YWlscy10b3AtY2FyZF9fY29tcGFueS1uYW1lIGEnLFxuICAgICAgJy5qb2JzLWRldGFpbHMtdG9wLWNhcmRfX2NvbXBhbnktbmFtZScsXG4gICAgICAnLnRvcGNhcmRfX2ZsYXZvci0tbWV0YWRhdGEgYScsXG4gICAgICAnLnRvcGNhcmRfX2ZsYXZvciBhJyxcbiAgICBdO1xuICAgIGxldCBjb21wYW55ID0gdGhpcy5nZXRUZXh0RnJvbVNlbGVjdG9ycyhjb21wYW55U2VsZWN0b3JzKSB8fCAnVW5rbm93biBDb21wYW55JztcblxuICAgIC8vIEZhbGxiYWNrIHVzaW5nIGZpcnN0IGgxIG9uIHBhZ2UgaWYgdGl0bGUgaXMgc3RpbGwgVW5rbm93blxuICAgIGlmICh0aXRsZSA9PT0gJ1Vua25vd24gUm9sZScpIHtcbiAgICAgIGNvbnN0IGZpcnN0SDEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoMScpO1xuICAgICAgaWYgKGZpcnN0SDEgJiYgZmlyc3RIMS50ZXh0Q29udGVudCkge1xuICAgICAgICB0aXRsZSA9IGZpcnN0SDEudGV4dENvbnRlbnQudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjayB1c2luZyBkb2N1bWVudC50aXRsZSBpZiB0aXRsZSBvciBjb21wYW55IGlzIHN0aWxsIFVua25vd25cbiAgICBpZiAodGl0bGUgPT09ICdVbmtub3duIFJvbGUnIHx8IGNvbXBhbnkgPT09ICdVbmtub3duIENvbXBhbnknKSB7XG4gICAgICBjb25zdCBmYWxsYmFjayA9IHRoaXMucGFyc2VEb2N1bWVudFRpdGxlKCk7XG4gICAgICBpZiAodGl0bGUgPT09ICdVbmtub3duIFJvbGUnICYmIGZhbGxiYWNrLnRpdGxlKSB7XG4gICAgICAgIHRpdGxlID0gZmFsbGJhY2sudGl0bGU7XG4gICAgICB9XG4gICAgICBpZiAoY29tcGFueSA9PT0gJ1Vua25vd24gQ29tcGFueScgJiYgZmFsbGJhY2suY29tcGFueSkge1xuICAgICAgICBjb21wYW55ID0gZmFsbGJhY2suY29tcGFueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyA0LiBFeHRyYWN0IExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25TZWxlY3RvcnMgPSBbXG4gICAgICAnLmpvYi1kZXRhaWxzLWpvYnMtdW5pZmllZC10b3AtY2FyZF9fcHJpbWFyeS1kZXNjcmlwdGlvbicsXG4gICAgICAnLmpvYnMtdW5pZmllZC10b3AtY2FyZF9fYnVsbGV0JyxcbiAgICAgICcuam9icy1kZXRhaWxzLXRvcC1jYXJkX19idWxsZXQnLFxuICAgICAgJy50b3BjYXJkX19mbGF2b3ItLW1ldGFkYXRhJyxcbiAgICAgICcudG9wY2FyZF9fZmxhdm9yJyxcbiAgICBdO1xuICAgIGxldCBsb2NhdGlvblRleHQgPSB0aGlzLmdldFRleHRGcm9tU2VsZWN0b3JzKGxvY2F0aW9uU2VsZWN0b3JzKSB8fCAnVW5rbm93biBMb2NhdGlvbic7XG4gICAgLy8gQ2xlYW4gdXAgbG9jYXRpb24gdGV4dCAoTGlua2VkSW4gc29tZXRpbWVzIHByZWZpeGVzIHdpdGggY29tcGFueSBuYW1lIG9yIGRldGFpbHMpXG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmNsZWFuTG9jYXRpb25UZXh0KGxvY2F0aW9uVGV4dCwgY29tcGFueSk7XG5cbiAgICAvLyA1LiBFeHRyYWN0IEpvYiBEZXNjcmlwdGlvblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uU2VsZWN0b3JzID0gW1xuICAgICAgJyNqb2ItZGV0YWlscycsXG4gICAgICAnLmpvYnMtZGVzY3JpcHRpb24tY29udGVudF9fdGV4dCcsXG4gICAgICAnLmpvYnMtZGVzY3JpcHRpb25fX2NvbnRlbnQnLFxuICAgICAgJy5qb2JzLWJveF9faHRtbC1jb250ZW50JyxcbiAgICAgICcuZGVzY3JpcHRpb25fX3RleHQnLFxuICAgIF07XG4gICAgY29uc3Qgam9iRGVzY3JpcHRpb24gPSB0aGlzLmdldEh0bWxGcm9tU2VsZWN0b3JzKGRlc2NyaXB0aW9uU2VsZWN0b3JzKSB8fCAnTm8gZGVzY3JpcHRpb24gYXZhaWxhYmxlLic7XG5cbiAgICAvLyA2LiBEZXRlcm1pbmUgV29yayBNb2RlIChSZW1vdGUgLyBIeWJyaWQgLyBPbi1zaXRlKVxuICAgIGNvbnN0IHdvcmtNb2RlID0gdGhpcy5kZXRlY3RXb3JrTW9kZShsb2NhdGlvblRleHQsIGpvYkRlc2NyaXB0aW9uKTtcblxuICAgIC8vIDcuIERldGVybWluZSBFbXBsb3ltZW50IFR5cGVcbiAgICBjb25zdCBlbXBsb3ltZW50VHlwZSA9IHRoaXMuZGV0ZWN0RW1wbG95bWVudFR5cGUoam9iRGVzY3JpcHRpb24pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBhbnksXG4gICAgICB0aXRsZSxcbiAgICAgIGxvY2F0aW9uLFxuICAgICAgam9iVXJsLFxuICAgICAgam9iRGVzY3JpcHRpb24sXG4gICAgICBlbXBsb3ltZW50VHlwZSxcbiAgICAgIHdvcmtNb2RlLFxuICAgICAgcG9ydGFsOiAnTGlua2VkSW4nLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGdldENhbm9uaWNhbEpvYlVybCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCk7XG4gICAgICBcbiAgICAgIC8vIFRyeSBwYXRoIHBhdHRlcm4gZmlyc3Q6IC9qb2JzL3ZpZXcvMTIzNDU2Nzg5L1xuICAgICAgY29uc3Qgam9iSWRNYXRjaCA9IHBhcnNlZC5wYXRobmFtZS5tYXRjaCgvXFwvam9ic1xcL3ZpZXdcXC8oXFxkKykvKTtcbiAgICAgIGlmIChqb2JJZE1hdGNoKSB7XG4gICAgICAgIHJldHVybiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2pvYnMvdmlldy8ke2pvYklkTWF0Y2hbMV19L2A7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFRyeSBxdWVyeSBwYXJhbWV0ZXI6ID9jdXJyZW50Sm9iSWQ9MTIzNDU2Nzg5XG4gICAgICBjb25zdCBjdXJyZW50Sm9iSWQgPSBwYXJzZWQuc2VhcmNoUGFyYW1zLmdldCgnY3VycmVudEpvYklkJyk7XG4gICAgICBpZiAoY3VycmVudEpvYklkKSB7XG4gICAgICAgIHJldHVybiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2pvYnMvdmlldy8ke2N1cnJlbnRKb2JJZH0vYDtcbiAgICAgIH1cblxuICAgICAgLy8gVHJ5IHJlYWRpbmcgam9iIElEIGZyb20gYWN0aXZlIGVsZW1lbnRzIG9uIHBhZ2VcbiAgICAgIGNvbnN0IGFjdGl2ZUpvYkNhcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuam9icy1zZWFyY2gtcmVzdWx0cy1saXN0X19saXN0LWl0ZW0tLWFjdGl2ZSwgW2RhdGEtam9iLWlkXScpO1xuICAgICAgaWYgKGFjdGl2ZUpvYkNhcmQpIHtcbiAgICAgICAgY29uc3Qgam9iSWQgPSBhY3RpdmVKb2JDYXJkLmdldEF0dHJpYnV0ZSgnZGF0YS1qb2ItaWQnKSB8fCBhY3RpdmVKb2JDYXJkLmdldEF0dHJpYnV0ZSgnZGF0YS1vY2NsdWRhYmxlLWpvYi1pZCcpO1xuICAgICAgICBpZiAoam9iSWQpIHtcbiAgICAgICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9qb2JzL3ZpZXcvJHtqb2JJZH0vYDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgSm9iIFVSTDonLCBlKTtcbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VGV4dEZyb21TZWxlY3RvcnMoc2VsZWN0b3JzOiBzdHJpbmdbXSk6IHN0cmluZyB8IG51bGwge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2Ygc2VsZWN0b3JzKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LnRleHRDb250ZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50LnRleHRDb250ZW50LnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRIdG1sRnJvbVNlbGVjdG9ycyhzZWxlY3RvcnM6IHN0cmluZ1tdKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBzZWxlY3RvcnMpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgIC8vIFJldHVybiBpbm5lckhUTUwgYnV0IGNsZWFuIGl0IHVwIHNsaWdodGx5XG4gICAgICAgIHJldHVybiBlbGVtZW50LmlubmVySFRNTC50cmltKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhbkxvY2F0aW9uVGV4dCh0ZXh0OiBzdHJpbmcsIGNvbXBhbnk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IGNsZWFuZWQgPSB0ZXh0O1xuICAgIC8vIFJlbW92ZSBjb21wYW55IG5hbWUgcHJlZml4IGlmIHByZXNlbnRcbiAgICBpZiAoY29tcGFueSAmJiBjbGVhbmVkLnN0YXJ0c1dpdGgoY29tcGFueSkpIHtcbiAgICAgIGNsZWFuZWQgPSBjbGVhbmVkLnN1YnN0cmluZyhjb21wYW55Lmxlbmd0aCkudHJpbSgpO1xuICAgIH1cbiAgICAvLyBSZW1vdmUgbGVhZGluZyBidWxsZXQvZG90cy9uZXdsaW5lc1xuICAgIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL15b4oCiwrdcXHNcXHJcXG5cXC1cXHUwMEI3XSsvLCAnJykudHJpbSgpO1xuICAgIFxuICAgIC8vIFNwbGl0IGJ5IGNvbW1vbiBzZXBhcmF0b3JzIChsaWtlIFwiwrdcIiBvciBcIm92ZXIgMTAgYXBwbGljYW50c1wiKSBhbmQga2VlcCB0aGUgZmlyc3QgY2h1bmtcbiAgICBjb25zdCBwYXJ0cyA9IGNsZWFuZWQuc3BsaXQoL1vCt1xcdTAwQjdcXG5dLyk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNsZWFuZWQgPSBwYXJ0c1swXS50cmltKCk7XG4gICAgfVxuICAgIHJldHVybiBjbGVhbmVkIHx8ICdVbmtub3duIExvY2F0aW9uJztcbiAgfVxuXG4gIHByaXZhdGUgZGV0ZWN0V29ya01vZGUobG9jYXRpb25UZXh0OiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRleHRUb0NoZWNrID0gYCR7bG9jYXRpb25UZXh0fSAke2Rlc2NyaXB0aW9ufWAudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICBpZiAodGV4dFRvQ2hlY2suaW5jbHVkZXMoJ3JlbW90ZScpKSB7XG4gICAgICByZXR1cm4gJ1JlbW90ZSc7XG4gICAgfSBlbHNlIGlmICh0ZXh0VG9DaGVjay5pbmNsdWRlcygnaHlicmlkJykpIHtcbiAgICAgIHJldHVybiAnSHlicmlkJztcbiAgICB9IGVsc2UgaWYgKHRleHRUb0NoZWNrLmluY2x1ZGVzKCdvbi1zaXRlJykgfHwgdGV4dFRvQ2hlY2suaW5jbHVkZXMoJ29uc2l0ZScpIHx8IHRleHRUb0NoZWNrLmluY2x1ZGVzKCdpbi1vZmZpY2UnKSkge1xuICAgICAgcmV0dXJuICdPbi1zaXRlJztcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IGJhc2VkIG9uIGdlbmVyYWwgaW5mbyBvciBmYWxsYmFja1xuICAgIHJldHVybiAnT24tc2l0ZSc7XG4gIH1cblxuICBwcml2YXRlIGRldGVjdEVtcGxveW1lbnRUeXBlKGRlc2NyaXB0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRlc2NMb3dlciA9IGRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAvLyBMb29rIGZvciBlbXBsb3ltZW50IHR5cGUgYmFkZ2VzIGluIHRoZSB0b3AgY2FyZCBpZiB0aGV5IGV4aXN0XG4gICAgY29uc3Qgam9iRGV0YWlsc0NhcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuam9iLWRldGFpbHMtam9icy11bmlmaWVkLXRvcC1jYXJkX19qb2ItaW5zaWdodCcpO1xuICAgIGNvbnN0IGNhcmRUZXh0ID0gam9iRGV0YWlsc0NhcmQ/LnRleHRDb250ZW50Py50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuXG4gICAgY29uc3QgdGV4dFRvU2VhcmNoID0gYCR7Y2FyZFRleHR9ICR7ZGVzY0xvd2VyfWA7XG5cbiAgICBpZiAodGV4dFRvU2VhcmNoLmluY2x1ZGVzKCdmdWxsLXRpbWUnKSB8fCB0ZXh0VG9TZWFyY2guaW5jbHVkZXMoJ2Z1bGwgdGltZScpKSB7XG4gICAgICByZXR1cm4gJ0Z1bGwtdGltZSc7XG4gICAgfSBlbHNlIGlmICh0ZXh0VG9TZWFyY2guaW5jbHVkZXMoJ3BhcnQtdGltZScpIHx8IHRleHRUb1NlYXJjaC5pbmNsdWRlcygncGFydCB0aW1lJykpIHtcbiAgICAgIHJldHVybiAnUGFydC10aW1lJztcbiAgICB9IGVsc2UgaWYgKHRleHRUb1NlYXJjaC5pbmNsdWRlcygnY29udHJhY3QnKSkge1xuICAgICAgcmV0dXJuICdDb250cmFjdCc7XG4gICAgfSBlbHNlIGlmICh0ZXh0VG9TZWFyY2guaW5jbHVkZXMoJ2ludGVybnNoaXAnKSB8fCB0ZXh0VG9TZWFyY2guaW5jbHVkZXMoJ2ludGVybicpKSB7XG4gICAgICByZXR1cm4gJ0ludGVybnNoaXAnO1xuICAgIH0gZWxzZSBpZiAodGV4dFRvU2VhcmNoLmluY2x1ZGVzKCd0ZW1wb3JhcnknKSkge1xuICAgICAgcmV0dXJuICdUZW1wb3JhcnknO1xuICAgIH1cblxuICAgIHJldHVybiAnRnVsbC10aW1lJzsgLy8gRGVmYXVsdCB0byBGdWxsLXRpbWUgYXMgc3RhbmRhcmRcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VEb2N1bWVudFRpdGxlKCk6IHsgdGl0bGU6IHN0cmluZzsgY29tcGFueTogc3RyaW5nIH0ge1xuICAgIGNvbnN0IGRvY1RpdGxlID0gZG9jdW1lbnQudGl0bGU7XG4gICAgLy8gUmVtb3ZlIG5vdGlmaWNhdGlvbiBjb3VudCBsaWtlICgxKSBvciAoMTIpXG4gICAgY29uc3QgY2xlYW5UaXRsZSA9IGRvY1RpdGxlLnJlcGxhY2UoL15cXChcXGQrXFwpXFxzKy8sICcnKS50cmltKCk7XG4gICAgXG4gICAgLy8gQ2hlY2sgZm9yIFwiQ29tcGFueSBoaXJpbmcgUm9sZS4uLlwiIG9yIFwiUm9sZSBhdCBDb21wYW55Li4uXCIgb3IgXCJSb2xlIC0gQ29tcGFueS4uLlwiXG4gICAgLy8gUGF0dGVybiAxOiBcIkNvbXBhbnkgaGlyaW5nIFJvbGUgaW4gTG9jYXRpb24gfCBMaW5rZWRJblwiXG4gICAgY29uc3QgaGlyaW5nTWF0Y2ggPSBjbGVhblRpdGxlLm1hdGNoKC9eKC4rPylcXHMraGlyaW5nXFxzKyguKz8pXFxzK2luXFxzKy9pKTtcbiAgICBpZiAoaGlyaW5nTWF0Y2gpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBhbnk6IGhpcmluZ01hdGNoWzFdLnRyaW0oKSxcbiAgICAgICAgdGl0bGU6IGhpcmluZ01hdGNoWzJdLnRyaW0oKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBQYXR0ZXJuIDI6IFwiUm9sZSBhdCBDb21wYW55IHwgTGlua2VkSW5cIlxuICAgIGNvbnN0IGF0TWF0Y2ggPSBjbGVhblRpdGxlLm1hdGNoKC9eKC4rPylcXHMrYXRcXHMrKC4rPykoPzpcXHMrXFx8fCQpL2kpO1xuICAgIGlmIChhdE1hdGNoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogYXRNYXRjaFsxXS50cmltKCksXG4gICAgICAgIGNvbXBhbnk6IGF0TWF0Y2hbMl0udHJpbSgpXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFBhdHRlcm4gMzogXCJSb2xlIC0gQ29tcGFueSB8IExpbmtlZEluXCIgb3Igc2ltaWxhciBzZXBhcmF0b3JzXG4gICAgY29uc3QgcGFydHMgPSBjbGVhblRpdGxlLnNwbGl0KCd8JylbMF0uc3BsaXQoJyAtICcpO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPj0gMikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IHBhcnRzWzBdLnRyaW0oKSxcbiAgICAgICAgY29tcGFueTogcGFydHNbMV0udHJpbSgpXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIHNwbGl0IGJ5IGNvbW1hIG9yIG90aGVyIGNvbW1vbiBkaXZpZGVyc1xuICAgIGNvbnN0IGNvbW1hUGFydHMgPSBjbGVhblRpdGxlLnNwbGl0KCd8JylbMF0uc3BsaXQoJywnKTtcbiAgICBpZiAoY29tbWFQYXJ0cy5sZW5ndGggPj0gMikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IGNvbW1hUGFydHNbMF0udHJpbSgpLFxuICAgICAgICBjb21wYW55OiBjb21tYVBhcnRzWzFdLnRyaW0oKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6IGNsZWFuVGl0bGUuc3BsaXQoJ3wnKVswXS50cmltKCksXG4gICAgICBjb21wYW55OiAnTGlua2VkSW4gQ29tcGFueSdcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQgeyBkZWZpbmVDb250ZW50U2NyaXB0IH0gZnJvbSAnd3h0L3NhbmRib3gnO1xuaW1wb3J0IHsgTGlua2VkSW5TY3JhcGVyIH0gZnJvbSAnQC9zZXJ2aWNlcy9zY3JhcGVyL0xpbmtlZEluU2NyYXBlcic7XG5pbXBvcnQgeyBTY3JhcGVkSm9iRGV0YWlscyB9IGZyb20gJ0Avc2VydmljZXMvc2NyYXBlci90eXBlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbXG4gICAgJ2h0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9qb2JzLyonLFxuICAgICdodHRwczovL3d3dy5saW5rZWRpbi5jb20vam9icy92aWV3LyonXG4gIF0sXG4gIHJ1bkF0OiAnZG9jdW1lbnRfZW5kJyxcbiAgbWFpbigpIHtcbiAgICBjb25zdCBzY3JhcGVyID0gbmV3IExpbmtlZEluU2NyYXBlcigpO1xuICAgIGxldCBjdXJyZW50VXJsID0gJyc7XG4gICAgbGV0IGFjdGl2ZU92ZXJsYXk6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgY29uc3Qgc2Vzc2lvblRyYWNrZWRVcmxzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3QgbG9nb1VybCA9IGNocm9tZS5ydW50aW1lLmdldFVSTCgnaWNvbnMvaWNvbjQ4LnBuZycpO1xuXG4gICAgLy8gUGVyaW9kaWMgb2JzZXJ2ZXIgdG8gZGV0ZWN0IFVSTCBjaGFuZ2VzIGFuZCBiaW5kIGFwcGx5IGJ1dHRvbiBsaXN0ZW5lcnNcbiAgICBmdW5jdGlvbiBpbml0VXJsT2JzZXJ2ZXIoKSB7XG4gICAgICBjdXJyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICBcbiAgICAgIC8vIFBlcmlvZGljYWxseSBjaGVjayBmb3IgcGFnZSBzdGF0ZVxuICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAvLyBJZiBVUkwgY2hhbmdlZCwgY2xvc2UgYW55IHN0YWxlIHRyYWNraW5nIGNhcmRzXG4gICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaHJlZiAhPT0gY3VycmVudFVybCkge1xuICAgICAgICAgIGN1cnJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICByZW1vdmVPdmVybGF5KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdHRhY2ggbGlzdGVuZXJzIHRvIG5ld2x5IHJlbmRlcmVkIGFwcGx5IGJ1dHRvbnNcbiAgICAgICAgaWYgKHNjcmFwZXIuaXNTdXBwb3J0ZWQod2luZG93LmxvY2F0aW9uLmhyZWYpKSB7XG4gICAgICAgICAgYmluZEFwcGx5QnV0dG9uTGlzdGVuZXJzKCk7XG4gICAgICAgICAgYmluZFN1Ym1pdEJ1dHRvbkxpc3RlbmVyKCk7XG4gICAgICAgICAgY2hlY2tFYXN5QXBwbHlTdWNjZXNzKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIC8vIEZpbmQgTGlua2VkSW4gQXBwbHkgYW5kIEVhc3kgQXBwbHkgYnV0dG9ucyBhbmQgYXR0YWNoIGNsaWNrIHRyaWdnZXJzXG4gICAgZnVuY3Rpb24gYmluZEFwcGx5QnV0dG9uTGlzdGVuZXJzKCkge1xuICAgICAgY29uc3QgYXBwbHlCdXR0b25zID0gZmluZEFwcGx5QnV0dG9ucygpO1xuICAgICAgYXBwbHlCdXR0b25zLmZvckVhY2goYnV0dG9uID0+IHtcbiAgICAgICAgaWYgKGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2RhdGEtam9iZmxvdy1saXN0ZW5lZCcpID09PSAndHJ1ZScpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGF0YS1qb2JmbG93LWxpc3RlbmVkJywgJ3RydWUnKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHRleHQgPSBidXR0b24udGV4dENvbnRlbnQ/LnRyaW0oKS50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuICAgICAgICBjb25zdCBpc0Vhc3lBcHBseSA9IHRleHQuaW5jbHVkZXMoJ2Vhc3kgYXBwbHknKTtcblxuICAgICAgICBpZiAoaXNFYXN5QXBwbHkpIHtcbiAgICAgICAgICAvLyBGb3IgRWFzeSBBcHBseSwgd2UgZG8gTk9UIHNhdmUgaW1tZWRpYXRlbHkgb24gY2xpY2tpbmcgXCJFYXN5IEFwcGx5XCIuXG4gICAgICAgICAgLy8gV2Ugd2lsbCBtb25pdG9yIGZvciB0aGUgZmluYWwgc3VibWl0IG9yIHN1Y2Nlc3Mgc3RhdGUuXG4gICAgICAgICAgY29uc29sZS5sb2coJ0pvYkZsb3c6IEVhc3kgQXBwbHkgYnV0dG9uIGRldGVjdGVkLiBNb25pdG9yaW5nIG1vZGFsLi4uJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gRm9yIGV4dGVybmFsIEFwcGx5LCBzYXZlIGltbWVkaWF0ZWx5IHdoZW4gY2xpY2tlZFxuICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdKb2JGbG93OiBFeHRlcm5hbCBBcHBseSBidXR0b24gY2xpY2tlZC4gU2F2aW5nLi4uJyk7XG4gICAgICAgICAgICB0cmlnZ2VyU2F2ZVdvcmtmbG93KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmRBcHBseUJ1dHRvbnMoKTogSFRNTEVsZW1lbnRbXSB7XG4gICAgICBjb25zdCBidXR0b25zOiBIVE1MRWxlbWVudFtdID0gW107XG4gICAgICBjb25zdCBzZWxlY3RvcnMgPSBbXG4gICAgICAgICcuam9icy1hcHBseS1idXR0b24nLFxuICAgICAgICAnLmpvYnMtcy1hcHBseSBidXR0b24nLFxuICAgICAgICAnYnV0dG9uLmpvYnMtYXBwbHktYnV0dG9uLS10b3AtY2FyZCcsXG4gICAgICAgICdbZGF0YS1jb250cm9sLW5hbWU9XCJqb2JfYXBwbHlcIl0nLFxuICAgICAgICAnLmpvYnMtYXBwbHktYnV0dG9uLS10b3AtY2FyZCBidXR0b24nXG4gICAgICBdO1xuXG4gICAgICBzZWxlY3RvcnMuZm9yRWFjaChzZWwgPT4ge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbCkuZm9yRWFjaChlbCA9PiB7XG4gICAgICAgICAgaWYgKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGJ1dHRvbnMucHVzaChlbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBGYWxsYmFjazogY2hlY2sgYWxsIGJ1dHRvbnMgb24gcGFnZSBmb3IgXCJhcHBseVwiIHRleHRcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbicpLmZvckVhY2goYnRuID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGJ0bi50ZXh0Q29udGVudD8udHJpbSgpLnRvTG93ZXJDYXNlKCkgfHwgJyc7XG4gICAgICAgIGlmICgodGV4dCA9PT0gJ2FwcGx5JyB8fCB0ZXh0ID09PSAnZWFzeSBhcHBseScgfHwgdGV4dC5pbmNsdWRlcygnYXBwbHkgbm93JykpICYmICFidXR0b25zLmluY2x1ZGVzKGJ0bikpIHtcbiAgICAgICAgICBidXR0b25zLnB1c2goYnRuKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBidXR0b25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJpbmRTdWJtaXRCdXR0b25MaXN0ZW5lcigpIHtcbiAgICAgIGNvbnN0IHN1Ym1pdEJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdidXR0b24nKTtcbiAgICAgIHN1Ym1pdEJ1dHRvbnMuZm9yRWFjaChidXR0b24gPT4ge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYnV0dG9uLnRleHRDb250ZW50Py50cmltKCkudG9Mb3dlckNhc2UoKSB8fCAnJztcbiAgICAgICAgY29uc3QgYXJpYUxhYmVsID0gYnV0dG9uLmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpPy50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKCh0ZXh0ID09PSAnc3VibWl0IGFwcGxpY2F0aW9uJyB8fCBhcmlhTGFiZWwgPT09ICdzdWJtaXQgYXBwbGljYXRpb24nKSAmJiBcbiAgICAgICAgICAgIGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2RhdGEtam9iZmxvdy1saXN0ZW5lZCcpICE9PSAndHJ1ZScpIHtcbiAgICAgICAgICBcbiAgICAgICAgICBidXR0b24uc2V0QXR0cmlidXRlKCdkYXRhLWpvYmZsb3ctbGlzdGVuZWQnLCAndHJ1ZScpO1xuICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdKb2JGbG93OiBTdWJtaXQgYXBwbGljYXRpb24gYnV0dG9uIGNsaWNrZWQhIFNhdmluZy4uLicpO1xuICAgICAgICAgICAgdHJpZ2dlclNhdmVXb3JrZmxvdygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0Vhc3lBcHBseVN1Y2Nlc3MoKSB7XG4gICAgICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qb2JzLWVhc3ktYXBwbHktbW9kYWwsIFtyb2xlPVwiZGlhbG9nXCJdLCAuYXJ0ZGVjby1tb2RhbCcpO1xuICAgICAgaWYgKCFtb2RhbCkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBtb2RhbFRleHQgPSBtb2RhbC50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgIGNvbnN0IHN1Y2Nlc3NQaHJhc2VzID0gW1xuICAgICAgICAnYXBwbGljYXRpb24gc2VudCcsXG4gICAgICAgICdhcHBsaWNhdGlvbiBzdWJtaXR0ZWQnLFxuICAgICAgICAneW91ciBhcHBsaWNhdGlvbiB3YXMgc2VudCcsXG4gICAgICAgICdzdWNjZXNzZnVsbHkgYXBwbGllZCdcbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IGhhc1N1Y2Nlc3MgPSBzdWNjZXNzUGhyYXNlcy5zb21lKHBocmFzZSA9PiBtb2RhbFRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhwaHJhc2UpKTtcbiAgICAgIGlmIChoYXNTdWNjZXNzKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRKb2JVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgaWYgKCFzZXNzaW9uVHJhY2tlZFVybHMuaGFzKGN1cnJlbnRKb2JVcmwpKSB7XG4gICAgICAgICAgc2Vzc2lvblRyYWNrZWRVcmxzLmFkZChjdXJyZW50Sm9iVXJsKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnSm9iRmxvdzogRGV0ZWN0ZWQgRWFzeSBBcHBseSBzdWNjZXNzIHNjcmVlbiEgU2F2aW5nLi4uJyk7XG4gICAgICAgICAgdHJpZ2dlclNhdmVXb3JrZmxvdygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2NyYXBlIGFuZCBkaXNwbGF5IGNvbmZpcm1hdGlvbiBvdmVybGF5XG4gICAgYXN5bmMgZnVuY3Rpb24gdHJpZ2dlclNhdmVXb3JrZmxvdygpIHtcbiAgICAgIGlmICghc2NyYXBlci5pc1N1cHBvcnRlZCh3aW5kb3cubG9jYXRpb24uaHJlZikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBCcmllZiBkZWxheSB0byBhbGxvdyBET00gdHJhbnNpdGlvbiAoZXNwZWNpYWxseSBmb3IgZHluYW1pYyBtb2RhbCB0cmlnZ2VycylcbiAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGRldGFpbHMgPSBhd2FpdCBzY3JhcGVyLmV4dHJhY3RKb2JEZXRhaWxzKCk7XG4gICAgICAgICAgaWYgKCFkZXRhaWxzIHx8ICFkZXRhaWxzLmpvYlVybCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdKb2JGbG93OiBTY3JhcGVyIHJldHVybmVkIGluY29tcGxldGUgZGV0YWlscy4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkZXRhaWxzLnRpdGxlIHx8IGRldGFpbHMudGl0bGUgPT09ICdVbmtub3duIFJvbGUnKSB7XG4gICAgICAgICAgICBkZXRhaWxzLnRpdGxlID0gJ0pvYiBBcHBsaWNhdGlvbic7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZGV0YWlscy5jb21wYW55IHx8IGRldGFpbHMuY29tcGFueSA9PT0gJ1Vua25vd24gQ29tcGFueScpIHtcbiAgICAgICAgICAgIGRldGFpbHMuY29tcGFueSA9ICdMaW5rZWRJbic7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgZHVwbGljYXRlIGluIHN0b3JhZ2VcbiAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICAgIHsgYWN0aW9uOiAnQ0hFQ0tfRFVQTElDQVRFJywgcGF5bG9hZDogeyB1cmw6IGRldGFpbHMuam9iVXJsIH0gfSxcbiAgICAgICAgICAgIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdKb2JGbG93IGR1cGxpY2F0ZSBjaGVjayBlcnJvcjonLCBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGlzVHJhY2tlZCA9IHJlc3BvbnNlICYmIHJlc3BvbnNlLmV4aXN0cztcbiAgICAgICAgICAgICAgY29uc3QgdHJhY2tlZEFwcCA9IHJlc3BvbnNlICYmIHJlc3BvbnNlLmFwcDtcblxuICAgICAgICAgICAgICBpbmplY3RPdmVybGF5KGRldGFpbHMsIGlzVHJhY2tlZCwgdHJhY2tlZEFwcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0pvYkZsb3cgdHJpZ2dlciBlcnJvcjonLCBlKTtcbiAgICAgICAgfVxuICAgICAgfSwgMzAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVPdmVybGF5KCkge1xuICAgICAgaWYgKGFjdGl2ZU92ZXJsYXkpIHtcbiAgICAgICAgYWN0aXZlT3ZlcmxheS5yZW1vdmUoKTtcbiAgICAgICAgYWN0aXZlT3ZlcmxheSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5qZWN0T3ZlcmxheShkZXRhaWxzOiBTY3JhcGVkSm9iRGV0YWlscywgaXNUcmFja2VkOiBib29sZWFuLCB0cmFja2VkQXBwOiBhbnkpIHtcbiAgICAgIHJlbW92ZU92ZXJsYXkoKTtcblxuICAgICAgLy8gQ3JlYXRlIGhvc3QgZWxlbWVudCBmb3IgU2hhZG93IERPTVxuICAgICAgY29uc3QgaG9zdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaG9zdC5pZCA9ICdqb2JmbG93LXRyYWNrZXItcm9vdCc7XG4gICAgICBob3N0LnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgIGhvc3Quc3R5bGUuYm90dG9tID0gJzIwcHgnO1xuICAgICAgaG9zdC5zdHlsZS5yaWdodCA9ICcyMHB4JztcbiAgICAgIGhvc3Quc3R5bGUuekluZGV4ID0gJzk5OTk5OSc7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhvc3QpO1xuICAgICAgYWN0aXZlT3ZlcmxheSA9IGhvc3Q7XG5cbiAgICAgIGNvbnN0IHNoYWRvdyA9IGhvc3QuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuXG4gICAgICAvLyBMb2FkIHN0eWxlc2hlZXQgaW5zaWRlIFNoYWRvdyBET01cbiAgICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgICAuam9iZmxvdy1jYXJkIHtcbiAgICAgICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgICAgICAgICB3aWR0aDogMzIwcHg7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzBmMTcyYTtcbiAgICAgICAgICBjb2xvcjogI2Y4ZmFmYztcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjMzM0MTU1O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgcGFkZGluZzogMTZweDtcbiAgICAgICAgICBib3gtc2hhZG93OiAwIDEwcHggMjVweCAtNXB4IHJnYmEoMCwgMCwgMCwgMC4zKSwgMCA4cHggMTBweCAtNnB4IHJnYmEoMCwgMCwgMCwgMC4zKTtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBjdWJpYy1iZXppZXIoMC40LCAwLCAwLjIsIDEpO1xuICAgICAgICB9XG4gICAgICAgIC5qb2JmbG93LWhlYWRlciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxMnB4O1xuICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjMWUyOTNiO1xuICAgICAgICAgIHBhZGRpbmctYm90dG9tOiA4cHg7XG4gICAgICAgIH1cbiAgICAgICAgLmpvYmZsb3ctdGl0bGUge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGNvbG9yOiAjODE4Y2Y4O1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgfVxuICAgICAgICAuam9iZmxvdy1jbG9zZSB7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgICBwYWRkaW5nOiA0cHg7XG4gICAgICAgIH1cbiAgICAgICAgLmpvYmZsb3ctY2xvc2U6aG92ZXIge1xuICAgICAgICAgIGNvbG9yOiAjZjFmNWY5O1xuICAgICAgICB9XG4gICAgICAgIC5qb2ItaW5mbyB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIG1hcmdpbi1ib3R0b206IDEycHg7XG4gICAgICAgIH1cbiAgICAgICAgLmpvYi1yb2xlIHtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgICAgICBjb2xvcjogI2YxZjVmOTtcbiAgICAgICAgICBtYXJnaW4tYm90dG9tOiAycHg7XG4gICAgICAgIH1cbiAgICAgICAgLmpvYi1jb21wYW55IHtcbiAgICAgICAgICBjb2xvcjogIzk0YTNiODtcbiAgICAgICAgfVxuICAgICAgICAuZm9ybS1ncm91cCB7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgICAgICAgfVxuICAgICAgICAuZm9ybS1sYWJlbCB7XG4gICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICAgIG1hcmdpbi1ib3R0b206IDRweDtcbiAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAwLjA1ZW07XG4gICAgICAgIH1cbiAgICAgICAgLmZvcm0tc2VsZWN0LCAuZm9ybS1pbnB1dCwgLmZvcm0tdGV4dGFyZWEge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMxZTI5M2I7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzMzNDE1NTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgICAgICAgY29sb3I6ICNmMWY1Zjk7XG4gICAgICAgICAgcGFkZGluZzogOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICB9XG4gICAgICAgIC5mb3JtLXNlbGVjdDpmb2N1cywgLmZvcm0taW5wdXQ6Zm9jdXMsIC5mb3JtLXRleHRhcmVhOmZvY3VzIHtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIGJvcmRlci1jb2xvcjogIzYzNjZmMTtcbiAgICAgICAgfVxuICAgICAgICAuZm9ybS10ZXh0YXJlYSB7XG4gICAgICAgICAgaGVpZ2h0OiA1MHB4O1xuICAgICAgICAgIHJlc2l6ZTogdmVydGljYWw7XG4gICAgICAgIH1cbiAgICAgICAgLmJ0bi1jb250YWluZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgICAgbWFyZ2luLXRvcDogMTRweDtcbiAgICAgICAgfVxuICAgICAgICAuYnRuIHtcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIHBhZGRpbmc6IDhweCAxMnB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgfVxuICAgICAgICAuYnRuLXByaW1hcnkge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICM0ZjQ2ZTU7XG4gICAgICAgICAgY29sb3I6ICNmZmZmZmY7XG4gICAgICAgIH1cbiAgICAgICAgLmJ0bi1wcmltYXJ5OmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjNDMzOGNhO1xuICAgICAgICB9XG4gICAgICAgIC5idG4tc2Vjb25kYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMzM0MTU1O1xuICAgICAgICAgIGNvbG9yOiAjY2JkNWUxO1xuICAgICAgICB9XG4gICAgICAgIC5idG4tc2Vjb25kYXJ5OmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjNDc1NTY5O1xuICAgICAgICB9XG4gICAgICAgIC5iYWRnZSB7XG4gICAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgICAgIHBhZGRpbmc6IDJweCA2cHg7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTBweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyMmM1NWUyMDtcbiAgICAgICAgICBjb2xvcjogIzIyYzU1ZTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjMjJjNTVlNDA7XG4gICAgICAgIH1cbiAgICAgICAgLmJhZGdlLXRyYWNrZWQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICM2MzY2ZjEyMDtcbiAgICAgICAgICBjb2xvcjogIzgxOGNmODtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjNjM2NmYxNDA7XG4gICAgICAgIH1cbiAgICAgICAgLnN1Y2Nlc3MtbXNnIHtcbiAgICAgICAgICBjb2xvcjogIzIyYzU1ZTtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIG1hcmdpbi10b3A6IDhweDtcbiAgICAgICAgfVxuICAgICAgYDtcbiAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChzdHlsZSk7XG5cbiAgICAgIGNvbnN0IGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGNhcmQuY2xhc3NOYW1lID0gJ2pvYmZsb3ctY2FyZCc7XG5cbiAgICAgIGlmIChpc1RyYWNrZWQpIHtcbiAgICAgICAgcmVuZGVyVHJhY2tlZFN0YXRlKGNhcmQsIGRldGFpbHMsIHRyYWNrZWRBcHApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2F2ZUF1dG9tYXRpY2FsbHkoY2FyZCwgZGV0YWlscyk7XG4gICAgICB9XG5cbiAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChjYXJkKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW5kZXJUcmFja2VkU3RhdGUoY2FyZDogSFRNTEVsZW1lbnQsIGRldGFpbHM6IFNjcmFwZWRKb2JEZXRhaWxzLCBhcHA6IGFueSkge1xuICAgICAgY2FyZC5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LWhlYWRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LXRpdGxlXCI+XG4gICAgICAgICAgICA8aW1nIHNyYz1cIiR7bG9nb1VybH1cIiBzdHlsZT1cIndpZHRoOiAxNHB4OyBoZWlnaHQ6IDE0cHg7IG9iamVjdC1maXQ6IGNvbnRhaW47IG1hcmdpbi1yaWdodDogNHB4O1wiIGFsdD1cIkxvZ29cIiAvPlxuICAgICAgICAgICAgSm9iRmxvdyBUcmFja2VyXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImpvYmZsb3ctY2xvc2VcIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9iLWluZm9cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iLXJvbGVcIj4ke2RldGFpbHMudGl0bGV9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImpvYi1jb21wYW55XCI+JHtkZXRhaWxzLmNvbXBhbnl9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMTJweDtcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImJhZGdlIGJhZGdlLXRyYWNrZWRcIj5UcmFja2VkIGFzOiAke2FwcC5zdGF0dXN9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTFweDsgY29sb3I6ICM5NGEzYjg7IGxpbmUtaGVpZ2h0OiAxLjQ7XCI+XG4gICAgICAgICAgQXBwbGllZCBvbiAke25ldyBEYXRlKGFwcC5hcHBsaWVkRGF0ZSkudG9Mb2NhbGVEYXRlU3RyaW5nKCl9IHVzaW5nIHJlc3VtZTo8YnIvPlxuICAgICAgICAgIDxzdHJvbmcgc3R5bGU9XCJjb2xvcjogI2YxZjVmOTtcIj4ke2FwcC5yZXN1bWVOYW1lIHx8ICdOb25lIFNlbGVjdGVkJ308L3N0cm9uZz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGNsb3NlLWJ0blwiPkNsb3NlIFRyYWNrZXI8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgO1xuXG4gICAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5qb2JmbG93LWNsb3NlJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVtb3ZlT3ZlcmxheSk7XG4gICAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5jbG9zZS1idG4nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCByZW1vdmVPdmVybGF5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzYXZlQXV0b21hdGljYWxseShjYXJkOiBIVE1MRWxlbWVudCwgZGV0YWlsczogU2NyYXBlZEpvYkRldGFpbHMpIHtcbiAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCBhcHBsaWVkRGF0ZSA9IG5vdy50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG4gICAgICBjb25zdCBhcHBsaWVkVGltZSA9IG5vdy50b1RpbWVTdHJpbmcoKS5zcGxpdCgnICcpWzBdLnN1YnN0cmluZygwLCA1KTtcblxuICAgICAgY29uc3QgYXBwRGF0YSA9IHtcbiAgICAgICAgY29tcGFueTogZGV0YWlscy5jb21wYW55LFxuICAgICAgICB0aXRsZTogZGV0YWlscy50aXRsZSxcbiAgICAgICAgbG9jYXRpb246IGRldGFpbHMubG9jYXRpb24sXG4gICAgICAgIGpvYlVybDogZGV0YWlscy5qb2JVcmwsXG4gICAgICAgIGpvYkRlc2NyaXB0aW9uOiBkZXRhaWxzLmpvYkRlc2NyaXB0aW9uLFxuICAgICAgICBlbXBsb3ltZW50VHlwZTogZGV0YWlscy5lbXBsb3ltZW50VHlwZSxcbiAgICAgICAgd29ya01vZGU6IGRldGFpbHMud29ya01vZGUsXG4gICAgICAgIHBvcnRhbDogZGV0YWlscy5wb3J0YWwsXG4gICAgICAgIHJlc3VtZUlkOiB1bmRlZmluZWQsXG4gICAgICAgIHJlc3VtZU5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgc3RhdHVzOiAnQXBwbGllZCcsXG4gICAgICAgIG5vdGVzOiAnJyxcbiAgICAgICAgYXBwbGllZERhdGUsXG4gICAgICAgIGFwcGxpZWRUaW1lLFxuICAgICAgICByZW1pbmRlclNlbnQ6IGZhbHNlXG4gICAgICB9O1xuXG4gICAgICBjYXJkLmlubmVySFRNTCA9IGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImpvYmZsb3ctaGVhZGVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImpvYmZsb3ctdGl0bGVcIj5cbiAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtsb2dvVXJsfVwiIHN0eWxlPVwid2lkdGg6IDE0cHg7IGhlaWdodDogMTRweDsgb2JqZWN0LWZpdDogY29udGFpbjsgbWFyZ2luLXJpZ2h0OiA0cHg7XCIgYWx0PVwiTG9nb1wiIC8+XG4gICAgICAgICAgICBKb2JGbG93IFRyYWNrZXJcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiam9iZmxvdy1jbG9zZVwiPiZ0aW1lczs8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb2ItaW5mb1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2Itcm9sZVwiPiR7ZGV0YWlscy50aXRsZX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iLWNvbXBhbnlcIj4ke2RldGFpbHMuY29tcGFueX0g4oCUIDxzcGFuIHN0eWxlPVwiZm9udC1zdHlsZTogaXRhbGljO1wiPiR7ZGV0YWlscy53b3JrTW9kZX08L3NwYW4+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwYWRkaW5nOiAxMnB4IDA7XCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cImNvbG9yOiAjODE4Y2Y4OyBmb250LXNpemU6IDEycHg7IGZvbnQtd2VpZ2h0OiA1MDA7IG1hcmdpbi1ib3R0b206IDhweDtcIj5TYXZpbmcgYXBwbGljYXRpb24gYXV0b21hdGljYWxseS4uLjwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3LTYgaC02IGJvcmRlci0yIGJvcmRlci1wcmltYXJ5IGJvcmRlci10LXRyYW5zcGFyZW50IHJvdW5kZWQtZnVsbCBhbmltYXRlLXNwaW5cIiBzdHlsZT1cIm1hcmdpbjogMCBhdXRvOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYDtcblxuICAgICAgY2FyZC5xdWVyeVNlbGVjdG9yKCcuam9iZmxvdy1jbG9zZScpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHJlbW92ZU92ZXJsYXkpO1xuXG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgeyBhY3Rpb246ICdTQVZFX0FQUExJQ0FUSU9OJywgcGF5bG9hZDogeyBhcHBsaWNhdGlvbjogYXBwRGF0YSB9IH0sXG4gICAgICAgIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0pvYkZsb3cgc2F2ZSBlcnJvcjonLCBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgY2FyZC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7bG9nb1VybH1cIiBzdHlsZT1cIndpZHRoOiAxNHB4OyBoZWlnaHQ6IDE0cHg7IG9iamVjdC1maXQ6IGNvbnRhaW47IG1hcmdpbi1yaWdodDogNHB4O1wiIGFsdD1cIkxvZ29cIiAvPlxuICAgICAgICAgICAgICAgICAgSm9iRmxvdyBUcmFja2VyXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImpvYmZsb3ctY2xvc2VcIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwYWRkaW5nOiAxMnB4IDA7IGNvbG9yOiAjZWY0NDQ0OyBmb250LXNpemU6IDExcHg7XCI+XG4gICAgICAgICAgICAgICAgRXJyb3I6ICR7Y2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2V9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYDtcbiAgICAgICAgICAgIGNhcmQucXVlcnlTZWxlY3RvcignLmpvYmZsb3ctY2xvc2UnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCByZW1vdmVPdmVybGF5KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgICAgY2FyZC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7bG9nb1VybH1cIiBzdHlsZT1cIndpZHRoOiAxNHB4OyBoZWlnaHQ6IDE0cHg7IG9iamVjdC1maXQ6IGNvbnRhaW47IG1hcmdpbi1yaWdodDogNHB4O1wiIGFsdD1cIkxvZ29cIiAvPlxuICAgICAgICAgICAgICAgICAgSm9iRmxvdyBUcmFja2VyXG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImpvYmZsb3ctY2xvc2VcIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwYWRkaW5nOiAxMnB4IDA7XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvYi1yb2xlXCI+JHtkZXRhaWxzLnRpdGxlfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2ItY29tcGFueVwiPiR7ZGV0YWlscy5jb21wYW55fTwvZGl2PlxuICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIzMlwiIGhlaWdodD1cIjMyXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiIzIyYzU1ZVwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHlsZT1cIm1hcmdpbjogMTBweCBhdXRvO1wiPjxwYXRoIGQ9XCJNMjIgMTEuMDhWMTJhMTAgMTAgMCAxIDEtNS45My05LjE0XCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9XCIyMiA0IDEyIDE0LjAxIDkgMTEuMDFcIj48L3BvbHlsaW5lPjwvc3ZnPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdWNjZXNzLW1zZ1wiPkFwcGxpY2F0aW9uIFRyYWNrZWQgQXV0b21hdGljYWxseSE8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMXB4OyBjb2xvcjogIzk0YTNiODsgbWFyZ2luLXRvcDogNnB4O1wiPkZvbGxvdy11cCBhbGFybSBzZXQgZm9yIDYgZGF5cy48L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMHB4OyBjb2xvcjogIzgxOGNmODsgbWFyZ2luLXRvcDogNnB4O1wiPkVkaXQgbm90ZXMgb3IgcmVzdW1lIGluIHRoZSBkYXNoYm9hcmQuPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYDtcbiAgICAgICAgICAgIGNhcmQucXVlcnlTZWxlY3RvcignLmpvYmZsb3ctY2xvc2UnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCByZW1vdmVPdmVybGF5KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQocmVtb3ZlT3ZlcmxheSwgMzUwMCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhcmQuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCIke2xvZ29Vcmx9XCIgc3R5bGU9XCJ3aWR0aDogMTRweDsgaGVpZ2h0OiAxNHB4OyBvYmplY3QtZml0OiBjb250YWluOyBtYXJnaW4tcmlnaHQ6IDRweDtcIiBhbHQ9XCJMb2dvXCIgLz5cbiAgICAgICAgICAgICAgICAgIEpvYkZsb3cgVHJhY2tlclxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJqb2JmbG93LWNsb3NlXCI+JnRpbWVzOzwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcGFkZGluZzogMTJweCAwOyBjb2xvcjogI2VmNDQ0NDsgZm9udC1zaXplOiAxMXB4O1wiPlxuICAgICAgICAgICAgICAgIEVycm9yOiAke3Jlc3BvbnNlLmVycm9yIHx8ICdGYWlsZWQgdG8gc2F2ZSd9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYDtcbiAgICAgICAgICAgIGNhcmQucXVlcnlTZWxlY3RvcignLmpvYmZsb3ctY2xvc2UnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCByZW1vdmVPdmVybGF5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gU3RhcnR1cFxuICAgIGluaXRVcmxPYnNlcnZlcigpO1xuICB9XG59KTtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShcIndlYmV4dGVuc2lvbi1wb2x5ZmlsbFwiLCBbXCJtb2R1bGVcIl0sIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZmFjdG9yeShtb2R1bGUpO1xuICB9IGVsc2Uge1xuICAgIHZhciBtb2QgPSB7XG4gICAgICBleHBvcnRzOiB7fVxuICAgIH07XG4gICAgZmFjdG9yeShtb2QpO1xuICAgIGdsb2JhbC5icm93c2VyID0gbW9kLmV4cG9ydHM7XG4gIH1cbn0pKHR5cGVvZiBnbG9iYWxUaGlzICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsVGhpcyA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHRoaXMsIGZ1bmN0aW9uIChtb2R1bGUpIHtcbiAgLyogd2ViZXh0ZW5zaW9uLXBvbHlmaWxsIC0gdjAuMTIuMCAtIFR1ZSBNYXkgMTQgMjAyNCAxODowMToyOSAqL1xuICAvKiAtKi0gTW9kZTogaW5kZW50LXRhYnMtbW9kZTogbmlsOyBqcy1pbmRlbnQtbGV2ZWw6IDIgLSotICovXG4gIC8qIHZpbTogc2V0IHN0cz0yIHN3PTIgZXQgdHc9ODA6ICovXG4gIC8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAgICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICAgKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLiAqL1xuICBcInVzZSBzdHJpY3RcIjtcblxuICBpZiAoIShnbG9iYWxUaGlzLmNocm9tZSAmJiBnbG9iYWxUaGlzLmNocm9tZS5ydW50aW1lICYmIGdsb2JhbFRoaXMuY2hyb21lLnJ1bnRpbWUuaWQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBzY3JpcHQgc2hvdWxkIG9ubHkgYmUgbG9hZGVkIGluIGEgYnJvd3NlciBleHRlbnNpb24uXCIpO1xuICB9XG4gIGlmICghKGdsb2JhbFRoaXMuYnJvd3NlciAmJiBnbG9iYWxUaGlzLmJyb3dzZXIucnVudGltZSAmJiBnbG9iYWxUaGlzLmJyb3dzZXIucnVudGltZS5pZCkpIHtcbiAgICBjb25zdCBDSFJPTUVfU0VORF9NRVNTQUdFX0NBTExCQUNLX05PX1JFU1BPTlNFX01FU1NBR0UgPSBcIlRoZSBtZXNzYWdlIHBvcnQgY2xvc2VkIGJlZm9yZSBhIHJlc3BvbnNlIHdhcyByZWNlaXZlZC5cIjtcblxuICAgIC8vIFdyYXBwaW5nIHRoZSBidWxrIG9mIHRoaXMgcG9seWZpbGwgaW4gYSBvbmUtdGltZS11c2UgZnVuY3Rpb24gaXMgYSBtaW5vclxuICAgIC8vIG9wdGltaXphdGlvbiBmb3IgRmlyZWZveC4gU2luY2UgU3BpZGVybW9ua2V5IGRvZXMgbm90IGZ1bGx5IHBhcnNlIHRoZVxuICAgIC8vIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24gdW50aWwgdGhlIGZpcnN0IHRpbWUgaXQncyBjYWxsZWQsIGFuZCBzaW5jZSBpdCB3aWxsXG4gICAgLy8gbmV2ZXIgYWN0dWFsbHkgbmVlZCB0byBiZSBjYWxsZWQsIHRoaXMgYWxsb3dzIHRoZSBwb2x5ZmlsbCB0byBiZSBpbmNsdWRlZFxuICAgIC8vIGluIEZpcmVmb3ggbmVhcmx5IGZvciBmcmVlLlxuICAgIGNvbnN0IHdyYXBBUElzID0gZXh0ZW5zaW9uQVBJcyA9PiB7XG4gICAgICAvLyBOT1RFOiBhcGlNZXRhZGF0YSBpcyBhc3NvY2lhdGVkIHRvIHRoZSBjb250ZW50IG9mIHRoZSBhcGktbWV0YWRhdGEuanNvbiBmaWxlXG4gICAgICAvLyBhdCBidWlsZCB0aW1lIGJ5IHJlcGxhY2luZyB0aGUgZm9sbG93aW5nIFwiaW5jbHVkZVwiIHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlXG4gICAgICAvLyBKU09OIGZpbGUuXG4gICAgICBjb25zdCBhcGlNZXRhZGF0YSA9IHtcbiAgICAgICAgXCJhbGFybXNcIjoge1xuICAgICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJjbGVhckFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImJvb2ttYXJrc1wiOiB7XG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRDaGlsZHJlblwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFJlY2VudFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFN1YlRyZWVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRUcmVlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVRyZWVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJicm93c2VyQWN0aW9uXCI6IHtcbiAgICAgICAgICBcImRpc2FibGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlbmFibGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRCYWRnZUJhY2tncm91bmRDb2xvclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFBvcHVwXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0VGl0bGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJvcGVuUG9wdXBcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRCYWRnZUJhY2tncm91bmRDb2xvclwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldEJhZGdlVGV4dFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldEljb25cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRQb3B1cFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFRpdGxlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYnJvd3NpbmdEYXRhXCI6IHtcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUNhY2hlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlQ29va2llc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZURvd25sb2Fkc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUZvcm1EYXRhXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlSGlzdG9yeVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUxvY2FsU3RvcmFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVBhc3N3b3Jkc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVBsdWdpbkRhdGFcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXR0aW5nc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImNvbW1hbmRzXCI6IHtcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImNvbnRleHRNZW51c1wiOiB7XG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJjb29raWVzXCI6IHtcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbENvb2tpZVN0b3Jlc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImRldnRvb2xzXCI6IHtcbiAgICAgICAgICBcImluc3BlY3RlZFdpbmRvd1wiOiB7XG4gICAgICAgICAgICBcImV2YWxcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDIsXG4gICAgICAgICAgICAgIFwic2luZ2xlQ2FsbGJhY2tBcmdcIjogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicGFuZWxzXCI6IHtcbiAgICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDMsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAzLFxuICAgICAgICAgICAgICBcInNpbmdsZUNhbGxiYWNrQXJnXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImVsZW1lbnRzXCI6IHtcbiAgICAgICAgICAgICAgXCJjcmVhdGVTaWRlYmFyUGFuZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJkb3dubG9hZHNcIjoge1xuICAgICAgICAgIFwiY2FuY2VsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZG93bmxvYWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlcmFzZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEZpbGVJY29uXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwib3BlblwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInBhdXNlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlRmlsZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlc3VtZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNob3dcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJleHRlbnNpb25cIjoge1xuICAgICAgICAgIFwiaXNBbGxvd2VkRmlsZVNjaGVtZUFjY2Vzc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImlzQWxsb3dlZEluY29nbml0b0FjY2Vzc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImhpc3RvcnlcIjoge1xuICAgICAgICAgIFwiYWRkVXJsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZGVsZXRlQWxsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZGVsZXRlUmFuZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJkZWxldGVVcmxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRWaXNpdHNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJpMThuXCI6IHtcbiAgICAgICAgICBcImRldGVjdExhbmd1YWdlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0QWNjZXB0TGFuZ3VhZ2VzXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaWRlbnRpdHlcIjoge1xuICAgICAgICAgIFwibGF1bmNoV2ViQXV0aEZsb3dcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJpZGxlXCI6IHtcbiAgICAgICAgICBcInF1ZXJ5U3RhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYW5hZ2VtZW50XCI6IHtcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFNlbGZcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRFbmFibGVkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidW5pbnN0YWxsU2VsZlwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIm5vdGlmaWNhdGlvbnNcIjoge1xuICAgICAgICAgIFwiY2xlYXJcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRQZXJtaXNzaW9uTGV2ZWxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwYWdlQWN0aW9uXCI6IHtcbiAgICAgICAgICBcImdldFBvcHVwXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0VGl0bGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJoaWRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0SWNvblwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFBvcHVwXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0VGl0bGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzaG93XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicGVybWlzc2lvbnNcIjoge1xuICAgICAgICAgIFwiY29udGFpbnNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZXF1ZXN0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicnVudGltZVwiOiB7XG4gICAgICAgICAgXCJnZXRCYWNrZ3JvdW5kUGFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFBsYXRmb3JtSW5mb1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIm9wZW5PcHRpb25zUGFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlcXVlc3RVcGRhdGVDaGVja1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNlbmRNZXNzYWdlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDNcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2VuZE5hdGl2ZU1lc3NhZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRVbmluc3RhbGxVUkxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXNzaW9uc1wiOiB7XG4gICAgICAgICAgXCJnZXREZXZpY2VzXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0UmVjZW50bHlDbG9zZWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZXN0b3JlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwic3RvcmFnZVwiOiB7XG4gICAgICAgICAgXCJsb2NhbFwiOiB7XG4gICAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2V0XCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIm1hbmFnZWRcIjoge1xuICAgICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic3luY1wiOiB7XG4gICAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdldEJ5dGVzSW5Vc2VcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInJlbW92ZVwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2V0XCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInRhYnNcIjoge1xuICAgICAgICAgIFwiY2FwdHVyZVZpc2libGVUYWJcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJkZXRlY3RMYW5ndWFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImRpc2NhcmRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJkdXBsaWNhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJleGVjdXRlU2NyaXB0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFpvb21cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRab29tU2V0dGluZ3NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnb0JhY2tcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnb0ZvcndhcmRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJoaWdobGlnaHRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJpbnNlcnRDU1NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJtb3ZlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicXVlcnlcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZWxvYWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVDU1NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZW5kTWVzc2FnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAzXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFpvb21cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRab29tU2V0dGluZ3NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ0b3BTaXRlc1wiOiB7XG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ3ZWJOYXZpZ2F0aW9uXCI6IHtcbiAgICAgICAgICBcImdldEFsbEZyYW1lc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEZyYW1lXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwid2ViUmVxdWVzdFwiOiB7XG4gICAgICAgICAgXCJoYW5kbGVyQmVoYXZpb3JDaGFuZ2VkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwid2luZG93c1wiOiB7XG4gICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRDdXJyZW50XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0TGFzdEZvY3VzZWRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhhcGlNZXRhZGF0YSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImFwaS1tZXRhZGF0YS5qc29uIGhhcyBub3QgYmVlbiBpbmNsdWRlZCBpbiBicm93c2VyLXBvbHlmaWxsXCIpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIEEgV2Vha01hcCBzdWJjbGFzcyB3aGljaCBjcmVhdGVzIGFuZCBzdG9yZXMgYSB2YWx1ZSBmb3IgYW55IGtleSB3aGljaCBkb2VzXG4gICAgICAgKiBub3QgZXhpc3Qgd2hlbiBhY2Nlc3NlZCwgYnV0IGJlaGF2ZXMgZXhhY3RseSBhcyBhbiBvcmRpbmFyeSBXZWFrTWFwXG4gICAgICAgKiBvdGhlcndpc2UuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY3JlYXRlSXRlbVxuICAgICAgICogICAgICAgIEEgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gY3JlYXRlIHRoZSB2YWx1ZSBmb3IgYW55XG4gICAgICAgKiAgICAgICAga2V5IHdoaWNoIGRvZXMgbm90IGV4aXN0LCB0aGUgZmlyc3QgdGltZSBpdCBpcyBhY2Nlc3NlZC4gVGhlXG4gICAgICAgKiAgICAgICAgZnVuY3Rpb24gcmVjZWl2ZXMsIGFzIGl0cyBvbmx5IGFyZ3VtZW50LCB0aGUga2V5IGJlaW5nIGNyZWF0ZWQuXG4gICAgICAgKi9cbiAgICAgIGNsYXNzIERlZmF1bHRXZWFrTWFwIGV4dGVuZHMgV2Vha01hcCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKGNyZWF0ZUl0ZW0sIGl0ZW1zID0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgc3VwZXIoaXRlbXMpO1xuICAgICAgICAgIHRoaXMuY3JlYXRlSXRlbSA9IGNyZWF0ZUl0ZW07XG4gICAgICAgIH1cbiAgICAgICAgZ2V0KGtleSkge1xuICAgICAgICAgIGlmICghdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhpcy5zZXQoa2V5LCB0aGlzLmNyZWF0ZUl0ZW0oa2V5KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzdXBlci5nZXQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGFuIG9iamVjdCB3aXRoIGEgYHRoZW5gIG1ldGhvZCwgYW5kIGNhblxuICAgICAgICogdGhlcmVmb3JlIGJlIGFzc3VtZWQgdG8gYmVoYXZlIGFzIGEgUHJvbWlzZS5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byB0ZXN0LlxuICAgICAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHZhbHVlIGlzIHRoZW5hYmxlLlxuICAgICAgICovXG4gICAgICBjb25zdCBpc1RoZW5hYmxlID0gdmFsdWUgPT4ge1xuICAgICAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICB9O1xuXG4gICAgICAvKipcbiAgICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBmdW5jdGlvbiB3aGljaCwgd2hlbiBjYWxsZWQsIHdpbGwgcmVzb2x2ZSBvciByZWplY3RcbiAgICAgICAqIHRoZSBnaXZlbiBwcm9taXNlIGJhc2VkIG9uIGhvdyBpdCBpcyBjYWxsZWQ6XG4gICAgICAgKlxuICAgICAgICogLSBJZiwgd2hlbiBjYWxsZWQsIGBjaHJvbWUucnVudGltZS5sYXN0RXJyb3JgIGNvbnRhaW5zIGEgbm9uLW51bGwgb2JqZWN0LFxuICAgICAgICogICB0aGUgcHJvbWlzZSBpcyByZWplY3RlZCB3aXRoIHRoYXQgdmFsdWUuXG4gICAgICAgKiAtIElmIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBleGFjdGx5IG9uZSBhcmd1bWVudCwgdGhlIHByb21pc2UgaXNcbiAgICAgICAqICAgcmVzb2x2ZWQgdG8gdGhhdCB2YWx1ZS5cbiAgICAgICAqIC0gT3RoZXJ3aXNlLCB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZCB0byBhbiBhcnJheSBjb250YWluaW5nIGFsbCBvZiB0aGVcbiAgICAgICAqICAgZnVuY3Rpb24ncyBhcmd1bWVudHMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHByb21pc2VcbiAgICAgICAqICAgICAgICBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgcmVzb2x1dGlvbiBhbmQgcmVqZWN0aW9uIGZ1bmN0aW9ucyBvZiBhXG4gICAgICAgKiAgICAgICAgcHJvbWlzZS5cbiAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb21pc2UucmVzb2x2ZVxuICAgICAgICogICAgICAgIFRoZSBwcm9taXNlJ3MgcmVzb2x1dGlvbiBmdW5jdGlvbi5cbiAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb21pc2UucmVqZWN0XG4gICAgICAgKiAgICAgICAgVGhlIHByb21pc2UncyByZWplY3Rpb24gZnVuY3Rpb24uXG4gICAgICAgKiBAcGFyYW0ge29iamVjdH0gbWV0YWRhdGFcbiAgICAgICAqICAgICAgICBNZXRhZGF0YSBhYm91dCB0aGUgd3JhcHBlZCBtZXRob2Qgd2hpY2ggaGFzIGNyZWF0ZWQgdGhlIGNhbGxiYWNrLlxuICAgICAgICogQHBhcmFtIHtib29sZWFufSBtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZ1xuICAgICAgICogICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggb25seSB0aGUgZmlyc3RcbiAgICAgICAqICAgICAgICBhcmd1bWVudCBvZiB0aGUgY2FsbGJhY2ssIGFsdGVybmF0aXZlbHkgYW4gYXJyYXkgb2YgYWxsIHRoZVxuICAgICAgICogICAgICAgIGNhbGxiYWNrIGFyZ3VtZW50cyBpcyByZXNvbHZlZC4gQnkgZGVmYXVsdCwgaWYgdGhlIGNhbGxiYWNrXG4gICAgICAgKiAgICAgICAgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIG9ubHkgYSBzaW5nbGUgYXJndW1lbnQsIHRoYXQgd2lsbCBiZVxuICAgICAgICogICAgICAgIHJlc29sdmVkIHRvIHRoZSBwcm9taXNlLCB3aGlsZSBhbGwgYXJndW1lbnRzIHdpbGwgYmUgcmVzb2x2ZWQgYXNcbiAgICAgICAqICAgICAgICBhbiBhcnJheSBpZiBtdWx0aXBsZSBhcmUgZ2l2ZW4uXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge2Z1bmN0aW9ufVxuICAgICAgICogICAgICAgIFRoZSBnZW5lcmF0ZWQgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICAgKi9cbiAgICAgIGNvbnN0IG1ha2VDYWxsYmFjayA9IChwcm9taXNlLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gKC4uLmNhbGxiYWNrQXJncykgPT4ge1xuICAgICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICBwcm9taXNlLnJlamVjdChuZXcgRXJyb3IoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtZXRhZGF0YS5zaW5nbGVDYWxsYmFja0FyZyB8fCBjYWxsYmFja0FyZ3MubGVuZ3RoIDw9IDEgJiYgbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmcgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBwcm9taXNlLnJlc29sdmUoY2FsbGJhY2tBcmdzWzBdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJncyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHBsdXJhbGl6ZUFyZ3VtZW50cyA9IG51bUFyZ3MgPT4gbnVtQXJncyA9PSAxID8gXCJhcmd1bWVudFwiIDogXCJhcmd1bWVudHNcIjtcblxuICAgICAgLyoqXG4gICAgICAgKiBDcmVhdGVzIGEgd3JhcHBlciBmdW5jdGlvbiBmb3IgYSBtZXRob2Qgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgbWV0YWRhdGEuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgICAqICAgICAgICBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHdoaWNoIGlzIGJlaW5nIHdyYXBwZWQuXG4gICAgICAgKiBAcGFyYW0ge29iamVjdH0gbWV0YWRhdGFcbiAgICAgICAqICAgICAgICBNZXRhZGF0YSBhYm91dCB0aGUgbWV0aG9kIGJlaW5nIHdyYXBwZWQuXG4gICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IG1ldGFkYXRhLm1pbkFyZ3NcbiAgICAgICAqICAgICAgICBUaGUgbWluaW11bSBudW1iZXIgb2YgYXJndW1lbnRzIHdoaWNoIG11c3QgYmUgcGFzc2VkIHRvIHRoZVxuICAgICAgICogICAgICAgIGZ1bmN0aW9uLiBJZiBjYWxsZWQgd2l0aCBmZXdlciB0aGFuIHRoaXMgbnVtYmVyIG9mIGFyZ3VtZW50cywgdGhlXG4gICAgICAgKiAgICAgICAgd3JhcHBlciB3aWxsIHJhaXNlIGFuIGV4Y2VwdGlvbi5cbiAgICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gbWV0YWRhdGEubWF4QXJnc1xuICAgICAgICogICAgICAgIFRoZSBtYXhpbXVtIG51bWJlciBvZiBhcmd1bWVudHMgd2hpY2ggbWF5IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgICAqICAgICAgICBmdW5jdGlvbi4gSWYgY2FsbGVkIHdpdGggbW9yZSB0aGFuIHRoaXMgbnVtYmVyIG9mIGFyZ3VtZW50cywgdGhlXG4gICAgICAgKiAgICAgICAgd3JhcHBlciB3aWxsIHJhaXNlIGFuIGV4Y2VwdGlvbi5cbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmdcbiAgICAgICAqICAgICAgICBXaGV0aGVyIG9yIG5vdCB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIG9ubHkgdGhlIGZpcnN0XG4gICAgICAgKiAgICAgICAgYXJndW1lbnQgb2YgdGhlIGNhbGxiYWNrLCBhbHRlcm5hdGl2ZWx5IGFuIGFycmF5IG9mIGFsbCB0aGVcbiAgICAgICAqICAgICAgICBjYWxsYmFjayBhcmd1bWVudHMgaXMgcmVzb2x2ZWQuIEJ5IGRlZmF1bHQsIGlmIHRoZSBjYWxsYmFja1xuICAgICAgICogICAgICAgIGZ1bmN0aW9uIGlzIGludm9rZWQgd2l0aCBvbmx5IGEgc2luZ2xlIGFyZ3VtZW50LCB0aGF0IHdpbGwgYmVcbiAgICAgICAqICAgICAgICByZXNvbHZlZCB0byB0aGUgcHJvbWlzZSwgd2hpbGUgYWxsIGFyZ3VtZW50cyB3aWxsIGJlIHJlc29sdmVkIGFzXG4gICAgICAgKiAgICAgICAgYW4gYXJyYXkgaWYgbXVsdGlwbGUgYXJlIGdpdmVuLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbihvYmplY3QsIC4uLiopfVxuICAgICAgICogICAgICAgVGhlIGdlbmVyYXRlZCB3cmFwcGVyIGZ1bmN0aW9uLlxuICAgICAgICovXG4gICAgICBjb25zdCB3cmFwQXN5bmNGdW5jdGlvbiA9IChuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gYXN5bmNGdW5jdGlvbldyYXBwZXIodGFyZ2V0LCAuLi5hcmdzKSB7XG4gICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDwgbWV0YWRhdGEubWluQXJncykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBsZWFzdCAke21ldGFkYXRhLm1pbkFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1pbkFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gbWV0YWRhdGEubWF4QXJncykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBtb3N0ICR7bWV0YWRhdGEubWF4QXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWF4QXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKG1ldGFkYXRhLmZhbGxiYWNrVG9Ob0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgQVBJIG1ldGhvZCBoYXMgY3VycmVudGx5IG5vIGNhbGxiYWNrIG9uIENocm9tZSwgYnV0IGl0IHJldHVybiBhIHByb21pc2Ugb24gRmlyZWZveCxcbiAgICAgICAgICAgICAgLy8gYW5kIHNvIHRoZSBwb2x5ZmlsbCB3aWxsIHRyeSB0byBjYWxsIGl0IHdpdGggYSBjYWxsYmFjayBmaXJzdCwgYW5kIGl0IHdpbGwgZmFsbGJhY2tcbiAgICAgICAgICAgICAgLy8gdG8gbm90IHBhc3NpbmcgdGhlIGNhbGxiYWNrIGlmIHRoZSBmaXJzdCBjYWxsIGZhaWxzLlxuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzLCBtYWtlQ2FsbGJhY2soe1xuICAgICAgICAgICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICAgICAgICAgIHJlamVjdFxuICAgICAgICAgICAgICAgIH0sIG1ldGFkYXRhKSk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGNiRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYCR7bmFtZX0gQVBJIG1ldGhvZCBkb2Vzbid0IHNlZW0gdG8gc3VwcG9ydCB0aGUgY2FsbGJhY2sgcGFyYW1ldGVyLCBgICsgXCJmYWxsaW5nIGJhY2sgdG8gY2FsbCBpdCB3aXRob3V0IGEgY2FsbGJhY2s6IFwiLCBjYkVycm9yKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0oLi4uYXJncyk7XG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIEFQSSBtZXRob2QgbWV0YWRhdGEsIHNvIHRoYXQgdGhlIG5leHQgQVBJIGNhbGxzIHdpbGwgbm90IHRyeSB0b1xuICAgICAgICAgICAgICAgIC8vIHVzZSB0aGUgdW5zdXBwb3J0ZWQgY2FsbGJhY2sgYW55bW9yZS5cbiAgICAgICAgICAgICAgICBtZXRhZGF0YS5mYWxsYmFja1RvTm9DYWxsYmFjayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIG1ldGFkYXRhLm5vQ2FsbGJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXRhZGF0YS5ub0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MsIG1ha2VDYWxsYmFjayh7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICAgICAgICByZWplY3RcbiAgICAgICAgICAgICAgfSwgbWV0YWRhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgICAgIC8qKlxuICAgICAgICogV3JhcHMgYW4gZXhpc3RpbmcgbWV0aG9kIG9mIHRoZSB0YXJnZXQgb2JqZWN0LCBzbyB0aGF0IGNhbGxzIHRvIGl0IGFyZVxuICAgICAgICogaW50ZXJjZXB0ZWQgYnkgdGhlIGdpdmVuIHdyYXBwZXIgZnVuY3Rpb24uIFRoZSB3cmFwcGVyIGZ1bmN0aW9uIHJlY2VpdmVzLFxuICAgICAgICogYXMgaXRzIGZpcnN0IGFyZ3VtZW50LCB0aGUgb3JpZ2luYWwgYHRhcmdldGAgb2JqZWN0LCBmb2xsb3dlZCBieSBlYWNoIG9mXG4gICAgICAgKiB0aGUgYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgb3JpZ2luYWwgbWV0aG9kLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAgICAgICAqICAgICAgICBUaGUgb3JpZ2luYWwgdGFyZ2V0IG9iamVjdCB0aGF0IHRoZSB3cmFwcGVkIG1ldGhvZCBiZWxvbmdzIHRvLlxuICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWV0aG9kXG4gICAgICAgKiAgICAgICAgVGhlIG1ldGhvZCBiZWluZyB3cmFwcGVkLiBUaGlzIGlzIHVzZWQgYXMgdGhlIHRhcmdldCBvZiB0aGUgUHJveHlcbiAgICAgICAqICAgICAgICBvYmplY3Qgd2hpY2ggaXMgY3JlYXRlZCB0byB3cmFwIHRoZSBtZXRob2QuXG4gICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB3cmFwcGVyXG4gICAgICAgKiAgICAgICAgVGhlIHdyYXBwZXIgZnVuY3Rpb24gd2hpY2ggaXMgY2FsbGVkIGluIHBsYWNlIG9mIGEgZGlyZWN0IGludm9jYXRpb25cbiAgICAgICAqICAgICAgICBvZiB0aGUgd3JhcHBlZCBtZXRob2QuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge1Byb3h5PGZ1bmN0aW9uPn1cbiAgICAgICAqICAgICAgICBBIFByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIG1ldGhvZCwgd2hpY2ggaW52b2tlcyB0aGUgZ2l2ZW4gd3JhcHBlclxuICAgICAgICogICAgICAgIG1ldGhvZCBpbiBpdHMgcGxhY2UuXG4gICAgICAgKi9cbiAgICAgIGNvbnN0IHdyYXBNZXRob2QgPSAodGFyZ2V0LCBtZXRob2QsIHdyYXBwZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShtZXRob2QsIHtcbiAgICAgICAgICBhcHBseSh0YXJnZXRNZXRob2QsIHRoaXNPYmosIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyLmNhbGwodGhpc09iaiwgdGFyZ2V0LCAuLi5hcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIGxldCBoYXNPd25Qcm9wZXJ0eSA9IEZ1bmN0aW9uLmNhbGwuYmluZChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcblxuICAgICAgLyoqXG4gICAgICAgKiBXcmFwcyBhbiBvYmplY3QgaW4gYSBQcm94eSB3aGljaCBpbnRlcmNlcHRzIGFuZCB3cmFwcyBjZXJ0YWluIG1ldGhvZHNcbiAgICAgICAqIGJhc2VkIG9uIHRoZSBnaXZlbiBgd3JhcHBlcnNgIGFuZCBgbWV0YWRhdGFgIG9iamVjdHMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICAgICAgICogICAgICAgIFRoZSB0YXJnZXQgb2JqZWN0IHRvIHdyYXAuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IFt3cmFwcGVycyA9IHt9XVxuICAgICAgICogICAgICAgIEFuIG9iamVjdCB0cmVlIGNvbnRhaW5pbmcgd3JhcHBlciBmdW5jdGlvbnMgZm9yIHNwZWNpYWwgY2FzZXMuIEFueVxuICAgICAgICogICAgICAgIGZ1bmN0aW9uIHByZXNlbnQgaW4gdGhpcyBvYmplY3QgdHJlZSBpcyBjYWxsZWQgaW4gcGxhY2Ugb2YgdGhlXG4gICAgICAgKiAgICAgICAgbWV0aG9kIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgdGFyZ2V0YCBvYmplY3QgdHJlZS4gVGhlc2VcbiAgICAgICAqICAgICAgICB3cmFwcGVyIG1ldGhvZHMgYXJlIGludm9rZWQgYXMgZGVzY3JpYmVkIGluIHtAc2VlIHdyYXBNZXRob2R9LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbbWV0YWRhdGEgPSB7fV1cbiAgICAgICAqICAgICAgICBBbiBvYmplY3QgdHJlZSBjb250YWluaW5nIG1ldGFkYXRhIHVzZWQgdG8gYXV0b21hdGljYWxseSBnZW5lcmF0ZVxuICAgICAgICogICAgICAgIFByb21pc2UtYmFzZWQgd3JhcHBlciBmdW5jdGlvbnMgZm9yIGFzeW5jaHJvbm91cy4gQW55IGZ1bmN0aW9uIGluXG4gICAgICAgKiAgICAgICAgdGhlIGB0YXJnZXRgIG9iamVjdCB0cmVlIHdoaWNoIGhhcyBhIGNvcnJlc3BvbmRpbmcgbWV0YWRhdGEgb2JqZWN0XG4gICAgICAgKiAgICAgICAgaW4gdGhlIHNhbWUgbG9jYXRpb24gaW4gdGhlIGBtZXRhZGF0YWAgdHJlZSBpcyByZXBsYWNlZCB3aXRoIGFuXG4gICAgICAgKiAgICAgICAgYXV0b21hdGljYWxseS1nZW5lcmF0ZWQgd3JhcHBlciBmdW5jdGlvbiwgYXMgZGVzY3JpYmVkIGluXG4gICAgICAgKiAgICAgICAge0BzZWUgd3JhcEFzeW5jRnVuY3Rpb259XG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge1Byb3h5PG9iamVjdD59XG4gICAgICAgKi9cbiAgICAgIGNvbnN0IHdyYXBPYmplY3QgPSAodGFyZ2V0LCB3cmFwcGVycyA9IHt9LCBtZXRhZGF0YSA9IHt9KSA9PiB7XG4gICAgICAgIGxldCBjYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIGxldCBoYW5kbGVycyA9IHtcbiAgICAgICAgICBoYXMocHJveHlUYXJnZXQsIHByb3ApIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9wIGluIHRhcmdldCB8fCBwcm9wIGluIGNhY2hlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZ2V0KHByb3h5VGFyZ2V0LCBwcm9wLCByZWNlaXZlcikge1xuICAgICAgICAgICAgaWYgKHByb3AgaW4gY2FjaGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEocHJvcCBpbiB0YXJnZXQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0YXJnZXRbcHJvcF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG1ldGhvZCBvbiB0aGUgdW5kZXJseWluZyBvYmplY3QuIENoZWNrIGlmIHdlIG5lZWQgdG8gZG9cbiAgICAgICAgICAgICAgLy8gYW55IHdyYXBwaW5nLlxuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2Ygd3JhcHBlcnNbcHJvcF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgYSBzcGVjaWFsLWNhc2Ugd3JhcHBlciBmb3IgdGhpcyBtZXRob2QuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3cmFwTWV0aG9kKHRhcmdldCwgdGFyZ2V0W3Byb3BdLCB3cmFwcGVyc1twcm9wXSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzT3duUHJvcGVydHkobWV0YWRhdGEsIHByb3ApKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBhc3luYyBtZXRob2QgdGhhdCB3ZSBoYXZlIG1ldGFkYXRhIGZvci4gQ3JlYXRlIGFcbiAgICAgICAgICAgICAgICAvLyBQcm9taXNlIHdyYXBwZXIgZm9yIGl0LlxuICAgICAgICAgICAgICAgIGxldCB3cmFwcGVyID0gd3JhcEFzeW5jRnVuY3Rpb24ocHJvcCwgbWV0YWRhdGFbcHJvcF0pO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG1ldGhvZCB0aGF0IHdlIGRvbid0IGtub3cgb3IgY2FyZSBhYm91dC4gUmV0dXJuIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIG1ldGhvZCwgYm91bmQgdG8gdGhlIHVuZGVybHlpbmcgb2JqZWN0LlxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuYmluZCh0YXJnZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAoaGFzT3duUHJvcGVydHkod3JhcHBlcnMsIHByb3ApIHx8IGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBwcm9wKSkpIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBvYmplY3QgdGhhdCB3ZSBuZWVkIHRvIGRvIHNvbWUgd3JhcHBpbmcgZm9yIHRoZSBjaGlsZHJlblxuICAgICAgICAgICAgICAvLyBvZi4gQ3JlYXRlIGEgc3ViLW9iamVjdCB3cmFwcGVyIGZvciBpdCB3aXRoIHRoZSBhcHByb3ByaWF0ZSBjaGlsZFxuICAgICAgICAgICAgICAvLyBtZXRhZGF0YS5cbiAgICAgICAgICAgICAgdmFsdWUgPSB3cmFwT2JqZWN0KHZhbHVlLCB3cmFwcGVyc1twcm9wXSwgbWV0YWRhdGFbcHJvcF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgXCIqXCIpKSB7XG4gICAgICAgICAgICAgIC8vIFdyYXAgYWxsIHByb3BlcnRpZXMgaW4gKiBuYW1lc3BhY2UuXG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE9iamVjdCh2YWx1ZSwgd3JhcHBlcnNbcHJvcF0sIG1ldGFkYXRhW1wiKlwiXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGRvIGFueSB3cmFwcGluZyBmb3IgdGhpcyBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgLy8gc28ganVzdCBmb3J3YXJkIGFsbCBhY2Nlc3MgdG8gdGhlIHVuZGVybHlpbmcgb2JqZWN0LlxuICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FjaGUsIHByb3AsIHtcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BdO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWNoZVtwcm9wXSA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2V0KHByb3h5VGFyZ2V0LCBwcm9wLCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgIGNhY2hlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZGVmaW5lUHJvcGVydHkocHJveHlUYXJnZXQsIHByb3AsIGRlc2MpIHtcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmRlZmluZVByb3BlcnR5KGNhY2hlLCBwcm9wLCBkZXNjKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRlbGV0ZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5kZWxldGVQcm9wZXJ0eShjYWNoZSwgcHJvcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFBlciBjb250cmFjdCBvZiB0aGUgUHJveHkgQVBJLCB0aGUgXCJnZXRcIiBwcm94eSBoYW5kbGVyIG11c3QgcmV0dXJuIHRoZVxuICAgICAgICAvLyBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgdGFyZ2V0IGlmIHRoYXQgdmFsdWUgaXMgZGVjbGFyZWQgcmVhZC1vbmx5IGFuZFxuICAgICAgICAvLyBub24tY29uZmlndXJhYmxlLiBGb3IgdGhpcyByZWFzb24sIHdlIGNyZWF0ZSBhbiBvYmplY3Qgd2l0aCB0aGVcbiAgICAgICAgLy8gcHJvdG90eXBlIHNldCB0byBgdGFyZ2V0YCBpbnN0ZWFkIG9mIHVzaW5nIGB0YXJnZXRgIGRpcmVjdGx5LlxuICAgICAgICAvLyBPdGhlcndpc2Ugd2UgY2Fubm90IHJldHVybiBhIGN1c3RvbSBvYmplY3QgZm9yIEFQSXMgdGhhdFxuICAgICAgICAvLyBhcmUgZGVjbGFyZWQgcmVhZC1vbmx5IGFuZCBub24tY29uZmlndXJhYmxlLCBzdWNoIGFzIGBjaHJvbWUuZGV2dG9vbHNgLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgcHJveHkgaGFuZGxlcnMgdGhlbXNlbHZlcyB3aWxsIHN0aWxsIHVzZSB0aGUgb3JpZ2luYWwgYHRhcmdldGBcbiAgICAgICAgLy8gaW5zdGVhZCBvZiB0aGUgYHByb3h5VGFyZ2V0YCwgc28gdGhhdCB0aGUgbWV0aG9kcyBhbmQgcHJvcGVydGllcyBhcmVcbiAgICAgICAgLy8gZGVyZWZlcmVuY2VkIHZpYSB0aGUgb3JpZ2luYWwgdGFyZ2V0cy5cbiAgICAgICAgbGV0IHByb3h5VGFyZ2V0ID0gT2JqZWN0LmNyZWF0ZSh0YXJnZXQpO1xuICAgICAgICByZXR1cm4gbmV3IFByb3h5KHByb3h5VGFyZ2V0LCBoYW5kbGVycyk7XG4gICAgICB9O1xuXG4gICAgICAvKipcbiAgICAgICAqIENyZWF0ZXMgYSBzZXQgb2Ygd3JhcHBlciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IG9iamVjdCwgd2hpY2ggaGFuZGxlc1xuICAgICAgICogd3JhcHBpbmcgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRoYXQgdGhvc2UgbWVzc2FnZXMgYXJlIHBhc3NlZC5cbiAgICAgICAqXG4gICAgICAgKiBBIHNpbmdsZSB3cmFwcGVyIGlzIGNyZWF0ZWQgZm9yIGVhY2ggbGlzdGVuZXIgZnVuY3Rpb24sIGFuZCBzdG9yZWQgaW4gYVxuICAgICAgICogbWFwLiBTdWJzZXF1ZW50IGNhbGxzIHRvIGBhZGRMaXN0ZW5lcmAsIGBoYXNMaXN0ZW5lcmAsIG9yIGByZW1vdmVMaXN0ZW5lcmBcbiAgICAgICAqIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB3cmFwcGVyLCBzbyB0aGF0ICBhdHRlbXB0cyB0byByZW1vdmUgYVxuICAgICAgICogcHJldmlvdXNseS1hZGRlZCBsaXN0ZW5lciB3b3JrIGFzIGV4cGVjdGVkLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7RGVmYXVsdFdlYWtNYXA8ZnVuY3Rpb24sIGZ1bmN0aW9uPn0gd3JhcHBlck1hcFxuICAgICAgICogICAgICAgIEEgRGVmYXVsdFdlYWtNYXAgb2JqZWN0IHdoaWNoIHdpbGwgY3JlYXRlIHRoZSBhcHByb3ByaWF0ZSB3cmFwcGVyXG4gICAgICAgKiAgICAgICAgZm9yIGEgZ2l2ZW4gbGlzdGVuZXIgZnVuY3Rpb24gd2hlbiBvbmUgZG9lcyBub3QgZXhpc3QsIGFuZCByZXRyaWV2ZVxuICAgICAgICogICAgICAgIGFuIGV4aXN0aW5nIG9uZSB3aGVuIGl0IGRvZXMuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMge29iamVjdH1cbiAgICAgICAqL1xuICAgICAgY29uc3Qgd3JhcEV2ZW50ID0gd3JhcHBlck1hcCA9PiAoe1xuICAgICAgICBhZGRMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyLCAuLi5hcmdzKSB7XG4gICAgICAgICAgdGFyZ2V0LmFkZExpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSwgLi4uYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhc0xpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFyZ2V0Lmhhc0xpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUxpc3RlbmVyKHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlTGlzdGVuZXIod3JhcHBlck1hcC5nZXQobGlzdGVuZXIpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBjb25zdCBvblJlcXVlc3RGaW5pc2hlZFdyYXBwZXJzID0gbmV3IERlZmF1bHRXZWFrTWFwKGxpc3RlbmVyID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdyYXBzIGFuIG9uUmVxdWVzdEZpbmlzaGVkIGxpc3RlbmVyIGZ1bmN0aW9uIHNvIHRoYXQgaXQgd2lsbCByZXR1cm4gYVxuICAgICAgICAgKiBgZ2V0Q29udGVudCgpYCBwcm9wZXJ0eSB3aGljaCByZXR1cm5zIGEgYFByb21pc2VgIHJhdGhlciB0aGFuIHVzaW5nIGFcbiAgICAgICAgICogY2FsbGJhY2sgQVBJLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVxXG4gICAgICAgICAqICAgICAgICBUaGUgSEFSIGVudHJ5IG9iamVjdCByZXByZXNlbnRpbmcgdGhlIG5ldHdvcmsgcmVxdWVzdC5cbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBvblJlcXVlc3RGaW5pc2hlZChyZXEpIHtcbiAgICAgICAgICBjb25zdCB3cmFwcGVkUmVxID0gd3JhcE9iamVjdChyZXEsIHt9IC8qIHdyYXBwZXJzICovLCB7XG4gICAgICAgICAgICBnZXRDb250ZW50OiB7XG4gICAgICAgICAgICAgIG1pbkFyZ3M6IDAsXG4gICAgICAgICAgICAgIG1heEFyZ3M6IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBsaXN0ZW5lcih3cmFwcGVkUmVxKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgb25NZXNzYWdlV3JhcHBlcnMgPSBuZXcgRGVmYXVsdFdlYWtNYXAobGlzdGVuZXIgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogV3JhcHMgYSBtZXNzYWdlIGxpc3RlbmVyIGZ1bmN0aW9uIHNvIHRoYXQgaXQgbWF5IHNlbmQgcmVzcG9uc2VzIGJhc2VkIG9uXG4gICAgICAgICAqIGl0cyByZXR1cm4gdmFsdWUsIHJhdGhlciB0aGFuIGJ5IHJldHVybmluZyBhIHNlbnRpbmVsIHZhbHVlIGFuZCBjYWxsaW5nIGFcbiAgICAgICAgICogY2FsbGJhY2suIElmIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiByZXR1cm5zIGEgUHJvbWlzZSwgdGhlIHJlc3BvbnNlIGlzXG4gICAgICAgICAqIHNlbnQgd2hlbiB0aGUgcHJvbWlzZSBlaXRoZXIgcmVzb2x2ZXMgb3IgcmVqZWN0cy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHsqfSBtZXNzYWdlXG4gICAgICAgICAqICAgICAgICBUaGUgbWVzc2FnZSBzZW50IGJ5IHRoZSBvdGhlciBlbmQgb2YgdGhlIGNoYW5uZWwuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzZW5kZXJcbiAgICAgICAgICogICAgICAgIERldGFpbHMgYWJvdXQgdGhlIHNlbmRlciBvZiB0aGUgbWVzc2FnZS5cbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbigqKX0gc2VuZFJlc3BvbnNlXG4gICAgICAgICAqICAgICAgICBBIGNhbGxiYWNrIHdoaWNoLCB3aGVuIGNhbGxlZCB3aXRoIGFuIGFyYml0cmFyeSBhcmd1bWVudCwgc2VuZHNcbiAgICAgICAgICogICAgICAgIHRoYXQgdmFsdWUgYXMgYSByZXNwb25zZS5cbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgICAqICAgICAgICBUcnVlIGlmIHRoZSB3cmFwcGVkIGxpc3RlbmVyIHJldHVybmVkIGEgUHJvbWlzZSwgd2hpY2ggd2lsbCBsYXRlclxuICAgICAgICAgKiAgICAgICAgeWllbGQgYSByZXNwb25zZS4gRmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG9uTWVzc2FnZShtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICAgICAgICAgIGxldCBkaWRDYWxsU2VuZFJlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHdyYXBwZWRTZW5kUmVzcG9uc2U7XG4gICAgICAgICAgbGV0IHNlbmRSZXNwb25zZVByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHdyYXBwZWRTZW5kUmVzcG9uc2UgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgZGlkQ2FsbFNlbmRSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBsaXN0ZW5lcihtZXNzYWdlLCBzZW5kZXIsIHdyYXBwZWRTZW5kUmVzcG9uc2UpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVzdWx0ID0gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgaXNSZXN1bHRUaGVuYWJsZSA9IHJlc3VsdCAhPT0gdHJ1ZSAmJiBpc1RoZW5hYmxlKHJlc3VsdCk7XG5cbiAgICAgICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgZGlkbid0IHJldHVybmVkIHRydWUgb3IgYSBQcm9taXNlLCBvciBjYWxsZWRcbiAgICAgICAgICAvLyB3cmFwcGVkU2VuZFJlc3BvbnNlIHN5bmNocm9ub3VzbHksIHdlIGNhbiBleGl0IGVhcmxpZXJcbiAgICAgICAgICAvLyBiZWNhdXNlIHRoZXJlIHdpbGwgYmUgbm8gcmVzcG9uc2Ugc2VudCBmcm9tIHRoaXMgbGlzdGVuZXIuXG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSAmJiAhaXNSZXN1bHRUaGVuYWJsZSAmJiAhZGlkQ2FsbFNlbmRSZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEEgc21hbGwgaGVscGVyIHRvIHNlbmQgdGhlIG1lc3NhZ2UgaWYgdGhlIHByb21pc2UgcmVzb2x2ZXNcbiAgICAgICAgICAvLyBhbmQgYW4gZXJyb3IgaWYgdGhlIHByb21pc2UgcmVqZWN0cyAoYSB3cmFwcGVkIHNlbmRNZXNzYWdlIGhhc1xuICAgICAgICAgIC8vIHRvIHRyYW5zbGF0ZSB0aGUgbWVzc2FnZSBpbnRvIGEgcmVzb2x2ZWQgcHJvbWlzZSBvciBhIHJlamVjdGVkXG4gICAgICAgICAgLy8gcHJvbWlzZSkuXG4gICAgICAgICAgY29uc3Qgc2VuZFByb21pc2VkUmVzdWx0ID0gcHJvbWlzZSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4obXNnID0+IHtcbiAgICAgICAgICAgICAgLy8gc2VuZCB0aGUgbWVzc2FnZSB2YWx1ZS5cbiAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKG1zZyk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgIC8vIFNlbmQgYSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBlcnJvciBpZiB0aGUgcmVqZWN0ZWQgdmFsdWVcbiAgICAgICAgICAgICAgLy8gaXMgYW4gaW5zdGFuY2Ugb2YgZXJyb3IsIG9yIHRoZSBvYmplY3QgaXRzZWxmIG90aGVyd2lzZS5cbiAgICAgICAgICAgICAgbGV0IG1lc3NhZ2U7XG4gICAgICAgICAgICAgIGlmIChlcnJvciAmJiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciB8fCB0eXBlb2YgZXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gXCJBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICBfX21veldlYkV4dGVuc2lvblBvbHlmaWxsUmVqZWN0X186IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIC8vIFByaW50IGFuIGVycm9yIG9uIHRoZSBjb25zb2xlIGlmIHVuYWJsZSB0byBzZW5kIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBzZW5kIG9uTWVzc2FnZSByZWplY3RlZCByZXBseVwiLCBlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5lZCBhIFByb21pc2UsIHNlbmQgdGhlIHJlc29sdmVkIHZhbHVlIGFzIGFcbiAgICAgICAgICAvLyByZXN1bHQsIG90aGVyd2lzZSB3YWl0IHRoZSBwcm9taXNlIHJlbGF0ZWQgdG8gdGhlIHdyYXBwZWRTZW5kUmVzcG9uc2VcbiAgICAgICAgICAvLyBjYWxsYmFjayB0byByZXNvbHZlIGFuZCBzZW5kIGl0IGFzIGEgcmVzcG9uc2UuXG4gICAgICAgICAgaWYgKGlzUmVzdWx0VGhlbmFibGUpIHtcbiAgICAgICAgICAgIHNlbmRQcm9taXNlZFJlc3VsdChyZXN1bHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZW5kUHJvbWlzZWRSZXN1bHQoc2VuZFJlc3BvbnNlUHJvbWlzZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTGV0IENocm9tZSBrbm93IHRoYXQgdGhlIGxpc3RlbmVyIGlzIHJlcGx5aW5nLlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICBjb25zdCB3cmFwcGVkU2VuZE1lc3NhZ2VDYWxsYmFjayA9ICh7XG4gICAgICAgIHJlamVjdCxcbiAgICAgICAgcmVzb2x2ZVxuICAgICAgfSwgcmVwbHkpID0+IHtcbiAgICAgICAgaWYgKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAvLyBEZXRlY3Qgd2hlbiBub25lIG9mIHRoZSBsaXN0ZW5lcnMgcmVwbGllZCB0byB0aGUgc2VuZE1lc3NhZ2UgY2FsbCBhbmQgcmVzb2x2ZVxuICAgICAgICAgIC8vIHRoZSBwcm9taXNlIHRvIHVuZGVmaW5lZCBhcyBpbiBGaXJlZm94LlxuICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS93ZWJleHRlbnNpb24tcG9seWZpbGwvaXNzdWVzLzEzMFxuICAgICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UgPT09IENIUk9NRV9TRU5EX01FU1NBR0VfQ0FMTEJBQ0tfTk9fUkVTUE9OU0VfTUVTU0FHRSkge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyZXBseSAmJiByZXBseS5fX21veldlYkV4dGVuc2lvblBvbHlmaWxsUmVqZWN0X18pIHtcbiAgICAgICAgICAvLyBDb252ZXJ0IGJhY2sgdGhlIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhlIGVycm9yIGludG9cbiAgICAgICAgICAvLyBhbiBFcnJvciBpbnN0YW5jZS5cbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcGx5Lm1lc3NhZ2UpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKHJlcGx5KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHdyYXBwZWRTZW5kTWVzc2FnZSA9IChuYW1lLCBtZXRhZGF0YSwgYXBpTmFtZXNwYWNlT2JqLCAuLi5hcmdzKSA9PiB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IG1ldGFkYXRhLm1pbkFyZ3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IGxlYXN0ICR7bWV0YWRhdGEubWluQXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWluQXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IG1ldGFkYXRhLm1heEFyZ3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGF0IG1vc3QgJHttZXRhZGF0YS5tYXhBcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5tYXhBcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCB3cmFwcGVkQ2IgPSB3cmFwcGVkU2VuZE1lc3NhZ2VDYWxsYmFjay5iaW5kKG51bGwsIHtcbiAgICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgICByZWplY3RcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBhcmdzLnB1c2god3JhcHBlZENiKTtcbiAgICAgICAgICBhcGlOYW1lc3BhY2VPYmouc2VuZE1lc3NhZ2UoLi4uYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHN0YXRpY1dyYXBwZXJzID0ge1xuICAgICAgICBkZXZ0b29sczoge1xuICAgICAgICAgIG5ldHdvcms6IHtcbiAgICAgICAgICAgIG9uUmVxdWVzdEZpbmlzaGVkOiB3cmFwRXZlbnQob25SZXF1ZXN0RmluaXNoZWRXcmFwcGVycylcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJ1bnRpbWU6IHtcbiAgICAgICAgICBvbk1lc3NhZ2U6IHdyYXBFdmVudChvbk1lc3NhZ2VXcmFwcGVycyksXG4gICAgICAgICAgb25NZXNzYWdlRXh0ZXJuYWw6IHdyYXBFdmVudChvbk1lc3NhZ2VXcmFwcGVycyksXG4gICAgICAgICAgc2VuZE1lc3NhZ2U6IHdyYXBwZWRTZW5kTWVzc2FnZS5iaW5kKG51bGwsIFwic2VuZE1lc3NhZ2VcIiwge1xuICAgICAgICAgICAgbWluQXJnczogMSxcbiAgICAgICAgICAgIG1heEFyZ3M6IDNcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICB0YWJzOiB7XG4gICAgICAgICAgc2VuZE1lc3NhZ2U6IHdyYXBwZWRTZW5kTWVzc2FnZS5iaW5kKG51bGwsIFwic2VuZE1lc3NhZ2VcIiwge1xuICAgICAgICAgICAgbWluQXJnczogMixcbiAgICAgICAgICAgIG1heEFyZ3M6IDNcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY29uc3Qgc2V0dGluZ01ldGFkYXRhID0ge1xuICAgICAgICBjbGVhcjoge1xuICAgICAgICAgIG1pbkFyZ3M6IDEsXG4gICAgICAgICAgbWF4QXJnczogMVxuICAgICAgICB9LFxuICAgICAgICBnZXQ6IHtcbiAgICAgICAgICBtaW5BcmdzOiAxLFxuICAgICAgICAgIG1heEFyZ3M6IDFcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiB7XG4gICAgICAgICAgbWluQXJnczogMSxcbiAgICAgICAgICBtYXhBcmdzOiAxXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBhcGlNZXRhZGF0YS5wcml2YWN5ID0ge1xuICAgICAgICBuZXR3b3JrOiB7XG4gICAgICAgICAgXCIqXCI6IHNldHRpbmdNZXRhZGF0YVxuICAgICAgICB9LFxuICAgICAgICBzZXJ2aWNlczoge1xuICAgICAgICAgIFwiKlwiOiBzZXR0aW5nTWV0YWRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgd2Vic2l0ZXM6IHtcbiAgICAgICAgICBcIipcIjogc2V0dGluZ01ldGFkYXRhXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gd3JhcE9iamVjdChleHRlbnNpb25BUElzLCBzdGF0aWNXcmFwcGVycywgYXBpTWV0YWRhdGEpO1xuICAgIH07XG5cbiAgICAvLyBUaGUgYnVpbGQgcHJvY2VzcyBhZGRzIGEgVU1EIHdyYXBwZXIgYXJvdW5kIHRoaXMgZmlsZSwgd2hpY2ggbWFrZXMgdGhlXG4gICAgLy8gYG1vZHVsZWAgdmFyaWFibGUgYXZhaWxhYmxlLlxuICAgIG1vZHVsZS5leHBvcnRzID0gd3JhcEFQSXMoY2hyb21lKTtcbiAgfSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbFRoaXMuYnJvd3NlcjtcbiAgfVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1icm93c2VyLXBvbHlmaWxsLmpzLm1hcFxuIiwiaW1wb3J0IG9yaWdpbmFsQnJvd3NlciBmcm9tIFwid2ViZXh0ZW5zaW9uLXBvbHlmaWxsXCI7XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IG9yaWdpbmFsQnJvd3NlcjtcbiIsImZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuICBpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG4gIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhcmdzLnNoaWZ0KCk7XG4gICAgbWV0aG9kKGBbd3h0XSAke21lc3NhZ2V9YCwgLi4uYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSB7XG4gIGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG4gIGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcbiAgd2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG4gIGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG5leHBvcnQgY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgY29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcbiAgICBzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcbiAgICB0aGlzLm5ld1VybCA9IG5ld1VybDtcbiAgICB0aGlzLm9sZFVybCA9IG9sZFVybDtcbiAgfVxuICBzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG4gIHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcbiAgbGV0IGludGVydmFsO1xuICBsZXQgb2xkVXJsO1xuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgbG9jYXRpb24gd2F0Y2hlciBpcyBhY3RpdmVseSBsb29raW5nIGZvciBVUkwgY2hhbmdlcy4gSWYgaXQncyBhbHJlYWR5IHdhdGNoaW5nLFxuICAgICAqIHRoaXMgaXMgYSBub29wLlxuICAgICAqL1xuICAgIHJ1bigpIHtcbiAgICAgIGlmIChpbnRlcnZhbCAhPSBudWxsKSByZXR1cm47XG4gICAgICBvbGRVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuICAgICAgaW50ZXJ2YWwgPSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBsZXQgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgaWYgKG5ld1VybC5ocmVmICE9PSBvbGRVcmwuaHJlZikge1xuICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgb2xkVXJsKSk7XG4gICAgICAgICAgb2xkVXJsID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9LCAxZTMpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi8uLi9zYW5kYm94L3V0aWxzL2xvZ2dlci5tanNcIjtcbmltcG9ydCB7IGdldFVuaXF1ZUV2ZW50TmFtZSB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuZXhwb3J0IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcbiAgY29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBpZiAodGhpcy5pc1RvcEZyYW1lKSB7XG4gICAgICB0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cyh7IGlnbm9yZUZpcnN0RXZlbnQ6IHRydWUgfSk7XG4gICAgICB0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG4gICAgfVxuICB9XG4gIHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXG4gICAgXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiXG4gICk7XG4gIGlzVG9wRnJhbWUgPSB3aW5kb3cuc2VsZiA9PT0gd2luZG93LnRvcDtcbiAgYWJvcnRDb250cm9sbGVyO1xuICBsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG4gIHJlY2VpdmVkTWVzc2FnZUlkcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gIGdldCBzaWduYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcbiAgfVxuICBhYm9ydChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcbiAgfVxuICBnZXQgaXNJbnZhbGlkKCkge1xuICAgIGlmIChicm93c2VyLnJ1bnRpbWUuaWQgPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcbiAgfVxuICBnZXQgaXNWYWxpZCgpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG4gICAqIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG4gICAqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG4gICAqIH0pXG4gICAqIC8vIC4uLlxuICAgKiByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG4gICAqL1xuICBvbkludmFsaWRhdGVkKGNiKSB7XG4gICAgdGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb24gdGhhdCBzaG91bGRuJ3QgcnVuXG4gICAqIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG4gICAqICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcbiAgICpcbiAgICogICAvLyAuLi5cbiAgICogfVxuICAgKi9cbiAgYmxvY2soKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWwgd2hlbiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbCB3aGVuIGludmFsaWRhdGVkLlxuICAgKi9cbiAgc2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG4gICAgY29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuICAgIGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICB9KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHJlcXVlc3RJZGxlQ2FsbGJhY2soY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICBjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soKC4uLmFyZ3MpID0+IHtcbiAgICAgIGlmICghdGhpcy5zaWduYWwuYWJvcnRlZCkgY2FsbGJhY2soLi4uYXJncyk7XG4gICAgfSwgb3B0aW9ucyk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbElkbGVDYWxsYmFjayhpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICBhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlID09PSBcInd4dDpsb2NhdGlvbmNoYW5nZVwiKSB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSB0aGlzLmxvY2F0aW9uV2F0Y2hlci5ydW4oKTtcbiAgICB9XG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXI/LihcbiAgICAgIHR5cGUuc3RhcnRzV2l0aChcInd4dDpcIikgPyBnZXRVbmlxdWVFdmVudE5hbWUodHlwZSkgOiB0eXBlLFxuICAgICAgaGFuZGxlcixcbiAgICAgIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgc2lnbmFsOiB0aGlzLnNpZ25hbFxuICAgICAgfVxuICAgICk7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBBYm9ydCB0aGUgYWJvcnQgY29udHJvbGxlciBhbmQgZXhlY3V0ZSBhbGwgYG9uSW52YWxpZGF0ZWRgIGxpc3RlbmVycy5cbiAgICovXG4gIG5vdGlmeUludmFsaWRhdGVkKCkge1xuICAgIHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuICAgIGxvZ2dlci5kZWJ1ZyhcbiAgICAgIGBDb250ZW50IHNjcmlwdCBcIiR7dGhpcy5jb250ZW50U2NyaXB0TmFtZX1cIiBjb250ZXh0IGludmFsaWRhdGVkYFxuICAgICk7XG4gIH1cbiAgc3RvcE9sZFNjcmlwdHMoKSB7XG4gICAgd2luZG93LnBvc3RNZXNzYWdlKFxuICAgICAge1xuICAgICAgICB0eXBlOiBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsXG4gICAgICAgIGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuICAgICAgICBtZXNzYWdlSWQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpXG4gICAgICB9LFxuICAgICAgXCIqXCJcbiAgICApO1xuICB9XG4gIHZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkge1xuICAgIGNvbnN0IGlzU2NyaXB0U3RhcnRlZEV2ZW50ID0gZXZlbnQuZGF0YT8udHlwZSA9PT0gQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFO1xuICAgIGNvbnN0IGlzU2FtZUNvbnRlbnRTY3JpcHQgPSBldmVudC5kYXRhPy5jb250ZW50U2NyaXB0TmFtZSA9PT0gdGhpcy5jb250ZW50U2NyaXB0TmFtZTtcbiAgICBjb25zdCBpc05vdER1cGxpY2F0ZSA9ICF0aGlzLnJlY2VpdmVkTWVzc2FnZUlkcy5oYXMoZXZlbnQuZGF0YT8ubWVzc2FnZUlkKTtcbiAgICByZXR1cm4gaXNTY3JpcHRTdGFydGVkRXZlbnQgJiYgaXNTYW1lQ29udGVudFNjcmlwdCAmJiBpc05vdER1cGxpY2F0ZTtcbiAgfVxuICBsaXN0ZW5Gb3JOZXdlclNjcmlwdHMob3B0aW9ucykge1xuICAgIGxldCBpc0ZpcnN0ID0gdHJ1ZTtcbiAgICBjb25zdCBjYiA9IChldmVudCkgPT4ge1xuICAgICAgaWYgKHRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkge1xuICAgICAgICB0aGlzLnJlY2VpdmVkTWVzc2FnZUlkcy5hZGQoZXZlbnQuZGF0YS5tZXNzYWdlSWQpO1xuICAgICAgICBjb25zdCB3YXNGaXJzdCA9IGlzRmlyc3Q7XG4gICAgICAgIGlzRmlyc3QgPSBmYWxzZTtcbiAgICAgICAgaWYgKHdhc0ZpcnN0ICYmIG9wdGlvbnM/Lmlnbm9yZUZpcnN0RXZlbnQpIHJldHVybjtcbiAgICAgICAgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuICAgICAgfVxuICAgIH07XG4gICAgYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgY2IpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiByZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBjYikpO1xuICB9XG59XG4iLCJjb25zdCBudWxsS2V5ID0gU3ltYm9sKCdudWxsJyk7IC8vIGBvYmplY3RIYXNoZXNgIGtleSBmb3IgbnVsbFxuXG5sZXQga2V5Q291bnRlciA9IDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hbnlLZXlzTWFwIGV4dGVuZHMgTWFwIHtcblx0Y29uc3RydWN0b3IoLi4uYXJndW1lbnRzXykge1xuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLl9vYmplY3RIYXNoZXMgPSBuZXcgV2Vha01hcCgpO1xuXHRcdHRoaXMuX3N5bWJvbEhhc2hlcyA9IG5ldyBNYXAoKTsgLy8gaHR0cHM6Ly9naXRodWIuY29tL3RjMzkvZWNtYTI2Mi9pc3N1ZXMvMTE5NFxuXHRcdHRoaXMuX3B1YmxpY0tleXMgPSBuZXcgTWFwKCk7XG5cblx0XHRjb25zdCBbcGFpcnNdID0gYXJndW1lbnRzXzsgLy8gTWFwIGNvbXBhdFxuXHRcdGlmIChwYWlycyA9PT0gbnVsbCB8fCBwYWlycyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwYWlyc1tTeW1ib2wuaXRlcmF0b3JdICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKHR5cGVvZiBwYWlycyArICcgaXMgbm90IGl0ZXJhYmxlIChjYW5ub3QgcmVhZCBwcm9wZXJ0eSBTeW1ib2woU3ltYm9sLml0ZXJhdG9yKSknKTtcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IFtrZXlzLCB2YWx1ZV0gb2YgcGFpcnMpIHtcblx0XHRcdHRoaXMuc2V0KGtleXMsIHZhbHVlKTtcblx0XHR9XG5cdH1cblxuXHRfZ2V0UHVibGljS2V5cyhrZXlzLCBjcmVhdGUgPSBmYWxzZSkge1xuXHRcdGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGtleXMgcGFyYW1ldGVyIG11c3QgYmUgYW4gYXJyYXknKTtcblx0XHR9XG5cblx0XHRjb25zdCBwcml2YXRlS2V5ID0gdGhpcy5fZ2V0UHJpdmF0ZUtleShrZXlzLCBjcmVhdGUpO1xuXG5cdFx0bGV0IHB1YmxpY0tleTtcblx0XHRpZiAocHJpdmF0ZUtleSAmJiB0aGlzLl9wdWJsaWNLZXlzLmhhcyhwcml2YXRlS2V5KSkge1xuXHRcdFx0cHVibGljS2V5ID0gdGhpcy5fcHVibGljS2V5cy5nZXQocHJpdmF0ZUtleSk7XG5cdFx0fSBlbHNlIGlmIChjcmVhdGUpIHtcblx0XHRcdHB1YmxpY0tleSA9IFsuLi5rZXlzXTsgLy8gUmVnZW5lcmF0ZSBrZXlzIGFycmF5IHRvIGF2b2lkIGV4dGVybmFsIGludGVyYWN0aW9uXG5cdFx0XHR0aGlzLl9wdWJsaWNLZXlzLnNldChwcml2YXRlS2V5LCBwdWJsaWNLZXkpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7cHJpdmF0ZUtleSwgcHVibGljS2V5fTtcblx0fVxuXG5cdF9nZXRQcml2YXRlS2V5KGtleXMsIGNyZWF0ZSA9IGZhbHNlKSB7XG5cdFx0Y29uc3QgcHJpdmF0ZUtleXMgPSBbXTtcblx0XHRmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG5cdFx0XHRjb25zdCBrZXlUb1Bhc3MgPSBrZXkgPT09IG51bGwgPyBudWxsS2V5IDoga2V5O1xuXG5cdFx0XHRsZXQgaGFzaGVzO1xuXHRcdFx0aWYgKHR5cGVvZiBrZXlUb1Bhc3MgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBrZXlUb1Bhc3MgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0aGFzaGVzID0gJ19vYmplY3RIYXNoZXMnO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlb2Yga2V5VG9QYXNzID09PSAnc3ltYm9sJykge1xuXHRcdFx0XHRoYXNoZXMgPSAnX3N5bWJvbEhhc2hlcyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRoYXNoZXMgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFoYXNoZXMpIHtcblx0XHRcdFx0cHJpdmF0ZUtleXMucHVzaChrZXlUb1Bhc3MpO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzW2hhc2hlc10uaGFzKGtleVRvUGFzcykpIHtcblx0XHRcdFx0cHJpdmF0ZUtleXMucHVzaCh0aGlzW2hhc2hlc10uZ2V0KGtleVRvUGFzcykpO1xuXHRcdFx0fSBlbHNlIGlmIChjcmVhdGUpIHtcblx0XHRcdFx0Y29uc3QgcHJpdmF0ZUtleSA9IGBAQG1rbS1yZWYtJHtrZXlDb3VudGVyKyt9QEBgO1xuXHRcdFx0XHR0aGlzW2hhc2hlc10uc2V0KGtleVRvUGFzcywgcHJpdmF0ZUtleSk7XG5cdFx0XHRcdHByaXZhdGVLZXlzLnB1c2gocHJpdmF0ZUtleSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHByaXZhdGVLZXlzKTtcblx0fVxuXG5cdHNldChrZXlzLCB2YWx1ZSkge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzLCB0cnVlKTtcblx0XHRyZXR1cm4gc3VwZXIuc2V0KHB1YmxpY0tleSwgdmFsdWUpO1xuXHR9XG5cblx0Z2V0KGtleXMpIHtcblx0XHRjb25zdCB7cHVibGljS2V5fSA9IHRoaXMuX2dldFB1YmxpY0tleXMoa2V5cyk7XG5cdFx0cmV0dXJuIHN1cGVyLmdldChwdWJsaWNLZXkpO1xuXHR9XG5cblx0aGFzKGtleXMpIHtcblx0XHRjb25zdCB7cHVibGljS2V5fSA9IHRoaXMuX2dldFB1YmxpY0tleXMoa2V5cyk7XG5cdFx0cmV0dXJuIHN1cGVyLmhhcyhwdWJsaWNLZXkpO1xuXHR9XG5cblx0ZGVsZXRlKGtleXMpIHtcblx0XHRjb25zdCB7cHVibGljS2V5LCBwcml2YXRlS2V5fSA9IHRoaXMuX2dldFB1YmxpY0tleXMoa2V5cyk7XG5cdFx0cmV0dXJuIEJvb2xlYW4ocHVibGljS2V5ICYmIHN1cGVyLmRlbGV0ZShwdWJsaWNLZXkpICYmIHRoaXMuX3B1YmxpY0tleXMuZGVsZXRlKHByaXZhdGVLZXkpKTtcblx0fVxuXG5cdGNsZWFyKCkge1xuXHRcdHN1cGVyLmNsZWFyKCk7XG5cdFx0dGhpcy5fc3ltYm9sSGFzaGVzLmNsZWFyKCk7XG5cdFx0dGhpcy5fcHVibGljS2V5cy5jbGVhcigpO1xuXHR9XG5cblx0Z2V0IFtTeW1ib2wudG9TdHJpbmdUYWddKCkge1xuXHRcdHJldHVybiAnTWFueUtleXNNYXAnO1xuXHR9XG5cblx0Z2V0IHNpemUoKSB7XG5cdFx0cmV0dXJuIHN1cGVyLnNpemU7XG5cdH1cbn1cbiIsImltcG9ydCBNYW55S2V5c01hcCBmcm9tICdtYW55LWtleXMtbWFwJztcbmltcG9ydCB7IGRlZnUgfSBmcm9tICdkZWZ1JztcbmltcG9ydCB7IGlzRXhpc3QgfSBmcm9tICcuL2RldGVjdG9ycy5tanMnO1xuXG5jb25zdCBnZXREZWZhdWx0T3B0aW9ucyA9ICgpID0+ICh7XG4gIHRhcmdldDogZ2xvYmFsVGhpcy5kb2N1bWVudCxcbiAgdW5pZnlQcm9jZXNzOiB0cnVlLFxuICBkZXRlY3RvcjogaXNFeGlzdCxcbiAgb2JzZXJ2ZUNvbmZpZ3M6IHtcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgc3VidHJlZTogdHJ1ZSxcbiAgICBhdHRyaWJ1dGVzOiB0cnVlXG4gIH0sXG4gIHNpZ25hbDogdm9pZCAwLFxuICBjdXN0b21NYXRjaGVyOiB2b2lkIDBcbn0pO1xuY29uc3QgbWVyZ2VPcHRpb25zID0gKHVzZXJTaWRlT3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpID0+IHtcbiAgcmV0dXJuIGRlZnUodXNlclNpZGVPcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG59O1xuXG5jb25zdCB1bmlmeUNhY2hlID0gbmV3IE1hbnlLZXlzTWFwKCk7XG5mdW5jdGlvbiBjcmVhdGVXYWl0RWxlbWVudChpbnN0YW5jZU9wdGlvbnMpIHtcbiAgY29uc3QgeyBkZWZhdWx0T3B0aW9ucyB9ID0gaW5zdGFuY2VPcHRpb25zO1xuICByZXR1cm4gKHNlbGVjdG9yLCBvcHRpb25zKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgdGFyZ2V0LFxuICAgICAgdW5pZnlQcm9jZXNzLFxuICAgICAgb2JzZXJ2ZUNvbmZpZ3MsXG4gICAgICBkZXRlY3RvcixcbiAgICAgIHNpZ25hbCxcbiAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICB9ID0gbWVyZ2VPcHRpb25zKG9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKTtcbiAgICBjb25zdCB1bmlmeVByb21pc2VLZXkgPSBbXG4gICAgICBzZWxlY3RvcixcbiAgICAgIHRhcmdldCxcbiAgICAgIHVuaWZ5UHJvY2VzcyxcbiAgICAgIG9ic2VydmVDb25maWdzLFxuICAgICAgZGV0ZWN0b3IsXG4gICAgICBzaWduYWwsXG4gICAgICBjdXN0b21NYXRjaGVyXG4gICAgXTtcbiAgICBjb25zdCBjYWNoZWRQcm9taXNlID0gdW5pZnlDYWNoZS5nZXQodW5pZnlQcm9taXNlS2V5KTtcbiAgICBpZiAodW5pZnlQcm9jZXNzICYmIGNhY2hlZFByb21pc2UpIHtcbiAgICAgIHJldHVybiBjYWNoZWRQcm9taXNlO1xuICAgIH1cbiAgICBjb25zdCBkZXRlY3RQcm9taXNlID0gbmV3IFByb21pc2UoXG4gICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vQXN5bmNQcm9taXNlRXhlY3V0b3I6IGF2b2lkIG5lc3RpbmcgcHJvbWlzZVxuICAgICAgYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChzaWduYWwucmVhc29uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKFxuICAgICAgICAgIGFzeW5jIChtdXRhdGlvbnMpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgXyBvZiBtdXRhdGlvbnMpIHtcbiAgICAgICAgICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zdCBkZXRlY3RSZXN1bHQyID0gYXdhaXQgZGV0ZWN0RWxlbWVudCh7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IsXG4gICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgIGRldGVjdG9yLFxuICAgICAgICAgICAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGlmIChkZXRlY3RSZXN1bHQyLmlzRGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkZXRlY3RSZXN1bHQyLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNpZ25hbD8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBcImFib3J0XCIsXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChzaWduYWwucmVhc29uKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgb25jZTogdHJ1ZSB9XG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGRldGVjdFJlc3VsdCA9IGF3YWl0IGRldGVjdEVsZW1lbnQoe1xuICAgICAgICAgIHNlbGVjdG9yLFxuICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICBkZXRlY3RvcixcbiAgICAgICAgICBjdXN0b21NYXRjaGVyXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZGV0ZWN0UmVzdWx0LmlzRGV0ZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkZXRlY3RSZXN1bHQucmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKHRhcmdldCwgb2JzZXJ2ZUNvbmZpZ3MpO1xuICAgICAgfVxuICAgICkuZmluYWxseSgoKSA9PiB7XG4gICAgICB1bmlmeUNhY2hlLmRlbGV0ZSh1bmlmeVByb21pc2VLZXkpO1xuICAgIH0pO1xuICAgIHVuaWZ5Q2FjaGUuc2V0KHVuaWZ5UHJvbWlzZUtleSwgZGV0ZWN0UHJvbWlzZSk7XG4gICAgcmV0dXJuIGRldGVjdFByb21pc2U7XG4gIH07XG59XG5hc3luYyBmdW5jdGlvbiBkZXRlY3RFbGVtZW50KHtcbiAgdGFyZ2V0LFxuICBzZWxlY3RvcixcbiAgZGV0ZWN0b3IsXG4gIGN1c3RvbU1hdGNoZXJcbn0pIHtcbiAgY29uc3QgZWxlbWVudCA9IGN1c3RvbU1hdGNoZXIgPyBjdXN0b21NYXRjaGVyKHNlbGVjdG9yKSA6IHRhcmdldC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgcmV0dXJuIGF3YWl0IGRldGVjdG9yKGVsZW1lbnQpO1xufVxuY29uc3Qgd2FpdEVsZW1lbnQgPSBjcmVhdGVXYWl0RWxlbWVudCh7XG4gIGRlZmF1bHRPcHRpb25zOiBnZXREZWZhdWx0T3B0aW9ucygpXG59KTtcblxuZXhwb3J0IHsgY3JlYXRlV2FpdEVsZW1lbnQsIGdldERlZmF1bHRPcHRpb25zLCB3YWl0RWxlbWVudCB9O1xuIl0sIm5hbWVzIjpbImRlZmluaXRpb24iLCJsb2NhdGlvbiIsIl9hIiwidGhpcyIsIm1vZHVsZSIsInByb3h5VGFyZ2V0IiwidmFsdWUiLCJyZXN1bHQiLCJtZXNzYWdlIiwicHJpbnQiLCJsb2dnZXIiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQU8sV0FBUyxvQkFBb0JBLGFBQVk7QUFDOUMsV0FBT0E7QUFBQSxFQUNUO0FBQUEsRUNBTyxNQUFNLGdCQUE0QztBQUFBLElBQ3ZELFlBQVksS0FBc0I7QUFDaEMsYUFBTyxJQUFJLFNBQVMsbUJBQW1CO0FBQUEsSUFDekM7QUFBQSxJQUVBLE1BQU0sb0JBQWdEO0FBRXBELFlBQU0sU0FBUyxLQUFLLG1CQUFBO0FBR3BCLFlBQU0saUJBQWlCO0FBQUEsUUFDckI7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQUE7QUFFRixVQUFJLFFBQVEsS0FBSyxxQkFBcUIsY0FBYyxLQUFLO0FBR3pELFlBQU0sbUJBQW1CO0FB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LE9BQU8sVUFBVTtBQUUzQyxZQUFJO0FBQ0osWUFBSSxPQUFPLGNBQWMsWUFBWSxPQUFPLGNBQWMsWUFBWTtBQUNyRSxtQkFBUztBQUFBLFFBQ1YsV0FBVyxPQUFPLGNBQWMsVUFBVTtBQUN6QyxtQkFBUztBQUFBLFFBQ1YsT0FBTztBQUNOLG1CQUFTO0FBQUEsUUFDVjtBQUVBLFlBQUksQ0FBQyxRQUFRO0FBQ1osc0JBQVksS0FBSyxTQUFTO0FBQUEsUUFDM0IsV0FBVyxLQUFLLE1BQU0sRUFBRSxJQUFJLFNBQVMsR0FBRztBQUN2QyxzQkFBWSxLQUFLLEtBQUssTUFBTSxFQUFFLElBQUksU0FBUyxDQUFDO0FBQUEsUUFDN0MsV0FBVyxRQUFRO0FBQ2xCLGdCQUFNLGFBQWEsYUFBYSxZQUFZO0FBQzVDLGVBQUssTUFBTSxFQUFFLElBQUksV0FBVyxVQUFVO0FBQ3RDLHNCQUFZLEtBQUssVUFBVTtBQUFBLFFBQzVCLE9BQU87QUFDTixpQkFBTztBQUFBLFFBQ1I7QUFBQSxNQUNEO0FBRUEsYUFBTyxLQUFLLFVBQVUsV0FBVztBQUFBLElBQ2xDO0FBQUEsSUFFQSxJQUFJLE1BQU0sT0FBTztBQUNoQixZQUFNLEVBQUMsVUFBUyxJQUFJLEtBQUssZUFBZSxNQUFNLElBQUk7QUFDbEQsYUFBTyxNQUFNLElBQUksV0FBVyxLQUFLO0FBQUEsSUFDbEM7QUFBQSxJQUVBLElBQUksTUFBTTtBQUNULFlBQU0sRUFBQyxVQUFTLElBQUksS0FBSyxlQUFlLElBQUk7QUFDNUMsYUFBTyxNQUFNLElBQUksU0FBUztBQUFBLElBQzNCO0FBQUEsSUFFQSxJQUFJLE1BQU07QUFDVCxZQUFNLEVBQUMsVUFBUyxJQUFJLEtBQUssZUFBZSxJQUFJO0FBQzVDLGFBQU8sTUFBTSxJQUFJLFNBQVM7QUFBQSxJQUMzQjtBQUFBLElBRUEsT0FBTyxNQUFNO0FBQ1osWUFBTSxFQUFDLFdBQVcsV0FBVSxJQUFJLEtBQUssZUFBZSxJQUFJO0FBQ3hELGFBQU8sUUFBUSxhQUFhLE1BQU0sT0FBTyxTQUFTLEtBQUssS0FBSyxZQUFZLE9BQU8sVUFBVSxDQUFDO0FBQUEsSUFDM0Y7QUFBQSxJQUVBLFFBQVE7QUFDUCxZQUFNLE1BQUs7QUFDWCxXQUFLLGNBQWMsTUFBSztBQUN4QixXQUFLLFlBQVksTUFBSztBQUFBLElBQ3ZCO0FBQUEsSUFFQSxLQUFLLE9BQU8sV0FBVyxJQUFJO0FBQzFCLGFBQU87QUFBQSxJQUNSO0FBQUEsSUFFQSxJQUFJLE9BQU87QUFDVixhQUFPLE1BQU07QUFBQSxJQUNkO0FBQUEsRUFDRDtBQ3ZGbUIsTUFBSSxZQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMyw0LDUsNiw3LDgsOSwxMF19
