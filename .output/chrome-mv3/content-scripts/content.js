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
  class IndeedScraper {
    isSupported(url) {
      return url.includes("indeed.com");
    }
    async extractJobDetails() {
      const jobUrl = this.getCanonicalJobUrl();
      const titleSelectors = [
        "h1.jobsearch-JobInfoHeader-title",
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        ".jobsearch-JobInfoHeader-title-container h1",
        'h2[class*="jobTitle"]',
        "h1"
      ];
      let title = this.getTextFromSelectors(titleSelectors) || "Unknown Role";
      const companySelectors = [
        '[data-testid="inlineHeader-companyName"] a',
        '[data-testid="inlineHeader-companyName"]',
        "div.jobsearch-CompanyInfoWithoutHeaderImage a",
        "div.jobsearch-CompanyInfoWithoutHeaderImage",
        '[class*="companyName"]',
        '[class*="company"]'
      ];
      let company = this.getTextFromSelectors(companySelectors) || "Unknown Company";
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
        '[data-testid="inlineHeader-companyLocation"]',
        "div.jobsearch-JobInfoHeader-subtitle",
        '[class*="companyLocation"]',
        '[class*="location"]'
      ];
      const locationText = this.getTextFromSelectors(locationSelectors) || "Unknown Location";
      const location2 = this.cleanLocationText(locationText, company);
      const descriptionSelectors = [
        "#jobDescriptionText",
        ".jobsearch-jobDescriptionText",
        '[id*="jobDescriptionText"]'
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
        portal: "Indeed"
      };
    }
    getCanonicalJobUrl() {
      const url = window.location.href;
      try {
        const parsed = new URL(url);
        const jk = parsed.searchParams.get("jk");
        if (jk) {
          return `https://www.indeed.com/viewjob?jk=${jk}`;
        }
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
          const href = canonicalLink.getAttribute("href");
          if (href) return href;
        }
      } catch (e) {
        console.error("Error parsing Indeed Job URL:", e);
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
      const descLower = description.toLowerCase();
      if (descLower.includes("full-time") || descLower.includes("full time")) {
        return "Full-time";
      } else if (descLower.includes("part-time") || descLower.includes("part time")) {
        return "Part-time";
      } else if (descLower.includes("contract")) {
        return "Contract";
      } else if (descLower.includes("internship") || descLower.includes("intern")) {
        return "Internship";
      } else if (descLower.includes("temporary")) {
        return "Temporary";
      }
      return "Full-time";
    }
    parseDocumentTitle() {
      const docTitle = document.title;
      const cleanTitle = docTitle.replace(/^\(\d+\)\s+/, "").trim();
      const parts = cleanTitle.split("|")[0].split(" - ");
      if (parts.length >= 2) {
        return {
          title: parts[0].trim(),
          company: parts[1].trim()
        };
      }
      const atMatch = cleanTitle.match(/^(.+?)\s+at\s+(.+?)(?:\s+\||$)/i);
      if (atMatch) {
        return {
          title: atMatch[1].trim(),
          company: atMatch[2].trim()
        };
      }
      return {
        title: cleanTitle.split("|")[0].trim(),
        company: "Indeed Company"
      };
    }
  }
  content;
  const definition = defineContentScript({
    matches: [
      "https://www.linkedin.com/jobs/*",
      "https://www.linkedin.com/jobs/view/*",
      "https://*.indeed.com/*",
      "https://indeed.com/*"
    ],
    runAt: "document_end",
    main() {
      const scrapers = [
        new LinkedInScraper(),
        new IndeedScraper()
      ];
      function getActiveScraper() {
        return scrapers.find((s) => s.isSupported(window.location.href));
      }
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
          const activeScraper = getActiveScraper();
          if (activeScraper) {
            bindApplyButtonListeners(activeScraper);
            bindSubmitButtonListener(activeScraper);
            checkEasyApplySuccess(activeScraper);
          }
        }, 1e3);
      }
      function bindApplyButtonListeners(activeScraper) {
        const applyButtons = findApplyButtons();
        applyButtons.forEach((button) => {
          var _a;
          if (button.getAttribute("data-jobflow-listened") === "true") {
            return;
          }
          button.setAttribute("data-jobflow-listened", "true");
          const text = ((_a = button.textContent) == null ? void 0 : _a.trim().toLowerCase()) || "";
          const isEasyApply = text.includes("easy apply") || button.classList.contains("indeed-apply-button") || button.id.includes("indeedApplyButton") || button.getAttribute("data-testid") === "indeed-apply-button";
          if (isEasyApply) {
            console.log("JobFlow: Easy Apply / Inline Apply button detected. Monitoring modal...");
          } else {
            button.addEventListener("click", () => {
              console.log("JobFlow: External Apply button clicked. Saving...");
              triggerSaveWorkflow(activeScraper);
            });
          }
        });
      }
      function findApplyButtons() {
        const buttons = [];
        const selectors = [
          // LinkedIn
          ".jobs-apply-button",
          ".jobs-s-apply button",
          "button.jobs-apply-button--top-card",
          '[data-control-name="job_apply"]',
          ".jobs-apply-button--top-card button",
          // Indeed
          "a.indeed-apply-button",
          'button[id*="indeedApplyButton"]',
          "#indeedApplyButton",
          '[data-testid="indeed-apply-button"]',
          '[data-testid="jobsearch-ViewJobButtons-container"] button',
          '[data-testid="jobsearch-ViewJobButtons-container"] a',
          "#applyButtonLinkContainer a",
          ".indeed-apply-button"
        ];
        selectors.forEach((sel) => {
          document.querySelectorAll(sel).forEach((el) => {
            if (el instanceof HTMLElement) {
              buttons.push(el);
            }
          });
        });
        document.querySelectorAll("button, a").forEach((btn) => {
          var _a;
          const text = ((_a = btn.textContent) == null ? void 0 : _a.trim().toLowerCase()) || "";
          const matchesText = text === "apply" || text === "easy apply" || text.includes("apply now") || text.includes("apply on company site");
          if (matchesText && !buttons.includes(btn)) {
            buttons.push(btn);
          }
        });
        return buttons;
      }
      function bindSubmitButtonListener(activeScraper) {
        const submitButtons = document.querySelectorAll("button");
        submitButtons.forEach((button) => {
          var _a, _b;
          const text = ((_a = button.textContent) == null ? void 0 : _a.trim().toLowerCase()) || "";
          const ariaLabel = ((_b = button.getAttribute("aria-label")) == null ? void 0 : _b.toLowerCase()) || "";
          const isSubmit = text === "submit application" || text === "submit your application" || text === "submit" || ariaLabel === "submit application" || ariaLabel === "submit";
          if (isSubmit && button.getAttribute("data-jobflow-listened") !== "true") {
            button.setAttribute("data-jobflow-listened", "true");
            button.addEventListener("click", () => {
              console.log("JobFlow: Submit application button clicked! Saving...");
              triggerSaveWorkflow(activeScraper);
            });
          }
        });
      }
      function checkEasyApplySuccess(activeScraper) {
        const successPhrases = [
          "application sent",
          "application submitted",
          "your application was sent",
          "successfully applied",
          "your application has been submitted"
        ];
        const modal = document.querySelector('.jobs-easy-apply-modal, [role="dialog"], .artdeco-modal, .ia-BaseModal, [id*="indeed-ia"]');
        if (modal) {
          const modalText = modal.textContent || "";
          const hasSuccess = successPhrases.some((phrase) => modalText.toLowerCase().includes(phrase));
          if (hasSuccess) {
            const currentJobUrl = window.location.href;
            if (!sessionTrackedUrls.has(currentJobUrl)) {
              sessionTrackedUrls.add(currentJobUrl);
              console.log("JobFlow: Detected Easy Apply success screen! Saving...");
              triggerSaveWorkflow(activeScraper);
            }
            return;
          }
        }
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach((iframe) => {
          var _a;
          try {
            const iframeDoc = iframe.contentDocument || ((_a = iframe.contentWindow) == null ? void 0 : _a.document);
            if (iframeDoc) {
              const iframeText = iframeDoc.body.textContent || "";
              const hasSuccess = successPhrases.some((phrase) => iframeText.toLowerCase().includes(phrase));
              if (hasSuccess) {
                const currentJobUrl = window.location.href;
                if (!sessionTrackedUrls.has(currentJobUrl)) {
                  sessionTrackedUrls.add(currentJobUrl);
                  console.log("JobFlow: Detected Easy Apply success screen in iframe! Saving...");
                  triggerSaveWorkflow(activeScraper);
                }
              }
            }
          } catch (e) {
          }
        });
      }
      async function triggerSaveWorkflow(activeScraper) {
        if (!activeScraper.isSupported(window.location.href)) {
          return;
        }
        setTimeout(async () => {
          try {
            const details = await activeScraper.extractJobDetails();
            if (!details || !details.jobUrl) {
              console.warn("JobFlow: Scraper returned incomplete details.");
              return;
            }
            if (!details.title || details.title === "Unknown Role") {
              details.title = "Job Application";
            }
            if (!details.company || details.company === "Unknown Company") {
              details.company = activeScraper instanceof LinkedInScraper ? "LinkedIn" : "Indeed";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI2LjEuMF9yb2xsdXBANC42Mi4yL25vZGVfbW9kdWxlcy93eHQvZGlzdC9zYW5kYm94L2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9zcmMvc2VydmljZXMvc2NyYXBlci9MaW5rZWRJblNjcmFwZXIudHMiLCIuLi8uLi8uLi9zcmMvc2VydmljZXMvc2NyYXBlci9JbmRlZWRTY3JhcGVyLnRzIiwiLi4vLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2NvbnRlbnQudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd2ViZXh0ZW5zaW9uLXBvbHlmaWxsQDAuMTIuMC9ub2RlX21vZHVsZXMvd2ViZXh0ZW5zaW9uLXBvbHlmaWxsL2Rpc3QvYnJvd3Nlci1wb2x5ZmlsbC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4xOS4yOV9AdHlwZXMrbm9kZUAyNi4xLjBfcm9sbHVwQDQuNjIuMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci9pbmRleC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMTkuMjlfQHR5cGVzK25vZGVAMjYuMS4wX3JvbGx1cEA0LjYyLjIvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvdXRpbHMvbG9nZ2VyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4xOS4yOV9AdHlwZXMrbm9kZUAyNi4xLjBfcm9sbHVwQDQuNjIuMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvY2xpZW50L2NvbnRlbnQtc2NyaXB0cy9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4xOS4yOV9AdHlwZXMrbm9kZUAyNi4xLjBfcm9sbHVwQDQuNjIuMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvY2xpZW50L2NvbnRlbnQtc2NyaXB0cy9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4xOS4yOV9AdHlwZXMrbm9kZUAyNi4xLjBfcm9sbHVwQDQuNjIuMi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvY2xpZW50L2NvbnRlbnQtc2NyaXB0cy9jb250ZW50LXNjcmlwdC1jb250ZXh0Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9tYW55LWtleXMtbWFwQDMuMC4zL25vZGVfbW9kdWxlcy9tYW55LWtleXMtbWFwL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0AxbmF0c3Urd2FpdC1lbGVtZW50QDQuMi4wL25vZGVfbW9kdWxlcy9AMW5hdHN1L3dhaXQtZWxlbWVudC9kaXN0L2luZGV4Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZGVmaW5lQ29udGVudFNjcmlwdChkZWZpbml0aW9uKSB7XG4gIHJldHVybiBkZWZpbml0aW9uO1xufVxuIiwiaW1wb3J0IHsgSm9iUG9ydGFsU2NyYXBlciwgU2NyYXBlZEpvYkRldGFpbHMgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIExpbmtlZEluU2NyYXBlciBpbXBsZW1lbnRzIEpvYlBvcnRhbFNjcmFwZXIge1xuICBpc1N1cHBvcnRlZCh1cmw6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB1cmwuaW5jbHVkZXMoJ2xpbmtlZGluLmNvbS9qb2JzJyk7XG4gIH1cblxuICBhc3luYyBleHRyYWN0Sm9iRGV0YWlscygpOiBQcm9taXNlPFNjcmFwZWRKb2JEZXRhaWxzPiB7XG4gICAgLy8gMS4gRXh0cmFjdCBKb2IgSUQgJiBVUkxcbiAgICBjb25zdCBqb2JVcmwgPSB0aGlzLmdldENhbm9uaWNhbEpvYlVybCgpO1xuXG4gICAgLy8gMi4gRXh0cmFjdCBUaXRsZVxuICAgIGNvbnN0IHRpdGxlU2VsZWN0b3JzID0gW1xuICAgICAgJy5qb2ItZGV0YWlscy1qb2JzLXVuaWZpZWQtdG9wLWNhcmRfX2pvYi10aXRsZScsXG4gICAgICAnLmpvYnMtdW5pZmllZC10b3AtY2FyZF9fam9iLXRpdGxlJyxcbiAgICAgICdoMS50LTI0JyxcbiAgICAgICcuam9icy1kZXRhaWxzLXRvcC1jYXJkX19qb2ItdGl0bGUnLFxuICAgICAgJ2gyLmpvYnMtZGV0YWlscy10b3AtY2FyZF9fam9iLXRpdGxlJyxcbiAgICAgICcudG9wY2FyZF9fdGl0bGUnLFxuICAgIF07XG4gICAgbGV0IHRpdGxlID0gdGhpcy5nZXRUZXh0RnJvbVNlbGVjdG9ycyh0aXRsZVNlbGVjdG9ycykgfHwgJ1Vua25vd24gUm9sZSc7XG5cbiAgICAvLyAzLiBFeHRyYWN0IENvbXBhbnlcbiAgICBjb25zdCBjb21wYW55U2VsZWN0b3JzID0gW1xuICAgICAgJy5qb2ItZGV0YWlscy1qb2JzLXVuaWZpZWQtdG9wLWNhcmRfX2NvbXBhbnktbmFtZSBhJyxcbiAgICAgICcuam9icy11bmlmaWVkLXRvcC1jYXJkX19jb21wYW55LW5hbWUgYScsXG4gICAgICAnLmpvYi1kZXRhaWxzLWpvYnMtdW5pZmllZC10b3AtY2FyZF9fY29tcGFueS1uYW1lJyxcbiAgICAgICcuam9icy11bmlmaWVkLXRvcC1jYXJkX19jb21wYW55LW5hbWUnLFxuICAgICAgJy5qb2JzLWRldGFpbHMtdG9wLWNhcmRfX2NvbXBhbnktbmFtZSBhJyxcbiAgICAgICcuam9icy1kZXRhaWxzLXRvcC1jYXJkX19jb21wYW55LW5hbWUnLFxuICAgICAgJy50b3BjYXJkX19mbGF2b3ItLW1ldGFkYXRhIGEnLFxuICAgICAgJy50b3BjYXJkX19mbGF2b3IgYScsXG4gICAgXTtcbiAgICBsZXQgY29tcGFueSA9IHRoaXMuZ2V0VGV4dEZyb21TZWxlY3RvcnMoY29tcGFueVNlbGVjdG9ycykgfHwgJ1Vua25vd24gQ29tcGFueSc7XG5cbiAgICAvLyBGYWxsYmFjayB1c2luZyBmaXJzdCBoMSBvbiBwYWdlIGlmIHRpdGxlIGlzIHN0aWxsIFVua25vd25cbiAgICBpZiAodGl0bGUgPT09ICdVbmtub3duIFJvbGUnKSB7XG4gICAgICBjb25zdCBmaXJzdEgxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDEnKTtcbiAgICAgIGlmIChmaXJzdEgxICYmIGZpcnN0SDEudGV4dENvbnRlbnQpIHtcbiAgICAgICAgdGl0bGUgPSBmaXJzdEgxLnRleHRDb250ZW50LnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgdXNpbmcgZG9jdW1lbnQudGl0bGUgaWYgdGl0bGUgb3IgY29tcGFueSBpcyBzdGlsbCBVbmtub3duXG4gICAgaWYgKHRpdGxlID09PSAnVW5rbm93biBSb2xlJyB8fCBjb21wYW55ID09PSAnVW5rbm93biBDb21wYW55Jykge1xuICAgICAgY29uc3QgZmFsbGJhY2sgPSB0aGlzLnBhcnNlRG9jdW1lbnRUaXRsZSgpO1xuICAgICAgaWYgKHRpdGxlID09PSAnVW5rbm93biBSb2xlJyAmJiBmYWxsYmFjay50aXRsZSkge1xuICAgICAgICB0aXRsZSA9IGZhbGxiYWNrLnRpdGxlO1xuICAgICAgfVxuICAgICAgaWYgKGNvbXBhbnkgPT09ICdVbmtub3duIENvbXBhbnknICYmIGZhbGxiYWNrLmNvbXBhbnkpIHtcbiAgICAgICAgY29tcGFueSA9IGZhbGxiYWNrLmNvbXBhbnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gNC4gRXh0cmFjdCBMb2NhdGlvblxuICAgIGNvbnN0IGxvY2F0aW9uU2VsZWN0b3JzID0gW1xuICAgICAgJy5qb2ItZGV0YWlscy1qb2JzLXVuaWZpZWQtdG9wLWNhcmRfX3ByaW1hcnktZGVzY3JpcHRpb24nLFxuICAgICAgJy5qb2JzLXVuaWZpZWQtdG9wLWNhcmRfX2J1bGxldCcsXG4gICAgICAnLmpvYnMtZGV0YWlscy10b3AtY2FyZF9fYnVsbGV0JyxcbiAgICAgICcudG9wY2FyZF9fZmxhdm9yLS1tZXRhZGF0YScsXG4gICAgICAnLnRvcGNhcmRfX2ZsYXZvcicsXG4gICAgXTtcbiAgICBsZXQgbG9jYXRpb25UZXh0ID0gdGhpcy5nZXRUZXh0RnJvbVNlbGVjdG9ycyhsb2NhdGlvblNlbGVjdG9ycykgfHwgJ1Vua25vd24gTG9jYXRpb24nO1xuICAgIC8vIENsZWFuIHVwIGxvY2F0aW9uIHRleHQgKExpbmtlZEluIHNvbWV0aW1lcyBwcmVmaXhlcyB3aXRoIGNvbXBhbnkgbmFtZSBvciBkZXRhaWxzKVxuICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5jbGVhbkxvY2F0aW9uVGV4dChsb2NhdGlvblRleHQsIGNvbXBhbnkpO1xuXG4gICAgLy8gNS4gRXh0cmFjdCBKb2IgRGVzY3JpcHRpb25cbiAgICBjb25zdCBkZXNjcmlwdGlvblNlbGVjdG9ycyA9IFtcbiAgICAgICcjam9iLWRldGFpbHMnLFxuICAgICAgJy5qb2JzLWRlc2NyaXB0aW9uLWNvbnRlbnRfX3RleHQnLFxuICAgICAgJy5qb2JzLWRlc2NyaXB0aW9uX19jb250ZW50JyxcbiAgICAgICcuam9icy1ib3hfX2h0bWwtY29udGVudCcsXG4gICAgICAnLmRlc2NyaXB0aW9uX190ZXh0JyxcbiAgICBdO1xuICAgIGNvbnN0IGpvYkRlc2NyaXB0aW9uID0gdGhpcy5nZXRIdG1sRnJvbVNlbGVjdG9ycyhkZXNjcmlwdGlvblNlbGVjdG9ycykgfHwgJ05vIGRlc2NyaXB0aW9uIGF2YWlsYWJsZS4nO1xuXG4gICAgLy8gNi4gRGV0ZXJtaW5lIFdvcmsgTW9kZSAoUmVtb3RlIC8gSHlicmlkIC8gT24tc2l0ZSlcbiAgICBjb25zdCB3b3JrTW9kZSA9IHRoaXMuZGV0ZWN0V29ya01vZGUobG9jYXRpb25UZXh0LCBqb2JEZXNjcmlwdGlvbik7XG5cbiAgICAvLyA3LiBEZXRlcm1pbmUgRW1wbG95bWVudCBUeXBlXG4gICAgY29uc3QgZW1wbG95bWVudFR5cGUgPSB0aGlzLmRldGVjdEVtcGxveW1lbnRUeXBlKGpvYkRlc2NyaXB0aW9uKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb21wYW55LFxuICAgICAgdGl0bGUsXG4gICAgICBsb2NhdGlvbixcbiAgICAgIGpvYlVybCxcbiAgICAgIGpvYkRlc2NyaXB0aW9uLFxuICAgICAgZW1wbG95bWVudFR5cGUsXG4gICAgICB3b3JrTW9kZSxcbiAgICAgIHBvcnRhbDogJ0xpbmtlZEluJyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDYW5vbmljYWxKb2JVcmwoKTogc3RyaW5nIHtcbiAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTCh1cmwpO1xuICAgICAgXG4gICAgICAvLyBUcnkgcGF0aCBwYXR0ZXJuIGZpcnN0OiAvam9icy92aWV3LzEyMzQ1Njc4OS9cbiAgICAgIGNvbnN0IGpvYklkTWF0Y2ggPSBwYXJzZWQucGF0aG5hbWUubWF0Y2goL1xcL2pvYnNcXC92aWV3XFwvKFxcZCspLyk7XG4gICAgICBpZiAoam9iSWRNYXRjaCkge1xuICAgICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9qb2JzL3ZpZXcvJHtqb2JJZE1hdGNoWzFdfS9gO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBUcnkgcXVlcnkgcGFyYW1ldGVyOiA/Y3VycmVudEpvYklkPTEyMzQ1Njc4OVxuICAgICAgY29uc3QgY3VycmVudEpvYklkID0gcGFyc2VkLnNlYXJjaFBhcmFtcy5nZXQoJ2N1cnJlbnRKb2JJZCcpO1xuICAgICAgaWYgKGN1cnJlbnRKb2JJZCkge1xuICAgICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9qb2JzL3ZpZXcvJHtjdXJyZW50Sm9iSWR9L2A7XG4gICAgICB9XG5cbiAgICAgIC8vIFRyeSByZWFkaW5nIGpvYiBJRCBmcm9tIGFjdGl2ZSBlbGVtZW50cyBvbiBwYWdlXG4gICAgICBjb25zdCBhY3RpdmVKb2JDYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmpvYnMtc2VhcmNoLXJlc3VsdHMtbGlzdF9fbGlzdC1pdGVtLS1hY3RpdmUsIFtkYXRhLWpvYi1pZF0nKTtcbiAgICAgIGlmIChhY3RpdmVKb2JDYXJkKSB7XG4gICAgICAgIGNvbnN0IGpvYklkID0gYWN0aXZlSm9iQ2FyZC5nZXRBdHRyaWJ1dGUoJ2RhdGEtam9iLWlkJykgfHwgYWN0aXZlSm9iQ2FyZC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb2NjbHVkYWJsZS1qb2ItaWQnKTtcbiAgICAgICAgaWYgKGpvYklkKSB7XG4gICAgICAgICAgcmV0dXJuIGBodHRwczovL3d3dy5saW5rZWRpbi5jb20vam9icy92aWV3LyR7am9iSWR9L2A7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwYXJzaW5nIEpvYiBVUkw6JywgZSk7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG4gIH1cblxuICBwcml2YXRlIGdldFRleHRGcm9tU2VsZWN0b3JzKHNlbGVjdG9yczogc3RyaW5nW10pOiBzdHJpbmcgfCBudWxsIHtcbiAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHNlbGVjdG9ycykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC50ZXh0Q29udGVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudC50ZXh0Q29udGVudC50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0SHRtbEZyb21TZWxlY3RvcnMoc2VsZWN0b3JzOiBzdHJpbmdbXSk6IHN0cmluZyB8IG51bGwge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2Ygc2VsZWN0b3JzKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAvLyBSZXR1cm4gaW5uZXJIVE1MIGJ1dCBjbGVhbiBpdCB1cCBzbGlnaHRseVxuICAgICAgICByZXR1cm4gZWxlbWVudC5pbm5lckhUTUwudHJpbSgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYW5Mb2NhdGlvblRleHQodGV4dDogc3RyaW5nLCBjb21wYW55OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCBjbGVhbmVkID0gdGV4dDtcbiAgICAvLyBSZW1vdmUgY29tcGFueSBuYW1lIHByZWZpeCBpZiBwcmVzZW50XG4gICAgaWYgKGNvbXBhbnkgJiYgY2xlYW5lZC5zdGFydHNXaXRoKGNvbXBhbnkpKSB7XG4gICAgICBjbGVhbmVkID0gY2xlYW5lZC5zdWJzdHJpbmcoY29tcGFueS5sZW5ndGgpLnRyaW0oKTtcbiAgICB9XG4gICAgLy8gUmVtb3ZlIGxlYWRpbmcgYnVsbGV0L2RvdHMvbmV3bGluZXNcbiAgICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9eW+KAosK3XFxzXFxyXFxuXFwtXFx1MDBCN10rLywgJycpLnRyaW0oKTtcbiAgICBcbiAgICAvLyBTcGxpdCBieSBjb21tb24gc2VwYXJhdG9ycyAobGlrZSBcIsK3XCIgb3IgXCJvdmVyIDEwIGFwcGxpY2FudHNcIikgYW5kIGtlZXAgdGhlIGZpcnN0IGNodW5rXG4gICAgY29uc3QgcGFydHMgPSBjbGVhbmVkLnNwbGl0KC9bwrdcXHUwMEI3XFxuXS8pO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjbGVhbmVkID0gcGFydHNbMF0udHJpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gY2xlYW5lZCB8fCAnVW5rbm93biBMb2NhdGlvbic7XG4gIH1cblxuICBwcml2YXRlIGRldGVjdFdvcmtNb2RlKGxvY2F0aW9uVGV4dDogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB0ZXh0VG9DaGVjayA9IGAke2xvY2F0aW9uVGV4dH0gJHtkZXNjcmlwdGlvbn1gLnRvTG93ZXJDYXNlKCk7XG4gICAgXG4gICAgaWYgKHRleHRUb0NoZWNrLmluY2x1ZGVzKCdyZW1vdGUnKSkge1xuICAgICAgcmV0dXJuICdSZW1vdGUnO1xuICAgIH0gZWxzZSBpZiAodGV4dFRvQ2hlY2suaW5jbHVkZXMoJ2h5YnJpZCcpKSB7XG4gICAgICByZXR1cm4gJ0h5YnJpZCc7XG4gICAgfSBlbHNlIGlmICh0ZXh0VG9DaGVjay5pbmNsdWRlcygnb24tc2l0ZScpIHx8IHRleHRUb0NoZWNrLmluY2x1ZGVzKCdvbnNpdGUnKSB8fCB0ZXh0VG9DaGVjay5pbmNsdWRlcygnaW4tb2ZmaWNlJykpIHtcbiAgICAgIHJldHVybiAnT24tc2l0ZSc7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBiYXNlZCBvbiBnZW5lcmFsIGluZm8gb3IgZmFsbGJhY2tcbiAgICByZXR1cm4gJ09uLXNpdGUnO1xuICB9XG5cbiAgcHJpdmF0ZSBkZXRlY3RFbXBsb3ltZW50VHlwZShkZXNjcmlwdGlvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBkZXNjTG93ZXIgPSBkZXNjcmlwdGlvbi50b0xvd2VyQ2FzZSgpO1xuXG4gICAgLy8gTG9vayBmb3IgZW1wbG95bWVudCB0eXBlIGJhZGdlcyBpbiB0aGUgdG9wIGNhcmQgaWYgdGhleSBleGlzdFxuICAgIGNvbnN0IGpvYkRldGFpbHNDYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmpvYi1kZXRhaWxzLWpvYnMtdW5pZmllZC10b3AtY2FyZF9fam9iLWluc2lnaHQnKTtcbiAgICBjb25zdCBjYXJkVGV4dCA9IGpvYkRldGFpbHNDYXJkPy50ZXh0Q29udGVudD8udG9Mb3dlckNhc2UoKSB8fCAnJztcblxuICAgIGNvbnN0IHRleHRUb1NlYXJjaCA9IGAke2NhcmRUZXh0fSAke2Rlc2NMb3dlcn1gO1xuXG4gICAgaWYgKHRleHRUb1NlYXJjaC5pbmNsdWRlcygnZnVsbC10aW1lJykgfHwgdGV4dFRvU2VhcmNoLmluY2x1ZGVzKCdmdWxsIHRpbWUnKSkge1xuICAgICAgcmV0dXJuICdGdWxsLXRpbWUnO1xuICAgIH0gZWxzZSBpZiAodGV4dFRvU2VhcmNoLmluY2x1ZGVzKCdwYXJ0LXRpbWUnKSB8fCB0ZXh0VG9TZWFyY2guaW5jbHVkZXMoJ3BhcnQgdGltZScpKSB7XG4gICAgICByZXR1cm4gJ1BhcnQtdGltZSc7XG4gICAgfSBlbHNlIGlmICh0ZXh0VG9TZWFyY2guaW5jbHVkZXMoJ2NvbnRyYWN0JykpIHtcbiAgICAgIHJldHVybiAnQ29udHJhY3QnO1xuICAgIH0gZWxzZSBpZiAodGV4dFRvU2VhcmNoLmluY2x1ZGVzKCdpbnRlcm5zaGlwJykgfHwgdGV4dFRvU2VhcmNoLmluY2x1ZGVzKCdpbnRlcm4nKSkge1xuICAgICAgcmV0dXJuICdJbnRlcm5zaGlwJztcbiAgICB9IGVsc2UgaWYgKHRleHRUb1NlYXJjaC5pbmNsdWRlcygndGVtcG9yYXJ5JykpIHtcbiAgICAgIHJldHVybiAnVGVtcG9yYXJ5JztcbiAgICB9XG5cbiAgICByZXR1cm4gJ0Z1bGwtdGltZSc7IC8vIERlZmF1bHQgdG8gRnVsbC10aW1lIGFzIHN0YW5kYXJkXG4gIH1cblxuICBwcml2YXRlIHBhcnNlRG9jdW1lbnRUaXRsZSgpOiB7IHRpdGxlOiBzdHJpbmc7IGNvbXBhbnk6IHN0cmluZyB9IHtcbiAgICBjb25zdCBkb2NUaXRsZSA9IGRvY3VtZW50LnRpdGxlO1xuICAgIC8vIFJlbW92ZSBub3RpZmljYXRpb24gY291bnQgbGlrZSAoMSkgb3IgKDEyKVxuICAgIGNvbnN0IGNsZWFuVGl0bGUgPSBkb2NUaXRsZS5yZXBsYWNlKC9eXFwoXFxkK1xcKVxccysvLCAnJykudHJpbSgpO1xuICAgIFxuICAgIC8vIENoZWNrIGZvciBcIkNvbXBhbnkgaGlyaW5nIFJvbGUuLi5cIiBvciBcIlJvbGUgYXQgQ29tcGFueS4uLlwiIG9yIFwiUm9sZSAtIENvbXBhbnkuLi5cIlxuICAgIC8vIFBhdHRlcm4gMTogXCJDb21wYW55IGhpcmluZyBSb2xlIGluIExvY2F0aW9uIHwgTGlua2VkSW5cIlxuICAgIGNvbnN0IGhpcmluZ01hdGNoID0gY2xlYW5UaXRsZS5tYXRjaCgvXiguKz8pXFxzK2hpcmluZ1xccysoLis/KVxccytpblxccysvaSk7XG4gICAgaWYgKGhpcmluZ01hdGNoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb21wYW55OiBoaXJpbmdNYXRjaFsxXS50cmltKCksXG4gICAgICAgIHRpdGxlOiBoaXJpbmdNYXRjaFsyXS50cmltKClcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gUGF0dGVybiAyOiBcIlJvbGUgYXQgQ29tcGFueSB8IExpbmtlZEluXCJcbiAgICBjb25zdCBhdE1hdGNoID0gY2xlYW5UaXRsZS5tYXRjaCgvXiguKz8pXFxzK2F0XFxzKyguKz8pKD86XFxzK1xcfHwkKS9pKTtcbiAgICBpZiAoYXRNYXRjaCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IGF0TWF0Y2hbMV0udHJpbSgpLFxuICAgICAgICBjb21wYW55OiBhdE1hdGNoWzJdLnRyaW0oKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBQYXR0ZXJuIDM6IFwiUm9sZSAtIENvbXBhbnkgfCBMaW5rZWRJblwiIG9yIHNpbWlsYXIgc2VwYXJhdG9yc1xuICAgIGNvbnN0IHBhcnRzID0gY2xlYW5UaXRsZS5zcGxpdCgnfCcpWzBdLnNwbGl0KCcgLSAnKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID49IDIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlOiBwYXJ0c1swXS50cmltKCksXG4gICAgICAgIGNvbXBhbnk6IHBhcnRzWzFdLnRyaW0oKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjayBzcGxpdCBieSBjb21tYSBvciBvdGhlciBjb21tb24gZGl2aWRlcnNcbiAgICBjb25zdCBjb21tYVBhcnRzID0gY2xlYW5UaXRsZS5zcGxpdCgnfCcpWzBdLnNwbGl0KCcsJyk7XG4gICAgaWYgKGNvbW1hUGFydHMubGVuZ3RoID49IDIpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlOiBjb21tYVBhcnRzWzBdLnRyaW0oKSxcbiAgICAgICAgY29tcGFueTogY29tbWFQYXJ0c1sxXS50cmltKClcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBjbGVhblRpdGxlLnNwbGl0KCd8JylbMF0udHJpbSgpLFxuICAgICAgY29tcGFueTogJ0xpbmtlZEluIENvbXBhbnknXG4gICAgfTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSm9iUG9ydGFsU2NyYXBlciwgU2NyYXBlZEpvYkRldGFpbHMgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIEluZGVlZFNjcmFwZXIgaW1wbGVtZW50cyBKb2JQb3J0YWxTY3JhcGVyIHtcbiAgaXNTdXBwb3J0ZWQodXJsOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdXJsLmluY2x1ZGVzKCdpbmRlZWQuY29tJyk7XG4gIH1cblxuICBhc3luYyBleHRyYWN0Sm9iRGV0YWlscygpOiBQcm9taXNlPFNjcmFwZWRKb2JEZXRhaWxzPiB7XG4gICAgY29uc3Qgam9iVXJsID0gdGhpcy5nZXRDYW5vbmljYWxKb2JVcmwoKTtcblxuICAgIC8vIDEuIEV4dHJhY3QgVGl0bGVcbiAgICBjb25zdCB0aXRsZVNlbGVjdG9ycyA9IFtcbiAgICAgICdoMS5qb2JzZWFyY2gtSm9iSW5mb0hlYWRlci10aXRsZScsXG4gICAgICAnW2RhdGEtdGVzdGlkPVwiam9ic2VhcmNoLUpvYkluZm9IZWFkZXItdGl0bGVcIl0nLFxuICAgICAgJy5qb2JzZWFyY2gtSm9iSW5mb0hlYWRlci10aXRsZS1jb250YWluZXIgaDEnLFxuICAgICAgJ2gyW2NsYXNzKj1cImpvYlRpdGxlXCJdJyxcbiAgICAgICdoMSdcbiAgICBdO1xuICAgIGxldCB0aXRsZSA9IHRoaXMuZ2V0VGV4dEZyb21TZWxlY3RvcnModGl0bGVTZWxlY3RvcnMpIHx8ICdVbmtub3duIFJvbGUnO1xuXG4gICAgLy8gMi4gRXh0cmFjdCBDb21wYW55XG4gICAgY29uc3QgY29tcGFueVNlbGVjdG9ycyA9IFtcbiAgICAgICdbZGF0YS10ZXN0aWQ9XCJpbmxpbmVIZWFkZXItY29tcGFueU5hbWVcIl0gYScsXG4gICAgICAnW2RhdGEtdGVzdGlkPVwiaW5saW5lSGVhZGVyLWNvbXBhbnlOYW1lXCJdJyxcbiAgICAgICdkaXYuam9ic2VhcmNoLUNvbXBhbnlJbmZvV2l0aG91dEhlYWRlckltYWdlIGEnLFxuICAgICAgJ2Rpdi5qb2JzZWFyY2gtQ29tcGFueUluZm9XaXRob3V0SGVhZGVySW1hZ2UnLFxuICAgICAgJ1tjbGFzcyo9XCJjb21wYW55TmFtZVwiXScsXG4gICAgICAnW2NsYXNzKj1cImNvbXBhbnlcIl0nXG4gICAgXTtcbiAgICBsZXQgY29tcGFueSA9IHRoaXMuZ2V0VGV4dEZyb21TZWxlY3RvcnMoY29tcGFueVNlbGVjdG9ycykgfHwgJ1Vua25vd24gQ29tcGFueSc7XG5cbiAgICAvLyBGYWxsYmFjazogcGFyc2UgZG9jdW1lbnQudGl0bGUgaWYgc2NyYXBlciByZXR1cm5zIFwiVW5rbm93biBSb2xlXCIgb3IgXCJVbmtub3duIENvbXBhbnlcIlxuICAgIGlmICh0aXRsZSA9PT0gJ1Vua25vd24gUm9sZScgfHwgY29tcGFueSA9PT0gJ1Vua25vd24gQ29tcGFueScpIHtcbiAgICAgIGNvbnN0IGZhbGxiYWNrID0gdGhpcy5wYXJzZURvY3VtZW50VGl0bGUoKTtcbiAgICAgIGlmICh0aXRsZSA9PT0gJ1Vua25vd24gUm9sZScgJiYgZmFsbGJhY2sudGl0bGUpIHtcbiAgICAgICAgdGl0bGUgPSBmYWxsYmFjay50aXRsZTtcbiAgICAgIH1cbiAgICAgIGlmIChjb21wYW55ID09PSAnVW5rbm93biBDb21wYW55JyAmJiBmYWxsYmFjay5jb21wYW55KSB7XG4gICAgICAgIGNvbXBhbnkgPSBmYWxsYmFjay5jb21wYW55O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIEV4dHJhY3QgTG9jYXRpb25cbiAgICBjb25zdCBsb2NhdGlvblNlbGVjdG9ycyA9IFtcbiAgICAgICdbZGF0YS10ZXN0aWQ9XCJpbmxpbmVIZWFkZXItY29tcGFueUxvY2F0aW9uXCJdJyxcbiAgICAgICdkaXYuam9ic2VhcmNoLUpvYkluZm9IZWFkZXItc3VidGl0bGUnLFxuICAgICAgJ1tjbGFzcyo9XCJjb21wYW55TG9jYXRpb25cIl0nLFxuICAgICAgJ1tjbGFzcyo9XCJsb2NhdGlvblwiXSdcbiAgICBdO1xuICAgIGNvbnN0IGxvY2F0aW9uVGV4dCA9IHRoaXMuZ2V0VGV4dEZyb21TZWxlY3RvcnMobG9jYXRpb25TZWxlY3RvcnMpIHx8ICdVbmtub3duIExvY2F0aW9uJztcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuY2xlYW5Mb2NhdGlvblRleHQobG9jYXRpb25UZXh0LCBjb21wYW55KTtcblxuICAgIC8vIDQuIEV4dHJhY3QgRGVzY3JpcHRpb25cbiAgICBjb25zdCBkZXNjcmlwdGlvblNlbGVjdG9ycyA9IFtcbiAgICAgICcjam9iRGVzY3JpcHRpb25UZXh0JyxcbiAgICAgICcuam9ic2VhcmNoLWpvYkRlc2NyaXB0aW9uVGV4dCcsXG4gICAgICAnW2lkKj1cImpvYkRlc2NyaXB0aW9uVGV4dFwiXSdcbiAgICBdO1xuICAgIGNvbnN0IGpvYkRlc2NyaXB0aW9uID0gdGhpcy5nZXRIdG1sRnJvbVNlbGVjdG9ycyhkZXNjcmlwdGlvblNlbGVjdG9ycykgfHwgJ05vIGRlc2NyaXB0aW9uIGF2YWlsYWJsZS4nO1xuXG4gICAgLy8gNS4gV29yayBNb2RlXG4gICAgY29uc3Qgd29ya01vZGUgPSB0aGlzLmRldGVjdFdvcmtNb2RlKGxvY2F0aW9uVGV4dCwgam9iRGVzY3JpcHRpb24pO1xuXG4gICAgLy8gNi4gRW1wbG95bWVudCBUeXBlXG4gICAgY29uc3QgZW1wbG95bWVudFR5cGUgPSB0aGlzLmRldGVjdEVtcGxveW1lbnRUeXBlKGpvYkRlc2NyaXB0aW9uKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb21wYW55LFxuICAgICAgdGl0bGUsXG4gICAgICBsb2NhdGlvbixcbiAgICAgIGpvYlVybCxcbiAgICAgIGpvYkRlc2NyaXB0aW9uLFxuICAgICAgZW1wbG95bWVudFR5cGUsXG4gICAgICB3b3JrTW9kZSxcbiAgICAgIHBvcnRhbDogJ0luZGVlZCdcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDYW5vbmljYWxKb2JVcmwoKTogc3RyaW5nIHtcbiAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTCh1cmwpO1xuICAgICAgY29uc3QgamsgPSBwYXJzZWQuc2VhcmNoUGFyYW1zLmdldCgnamsnKTtcbiAgICAgIGlmIChqaykge1xuICAgICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmluZGVlZC5jb20vdmlld2pvYj9qaz0ke2prfWA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IGNhbm9uaWNhbExpbmsgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpO1xuICAgICAgaWYgKGNhbm9uaWNhbExpbmspIHtcbiAgICAgICAgY29uc3QgaHJlZiA9IGNhbm9uaWNhbExpbmsuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgICAgIGlmIChocmVmKSByZXR1cm4gaHJlZjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwYXJzaW5nIEluZGVlZCBKb2IgVVJMOicsIGUpO1xuICAgIH1cbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUZXh0RnJvbVNlbGVjdG9ycyhzZWxlY3RvcnM6IHN0cmluZ1tdKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBzZWxlY3RvcnMpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQudGV4dENvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQudGV4dENvbnRlbnQudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGdldEh0bWxGcm9tU2VsZWN0b3JzKHNlbGVjdG9yczogc3RyaW5nW10pOiBzdHJpbmcgfCBudWxsIHtcbiAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIHNlbGVjdG9ycykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuaW5uZXJIVE1MLnRyaW0oKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNsZWFuTG9jYXRpb25UZXh0KHRleHQ6IHN0cmluZywgY29tcGFueTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgY2xlYW5lZCA9IHRleHQ7XG4gICAgaWYgKGNvbXBhbnkgJiYgY2xlYW5lZC5zdGFydHNXaXRoKGNvbXBhbnkpKSB7XG4gICAgICBjbGVhbmVkID0gY2xlYW5lZC5zdWJzdHJpbmcoY29tcGFueS5sZW5ndGgpLnRyaW0oKTtcbiAgICB9XG4gICAgY2xlYW5lZCA9IGNsZWFuZWQucmVwbGFjZSgvXlvigKLCt1xcc1xcclxcblxcLVxcdTAwQjddKy8sICcnKS50cmltKCk7XG4gICAgY29uc3QgcGFydHMgPSBjbGVhbmVkLnNwbGl0KC9bwrdcXHUwMEI3XFxuXS8pO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjbGVhbmVkID0gcGFydHNbMF0udHJpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gY2xlYW5lZCB8fCAnVW5rbm93biBMb2NhdGlvbic7XG4gIH1cblxuICBwcml2YXRlIGRldGVjdFdvcmtNb2RlKGxvY2F0aW9uVGV4dDogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB0ZXh0VG9DaGVjayA9IGAke2xvY2F0aW9uVGV4dH0gJHtkZXNjcmlwdGlvbn1gLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKHRleHRUb0NoZWNrLmluY2x1ZGVzKCdyZW1vdGUnKSkge1xuICAgICAgcmV0dXJuICdSZW1vdGUnO1xuICAgIH0gZWxzZSBpZiAodGV4dFRvQ2hlY2suaW5jbHVkZXMoJ2h5YnJpZCcpKSB7XG4gICAgICByZXR1cm4gJ0h5YnJpZCc7XG4gICAgfSBlbHNlIGlmICh0ZXh0VG9DaGVjay5pbmNsdWRlcygnb24tc2l0ZScpIHx8IHRleHRUb0NoZWNrLmluY2x1ZGVzKCdvbnNpdGUnKSB8fCB0ZXh0VG9DaGVjay5pbmNsdWRlcygnaW4tb2ZmaWNlJykpIHtcbiAgICAgIHJldHVybiAnT24tc2l0ZSc7XG4gICAgfVxuICAgIHJldHVybiAnT24tc2l0ZSc7XG4gIH1cblxuICBwcml2YXRlIGRldGVjdEVtcGxveW1lbnRUeXBlKGRlc2NyaXB0aW9uOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRlc2NMb3dlciA9IGRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGRlc2NMb3dlci5pbmNsdWRlcygnZnVsbC10aW1lJykgfHwgZGVzY0xvd2VyLmluY2x1ZGVzKCdmdWxsIHRpbWUnKSkge1xuICAgICAgcmV0dXJuICdGdWxsLXRpbWUnO1xuICAgIH0gZWxzZSBpZiAoZGVzY0xvd2VyLmluY2x1ZGVzKCdwYXJ0LXRpbWUnKSB8fCBkZXNjTG93ZXIuaW5jbHVkZXMoJ3BhcnQgdGltZScpKSB7XG4gICAgICByZXR1cm4gJ1BhcnQtdGltZSc7XG4gICAgfSBlbHNlIGlmIChkZXNjTG93ZXIuaW5jbHVkZXMoJ2NvbnRyYWN0JykpIHtcbiAgICAgIHJldHVybiAnQ29udHJhY3QnO1xuICAgIH0gZWxzZSBpZiAoZGVzY0xvd2VyLmluY2x1ZGVzKCdpbnRlcm5zaGlwJykgfHwgZGVzY0xvd2VyLmluY2x1ZGVzKCdpbnRlcm4nKSkge1xuICAgICAgcmV0dXJuICdJbnRlcm5zaGlwJztcbiAgICB9IGVsc2UgaWYgKGRlc2NMb3dlci5pbmNsdWRlcygndGVtcG9yYXJ5JykpIHtcbiAgICAgIHJldHVybiAnVGVtcG9yYXJ5JztcbiAgICB9XG4gICAgcmV0dXJuICdGdWxsLXRpbWUnO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZURvY3VtZW50VGl0bGUoKTogeyB0aXRsZTogc3RyaW5nOyBjb21wYW55OiBzdHJpbmcgfSB7XG4gICAgY29uc3QgZG9jVGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICBjb25zdCBjbGVhblRpdGxlID0gZG9jVGl0bGUucmVwbGFjZSgvXlxcKFxcZCtcXClcXHMrLywgJycpLnRyaW0oKTtcbiAgICBcbiAgICBjb25zdCBwYXJ0cyA9IGNsZWFuVGl0bGUuc3BsaXQoJ3wnKVswXS5zcGxpdCgnIC0gJyk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogcGFydHNbMF0udHJpbSgpLFxuICAgICAgICBjb21wYW55OiBwYXJ0c1sxXS50cmltKClcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgYXRNYXRjaCA9IGNsZWFuVGl0bGUubWF0Y2goL14oLis/KVxccythdFxccysoLis/KSg/OlxccytcXHx8JCkvaSk7XG4gICAgaWYgKGF0TWF0Y2gpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlOiBhdE1hdGNoWzFdLnRyaW0oKSxcbiAgICAgICAgY29tcGFueTogYXRNYXRjaFsyXS50cmltKClcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBjbGVhblRpdGxlLnNwbGl0KCd8JylbMF0udHJpbSgpLFxuICAgICAgY29tcGFueTogJ0luZGVlZCBDb21wYW55J1xuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCB7IGRlZmluZUNvbnRlbnRTY3JpcHQgfSBmcm9tICd3eHQvc2FuZGJveCc7XG5pbXBvcnQgeyBMaW5rZWRJblNjcmFwZXIgfSBmcm9tICdAL3NlcnZpY2VzL3NjcmFwZXIvTGlua2VkSW5TY3JhcGVyJztcbmltcG9ydCB7IEluZGVlZFNjcmFwZXIgfSBmcm9tICdAL3NlcnZpY2VzL3NjcmFwZXIvSW5kZWVkU2NyYXBlcic7XG5pbXBvcnQgeyBTY3JhcGVkSm9iRGV0YWlscywgSm9iUG9ydGFsU2NyYXBlciB9IGZyb20gJ0Avc2VydmljZXMvc2NyYXBlci90eXBlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbXG4gICAgJ2h0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9qb2JzLyonLFxuICAgICdodHRwczovL3d3dy5saW5rZWRpbi5jb20vam9icy92aWV3LyonLFxuICAgICdodHRwczovLyouaW5kZWVkLmNvbS8qJyxcbiAgICAnaHR0cHM6Ly9pbmRlZWQuY29tLyonXG4gIF0sXG4gIHJ1bkF0OiAnZG9jdW1lbnRfZW5kJyxcbiAgbWFpbigpIHtcbiAgICBjb25zdCBzY3JhcGVyczogSm9iUG9ydGFsU2NyYXBlcltdID0gW1xuICAgICAgbmV3IExpbmtlZEluU2NyYXBlcigpLFxuICAgICAgbmV3IEluZGVlZFNjcmFwZXIoKVxuICAgIF07XG5cbiAgICBmdW5jdGlvbiBnZXRBY3RpdmVTY3JhcGVyKCk6IEpvYlBvcnRhbFNjcmFwZXIgfCB1bmRlZmluZWQge1xuICAgICAgcmV0dXJuIHNjcmFwZXJzLmZpbmQocyA9PiBzLmlzU3VwcG9ydGVkKHdpbmRvdy5sb2NhdGlvbi5ocmVmKSk7XG4gICAgfVxuXG4gICAgbGV0IGN1cnJlbnRVcmwgPSAnJztcbiAgICBsZXQgYWN0aXZlT3ZlcmxheTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICBjb25zdCBzZXNzaW9uVHJhY2tlZFVybHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBsb2dvVXJsID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKCdpY29ucy9pY29uNDgucG5nJyk7XG5cbiAgICAvLyBQZXJpb2RpYyBvYnNlcnZlciB0byBkZXRlY3QgVVJMIGNoYW5nZXMgYW5kIGJpbmQgYXBwbHkgYnV0dG9uIGxpc3RlbmVyc1xuICAgIGZ1bmN0aW9uIGluaXRVcmxPYnNlcnZlcigpIHtcbiAgICAgIGN1cnJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgIFxuICAgICAgLy8gUGVyaW9kaWNhbGx5IGNoZWNrIGZvciBwYWdlIHN0YXRlXG4gICAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIC8vIElmIFVSTCBjaGFuZ2VkLCBjbG9zZSBhbnkgc3RhbGUgdHJhY2tpbmcgY2FyZHNcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ocmVmICE9PSBjdXJyZW50VXJsKSB7XG4gICAgICAgICAgY3VycmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgICAgIHJlbW92ZU92ZXJsYXkoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF0dGFjaCBsaXN0ZW5lcnMgdG8gbmV3bHkgcmVuZGVyZWQgYXBwbHkgYnV0dG9uc1xuICAgICAgICBjb25zdCBhY3RpdmVTY3JhcGVyID0gZ2V0QWN0aXZlU2NyYXBlcigpO1xuICAgICAgICBpZiAoYWN0aXZlU2NyYXBlcikge1xuICAgICAgICAgIGJpbmRBcHBseUJ1dHRvbkxpc3RlbmVycyhhY3RpdmVTY3JhcGVyKTtcbiAgICAgICAgICBiaW5kU3VibWl0QnV0dG9uTGlzdGVuZXIoYWN0aXZlU2NyYXBlcik7XG4gICAgICAgICAgY2hlY2tFYXN5QXBwbHlTdWNjZXNzKGFjdGl2ZVNjcmFwZXIpO1xuICAgICAgICB9XG4gICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIEFwcGx5IGFuZCBFYXN5IEFwcGx5IGJ1dHRvbnMgYW5kIGF0dGFjaCBjbGljayB0cmlnZ2Vyc1xuICAgIGZ1bmN0aW9uIGJpbmRBcHBseUJ1dHRvbkxpc3RlbmVycyhhY3RpdmVTY3JhcGVyOiBKb2JQb3J0YWxTY3JhcGVyKSB7XG4gICAgICBjb25zdCBhcHBseUJ1dHRvbnMgPSBmaW5kQXBwbHlCdXR0b25zKCk7XG4gICAgICBhcHBseUJ1dHRvbnMuZm9yRWFjaChidXR0b24gPT4ge1xuICAgICAgICBpZiAoYnV0dG9uLmdldEF0dHJpYnV0ZSgnZGF0YS1qb2JmbG93LWxpc3RlbmVkJykgPT09ICd0cnVlJykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBidXR0b24uc2V0QXR0cmlidXRlKCdkYXRhLWpvYmZsb3ctbGlzdGVuZWQnLCAndHJ1ZScpO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgdGV4dCA9IGJ1dHRvbi50ZXh0Q29udGVudD8udHJpbSgpLnRvTG93ZXJDYXNlKCkgfHwgJyc7XG4gICAgICAgIGNvbnN0IGlzRWFzeUFwcGx5ID0gdGV4dC5pbmNsdWRlcygnZWFzeSBhcHBseScpIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuY29udGFpbnMoJ2luZGVlZC1hcHBseS1idXR0b24nKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24uaWQuaW5jbHVkZXMoJ2luZGVlZEFwcGx5QnV0dG9uJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24uZ2V0QXR0cmlidXRlKCdkYXRhLXRlc3RpZCcpID09PSAnaW5kZWVkLWFwcGx5LWJ1dHRvbic7XG5cbiAgICAgICAgaWYgKGlzRWFzeUFwcGx5KSB7XG4gICAgICAgICAgLy8gRm9yIEVhc3kgQXBwbHksIHdlIGRvIE5PVCBzYXZlIGltbWVkaWF0ZWx5IG9uIGNsaWNraW5nIFwiRWFzeSBBcHBseVwiLlxuICAgICAgICAgIC8vIFdlIHdpbGwgbW9uaXRvciBmb3IgdGhlIGZpbmFsIHN1Ym1pdCBvciBzdWNjZXNzIHN0YXRlLlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdKb2JGbG93OiBFYXN5IEFwcGx5IC8gSW5saW5lIEFwcGx5IGJ1dHRvbiBkZXRlY3RlZC4gTW9uaXRvcmluZyBtb2RhbC4uLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEZvciBleHRlcm5hbCBBcHBseSwgc2F2ZSBpbW1lZGlhdGVseSB3aGVuIGNsaWNrZWRcbiAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSm9iRmxvdzogRXh0ZXJuYWwgQXBwbHkgYnV0dG9uIGNsaWNrZWQuIFNhdmluZy4uLicpO1xuICAgICAgICAgICAgdHJpZ2dlclNhdmVXb3JrZmxvdyhhY3RpdmVTY3JhcGVyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluZEFwcGx5QnV0dG9ucygpOiBIVE1MRWxlbWVudFtdIHtcbiAgICAgIGNvbnN0IGJ1dHRvbnM6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgICAgIGNvbnN0IHNlbGVjdG9ycyA9IFtcbiAgICAgICAgLy8gTGlua2VkSW5cbiAgICAgICAgJy5qb2JzLWFwcGx5LWJ1dHRvbicsXG4gICAgICAgICcuam9icy1zLWFwcGx5IGJ1dHRvbicsXG4gICAgICAgICdidXR0b24uam9icy1hcHBseS1idXR0b24tLXRvcC1jYXJkJyxcbiAgICAgICAgJ1tkYXRhLWNvbnRyb2wtbmFtZT1cImpvYl9hcHBseVwiXScsXG4gICAgICAgICcuam9icy1hcHBseS1idXR0b24tLXRvcC1jYXJkIGJ1dHRvbicsXG4gICAgICAgIC8vIEluZGVlZFxuICAgICAgICAnYS5pbmRlZWQtYXBwbHktYnV0dG9uJyxcbiAgICAgICAgJ2J1dHRvbltpZCo9XCJpbmRlZWRBcHBseUJ1dHRvblwiXScsXG4gICAgICAgICcjaW5kZWVkQXBwbHlCdXR0b24nLFxuICAgICAgICAnW2RhdGEtdGVzdGlkPVwiaW5kZWVkLWFwcGx5LWJ1dHRvblwiXScsXG4gICAgICAgICdbZGF0YS10ZXN0aWQ9XCJqb2JzZWFyY2gtVmlld0pvYkJ1dHRvbnMtY29udGFpbmVyXCJdIGJ1dHRvbicsXG4gICAgICAgICdbZGF0YS10ZXN0aWQ9XCJqb2JzZWFyY2gtVmlld0pvYkJ1dHRvbnMtY29udGFpbmVyXCJdIGEnLFxuICAgICAgICAnI2FwcGx5QnV0dG9uTGlua0NvbnRhaW5lciBhJyxcbiAgICAgICAgJy5pbmRlZWQtYXBwbHktYnV0dG9uJ1xuICAgICAgXTtcblxuICAgICAgc2VsZWN0b3JzLmZvckVhY2goc2VsID0+IHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWwpLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgICBidXR0b25zLnB1c2goZWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gRmFsbGJhY2s6IGNoZWNrIGFsbCBidXR0b25zIGFuZCBsaW5rcyBvbiBwYWdlIGZvciBcImFwcGx5XCIgdGV4dFxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYnV0dG9uLCBhJykuZm9yRWFjaChidG4gPT4ge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYnRuLnRleHRDb250ZW50Py50cmltKCkudG9Mb3dlckNhc2UoKSB8fCAnJztcbiAgICAgICAgY29uc3QgbWF0Y2hlc1RleHQgPSB0ZXh0ID09PSAnYXBwbHknIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPT09ICdlYXN5IGFwcGx5JyB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LmluY2x1ZGVzKCdhcHBseSBub3cnKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LmluY2x1ZGVzKCdhcHBseSBvbiBjb21wYW55IHNpdGUnKTtcbiAgICAgICAgaWYgKG1hdGNoZXNUZXh0ICYmICFidXR0b25zLmluY2x1ZGVzKGJ0biBhcyBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICBidXR0b25zLnB1c2goYnRuIGFzIEhUTUxFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBidXR0b25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJpbmRTdWJtaXRCdXR0b25MaXN0ZW5lcihhY3RpdmVTY3JhcGVyOiBKb2JQb3J0YWxTY3JhcGVyKSB7XG4gICAgICBjb25zdCBzdWJtaXRCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYnV0dG9uJyk7XG4gICAgICBzdWJtaXRCdXR0b25zLmZvckVhY2goYnV0dG9uID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGJ1dHRvbi50ZXh0Q29udGVudD8udHJpbSgpLnRvTG93ZXJDYXNlKCkgfHwgJyc7XG4gICAgICAgIGNvbnN0IGFyaWFMYWJlbCA9IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnKT8udG9Mb3dlckNhc2UoKSB8fCAnJztcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGlzU3VibWl0ID0gdGV4dCA9PT0gJ3N1Ym1pdCBhcHBsaWNhdGlvbicgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9PT0gJ3N1Ym1pdCB5b3VyIGFwcGxpY2F0aW9uJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPT09ICdzdWJtaXQnIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWFMYWJlbCA9PT0gJ3N1Ym1pdCBhcHBsaWNhdGlvbicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhTGFiZWwgPT09ICdzdWJtaXQnO1xuXG4gICAgICAgIGlmIChpc1N1Ym1pdCAmJiBidXR0b24uZ2V0QXR0cmlidXRlKCdkYXRhLWpvYmZsb3ctbGlzdGVuZWQnKSAhPT0gJ3RydWUnKSB7XG4gICAgICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGF0YS1qb2JmbG93LWxpc3RlbmVkJywgJ3RydWUnKTtcbiAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSm9iRmxvdzogU3VibWl0IGFwcGxpY2F0aW9uIGJ1dHRvbiBjbGlja2VkISBTYXZpbmcuLi4nKTtcbiAgICAgICAgICAgIHRyaWdnZXJTYXZlV29ya2Zsb3coYWN0aXZlU2NyYXBlcik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrRWFzeUFwcGx5U3VjY2VzcyhhY3RpdmVTY3JhcGVyOiBKb2JQb3J0YWxTY3JhcGVyKSB7XG4gICAgICBjb25zdCBzdWNjZXNzUGhyYXNlcyA9IFtcbiAgICAgICAgJ2FwcGxpY2F0aW9uIHNlbnQnLFxuICAgICAgICAnYXBwbGljYXRpb24gc3VibWl0dGVkJyxcbiAgICAgICAgJ3lvdXIgYXBwbGljYXRpb24gd2FzIHNlbnQnLFxuICAgICAgICAnc3VjY2Vzc2Z1bGx5IGFwcGxpZWQnLFxuICAgICAgICAneW91ciBhcHBsaWNhdGlvbiBoYXMgYmVlbiBzdWJtaXR0ZWQnXG4gICAgICBdO1xuXG4gICAgICAvLyAxLiBDaGVjayBwYXJlbnQgd2luZG93IG1vZGFsXG4gICAgICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qb2JzLWVhc3ktYXBwbHktbW9kYWwsIFtyb2xlPVwiZGlhbG9nXCJdLCAuYXJ0ZGVjby1tb2RhbCwgLmlhLUJhc2VNb2RhbCwgW2lkKj1cImluZGVlZC1pYVwiXScpO1xuICAgICAgaWYgKG1vZGFsKSB7XG4gICAgICAgIGNvbnN0IG1vZGFsVGV4dCA9IG1vZGFsLnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICBjb25zdCBoYXNTdWNjZXNzID0gc3VjY2Vzc1BocmFzZXMuc29tZShwaHJhc2UgPT4gbW9kYWxUZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocGhyYXNlKSk7XG4gICAgICAgIGlmIChoYXNTdWNjZXNzKSB7XG4gICAgICAgICAgY29uc3QgY3VycmVudEpvYlVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgICAgIGlmICghc2Vzc2lvblRyYWNrZWRVcmxzLmhhcyhjdXJyZW50Sm9iVXJsKSkge1xuICAgICAgICAgICAgc2Vzc2lvblRyYWNrZWRVcmxzLmFkZChjdXJyZW50Sm9iVXJsKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdKb2JGbG93OiBEZXRlY3RlZCBFYXN5IEFwcGx5IHN1Y2Nlc3Mgc2NyZWVuISBTYXZpbmcuLi4nKTtcbiAgICAgICAgICAgIHRyaWdnZXJTYXZlV29ya2Zsb3coYWN0aXZlU2NyYXBlcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyAyLiBDaGVjayBzYW1lLW9yaWdpbiBpZnJhbWVzIChjb21tb24gb24gSW5kZWVkKVxuICAgICAgY29uc3QgaWZyYW1lcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lmcmFtZScpO1xuICAgICAgaWZyYW1lcy5mb3JFYWNoKGlmcmFtZSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgaWZyYW1lRG9jID0gaWZyYW1lLmNvbnRlbnREb2N1bWVudCB8fCBpZnJhbWUuY29udGVudFdpbmRvdz8uZG9jdW1lbnQ7XG4gICAgICAgICAgaWYgKGlmcmFtZURvYykge1xuICAgICAgICAgICAgY29uc3QgaWZyYW1lVGV4dCA9IGlmcmFtZURvYy5ib2R5LnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgICAgY29uc3QgaGFzU3VjY2VzcyA9IHN1Y2Nlc3NQaHJhc2VzLnNvbWUocGhyYXNlID0+IGlmcmFtZVRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhwaHJhc2UpKTtcbiAgICAgICAgICAgIGlmIChoYXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRKb2JVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICAgICAgaWYgKCFzZXNzaW9uVHJhY2tlZFVybHMuaGFzKGN1cnJlbnRKb2JVcmwpKSB7XG4gICAgICAgICAgICAgICAgc2Vzc2lvblRyYWNrZWRVcmxzLmFkZChjdXJyZW50Sm9iVXJsKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSm9iRmxvdzogRGV0ZWN0ZWQgRWFzeSBBcHBseSBzdWNjZXNzIHNjcmVlbiBpbiBpZnJhbWUhIFNhdmluZy4uLicpO1xuICAgICAgICAgICAgICAgIHRyaWdnZXJTYXZlV29ya2Zsb3coYWN0aXZlU2NyYXBlcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBDcm9zcy1vcmlnaW4gaWZyYW1lIHNlY3VyaXR5IGJsb2NrLCBpZ25vcmVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU2NyYXBlIGFuZCBkaXNwbGF5IGNvbmZpcm1hdGlvbiBvdmVybGF5XG4gICAgYXN5bmMgZnVuY3Rpb24gdHJpZ2dlclNhdmVXb3JrZmxvdyhhY3RpdmVTY3JhcGVyOiBKb2JQb3J0YWxTY3JhcGVyKSB7XG4gICAgICBpZiAoIWFjdGl2ZVNjcmFwZXIuaXNTdXBwb3J0ZWQod2luZG93LmxvY2F0aW9uLmhyZWYpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gQnJpZWYgZGVsYXkgdG8gYWxsb3cgRE9NIHRyYW5zaXRpb24gKGVzcGVjaWFsbHkgZm9yIGR5bmFtaWMgbW9kYWwgdHJpZ2dlcnMpXG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBkZXRhaWxzID0gYXdhaXQgYWN0aXZlU2NyYXBlci5leHRyYWN0Sm9iRGV0YWlscygpO1xuICAgICAgICAgIGlmICghZGV0YWlscyB8fCAhZGV0YWlscy5qb2JVcmwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignSm9iRmxvdzogU2NyYXBlciByZXR1cm5lZCBpbmNvbXBsZXRlIGRldGFpbHMuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZGV0YWlscy50aXRsZSB8fCBkZXRhaWxzLnRpdGxlID09PSAnVW5rbm93biBSb2xlJykge1xuICAgICAgICAgICAgZGV0YWlscy50aXRsZSA9ICdKb2IgQXBwbGljYXRpb24nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWRldGFpbHMuY29tcGFueSB8fCBkZXRhaWxzLmNvbXBhbnkgPT09ICdVbmtub3duIENvbXBhbnknKSB7XG4gICAgICAgICAgICBkZXRhaWxzLmNvbXBhbnkgPSBhY3RpdmVTY3JhcGVyIGluc3RhbmNlb2YgTGlua2VkSW5TY3JhcGVyID8gJ0xpbmtlZEluJyA6ICdJbmRlZWQnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENoZWNrIGlmIGR1cGxpY2F0ZSBpbiBzdG9yYWdlXG4gICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgICB7IGFjdGlvbjogJ0NIRUNLX0RVUExJQ0FURScsIHBheWxvYWQ6IHsgdXJsOiBkZXRhaWxzLmpvYlVybCB9IH0sXG4gICAgICAgICAgICAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignSm9iRmxvdyBkdXBsaWNhdGUgY2hlY2sgZXJyb3I6JywgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBpc1RyYWNrZWQgPSByZXNwb25zZSAmJiByZXNwb25zZS5leGlzdHM7XG4gICAgICAgICAgICAgIGNvbnN0IHRyYWNrZWRBcHAgPSByZXNwb25zZSAmJiByZXNwb25zZS5hcHA7XG5cbiAgICAgICAgICAgICAgaW5qZWN0T3ZlcmxheShkZXRhaWxzLCBpc1RyYWNrZWQsIHRyYWNrZWRBcHApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdKb2JGbG93IHRyaWdnZXIgZXJyb3I6JywgZSk7XG4gICAgICAgIH1cbiAgICAgIH0sIDMwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlT3ZlcmxheSgpIHtcbiAgICAgIGlmIChhY3RpdmVPdmVybGF5KSB7XG4gICAgICAgIGFjdGl2ZU92ZXJsYXkucmVtb3ZlKCk7XG4gICAgICAgIGFjdGl2ZU92ZXJsYXkgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluamVjdE92ZXJsYXkoZGV0YWlsczogU2NyYXBlZEpvYkRldGFpbHMsIGlzVHJhY2tlZDogYm9vbGVhbiwgdHJhY2tlZEFwcDogYW55KSB7XG4gICAgICByZW1vdmVPdmVybGF5KCk7XG5cbiAgICAgIC8vIENyZWF0ZSBob3N0IGVsZW1lbnQgZm9yIFNoYWRvdyBET01cbiAgICAgIGNvbnN0IGhvc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGhvc3QuaWQgPSAnam9iZmxvdy10cmFja2VyLXJvb3QnO1xuICAgICAgaG9zdC5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICBob3N0LnN0eWxlLmJvdHRvbSA9ICcyMHB4JztcbiAgICAgIGhvc3Quc3R5bGUucmlnaHQgPSAnMjBweCc7XG4gICAgICBob3N0LnN0eWxlLnpJbmRleCA9ICc5OTk5OTknO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChob3N0KTtcbiAgICAgIGFjdGl2ZU92ZXJsYXkgPSBob3N0O1xuXG4gICAgICBjb25zdCBzaGFkb3cgPSBob3N0LmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcblxuICAgICAgLy8gTG9hZCBzdHlsZXNoZWV0IGluc2lkZSBTaGFkb3cgRE9NXG4gICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbiAgICAgICAgLmpvYmZsb3ctY2FyZCB7XG4gICAgICAgICAgZm9udC1mYW1pbHk6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgd2lkdGg6IDMyMHB4O1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMwZjE3MmE7XG4gICAgICAgICAgY29sb3I6ICNmOGZhZmM7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzMzNDE1NTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgICAgICAgIHBhZGRpbmc6IDE2cHg7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCAxMHB4IDI1cHggLTVweCByZ2JhKDAsIDAsIDAsIDAuMyksIDAgOHB4IDEwcHggLTZweCByZ2JhKDAsIDAsIDAsIDAuMyk7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuM3MgY3ViaWMtYmV6aWVyKDAuNCwgMCwgMC4yLCAxKTtcbiAgICAgICAgfVxuICAgICAgICAuam9iZmxvdy1oZWFkZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTJweDtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzFlMjkzYjtcbiAgICAgICAgICBwYWRkaW5nLWJvdHRvbTogOHB4O1xuICAgICAgICB9XG4gICAgICAgIC5qb2JmbG93LXRpdGxlIHtcbiAgICAgICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICBjb2xvcjogIzgxOGNmODtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA2cHg7XG4gICAgICAgIH1cbiAgICAgICAgLmpvYmZsb3ctY2xvc2Uge1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBjb2xvcjogIzk0YTNiODtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgcGFkZGluZzogNHB4O1xuICAgICAgICB9XG4gICAgICAgIC5qb2JmbG93LWNsb3NlOmhvdmVyIHtcbiAgICAgICAgICBjb2xvcjogI2YxZjVmOTtcbiAgICAgICAgfVxuICAgICAgICAuam9iLWluZm8ge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxMnB4O1xuICAgICAgICB9XG4gICAgICAgIC5qb2Itcm9sZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgY29sb3I6ICNmMWY1Zjk7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMnB4O1xuICAgICAgICB9XG4gICAgICAgIC5qb2ItY29tcGFueSB7XG4gICAgICAgICAgY29sb3I6ICM5NGEzYjg7XG4gICAgICAgIH1cbiAgICAgICAgLmZvcm0tZ3JvdXAge1xuICAgICAgICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gICAgICAgIH1cbiAgICAgICAgLmZvcm0tbGFiZWwge1xuICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBjb2xvcjogIzk0YTNiODtcbiAgICAgICAgICBtYXJnaW4tYm90dG9tOiA0cHg7XG4gICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICBsZXR0ZXItc3BhY2luZzogMC4wNWVtO1xuICAgICAgICB9XG4gICAgICAgIC5mb3JtLXNlbGVjdCwgLmZvcm0taW5wdXQsIC5mb3JtLXRleHRhcmVhIHtcbiAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWUyOTNiO1xuICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICMzMzQxNTU7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgIGNvbG9yOiAjZjFmNWY5O1xuICAgICAgICAgIHBhZGRpbmc6IDhweDtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgfVxuICAgICAgICAuZm9ybS1zZWxlY3Q6Zm9jdXMsIC5mb3JtLWlucHV0OmZvY3VzLCAuZm9ybS10ZXh0YXJlYTpmb2N1cyB7XG4gICAgICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICM2MzY2ZjE7XG4gICAgICAgIH1cbiAgICAgICAgLmZvcm0tdGV4dGFyZWEge1xuICAgICAgICAgIGhlaWdodDogNTBweDtcbiAgICAgICAgICByZXNpemU6IHZlcnRpY2FsO1xuICAgICAgICB9XG4gICAgICAgIC5idG4tY29udGFpbmVyIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIG1hcmdpbi10b3A6IDE0cHg7XG4gICAgICAgIH1cbiAgICAgICAgLmJ0biB7XG4gICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICBwYWRkaW5nOiA4cHggMTJweDtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgIH1cbiAgICAgICAgLmJ0bi1wcmltYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjNGY0NmU1O1xuICAgICAgICAgIGNvbG9yOiAjZmZmZmZmO1xuICAgICAgICB9XG4gICAgICAgIC5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzQzMzhjYTtcbiAgICAgICAgfVxuICAgICAgICAuYnRuLXNlY29uZGFyeSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzMzNDE1NTtcbiAgICAgICAgICBjb2xvcjogI2NiZDVlMTtcbiAgICAgICAgfVxuICAgICAgICAuYnRuLXNlY29uZGFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzQ3NTU2OTtcbiAgICAgICAgfVxuICAgICAgICAuYmFkZ2Uge1xuICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgICBwYWRkaW5nOiAycHggNnB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMjJjNTVlMjA7XG4gICAgICAgICAgY29sb3I6ICMyMmM1NWU7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzIyYzU1ZTQwO1xuICAgICAgICB9XG4gICAgICAgIC5iYWRnZS10cmFja2VkIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjNjM2NmYxMjA7XG4gICAgICAgICAgY29sb3I6ICM4MThjZjg7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzYzNjZmMTQwO1xuICAgICAgICB9XG4gICAgICAgIC5zdWNjZXNzLW1zZyB7XG4gICAgICAgICAgY29sb3I6ICMyMmM1NWU7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICBtYXJnaW4tdG9wOiA4cHg7XG4gICAgICAgIH1cbiAgICAgIGA7XG4gICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gICAgICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBjYXJkLmNsYXNzTmFtZSA9ICdqb2JmbG93LWNhcmQnO1xuXG4gICAgICBpZiAoaXNUcmFja2VkKSB7XG4gICAgICAgIHJlbmRlclRyYWNrZWRTdGF0ZShjYXJkLCBkZXRhaWxzLCB0cmFja2VkQXBwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNhdmVBdXRvbWF0aWNhbGx5KGNhcmQsIGRldGFpbHMpO1xuICAgICAgfVxuXG4gICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQoY2FyZCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVuZGVyVHJhY2tlZFN0YXRlKGNhcmQ6IEhUTUxFbGVtZW50LCBkZXRhaWxzOiBTY3JhcGVkSm9iRGV0YWlscywgYXBwOiBhbnkpIHtcbiAgICAgIGNhcmQuaW5uZXJIVE1MID0gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy1oZWFkZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy10aXRsZVwiPlxuICAgICAgICAgICAgPGltZyBzcmM9XCIke2xvZ29Vcmx9XCIgc3R5bGU9XCJ3aWR0aDogMTRweDsgaGVpZ2h0OiAxNHB4OyBvYmplY3QtZml0OiBjb250YWluOyBtYXJnaW4tcmlnaHQ6IDRweDtcIiBhbHQ9XCJMb2dvXCIgLz5cbiAgICAgICAgICAgIEpvYkZsb3cgVHJhY2tlclxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJqb2JmbG93LWNsb3NlXCI+JnRpbWVzOzwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImpvYi1pbmZvXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImpvYi1yb2xlXCI+JHtkZXRhaWxzLnRpdGxlfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2ItY29tcGFueVwiPiR7ZGV0YWlscy5jb21wYW55fTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDEycHg7XCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJiYWRnZSBiYWRnZS10cmFja2VkXCI+VHJhY2tlZCBhczogJHthcHAuc3RhdHVzfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXNpemU6IDExcHg7IGNvbG9yOiAjOTRhM2I4OyBsaW5lLWhlaWdodDogMS40O1wiPlxuICAgICAgICAgIEFwcGxpZWQgb24gJHtuZXcgRGF0ZShhcHAuYXBwbGllZERhdGUpLnRvTG9jYWxlRGF0ZVN0cmluZygpfSB1c2luZyByZXN1bWU6PGJyLz5cbiAgICAgICAgICA8c3Ryb25nIHN0eWxlPVwiY29sb3I6ICNmMWY1Zjk7XCI+JHthcHAucmVzdW1lTmFtZSB8fCAnTm9uZSBTZWxlY3RlZCd9PC9zdHJvbmc+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLXNlY29uZGFyeSBjbG9zZS1idG5cIj5DbG9zZSBUcmFja2VyPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYDtcblxuICAgICAgY2FyZC5xdWVyeVNlbGVjdG9yKCcuam9iZmxvdy1jbG9zZScpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHJlbW92ZU92ZXJsYXkpO1xuICAgICAgY2FyZC5xdWVyeVNlbGVjdG9yKCcuY2xvc2UtYnRuJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVtb3ZlT3ZlcmxheSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2F2ZUF1dG9tYXRpY2FsbHkoY2FyZDogSFRNTEVsZW1lbnQsIGRldGFpbHM6IFNjcmFwZWRKb2JEZXRhaWxzKSB7XG4gICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgY29uc3QgYXBwbGllZERhdGUgPSBub3cudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xuICAgICAgY29uc3QgYXBwbGllZFRpbWUgPSBub3cudG9UaW1lU3RyaW5nKCkuc3BsaXQoJyAnKVswXS5zdWJzdHJpbmcoMCwgNSk7XG5cbiAgICAgIGNvbnN0IGFwcERhdGEgPSB7XG4gICAgICAgIGNvbXBhbnk6IGRldGFpbHMuY29tcGFueSxcbiAgICAgICAgdGl0bGU6IGRldGFpbHMudGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiBkZXRhaWxzLmxvY2F0aW9uLFxuICAgICAgICBqb2JVcmw6IGRldGFpbHMuam9iVXJsLFxuICAgICAgICBqb2JEZXNjcmlwdGlvbjogZGV0YWlscy5qb2JEZXNjcmlwdGlvbixcbiAgICAgICAgZW1wbG95bWVudFR5cGU6IGRldGFpbHMuZW1wbG95bWVudFR5cGUsXG4gICAgICAgIHdvcmtNb2RlOiBkZXRhaWxzLndvcmtNb2RlLFxuICAgICAgICBwb3J0YWw6IGRldGFpbHMucG9ydGFsLFxuICAgICAgICByZXN1bWVJZDogdW5kZWZpbmVkLFxuICAgICAgICByZXN1bWVOYW1lOiB1bmRlZmluZWQsXG4gICAgICAgIHN0YXR1czogJ0FwcGxpZWQnLFxuICAgICAgICBub3RlczogJycsXG4gICAgICAgIGFwcGxpZWREYXRlLFxuICAgICAgICBhcHBsaWVkVGltZSxcbiAgICAgICAgcmVtaW5kZXJTZW50OiBmYWxzZVxuICAgICAgfTtcblxuICAgICAgY2FyZC5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LWhlYWRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2JmbG93LXRpdGxlXCI+XG4gICAgICAgICAgICA8aW1nIHNyYz1cIiR7bG9nb1VybH1cIiBzdHlsZT1cIndpZHRoOiAxNHB4OyBoZWlnaHQ6IDE0cHg7IG9iamVjdC1maXQ6IGNvbnRhaW47IG1hcmdpbi1yaWdodDogNHB4O1wiIGFsdD1cIkxvZ29cIiAvPlxuICAgICAgICAgICAgSm9iRmxvdyBUcmFja2VyXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImpvYmZsb3ctY2xvc2VcIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9iLWluZm9cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iLXJvbGVcIj4ke2RldGFpbHMudGl0bGV9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImpvYi1jb21wYW55XCI+JHtkZXRhaWxzLmNvbXBhbnl9IOKAlCA8c3BhbiBzdHlsZT1cImZvbnQtc3R5bGU6IGl0YWxpYztcIj4ke2RldGFpbHMud29ya01vZGV9PC9zcGFuPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcGFkZGluZzogMTJweCAwO1wiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJjb2xvcjogIzgxOGNmODsgZm9udC1zaXplOiAxMnB4OyBmb250LXdlaWdodDogNTAwOyBtYXJnaW4tYm90dG9tOiA4cHg7XCI+U2F2aW5nIGFwcGxpY2F0aW9uIGF1dG9tYXRpY2FsbHkuLi48L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidy02IGgtNiBib3JkZXItMiBib3JkZXItcHJpbWFyeSBib3JkZXItdC10cmFuc3BhcmVudCByb3VuZGVkLWZ1bGwgYW5pbWF0ZS1zcGluXCIgc3R5bGU9XCJtYXJnaW46IDAgYXV0bzsgZGlzcGxheTogaW5saW5lLWJsb2NrO1wiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGA7XG5cbiAgICAgIGNhcmQucXVlcnlTZWxlY3RvcignLmpvYmZsb3ctY2xvc2UnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCByZW1vdmVPdmVybGF5KTtcblxuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgIHsgYWN0aW9uOiAnU0FWRV9BUFBMSUNBVElPTicsIHBheWxvYWQ6IHsgYXBwbGljYXRpb246IGFwcERhdGEgfSB9LFxuICAgICAgICAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdKb2JGbG93IHNhdmUgZXJyb3I6JywgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgIGNhcmQuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCIke2xvZ29Vcmx9XCIgc3R5bGU9XCJ3aWR0aDogMTRweDsgaGVpZ2h0OiAxNHB4OyBvYmplY3QtZml0OiBjb250YWluOyBtYXJnaW4tcmlnaHQ6IDRweDtcIiBhbHQ9XCJMb2dvXCIgLz5cbiAgICAgICAgICAgICAgICAgIEpvYkZsb3cgVHJhY2tlclxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJqb2JmbG93LWNsb3NlXCI+JnRpbWVzOzwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcGFkZGluZzogMTJweCAwOyBjb2xvcjogI2VmNDQ0NDsgZm9udC1zaXplOiAxMXB4O1wiPlxuICAgICAgICAgICAgICAgIEVycm9yOiAke2Nocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGA7XG4gICAgICAgICAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5qb2JmbG93LWNsb3NlJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVtb3ZlT3ZlcmxheSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGNhcmQuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iZmxvdy10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCIke2xvZ29Vcmx9XCIgc3R5bGU9XCJ3aWR0aDogMTRweDsgaGVpZ2h0OiAxNHB4OyBvYmplY3QtZml0OiBjb250YWluOyBtYXJnaW4tcmlnaHQ6IDRweDtcIiBhbHQ9XCJMb2dvXCIgLz5cbiAgICAgICAgICAgICAgICAgIEpvYkZsb3cgVHJhY2tlclxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJqb2JmbG93LWNsb3NlXCI+JnRpbWVzOzwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcGFkZGluZzogMTJweCAwO1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2Itcm9sZVwiPiR7ZGV0YWlscy50aXRsZX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9iLWNvbXBhbnlcIj4ke2RldGFpbHMuY29tcGFueX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMzJcIiBoZWlnaHQ9XCIzMlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiMyMmM1NWVcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3R5bGU9XCJtYXJnaW46IDEwcHggYXV0bztcIj48cGF0aCBkPVwiTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNFwiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPVwiMjIgNCAxMiAxNC4wMSA5IDExLjAxXCI+PC9wb2x5bGluZT48L3N2Zz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3VjY2Vzcy1tc2dcIj5BcHBsaWNhdGlvbiBUcmFja2VkIEF1dG9tYXRpY2FsbHkhPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTFweDsgY29sb3I6ICM5NGEzYjg7IG1hcmdpbi10b3A6IDZweDtcIj5Gb2xsb3ctdXAgYWxhcm0gc2V0IGZvciA2IGRheXMuPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTBweDsgY29sb3I6ICM4MThjZjg7IG1hcmdpbi10b3A6IDZweDtcIj5FZGl0IG5vdGVzIG9yIHJlc3VtZSBpbiB0aGUgZGFzaGJvYXJkLjwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGA7XG4gICAgICAgICAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5qb2JmbG93LWNsb3NlJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVtb3ZlT3ZlcmxheSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KHJlbW92ZU92ZXJsYXksIDM1MDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYXJkLmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvYmZsb3ctaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvYmZsb3ctdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtsb2dvVXJsfVwiIHN0eWxlPVwid2lkdGg6IDE0cHg7IGhlaWdodDogMTRweDsgb2JqZWN0LWZpdDogY29udGFpbjsgbWFyZ2luLXJpZ2h0OiA0cHg7XCIgYWx0PVwiTG9nb1wiIC8+XG4gICAgICAgICAgICAgICAgICBKb2JGbG93IFRyYWNrZXJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiam9iZmxvdy1jbG9zZVwiPiZ0aW1lczs8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBhZGRpbmc6IDEycHggMDsgY29sb3I6ICNlZjQ0NDQ7IGZvbnQtc2l6ZTogMTFweDtcIj5cbiAgICAgICAgICAgICAgICBFcnJvcjogJHtyZXNwb25zZS5lcnJvciB8fCAnRmFpbGVkIHRvIHNhdmUnfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGA7XG4gICAgICAgICAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5qb2JmbG93LWNsb3NlJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVtb3ZlT3ZlcmxheSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFN0YXJ0dXBcbiAgICBpbml0VXJsT2JzZXJ2ZXIoKTtcbiAgfVxufSk7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoXCJ3ZWJleHRlbnNpb24tcG9seWZpbGxcIiwgW1wibW9kdWxlXCJdLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGZhY3RvcnkobW9kdWxlKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbW9kID0ge1xuICAgICAgZXhwb3J0czoge31cbiAgICB9O1xuICAgIGZhY3RvcnkobW9kKTtcbiAgICBnbG9iYWwuYnJvd3NlciA9IG1vZC5leHBvcnRzO1xuICB9XG59KSh0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0aGlzLCBmdW5jdGlvbiAobW9kdWxlKSB7XG4gIC8qIHdlYmV4dGVuc2lvbi1wb2x5ZmlsbCAtIHYwLjEyLjAgLSBUdWUgTWF5IDE0IDIwMjQgMTg6MDE6MjkgKi9cbiAgLyogLSotIE1vZGU6IGluZGVudC10YWJzLW1vZGU6IG5pbDsganMtaW5kZW50LWxldmVsOiAyIC0qLSAqL1xuICAvKiB2aW06IHNldCBzdHM9MiBzdz0yIGV0IHR3PTgwOiAqL1xuICAvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gICAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAgICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy4gKi9cbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgaWYgKCEoZ2xvYmFsVGhpcy5jaHJvbWUgJiYgZ2xvYmFsVGhpcy5jaHJvbWUucnVudGltZSAmJiBnbG9iYWxUaGlzLmNocm9tZS5ydW50aW1lLmlkKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgc2NyaXB0IHNob3VsZCBvbmx5IGJlIGxvYWRlZCBpbiBhIGJyb3dzZXIgZXh0ZW5zaW9uLlwiKTtcbiAgfVxuICBpZiAoIShnbG9iYWxUaGlzLmJyb3dzZXIgJiYgZ2xvYmFsVGhpcy5icm93c2VyLnJ1bnRpbWUgJiYgZ2xvYmFsVGhpcy5icm93c2VyLnJ1bnRpbWUuaWQpKSB7XG4gICAgY29uc3QgQ0hST01FX1NFTkRfTUVTU0FHRV9DQUxMQkFDS19OT19SRVNQT05TRV9NRVNTQUdFID0gXCJUaGUgbWVzc2FnZSBwb3J0IGNsb3NlZCBiZWZvcmUgYSByZXNwb25zZSB3YXMgcmVjZWl2ZWQuXCI7XG5cbiAgICAvLyBXcmFwcGluZyB0aGUgYnVsayBvZiB0aGlzIHBvbHlmaWxsIGluIGEgb25lLXRpbWUtdXNlIGZ1bmN0aW9uIGlzIGEgbWlub3JcbiAgICAvLyBvcHRpbWl6YXRpb24gZm9yIEZpcmVmb3guIFNpbmNlIFNwaWRlcm1vbmtleSBkb2VzIG5vdCBmdWxseSBwYXJzZSB0aGVcbiAgICAvLyBjb250ZW50cyBvZiBhIGZ1bmN0aW9uIHVudGlsIHRoZSBmaXJzdCB0aW1lIGl0J3MgY2FsbGVkLCBhbmQgc2luY2UgaXQgd2lsbFxuICAgIC8vIG5ldmVyIGFjdHVhbGx5IG5lZWQgdG8gYmUgY2FsbGVkLCB0aGlzIGFsbG93cyB0aGUgcG9seWZpbGwgdG8gYmUgaW5jbHVkZWRcbiAgICAvLyBpbiBGaXJlZm94IG5lYXJseSBmb3IgZnJlZS5cbiAgICBjb25zdCB3cmFwQVBJcyA9IGV4dGVuc2lvbkFQSXMgPT4ge1xuICAgICAgLy8gTk9URTogYXBpTWV0YWRhdGEgaXMgYXNzb2NpYXRlZCB0byB0aGUgY29udGVudCBvZiB0aGUgYXBpLW1ldGFkYXRhLmpzb24gZmlsZVxuICAgICAgLy8gYXQgYnVpbGQgdGltZSBieSByZXBsYWNpbmcgdGhlIGZvbGxvd2luZyBcImluY2x1ZGVcIiB3aXRoIHRoZSBjb250ZW50IG9mIHRoZVxuICAgICAgLy8gSlNPTiBmaWxlLlxuICAgICAgY29uc3QgYXBpTWV0YWRhdGEgPSB7XG4gICAgICAgIFwiYWxhcm1zXCI6IHtcbiAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiY2xlYXJBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJib29rbWFya3NcIjoge1xuICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Q2hpbGRyZW5cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRSZWNlbnRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRTdWJUcmVlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0VHJlZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIm1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVUcmVlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYnJvd3NlckFjdGlvblwiOiB7XG4gICAgICAgICAgXCJkaXNhYmxlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZW5hYmxlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0QmFkZ2VCYWNrZ3JvdW5kQ29sb3JcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRCYWRnZVRleHRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRQb3B1cFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFRpdGxlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwib3BlblBvcHVwXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0QmFkZ2VCYWNrZ3JvdW5kQ29sb3JcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRCYWRnZVRleHRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRJY29uXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0UG9wdXBcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRUaXRsZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImJyb3dzaW5nRGF0YVwiOiB7XG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVDYWNoZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUNvb2tpZXNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVEb3dubG9hZHNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVGb3JtRGF0YVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUhpc3RvcnlcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVMb2NhbFN0b3JhZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVQYXNzd29yZHNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVQbHVnaW5EYXRhXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0dGluZ3NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJjb21tYW5kc1wiOiB7XG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJjb250ZXh0TWVudXNcIjoge1xuICAgICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlQWxsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiY29va2llc1wiOiB7XG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxDb29raWVTdG9yZXNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJkZXZ0b29sc1wiOiB7XG4gICAgICAgICAgXCJpbnNwZWN0ZWRXaW5kb3dcIjoge1xuICAgICAgICAgICAgXCJldmFsXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyLFxuICAgICAgICAgICAgICBcInNpbmdsZUNhbGxiYWNrQXJnXCI6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInBhbmVsc1wiOiB7XG4gICAgICAgICAgICBcImNyZWF0ZVwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAzLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMyxcbiAgICAgICAgICAgICAgXCJzaW5nbGVDYWxsYmFja0FyZ1wiOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJlbGVtZW50c1wiOiB7XG4gICAgICAgICAgICAgIFwiY3JlYXRlU2lkZWJhclBhbmVcIjoge1xuICAgICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiZG93bmxvYWRzXCI6IHtcbiAgICAgICAgICBcImNhbmNlbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImRvd25sb2FkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZXJhc2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRGaWxlSWNvblwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIm9wZW5cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwiZmFsbGJhY2tUb05vQ2FsbGJhY2tcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJwYXVzZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInJlbW92ZUZpbGVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZXN1bWVcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZWFyY2hcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzaG93XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiZXh0ZW5zaW9uXCI6IHtcbiAgICAgICAgICBcImlzQWxsb3dlZEZpbGVTY2hlbWVBY2Nlc3NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJpc0FsbG93ZWRJbmNvZ25pdG9BY2Nlc3NcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJoaXN0b3J5XCI6IHtcbiAgICAgICAgICBcImFkZFVybFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImRlbGV0ZUFsbFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImRlbGV0ZVJhbmdlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZGVsZXRlVXJsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0VmlzaXRzXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2VhcmNoXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaTE4blwiOiB7XG4gICAgICAgICAgXCJkZXRlY3RMYW5ndWFnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEFjY2VwdExhbmd1YWdlc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImlkZW50aXR5XCI6IHtcbiAgICAgICAgICBcImxhdW5jaFdlYkF1dGhGbG93XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaWRsZVwiOiB7XG4gICAgICAgICAgXCJxdWVyeVN0YXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibWFuYWdlbWVudFwiOiB7XG4gICAgICAgICAgXCJnZXRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRBbGxcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRTZWxmXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0RW5hYmxlZFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInVuaW5zdGFsbFNlbGZcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJub3RpZmljYXRpb25zXCI6IHtcbiAgICAgICAgICBcImNsZWFyXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0UGVybWlzc2lvbkxldmVsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwicGFnZUFjdGlvblwiOiB7XG4gICAgICAgICAgXCJnZXRQb3B1cFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFRpdGxlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiaGlkZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldEljb25cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRQb3B1cFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNldFRpdGxlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDEsXG4gICAgICAgICAgICBcImZhbGxiYWNrVG9Ob0NhbGxiYWNrXCI6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2hvd1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJmYWxsYmFja1RvTm9DYWxsYmFja1wiOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBlcm1pc3Npb25zXCI6IHtcbiAgICAgICAgICBcImNvbnRhaW5zXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVxdWVzdFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInJ1bnRpbWVcIjoge1xuICAgICAgICAgIFwiZ2V0QmFja2dyb3VuZFBhZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRQbGF0Zm9ybUluZm9cIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJvcGVuT3B0aW9uc1BhZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJyZXF1ZXN0VXBkYXRlQ2hlY2tcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZW5kTWVzc2FnZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAzXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInNlbmROYXRpdmVNZXNzYWdlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0VW5pbnN0YWxsVVJMXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwic2Vzc2lvbnNcIjoge1xuICAgICAgICAgIFwiZ2V0RGV2aWNlc1wiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFJlY2VudGx5Q2xvc2VkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVzdG9yZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInN0b3JhZ2VcIjoge1xuICAgICAgICAgIFwibG9jYWxcIjoge1xuICAgICAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZXRCeXRlc0luVXNlXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJtYW5hZ2VkXCI6IHtcbiAgICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZXRCeXRlc0luVXNlXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInN5bmNcIjoge1xuICAgICAgICAgICAgXCJjbGVhclwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZXRCeXRlc0luVXNlXCI6IHtcbiAgICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJyZW1vdmVcIjoge1xuICAgICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNldFwiOiB7XG4gICAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ0YWJzXCI6IHtcbiAgICAgICAgICBcImNhcHR1cmVWaXNpYmxlVGFiXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZGV0ZWN0TGFuZ3VhZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJkaXNjYXJkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZHVwbGljYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZXhlY3V0ZVNjcmlwdFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldEN1cnJlbnRcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDAsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRab29tXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Wm9vbVNldHRpbmdzXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ29CYWNrXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ29Gb3J3YXJkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiaGlnaGxpZ2h0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiaW5zZXJ0Q1NTXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwibW92ZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMixcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInF1ZXJ5XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVsb2FkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlQ1NTXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2VuZE1lc3NhZ2VcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDIsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogM1xuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJzZXRab29tXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwic2V0Wm9vbVNldHRpbmdzXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwidG9wU2l0ZXNcIjoge1xuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDBcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwid2ViTmF2aWdhdGlvblwiOiB7XG4gICAgICAgICAgXCJnZXRBbGxGcmFtZXNcIjoge1xuICAgICAgICAgICAgXCJtaW5BcmdzXCI6IDEsXG4gICAgICAgICAgICBcIm1heEFyZ3NcIjogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJnZXRGcmFtZVwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMSxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIndlYlJlcXVlc3RcIjoge1xuICAgICAgICAgIFwiaGFuZGxlckJlaGF2aW9yQ2hhbmdlZFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAwXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIndpbmRvd3NcIjoge1xuICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0XCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0QWxsXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiZ2V0Q3VycmVudFwiOiB7XG4gICAgICAgICAgICBcIm1pbkFyZ3NcIjogMCxcbiAgICAgICAgICAgIFwibWF4QXJnc1wiOiAxXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImdldExhc3RGb2N1c2VkXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAwLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwicmVtb3ZlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAxLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgIFwibWluQXJnc1wiOiAyLFxuICAgICAgICAgICAgXCJtYXhBcmdzXCI6IDJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBpZiAoT2JqZWN0LmtleXMoYXBpTWV0YWRhdGEpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhcGktbWV0YWRhdGEuanNvbiBoYXMgbm90IGJlZW4gaW5jbHVkZWQgaW4gYnJvd3Nlci1wb2x5ZmlsbFwiKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBBIFdlYWtNYXAgc3ViY2xhc3Mgd2hpY2ggY3JlYXRlcyBhbmQgc3RvcmVzIGEgdmFsdWUgZm9yIGFueSBrZXkgd2hpY2ggZG9lc1xuICAgICAgICogbm90IGV4aXN0IHdoZW4gYWNjZXNzZWQsIGJ1dCBiZWhhdmVzIGV4YWN0bHkgYXMgYW4gb3JkaW5hcnkgV2Vha01hcFxuICAgICAgICogb3RoZXJ3aXNlLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNyZWF0ZUl0ZW1cbiAgICAgICAqICAgICAgICBBIGZ1bmN0aW9uIHdoaWNoIHdpbGwgYmUgY2FsbGVkIGluIG9yZGVyIHRvIGNyZWF0ZSB0aGUgdmFsdWUgZm9yIGFueVxuICAgICAgICogICAgICAgIGtleSB3aGljaCBkb2VzIG5vdCBleGlzdCwgdGhlIGZpcnN0IHRpbWUgaXQgaXMgYWNjZXNzZWQuIFRoZVxuICAgICAgICogICAgICAgIGZ1bmN0aW9uIHJlY2VpdmVzLCBhcyBpdHMgb25seSBhcmd1bWVudCwgdGhlIGtleSBiZWluZyBjcmVhdGVkLlxuICAgICAgICovXG4gICAgICBjbGFzcyBEZWZhdWx0V2Vha01hcCBleHRlbmRzIFdlYWtNYXAge1xuICAgICAgICBjb25zdHJ1Y3RvcihjcmVhdGVJdGVtLCBpdGVtcyA9IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHN1cGVyKGl0ZW1zKTtcbiAgICAgICAgICB0aGlzLmNyZWF0ZUl0ZW0gPSBjcmVhdGVJdGVtO1xuICAgICAgICB9XG4gICAgICAgIGdldChrZXkpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGtleSwgdGhpcy5jcmVhdGVJdGVtKGtleSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3VwZXIuZ2V0KGtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG9iamVjdCBpcyBhbiBvYmplY3Qgd2l0aCBhIGB0aGVuYCBtZXRob2QsIGFuZCBjYW5cbiAgICAgICAqIHRoZXJlZm9yZSBiZSBhc3N1bWVkIHRvIGJlaGF2ZSBhcyBhIFByb21pc2UuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gdGVzdC5cbiAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSB2YWx1ZSBpcyB0aGVuYWJsZS5cbiAgICAgICAqL1xuICAgICAgY29uc3QgaXNUaGVuYWJsZSA9IHZhbHVlID0+IHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xuICAgICAgfTtcblxuICAgICAgLyoqXG4gICAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2gsIHdoZW4gY2FsbGVkLCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0XG4gICAgICAgKiB0aGUgZ2l2ZW4gcHJvbWlzZSBiYXNlZCBvbiBob3cgaXQgaXMgY2FsbGVkOlxuICAgICAgICpcbiAgICAgICAqIC0gSWYsIHdoZW4gY2FsbGVkLCBgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yYCBjb250YWlucyBhIG5vbi1udWxsIG9iamVjdCxcbiAgICAgICAqICAgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQgd2l0aCB0aGF0IHZhbHVlLlxuICAgICAgICogLSBJZiB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggZXhhY3RseSBvbmUgYXJndW1lbnQsIHRoZSBwcm9taXNlIGlzXG4gICAgICAgKiAgIHJlc29sdmVkIHRvIHRoYXQgdmFsdWUuXG4gICAgICAgKiAtIE90aGVyd2lzZSwgdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQgdG8gYW4gYXJyYXkgY29udGFpbmluZyBhbGwgb2YgdGhlXG4gICAgICAgKiAgIGZ1bmN0aW9uJ3MgYXJndW1lbnRzLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwcm9taXNlXG4gICAgICAgKiAgICAgICAgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHJlc29sdXRpb24gYW5kIHJlamVjdGlvbiBmdW5jdGlvbnMgb2YgYVxuICAgICAgICogICAgICAgIHByb21pc2UuXG4gICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9taXNlLnJlc29sdmVcbiAgICAgICAqICAgICAgICBUaGUgcHJvbWlzZSdzIHJlc29sdXRpb24gZnVuY3Rpb24uXG4gICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9taXNlLnJlamVjdFxuICAgICAgICogICAgICAgIFRoZSBwcm9taXNlJ3MgcmVqZWN0aW9uIGZ1bmN0aW9uLlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IG1ldGFkYXRhXG4gICAgICAgKiAgICAgICAgTWV0YWRhdGEgYWJvdXQgdGhlIHdyYXBwZWQgbWV0aG9kIHdoaWNoIGhhcyBjcmVhdGVkIHRoZSBjYWxsYmFjay5cbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmdcbiAgICAgICAqICAgICAgICBXaGV0aGVyIG9yIG5vdCB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIG9ubHkgdGhlIGZpcnN0XG4gICAgICAgKiAgICAgICAgYXJndW1lbnQgb2YgdGhlIGNhbGxiYWNrLCBhbHRlcm5hdGl2ZWx5IGFuIGFycmF5IG9mIGFsbCB0aGVcbiAgICAgICAqICAgICAgICBjYWxsYmFjayBhcmd1bWVudHMgaXMgcmVzb2x2ZWQuIEJ5IGRlZmF1bHQsIGlmIHRoZSBjYWxsYmFja1xuICAgICAgICogICAgICAgIGZ1bmN0aW9uIGlzIGludm9rZWQgd2l0aCBvbmx5IGEgc2luZ2xlIGFyZ3VtZW50LCB0aGF0IHdpbGwgYmVcbiAgICAgICAqICAgICAgICByZXNvbHZlZCB0byB0aGUgcHJvbWlzZSwgd2hpbGUgYWxsIGFyZ3VtZW50cyB3aWxsIGJlIHJlc29sdmVkIGFzXG4gICAgICAgKiAgICAgICAgYW4gYXJyYXkgaWYgbXVsdGlwbGUgYXJlIGdpdmVuLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn1cbiAgICAgICAqICAgICAgICBUaGUgZ2VuZXJhdGVkIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgICovXG4gICAgICBjb25zdCBtYWtlQ2FsbGJhY2sgPSAocHJvbWlzZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuICguLi5jYWxsYmFja0FyZ3MpID0+IHtcbiAgICAgICAgICBpZiAoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgcHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGV4dGVuc2lvbkFQSXMucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWV0YWRhdGEuc2luZ2xlQ2FsbGJhY2tBcmcgfHwgY2FsbGJhY2tBcmdzLmxlbmd0aCA8PSAxICYmIG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrQXJnc1swXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2UucmVzb2x2ZShjYWxsYmFja0FyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgICBjb25zdCBwbHVyYWxpemVBcmd1bWVudHMgPSBudW1BcmdzID0+IG51bUFyZ3MgPT0gMSA/IFwiYXJndW1lbnRcIiA6IFwiYXJndW1lbnRzXCI7XG5cbiAgICAgIC8qKlxuICAgICAgICogQ3JlYXRlcyBhIHdyYXBwZXIgZnVuY3Rpb24gZm9yIGEgbWV0aG9kIHdpdGggdGhlIGdpdmVuIG5hbWUgYW5kIG1ldGFkYXRhLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICAgKiAgICAgICAgVGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aGljaCBpcyBiZWluZyB3cmFwcGVkLlxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IG1ldGFkYXRhXG4gICAgICAgKiAgICAgICAgTWV0YWRhdGEgYWJvdXQgdGhlIG1ldGhvZCBiZWluZyB3cmFwcGVkLlxuICAgICAgICogQHBhcmFtIHtpbnRlZ2VyfSBtZXRhZGF0YS5taW5BcmdzXG4gICAgICAgKiAgICAgICAgVGhlIG1pbmltdW0gbnVtYmVyIG9mIGFyZ3VtZW50cyB3aGljaCBtdXN0IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgICAqICAgICAgICBmdW5jdGlvbi4gSWYgY2FsbGVkIHdpdGggZmV3ZXIgdGhhbiB0aGlzIG51bWJlciBvZiBhcmd1bWVudHMsIHRoZVxuICAgICAgICogICAgICAgIHdyYXBwZXIgd2lsbCByYWlzZSBhbiBleGNlcHRpb24uXG4gICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IG1ldGFkYXRhLm1heEFyZ3NcbiAgICAgICAqICAgICAgICBUaGUgbWF4aW11bSBudW1iZXIgb2YgYXJndW1lbnRzIHdoaWNoIG1heSBiZSBwYXNzZWQgdG8gdGhlXG4gICAgICAgKiAgICAgICAgZnVuY3Rpb24uIElmIGNhbGxlZCB3aXRoIG1vcmUgdGhhbiB0aGlzIG51bWJlciBvZiBhcmd1bWVudHMsIHRoZVxuICAgICAgICogICAgICAgIHdyYXBwZXIgd2lsbCByYWlzZSBhbiBleGNlcHRpb24uXG4gICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG1ldGFkYXRhLnNpbmdsZUNhbGxiYWNrQXJnXG4gICAgICAgKiAgICAgICAgV2hldGhlciBvciBub3QgdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCBvbmx5IHRoZSBmaXJzdFxuICAgICAgICogICAgICAgIGFyZ3VtZW50IG9mIHRoZSBjYWxsYmFjaywgYWx0ZXJuYXRpdmVseSBhbiBhcnJheSBvZiBhbGwgdGhlXG4gICAgICAgKiAgICAgICAgY2FsbGJhY2sgYXJndW1lbnRzIGlzIHJlc29sdmVkLiBCeSBkZWZhdWx0LCBpZiB0aGUgY2FsbGJhY2tcbiAgICAgICAqICAgICAgICBmdW5jdGlvbiBpcyBpbnZva2VkIHdpdGggb25seSBhIHNpbmdsZSBhcmd1bWVudCwgdGhhdCB3aWxsIGJlXG4gICAgICAgKiAgICAgICAgcmVzb2x2ZWQgdG8gdGhlIHByb21pc2UsIHdoaWxlIGFsbCBhcmd1bWVudHMgd2lsbCBiZSByZXNvbHZlZCBhc1xuICAgICAgICogICAgICAgIGFuIGFycmF5IGlmIG11bHRpcGxlIGFyZSBnaXZlbi5cbiAgICAgICAqXG4gICAgICAgKiBAcmV0dXJucyB7ZnVuY3Rpb24ob2JqZWN0LCAuLi4qKX1cbiAgICAgICAqICAgICAgIFRoZSBnZW5lcmF0ZWQgd3JhcHBlciBmdW5jdGlvbi5cbiAgICAgICAqL1xuICAgICAgY29uc3Qgd3JhcEFzeW5jRnVuY3Rpb24gPSAobmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGFzeW5jRnVuY3Rpb25XcmFwcGVyKHRhcmdldCwgLi4uYXJncykge1xuICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IG1ldGFkYXRhLm1pbkFyZ3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbGVhc3QgJHttZXRhZGF0YS5taW5BcmdzfSAke3BsdXJhbGl6ZUFyZ3VtZW50cyhtZXRhZGF0YS5taW5BcmdzKX0gZm9yICR7bmFtZX0oKSwgZ290ICR7YXJncy5sZW5ndGh9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IG1ldGFkYXRhLm1heEFyZ3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgYXQgbW9zdCAke21ldGFkYXRhLm1heEFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1heEFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmIChtZXRhZGF0YS5mYWxsYmFja1RvTm9DYWxsYmFjaykge1xuICAgICAgICAgICAgICAvLyBUaGlzIEFQSSBtZXRob2QgaGFzIGN1cnJlbnRseSBubyBjYWxsYmFjayBvbiBDaHJvbWUsIGJ1dCBpdCByZXR1cm4gYSBwcm9taXNlIG9uIEZpcmVmb3gsXG4gICAgICAgICAgICAgIC8vIGFuZCBzbyB0aGUgcG9seWZpbGwgd2lsbCB0cnkgdG8gY2FsbCBpdCB3aXRoIGEgY2FsbGJhY2sgZmlyc3QsIGFuZCBpdCB3aWxsIGZhbGxiYWNrXG4gICAgICAgICAgICAgIC8vIHRvIG5vdCBwYXNzaW5nIHRoZSBjYWxsYmFjayBpZiB0aGUgZmlyc3QgY2FsbCBmYWlscy5cbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0oLi4uYXJncywgbWFrZUNhbGxiYWNrKHtcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgICAgICAgICByZWplY3RcbiAgICAgICAgICAgICAgICB9LCBtZXRhZGF0YSkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChjYkVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAke25hbWV9IEFQSSBtZXRob2QgZG9lc24ndCBzZWVtIHRvIHN1cHBvcnQgdGhlIGNhbGxiYWNrIHBhcmFtZXRlciwgYCArIFwiZmFsbGluZyBiYWNrIHRvIGNhbGwgaXQgd2l0aG91dCBhIGNhbGxiYWNrOiBcIiwgY2JFcnJvcik7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdKC4uLmFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBBUEkgbWV0aG9kIG1ldGFkYXRhLCBzbyB0aGF0IHRoZSBuZXh0IEFQSSBjYWxscyB3aWxsIG5vdCB0cnkgdG9cbiAgICAgICAgICAgICAgICAvLyB1c2UgdGhlIHVuc3VwcG9ydGVkIGNhbGxiYWNrIGFueW1vcmUuXG4gICAgICAgICAgICAgICAgbWV0YWRhdGEuZmFsbGJhY2tUb05vQ2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBtZXRhZGF0YS5ub0NhbGxiYWNrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWV0YWRhdGEubm9DYWxsYmFjaykge1xuICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0oLi4uYXJncyk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRhcmdldFtuYW1lXSguLi5hcmdzLCBtYWtlQ2FsbGJhY2soe1xuICAgICAgICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgICAgICAgcmVqZWN0XG4gICAgICAgICAgICAgIH0sIG1ldGFkYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9O1xuXG4gICAgICAvKipcbiAgICAgICAqIFdyYXBzIGFuIGV4aXN0aW5nIG1ldGhvZCBvZiB0aGUgdGFyZ2V0IG9iamVjdCwgc28gdGhhdCBjYWxscyB0byBpdCBhcmVcbiAgICAgICAqIGludGVyY2VwdGVkIGJ5IHRoZSBnaXZlbiB3cmFwcGVyIGZ1bmN0aW9uLiBUaGUgd3JhcHBlciBmdW5jdGlvbiByZWNlaXZlcyxcbiAgICAgICAqIGFzIGl0cyBmaXJzdCBhcmd1bWVudCwgdGhlIG9yaWdpbmFsIGB0YXJnZXRgIG9iamVjdCwgZm9sbG93ZWQgYnkgZWFjaCBvZlxuICAgICAgICogdGhlIGFyZ3VtZW50cyBwYXNzZWQgdG8gdGhlIG9yaWdpbmFsIG1ldGhvZC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0XG4gICAgICAgKiAgICAgICAgVGhlIG9yaWdpbmFsIHRhcmdldCBvYmplY3QgdGhhdCB0aGUgd3JhcHBlZCBtZXRob2QgYmVsb25ncyB0by5cbiAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1ldGhvZFxuICAgICAgICogICAgICAgIFRoZSBtZXRob2QgYmVpbmcgd3JhcHBlZC4gVGhpcyBpcyB1c2VkIGFzIHRoZSB0YXJnZXQgb2YgdGhlIFByb3h5XG4gICAgICAgKiAgICAgICAgb2JqZWN0IHdoaWNoIGlzIGNyZWF0ZWQgdG8gd3JhcCB0aGUgbWV0aG9kLlxuICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gd3JhcHBlclxuICAgICAgICogICAgICAgIFRoZSB3cmFwcGVyIGZ1bmN0aW9uIHdoaWNoIGlzIGNhbGxlZCBpbiBwbGFjZSBvZiBhIGRpcmVjdCBpbnZvY2F0aW9uXG4gICAgICAgKiAgICAgICAgb2YgdGhlIHdyYXBwZWQgbWV0aG9kLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtQcm94eTxmdW5jdGlvbj59XG4gICAgICAgKiAgICAgICAgQSBQcm94eSBvYmplY3QgZm9yIHRoZSBnaXZlbiBtZXRob2QsIHdoaWNoIGludm9rZXMgdGhlIGdpdmVuIHdyYXBwZXJcbiAgICAgICAqICAgICAgICBtZXRob2QgaW4gaXRzIHBsYWNlLlxuICAgICAgICovXG4gICAgICBjb25zdCB3cmFwTWV0aG9kID0gKHRhcmdldCwgbWV0aG9kLCB3cmFwcGVyKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkobWV0aG9kLCB7XG4gICAgICAgICAgYXBwbHkodGFyZ2V0TWV0aG9kLCB0aGlzT2JqLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gd3JhcHBlci5jYWxsKHRoaXNPYmosIHRhcmdldCwgLi4uYXJncyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICBsZXQgaGFzT3duUHJvcGVydHkgPSBGdW5jdGlvbi5jYWxsLmJpbmQoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbiAgICAgIC8qKlxuICAgICAgICogV3JhcHMgYW4gb2JqZWN0IGluIGEgUHJveHkgd2hpY2ggaW50ZXJjZXB0cyBhbmQgd3JhcHMgY2VydGFpbiBtZXRob2RzXG4gICAgICAgKiBiYXNlZCBvbiB0aGUgZ2l2ZW4gYHdyYXBwZXJzYCBhbmQgYG1ldGFkYXRhYCBvYmplY3RzLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAgICAgICAqICAgICAgICBUaGUgdGFyZ2V0IG9iamVjdCB0byB3cmFwLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbd3JhcHBlcnMgPSB7fV1cbiAgICAgICAqICAgICAgICBBbiBvYmplY3QgdHJlZSBjb250YWluaW5nIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBzcGVjaWFsIGNhc2VzLiBBbnlcbiAgICAgICAqICAgICAgICBmdW5jdGlvbiBwcmVzZW50IGluIHRoaXMgb2JqZWN0IHRyZWUgaXMgY2FsbGVkIGluIHBsYWNlIG9mIHRoZVxuICAgICAgICogICAgICAgIG1ldGhvZCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGUgYHRhcmdldGAgb2JqZWN0IHRyZWUuIFRoZXNlXG4gICAgICAgKiAgICAgICAgd3JhcHBlciBtZXRob2RzIGFyZSBpbnZva2VkIGFzIGRlc2NyaWJlZCBpbiB7QHNlZSB3cmFwTWV0aG9kfS5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge29iamVjdH0gW21ldGFkYXRhID0ge31dXG4gICAgICAgKiAgICAgICAgQW4gb2JqZWN0IHRyZWUgY29udGFpbmluZyBtZXRhZGF0YSB1c2VkIHRvIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVcbiAgICAgICAqICAgICAgICBQcm9taXNlLWJhc2VkIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBhc3luY2hyb25vdXMuIEFueSBmdW5jdGlvbiBpblxuICAgICAgICogICAgICAgIHRoZSBgdGFyZ2V0YCBvYmplY3QgdHJlZSB3aGljaCBoYXMgYSBjb3JyZXNwb25kaW5nIG1ldGFkYXRhIG9iamVjdFxuICAgICAgICogICAgICAgIGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZSBgbWV0YWRhdGFgIHRyZWUgaXMgcmVwbGFjZWQgd2l0aCBhblxuICAgICAgICogICAgICAgIGF1dG9tYXRpY2FsbHktZ2VuZXJhdGVkIHdyYXBwZXIgZnVuY3Rpb24sIGFzIGRlc2NyaWJlZCBpblxuICAgICAgICogICAgICAgIHtAc2VlIHdyYXBBc3luY0Z1bmN0aW9ufVxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtQcm94eTxvYmplY3Q+fVxuICAgICAgICovXG4gICAgICBjb25zdCB3cmFwT2JqZWN0ID0gKHRhcmdldCwgd3JhcHBlcnMgPSB7fSwgbWV0YWRhdGEgPSB7fSkgPT4ge1xuICAgICAgICBsZXQgY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBsZXQgaGFuZGxlcnMgPSB7XG4gICAgICAgICAgaGFzKHByb3h5VGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcCBpbiB0YXJnZXQgfHwgcHJvcCBpbiBjYWNoZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGdldChwcm94eVRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWNoZVtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghKHByb3AgaW4gdGFyZ2V0KSkge1xuICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGFyZ2V0W3Byb3BdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBtZXRob2Qgb24gdGhlIHVuZGVybHlpbmcgb2JqZWN0LiBDaGVjayBpZiB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAgIC8vIGFueSB3cmFwcGluZy5cblxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHdyYXBwZXJzW3Byb3BdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgc3BlY2lhbC1jYXNlIHdyYXBwZXIgZm9yIHRoaXMgbWV0aG9kLlxuICAgICAgICAgICAgICAgIHZhbHVlID0gd3JhcE1ldGhvZCh0YXJnZXQsIHRhcmdldFtwcm9wXSwgd3JhcHBlcnNbcHJvcF0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGhhc093blByb3BlcnR5KG1ldGFkYXRhLCBwcm9wKSkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYXN5bmMgbWV0aG9kIHRoYXQgd2UgaGF2ZSBtZXRhZGF0YSBmb3IuIENyZWF0ZSBhXG4gICAgICAgICAgICAgICAgLy8gUHJvbWlzZSB3cmFwcGVyIGZvciBpdC5cbiAgICAgICAgICAgICAgICBsZXQgd3JhcHBlciA9IHdyYXBBc3luY0Z1bmN0aW9uKHByb3AsIG1ldGFkYXRhW3Byb3BdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXBNZXRob2QodGFyZ2V0LCB0YXJnZXRbcHJvcF0sIHdyYXBwZXIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBtZXRob2QgdGhhdCB3ZSBkb24ndCBrbm93IG9yIGNhcmUgYWJvdXQuIFJldHVybiB0aGVcbiAgICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBtZXRob2QsIGJvdW5kIHRvIHRoZSB1bmRlcmx5aW5nIG9iamVjdC5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmJpbmQodGFyZ2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgKGhhc093blByb3BlcnR5KHdyYXBwZXJzLCBwcm9wKSB8fCBoYXNPd25Qcm9wZXJ0eShtZXRhZGF0YSwgcHJvcCkpKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gb2JqZWN0IHRoYXQgd2UgbmVlZCB0byBkbyBzb21lIHdyYXBwaW5nIGZvciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgICAgLy8gb2YuIENyZWF0ZSBhIHN1Yi1vYmplY3Qgd3JhcHBlciBmb3IgaXQgd2l0aCB0aGUgYXBwcm9wcmlhdGUgY2hpbGRcbiAgICAgICAgICAgICAgLy8gbWV0YWRhdGEuXG4gICAgICAgICAgICAgIHZhbHVlID0gd3JhcE9iamVjdCh2YWx1ZSwgd3JhcHBlcnNbcHJvcF0sIG1ldGFkYXRhW3Byb3BdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzT3duUHJvcGVydHkobWV0YWRhdGEsIFwiKlwiKSkge1xuICAgICAgICAgICAgICAvLyBXcmFwIGFsbCBwcm9wZXJ0aWVzIGluICogbmFtZXNwYWNlLlxuICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXBPYmplY3QodmFsdWUsIHdyYXBwZXJzW3Byb3BdLCBtZXRhZGF0YVtcIipcIl0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBkbyBhbnkgd3JhcHBpbmcgZm9yIHRoaXMgcHJvcGVydHksXG4gICAgICAgICAgICAgIC8vIHNvIGp1c3QgZm9yd2FyZCBhbGwgYWNjZXNzIHRvIHRoZSB1bmRlcmx5aW5nIG9iamVjdC5cbiAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhY2hlLCBwcm9wLCB7XG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FjaGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldChwcm94eVRhcmdldCwgcHJvcCwgdmFsdWUsIHJlY2VpdmVyKSB7XG4gICAgICAgICAgICBpZiAocHJvcCBpbiBjYWNoZSkge1xuICAgICAgICAgICAgICBjYWNoZVtwcm9wXSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRlZmluZVByb3BlcnR5KHByb3h5VGFyZ2V0LCBwcm9wLCBkZXNjKSB7XG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eShjYWNoZSwgcHJvcCwgZGVzYyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBkZWxldGVQcm9wZXJ0eShwcm94eVRhcmdldCwgcHJvcCkge1xuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoY2FjaGUsIHByb3ApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBQZXIgY29udHJhY3Qgb2YgdGhlIFByb3h5IEFQSSwgdGhlIFwiZ2V0XCIgcHJveHkgaGFuZGxlciBtdXN0IHJldHVybiB0aGVcbiAgICAgICAgLy8gb3JpZ2luYWwgdmFsdWUgb2YgdGhlIHRhcmdldCBpZiB0aGF0IHZhbHVlIGlzIGRlY2xhcmVkIHJlYWQtb25seSBhbmRcbiAgICAgICAgLy8gbm9uLWNvbmZpZ3VyYWJsZS4gRm9yIHRoaXMgcmVhc29uLCB3ZSBjcmVhdGUgYW4gb2JqZWN0IHdpdGggdGhlXG4gICAgICAgIC8vIHByb3RvdHlwZSBzZXQgdG8gYHRhcmdldGAgaW5zdGVhZCBvZiB1c2luZyBgdGFyZ2V0YCBkaXJlY3RseS5cbiAgICAgICAgLy8gT3RoZXJ3aXNlIHdlIGNhbm5vdCByZXR1cm4gYSBjdXN0b20gb2JqZWN0IGZvciBBUElzIHRoYXRcbiAgICAgICAgLy8gYXJlIGRlY2xhcmVkIHJlYWQtb25seSBhbmQgbm9uLWNvbmZpZ3VyYWJsZSwgc3VjaCBhcyBgY2hyb21lLmRldnRvb2xzYC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIHByb3h5IGhhbmRsZXJzIHRoZW1zZWx2ZXMgd2lsbCBzdGlsbCB1c2UgdGhlIG9yaWdpbmFsIGB0YXJnZXRgXG4gICAgICAgIC8vIGluc3RlYWQgb2YgdGhlIGBwcm94eVRhcmdldGAsIHNvIHRoYXQgdGhlIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgYXJlXG4gICAgICAgIC8vIGRlcmVmZXJlbmNlZCB2aWEgdGhlIG9yaWdpbmFsIHRhcmdldHMuXG4gICAgICAgIGxldCBwcm94eVRhcmdldCA9IE9iamVjdC5jcmVhdGUodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShwcm94eVRhcmdldCwgaGFuZGxlcnMpO1xuICAgICAgfTtcblxuICAgICAgLyoqXG4gICAgICAgKiBDcmVhdGVzIGEgc2V0IG9mIHdyYXBwZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBvYmplY3QsIHdoaWNoIGhhbmRsZXNcbiAgICAgICAqIHdyYXBwaW5nIG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0aGF0IHRob3NlIG1lc3NhZ2VzIGFyZSBwYXNzZWQuXG4gICAgICAgKlxuICAgICAgICogQSBzaW5nbGUgd3JhcHBlciBpcyBjcmVhdGVkIGZvciBlYWNoIGxpc3RlbmVyIGZ1bmN0aW9uLCBhbmQgc3RvcmVkIGluIGFcbiAgICAgICAqIG1hcC4gU3Vic2VxdWVudCBjYWxscyB0byBgYWRkTGlzdGVuZXJgLCBgaGFzTGlzdGVuZXJgLCBvciBgcmVtb3ZlTGlzdGVuZXJgXG4gICAgICAgKiByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgd3JhcHBlciwgc28gdGhhdCAgYXR0ZW1wdHMgdG8gcmVtb3ZlIGFcbiAgICAgICAqIHByZXZpb3VzbHktYWRkZWQgbGlzdGVuZXIgd29yayBhcyBleHBlY3RlZC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge0RlZmF1bHRXZWFrTWFwPGZ1bmN0aW9uLCBmdW5jdGlvbj59IHdyYXBwZXJNYXBcbiAgICAgICAqICAgICAgICBBIERlZmF1bHRXZWFrTWFwIG9iamVjdCB3aGljaCB3aWxsIGNyZWF0ZSB0aGUgYXBwcm9wcmlhdGUgd3JhcHBlclxuICAgICAgICogICAgICAgIGZvciBhIGdpdmVuIGxpc3RlbmVyIGZ1bmN0aW9uIHdoZW4gb25lIGRvZXMgbm90IGV4aXN0LCBhbmQgcmV0cmlldmVcbiAgICAgICAqICAgICAgICBhbiBleGlzdGluZyBvbmUgd2hlbiBpdCBkb2VzLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9XG4gICAgICAgKi9cbiAgICAgIGNvbnN0IHdyYXBFdmVudCA9IHdyYXBwZXJNYXAgPT4gKHtcbiAgICAgICAgYWRkTGlzdGVuZXIodGFyZ2V0LCBsaXN0ZW5lciwgLi4uYXJncykge1xuICAgICAgICAgIHRhcmdldC5hZGRMaXN0ZW5lcih3cmFwcGVyTWFwLmdldChsaXN0ZW5lciksIC4uLmFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBoYXNMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldC5oYXNMaXN0ZW5lcih3cmFwcGVyTWFwLmdldChsaXN0ZW5lcikpO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmVMaXN0ZW5lcih0YXJnZXQsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgdGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHdyYXBwZXJNYXAuZ2V0KGxpc3RlbmVyKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY29uc3Qgb25SZXF1ZXN0RmluaXNoZWRXcmFwcGVycyA9IG5ldyBEZWZhdWx0V2Vha01hcChsaXN0ZW5lciA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXcmFwcyBhbiBvblJlcXVlc3RGaW5pc2hlZCBsaXN0ZW5lciBmdW5jdGlvbiBzbyB0aGF0IGl0IHdpbGwgcmV0dXJuIGFcbiAgICAgICAgICogYGdldENvbnRlbnQoKWAgcHJvcGVydHkgd2hpY2ggcmV0dXJucyBhIGBQcm9taXNlYCByYXRoZXIgdGhhbiB1c2luZyBhXG4gICAgICAgICAqIGNhbGxiYWNrIEFQSS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICAgICAgICAgKiAgICAgICAgVGhlIEhBUiBlbnRyeSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBuZXR3b3JrIHJlcXVlc3QuXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gb25SZXF1ZXN0RmluaXNoZWQocmVxKSB7XG4gICAgICAgICAgY29uc3Qgd3JhcHBlZFJlcSA9IHdyYXBPYmplY3QocmVxLCB7fSAvKiB3cmFwcGVycyAqLywge1xuICAgICAgICAgICAgZ2V0Q29udGVudDoge1xuICAgICAgICAgICAgICBtaW5BcmdzOiAwLFxuICAgICAgICAgICAgICBtYXhBcmdzOiAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbGlzdGVuZXIod3JhcHBlZFJlcSk7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG9uTWVzc2FnZVdyYXBwZXJzID0gbmV3IERlZmF1bHRXZWFrTWFwKGxpc3RlbmVyID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdyYXBzIGEgbWVzc2FnZSBsaXN0ZW5lciBmdW5jdGlvbiBzbyB0aGF0IGl0IG1heSBzZW5kIHJlc3BvbnNlcyBiYXNlZCBvblxuICAgICAgICAgKiBpdHMgcmV0dXJuIHZhbHVlLCByYXRoZXIgdGhhbiBieSByZXR1cm5pbmcgYSBzZW50aW5lbCB2YWx1ZSBhbmQgY2FsbGluZyBhXG4gICAgICAgICAqIGNhbGxiYWNrLiBJZiB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gcmV0dXJucyBhIFByb21pc2UsIHRoZSByZXNwb25zZSBpc1xuICAgICAgICAgKiBzZW50IHdoZW4gdGhlIHByb21pc2UgZWl0aGVyIHJlc29sdmVzIG9yIHJlamVjdHMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gbWVzc2FnZVxuICAgICAgICAgKiAgICAgICAgVGhlIG1lc3NhZ2Ugc2VudCBieSB0aGUgb3RoZXIgZW5kIG9mIHRoZSBjaGFubmVsLlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gc2VuZGVyXG4gICAgICAgICAqICAgICAgICBEZXRhaWxzIGFib3V0IHRoZSBzZW5kZXIgb2YgdGhlIG1lc3NhZ2UuXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oKil9IHNlbmRSZXNwb25zZVxuICAgICAgICAgKiAgICAgICAgQSBjYWxsYmFjayB3aGljaCwgd2hlbiBjYWxsZWQgd2l0aCBhbiBhcmJpdHJhcnkgYXJndW1lbnQsIHNlbmRzXG4gICAgICAgICAqICAgICAgICB0aGF0IHZhbHVlIGFzIGEgcmVzcG9uc2UuXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKiAgICAgICAgVHJ1ZSBpZiB0aGUgd3JhcHBlZCBsaXN0ZW5lciByZXR1cm5lZCBhIFByb21pc2UsIHdoaWNoIHdpbGwgbGF0ZXJcbiAgICAgICAgICogICAgICAgIHlpZWxkIGEgcmVzcG9uc2UuIEZhbHNlIG90aGVyd2lzZS5cbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBvbk1lc3NhZ2UobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgICAgICAgICBsZXQgZGlkQ2FsbFNlbmRSZXNwb25zZSA9IGZhbHNlO1xuICAgICAgICAgIGxldCB3cmFwcGVkU2VuZFJlc3BvbnNlO1xuICAgICAgICAgIGxldCBzZW5kUmVzcG9uc2VQcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICB3cmFwcGVkU2VuZFJlc3BvbnNlID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIGRpZENhbGxTZW5kUmVzcG9uc2UgPSB0cnVlO1xuICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0ID0gbGlzdGVuZXIobWVzc2FnZSwgc2VuZGVyLCB3cmFwcGVkU2VuZFJlc3BvbnNlKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGlzUmVzdWx0VGhlbmFibGUgPSByZXN1bHQgIT09IHRydWUgJiYgaXNUaGVuYWJsZShyZXN1bHQpO1xuXG4gICAgICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIGRpZG4ndCByZXR1cm5lZCB0cnVlIG9yIGEgUHJvbWlzZSwgb3IgY2FsbGVkXG4gICAgICAgICAgLy8gd3JhcHBlZFNlbmRSZXNwb25zZSBzeW5jaHJvbm91c2x5LCB3ZSBjYW4gZXhpdCBlYXJsaWVyXG4gICAgICAgICAgLy8gYmVjYXVzZSB0aGVyZSB3aWxsIGJlIG5vIHJlc3BvbnNlIHNlbnQgZnJvbSB0aGlzIGxpc3RlbmVyLlxuICAgICAgICAgIGlmIChyZXN1bHQgIT09IHRydWUgJiYgIWlzUmVzdWx0VGhlbmFibGUgJiYgIWRpZENhbGxTZW5kUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBIHNtYWxsIGhlbHBlciB0byBzZW5kIHRoZSBtZXNzYWdlIGlmIHRoZSBwcm9taXNlIHJlc29sdmVzXG4gICAgICAgICAgLy8gYW5kIGFuIGVycm9yIGlmIHRoZSBwcm9taXNlIHJlamVjdHMgKGEgd3JhcHBlZCBzZW5kTWVzc2FnZSBoYXNcbiAgICAgICAgICAvLyB0byB0cmFuc2xhdGUgdGhlIG1lc3NhZ2UgaW50byBhIHJlc29sdmVkIHByb21pc2Ugb3IgYSByZWplY3RlZFxuICAgICAgICAgIC8vIHByb21pc2UpLlxuICAgICAgICAgIGNvbnN0IHNlbmRQcm9taXNlZFJlc3VsdCA9IHByb21pc2UgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKG1zZyA9PiB7XG4gICAgICAgICAgICAgIC8vIHNlbmQgdGhlIG1lc3NhZ2UgdmFsdWUuXG4gICAgICAgICAgICAgIHNlbmRSZXNwb25zZShtc2cpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAvLyBTZW5kIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgZXJyb3IgaWYgdGhlIHJlamVjdGVkIHZhbHVlXG4gICAgICAgICAgICAgIC8vIGlzIGFuIGluc3RhbmNlIG9mIGVycm9yLCBvciB0aGUgb2JqZWN0IGl0c2VsZiBvdGhlcndpc2UuXG4gICAgICAgICAgICAgIGxldCBtZXNzYWdlO1xuICAgICAgICAgICAgICBpZiAoZXJyb3IgJiYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgfHwgdHlwZW9mIGVycm9yLm1lc3NhZ2UgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZFwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgX19tb3pXZWJFeHRlbnNpb25Qb2x5ZmlsbFJlamVjdF9fOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAvLyBQcmludCBhbiBlcnJvciBvbiB0aGUgY29uc29sZSBpZiB1bmFibGUgdG8gc2VuZCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gc2VuZCBvbk1lc3NhZ2UgcmVqZWN0ZWQgcmVwbHlcIiwgZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJuZWQgYSBQcm9taXNlLCBzZW5kIHRoZSByZXNvbHZlZCB2YWx1ZSBhcyBhXG4gICAgICAgICAgLy8gcmVzdWx0LCBvdGhlcndpc2Ugd2FpdCB0aGUgcHJvbWlzZSByZWxhdGVkIHRvIHRoZSB3cmFwcGVkU2VuZFJlc3BvbnNlXG4gICAgICAgICAgLy8gY2FsbGJhY2sgdG8gcmVzb2x2ZSBhbmQgc2VuZCBpdCBhcyBhIHJlc3BvbnNlLlxuICAgICAgICAgIGlmIChpc1Jlc3VsdFRoZW5hYmxlKSB7XG4gICAgICAgICAgICBzZW5kUHJvbWlzZWRSZXN1bHQocmVzdWx0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VuZFByb21pc2VkUmVzdWx0KHNlbmRSZXNwb25zZVByb21pc2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIExldCBDaHJvbWUga25vdyB0aGF0IHRoZSBsaXN0ZW5lciBpcyByZXBseWluZy5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgd3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2sgPSAoe1xuICAgICAgICByZWplY3QsXG4gICAgICAgIHJlc29sdmVcbiAgICAgIH0sIHJlcGx5KSA9PiB7XG4gICAgICAgIGlmIChleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgLy8gRGV0ZWN0IHdoZW4gbm9uZSBvZiB0aGUgbGlzdGVuZXJzIHJlcGxpZWQgdG8gdGhlIHNlbmRNZXNzYWdlIGNhbGwgYW5kIHJlc29sdmVcbiAgICAgICAgICAvLyB0aGUgcHJvbWlzZSB0byB1bmRlZmluZWQgYXMgaW4gRmlyZWZveC5cbiAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvd2ViZXh0ZW5zaW9uLXBvbHlmaWxsL2lzc3Vlcy8xMzBcbiAgICAgICAgICBpZiAoZXh0ZW5zaW9uQVBJcy5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlID09PSBDSFJPTUVfU0VORF9NRVNTQUdFX0NBTExCQUNLX05PX1JFU1BPTlNFX01FU1NBR0UpIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihleHRlbnNpb25BUElzLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocmVwbHkgJiYgcmVwbHkuX19tb3pXZWJFeHRlbnNpb25Qb2x5ZmlsbFJlamVjdF9fKSB7XG4gICAgICAgICAgLy8gQ29udmVydCBiYWNrIHRoZSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBlcnJvciBpbnRvXG4gICAgICAgICAgLy8gYW4gRXJyb3IgaW5zdGFuY2UuXG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXBseS5tZXNzYWdlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzb2x2ZShyZXBseSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjb25zdCB3cmFwcGVkU2VuZE1lc3NhZ2UgPSAobmFtZSwgbWV0YWRhdGEsIGFwaU5hbWVzcGFjZU9iaiwgLi4uYXJncykgPT4ge1xuICAgICAgICBpZiAoYXJncy5sZW5ndGggPCBtZXRhZGF0YS5taW5BcmdzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBsZWFzdCAke21ldGFkYXRhLm1pbkFyZ3N9ICR7cGx1cmFsaXplQXJndW1lbnRzKG1ldGFkYXRhLm1pbkFyZ3MpfSBmb3IgJHtuYW1lfSgpLCBnb3QgJHthcmdzLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPiBtZXRhZGF0YS5tYXhBcmdzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhdCBtb3N0ICR7bWV0YWRhdGEubWF4QXJnc30gJHtwbHVyYWxpemVBcmd1bWVudHMobWV0YWRhdGEubWF4QXJncyl9IGZvciAke25hbWV9KCksIGdvdCAke2FyZ3MubGVuZ3RofWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgd3JhcHBlZENiID0gd3JhcHBlZFNlbmRNZXNzYWdlQ2FsbGJhY2suYmluZChudWxsLCB7XG4gICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgcmVqZWN0XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYXJncy5wdXNoKHdyYXBwZWRDYik7XG4gICAgICAgICAgYXBpTmFtZXNwYWNlT2JqLnNlbmRNZXNzYWdlKC4uLmFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICBjb25zdCBzdGF0aWNXcmFwcGVycyA9IHtcbiAgICAgICAgZGV2dG9vbHM6IHtcbiAgICAgICAgICBuZXR3b3JrOiB7XG4gICAgICAgICAgICBvblJlcXVlc3RGaW5pc2hlZDogd3JhcEV2ZW50KG9uUmVxdWVzdEZpbmlzaGVkV3JhcHBlcnMpXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBydW50aW1lOiB7XG4gICAgICAgICAgb25NZXNzYWdlOiB3cmFwRXZlbnQob25NZXNzYWdlV3JhcHBlcnMpLFxuICAgICAgICAgIG9uTWVzc2FnZUV4dGVybmFsOiB3cmFwRXZlbnQob25NZXNzYWdlV3JhcHBlcnMpLFxuICAgICAgICAgIHNlbmRNZXNzYWdlOiB3cmFwcGVkU2VuZE1lc3NhZ2UuYmluZChudWxsLCBcInNlbmRNZXNzYWdlXCIsIHtcbiAgICAgICAgICAgIG1pbkFyZ3M6IDEsXG4gICAgICAgICAgICBtYXhBcmdzOiAzXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgdGFiczoge1xuICAgICAgICAgIHNlbmRNZXNzYWdlOiB3cmFwcGVkU2VuZE1lc3NhZ2UuYmluZChudWxsLCBcInNlbmRNZXNzYWdlXCIsIHtcbiAgICAgICAgICAgIG1pbkFyZ3M6IDIsXG4gICAgICAgICAgICBtYXhBcmdzOiAzXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHNldHRpbmdNZXRhZGF0YSA9IHtcbiAgICAgICAgY2xlYXI6IHtcbiAgICAgICAgICBtaW5BcmdzOiAxLFxuICAgICAgICAgIG1heEFyZ3M6IDFcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgbWluQXJnczogMSxcbiAgICAgICAgICBtYXhBcmdzOiAxXG4gICAgICAgIH0sXG4gICAgICAgIHNldDoge1xuICAgICAgICAgIG1pbkFyZ3M6IDEsXG4gICAgICAgICAgbWF4QXJnczogMVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgYXBpTWV0YWRhdGEucHJpdmFjeSA9IHtcbiAgICAgICAgbmV0d29yazoge1xuICAgICAgICAgIFwiKlwiOiBzZXR0aW5nTWV0YWRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmljZXM6IHtcbiAgICAgICAgICBcIipcIjogc2V0dGluZ01ldGFkYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHdlYnNpdGVzOiB7XG4gICAgICAgICAgXCIqXCI6IHNldHRpbmdNZXRhZGF0YVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHdyYXBPYmplY3QoZXh0ZW5zaW9uQVBJcywgc3RhdGljV3JhcHBlcnMsIGFwaU1ldGFkYXRhKTtcbiAgICB9O1xuXG4gICAgLy8gVGhlIGJ1aWxkIHByb2Nlc3MgYWRkcyBhIFVNRCB3cmFwcGVyIGFyb3VuZCB0aGlzIGZpbGUsIHdoaWNoIG1ha2VzIHRoZVxuICAgIC8vIGBtb2R1bGVgIHZhcmlhYmxlIGF2YWlsYWJsZS5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdyYXBBUElzKGNocm9tZSk7XG4gIH0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxUaGlzLmJyb3dzZXI7XG4gIH1cbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YnJvd3Nlci1wb2x5ZmlsbC5qcy5tYXBcbiIsImltcG9ydCBvcmlnaW5hbEJyb3dzZXIgZnJvbSBcIndlYmV4dGVuc2lvbi1wb2x5ZmlsbFwiO1xuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBvcmlnaW5hbEJyb3dzZXI7XG4iLCJmdW5jdGlvbiBwcmludChtZXRob2QsIC4uLmFyZ3MpIHtcbiAgaWYgKGltcG9ydC5tZXRhLmVudi5NT0RFID09PSBcInByb2R1Y3Rpb25cIikgcmV0dXJuO1xuICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gYXJncy5zaGlmdCgpO1xuICAgIG1ldGhvZChgW3d4dF0gJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xuICB9XG59XG5leHBvcnQgY29uc3QgbG9nZ2VyID0ge1xuICBkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuICBsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG4gIHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuICBlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuZXhwb3J0IGNsYXNzIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG4gIGNvbnN0cnVjdG9yKG5ld1VybCwgb2xkVXJsKSB7XG4gICAgc3VwZXIoV3h0TG9jYXRpb25DaGFuZ2VFdmVudC5FVkVOVF9OQU1FLCB7fSk7XG4gICAgdGhpcy5uZXdVcmwgPSBuZXdVcmw7XG4gICAgdGhpcy5vbGRVcmwgPSBvbGRVcmw7XG4gIH1cbiAgc3RhdGljIEVWRU5UX05BTUUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIik7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRXZlbnROYW1lKGV2ZW50TmFtZSkge1xuICByZXR1cm4gYCR7YnJvd3Nlcj8ucnVudGltZT8uaWR9OiR7aW1wb3J0Lm1ldGEuZW52LkVOVFJZUE9JTlR9OiR7ZXZlbnROYW1lfWA7XG59XG4iLCJpbXBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IH0gZnJvbSBcIi4vY3VzdG9tLWV2ZW50cy5tanNcIjtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMb2NhdGlvbldhdGNoZXIoY3R4KSB7XG4gIGxldCBpbnRlcnZhbDtcbiAgbGV0IG9sZFVybDtcbiAgcmV0dXJuIHtcbiAgICAvKipcbiAgICAgKiBFbnN1cmUgdGhlIGxvY2F0aW9uIHdhdGNoZXIgaXMgYWN0aXZlbHkgbG9va2luZyBmb3IgVVJMIGNoYW5nZXMuIElmIGl0J3MgYWxyZWFkeSB3YXRjaGluZyxcbiAgICAgKiB0aGlzIGlzIGEgbm9vcC5cbiAgICAgKi9cbiAgICBydW4oKSB7XG4gICAgICBpZiAoaW50ZXJ2YWwgIT0gbnVsbCkgcmV0dXJuO1xuICAgICAgb2xkVXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcbiAgICAgIGludGVydmFsID0gY3R4LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgbGV0IG5ld1VybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG4gICAgICAgIGlmIChuZXdVcmwuaHJlZiAhPT0gb2xkVXJsLmhyZWYpIHtcbiAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIG9sZFVybCkpO1xuICAgICAgICAgIG9sZFVybCA9IG5ld1VybDtcbiAgICAgICAgfVxuICAgICAgfSwgMWUzKTtcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi4vLi4vc2FuZGJveC91dGlscy9sb2dnZXIubWpzXCI7XG5pbXBvcnQgeyBnZXRVbmlxdWVFdmVudE5hbWUgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH0gZnJvbSBcIi4vbG9jYXRpb24td2F0Y2hlci5tanNcIjtcbmV4cG9ydCBjbGFzcyBDb250ZW50U2NyaXB0Q29udGV4dCB7XG4gIGNvbnN0cnVjdG9yKGNvbnRlbnRTY3JpcHROYW1lLCBvcHRpb25zKSB7XG4gICAgdGhpcy5jb250ZW50U2NyaXB0TmFtZSA9IGNvbnRlbnRTY3JpcHROYW1lO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgaWYgKHRoaXMuaXNUb3BGcmFtZSkge1xuICAgICAgdGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoeyBpZ25vcmVGaXJzdEV2ZW50OiB0cnVlIH0pO1xuICAgICAgdGhpcy5zdG9wT2xkU2NyaXB0cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cygpO1xuICAgIH1cbiAgfVxuICBzdGF0aWMgU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFID0gZ2V0VW5pcXVlRXZlbnROYW1lKFxuICAgIFwid3h0OmNvbnRlbnQtc2NyaXB0LXN0YXJ0ZWRcIlxuICApO1xuICBpc1RvcEZyYW1lID0gd2luZG93LnNlbGYgPT09IHdpbmRvdy50b3A7XG4gIGFib3J0Q29udHJvbGxlcjtcbiAgbG9jYXRpb25XYXRjaGVyID0gY3JlYXRlTG9jYXRpb25XYXRjaGVyKHRoaXMpO1xuICByZWNlaXZlZE1lc3NhZ2VJZHMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xuICBnZXQgc2lnbmFsKCkge1xuICAgIHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5zaWduYWw7XG4gIH1cbiAgYWJvcnQocmVhc29uKSB7XG4gICAgcmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLmFib3J0KHJlYXNvbik7XG4gIH1cbiAgZ2V0IGlzSW52YWxpZCgpIHtcbiAgICBpZiAoYnJvd3Nlci5ydW50aW1lLmlkID09IG51bGwpIHtcbiAgICAgIHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2lnbmFsLmFib3J0ZWQ7XG4gIH1cbiAgZ2V0IGlzVmFsaWQoKSB7XG4gICAgcmV0dXJuICF0aGlzLmlzSW52YWxpZDtcbiAgfVxuICAvKipcbiAgICogQWRkIGEgbGlzdGVuZXIgdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBzY3JpcHQncyBjb250ZXh0IGlzIGludmFsaWRhdGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoY2IpO1xuICAgKiBjb25zdCByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyID0gY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4ge1xuICAgKiAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIoY2IpO1xuICAgKiB9KVxuICAgKiAvLyAuLi5cbiAgICogcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lcigpO1xuICAgKi9cbiAgb25JbnZhbGlkYXRlZChjYikge1xuICAgIHRoaXMuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG4gICAgcmV0dXJuICgpID0+IHRoaXMuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybiBhIHByb21pc2UgdGhhdCBuZXZlciByZXNvbHZlcy4gVXNlZnVsIGlmIHlvdSBoYXZlIGFuIGFzeW5jIGZ1bmN0aW9uIHRoYXQgc2hvdWxkbid0IHJ1blxuICAgKiBhZnRlciB0aGUgY29udGV4dCBpcyBleHBpcmVkLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBjb25zdCBnZXRWYWx1ZUZyb21TdG9yYWdlID0gYXN5bmMgKCkgPT4ge1xuICAgKiAgIGlmIChjdHguaXNJbnZhbGlkKSByZXR1cm4gY3R4LmJsb2NrKCk7XG4gICAqXG4gICAqICAgLy8gLi4uXG4gICAqIH1cbiAgICovXG4gIGJsb2NrKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgoKSA9PiB7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0SW50ZXJ2YWxgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsIHdoZW4gaW52YWxpZGF0ZWQuXG4gICAqL1xuICBzZXRJbnRlcnZhbChoYW5kbGVyLCB0aW1lb3V0KSB7XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG4gICAgfSwgdGltZW91dCk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFySW50ZXJ2YWwoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWwgd2hlbiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHNldFRpbWVvdXQoaGFuZGxlciwgdGltZW91dCkge1xuICAgIGNvbnN0IGlkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG4gICAgfSwgdGltZW91dCk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFyVGltZW91dChpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZSByZXF1ZXN0IHdoZW5cbiAgICogaW52YWxpZGF0ZWQuXG4gICAqL1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spIHtcbiAgICBjb25zdCBpZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgY2FsbGJhY2soLi4uYXJncyk7XG4gICAgfSk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2tgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZSByZXF1ZXN0IHdoZW5cbiAgICogaW52YWxpZGF0ZWQuXG4gICAqL1xuICByZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG4gICAgY29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuICAgIH0sIG9wdGlvbnMpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgYWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG4gICAgfVxuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4oXG4gICAgICB0eXBlLnN0YXJ0c1dpdGgoXCJ3eHQ6XCIpID8gZ2V0VW5pcXVlRXZlbnROYW1lKHR5cGUpIDogdHlwZSxcbiAgICAgIGhhbmRsZXIsXG4gICAgICB7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIHNpZ25hbDogdGhpcy5zaWduYWxcbiAgICAgIH1cbiAgICApO1xuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG4gICAqL1xuICBub3RpZnlJbnZhbGlkYXRlZCgpIHtcbiAgICB0aGlzLmFib3J0KFwiQ29udGVudCBzY3JpcHQgY29udGV4dCBpbnZhbGlkYXRlZFwiKTtcbiAgICBsb2dnZXIuZGVidWcoXG4gICAgICBgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGBcbiAgICApO1xuICB9XG4gIHN0b3BPbGRTY3JpcHRzKCkge1xuICAgIHdpbmRvdy5wb3N0TWVzc2FnZShcbiAgICAgIHtcbiAgICAgICAgdHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuICAgICAgICBjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcbiAgICAgICAgbWVzc2FnZUlkOiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKVxuICAgICAgfSxcbiAgICAgIFwiKlwiXG4gICAgKTtcbiAgfVxuICB2ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpIHtcbiAgICBjb25zdCBpc1NjcmlwdFN0YXJ0ZWRFdmVudCA9IGV2ZW50LmRhdGE/LnR5cGUgPT09IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRTtcbiAgICBjb25zdCBpc1NhbWVDb250ZW50U2NyaXB0ID0gZXZlbnQuZGF0YT8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG4gICAgY29uc3QgaXNOb3REdXBsaWNhdGUgPSAhdGhpcy5yZWNlaXZlZE1lc3NhZ2VJZHMuaGFzKGV2ZW50LmRhdGE/Lm1lc3NhZ2VJZCk7XG4gICAgcmV0dXJuIGlzU2NyaXB0U3RhcnRlZEV2ZW50ICYmIGlzU2FtZUNvbnRlbnRTY3JpcHQgJiYgaXNOb3REdXBsaWNhdGU7XG4gIH1cbiAgbGlzdGVuRm9yTmV3ZXJTY3JpcHRzKG9wdGlvbnMpIHtcbiAgICBsZXQgaXNGaXJzdCA9IHRydWU7XG4gICAgY29uc3QgY2IgPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLnZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkpIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlZE1lc3NhZ2VJZHMuYWRkKGV2ZW50LmRhdGEubWVzc2FnZUlkKTtcbiAgICAgICAgY29uc3Qgd2FzRmlyc3QgPSBpc0ZpcnN0O1xuICAgICAgICBpc0ZpcnN0ID0gZmFsc2U7XG4gICAgICAgIGlmICh3YXNGaXJzdCAmJiBvcHRpb25zPy5pZ25vcmVGaXJzdEV2ZW50KSByZXR1cm47XG4gICAgICAgIHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNiKTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gcmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgY2IpKTtcbiAgfVxufVxuIiwiY29uc3QgbnVsbEtleSA9IFN5bWJvbCgnbnVsbCcpOyAvLyBgb2JqZWN0SGFzaGVzYCBrZXkgZm9yIG51bGxcblxubGV0IGtleUNvdW50ZXIgPSAwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYW55S2V5c01hcCBleHRlbmRzIE1hcCB7XG5cdGNvbnN0cnVjdG9yKC4uLmFyZ3VtZW50c18pIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5fb2JqZWN0SGFzaGVzID0gbmV3IFdlYWtNYXAoKTtcblx0XHR0aGlzLl9zeW1ib2xIYXNoZXMgPSBuZXcgTWFwKCk7IC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YzM5L2VjbWEyNjIvaXNzdWVzLzExOTRcblx0XHR0aGlzLl9wdWJsaWNLZXlzID0gbmV3IE1hcCgpO1xuXG5cdFx0Y29uc3QgW3BhaXJzXSA9IGFyZ3VtZW50c187IC8vIE1hcCBjb21wYXRcblx0XHRpZiAocGFpcnMgPT09IG51bGwgfHwgcGFpcnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcGFpcnNbU3ltYm9sLml0ZXJhdG9yXSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcih0eXBlb2YgcGFpcnMgKyAnIGlzIG5vdCBpdGVyYWJsZSAoY2Fubm90IHJlYWQgcHJvcGVydHkgU3ltYm9sKFN5bWJvbC5pdGVyYXRvcikpJyk7XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBba2V5cywgdmFsdWVdIG9mIHBhaXJzKSB7XG5cdFx0XHR0aGlzLnNldChrZXlzLCB2YWx1ZSk7XG5cdFx0fVxuXHR9XG5cblx0X2dldFB1YmxpY0tleXMoa2V5cywgY3JlYXRlID0gZmFsc2UpIHtcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkoa2V5cykpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBrZXlzIHBhcmFtZXRlciBtdXN0IGJlIGFuIGFycmF5Jyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcHJpdmF0ZUtleSA9IHRoaXMuX2dldFByaXZhdGVLZXkoa2V5cywgY3JlYXRlKTtcblxuXHRcdGxldCBwdWJsaWNLZXk7XG5cdFx0aWYgKHByaXZhdGVLZXkgJiYgdGhpcy5fcHVibGljS2V5cy5oYXMocHJpdmF0ZUtleSkpIHtcblx0XHRcdHB1YmxpY0tleSA9IHRoaXMuX3B1YmxpY0tleXMuZ2V0KHByaXZhdGVLZXkpO1xuXHRcdH0gZWxzZSBpZiAoY3JlYXRlKSB7XG5cdFx0XHRwdWJsaWNLZXkgPSBbLi4ua2V5c107IC8vIFJlZ2VuZXJhdGUga2V5cyBhcnJheSB0byBhdm9pZCBleHRlcm5hbCBpbnRlcmFjdGlvblxuXHRcdFx0dGhpcy5fcHVibGljS2V5cy5zZXQocHJpdmF0ZUtleSwgcHVibGljS2V5KTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge3ByaXZhdGVLZXksIHB1YmxpY0tleX07XG5cdH1cblxuXHRfZ2V0UHJpdmF0ZUtleShrZXlzLCBjcmVhdGUgPSBmYWxzZSkge1xuXHRcdGNvbnN0IHByaXZhdGVLZXlzID0gW107XG5cdFx0Zm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuXHRcdFx0Y29uc3Qga2V5VG9QYXNzID0ga2V5ID09PSBudWxsID8gbnVsbEtleSA6IGtleTtcblxuXHRcdFx0bGV0IGhhc2hlcztcblx0XHRcdGlmICh0eXBlb2Yga2V5VG9QYXNzID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5VG9QYXNzID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGhhc2hlcyA9ICdfb2JqZWN0SGFzaGVzJztcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGtleVRvUGFzcyA9PT0gJ3N5bWJvbCcpIHtcblx0XHRcdFx0aGFzaGVzID0gJ19zeW1ib2xIYXNoZXMnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aGFzaGVzID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghaGFzaGVzKSB7XG5cdFx0XHRcdHByaXZhdGVLZXlzLnB1c2goa2V5VG9QYXNzKTtcblx0XHRcdH0gZWxzZSBpZiAodGhpc1toYXNoZXNdLmhhcyhrZXlUb1Bhc3MpKSB7XG5cdFx0XHRcdHByaXZhdGVLZXlzLnB1c2godGhpc1toYXNoZXNdLmdldChrZXlUb1Bhc3MpKTtcblx0XHRcdH0gZWxzZSBpZiAoY3JlYXRlKSB7XG5cdFx0XHRcdGNvbnN0IHByaXZhdGVLZXkgPSBgQEBta20tcmVmLSR7a2V5Q291bnRlcisrfUBAYDtcblx0XHRcdFx0dGhpc1toYXNoZXNdLnNldChrZXlUb1Bhc3MsIHByaXZhdGVLZXkpO1xuXHRcdFx0XHRwcml2YXRlS2V5cy5wdXNoKHByaXZhdGVLZXkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeShwcml2YXRlS2V5cyk7XG5cdH1cblxuXHRzZXQoa2V5cywgdmFsdWUpIHtcblx0XHRjb25zdCB7cHVibGljS2V5fSA9IHRoaXMuX2dldFB1YmxpY0tleXMoa2V5cywgdHJ1ZSk7XG5cdFx0cmV0dXJuIHN1cGVyLnNldChwdWJsaWNLZXksIHZhbHVlKTtcblx0fVxuXG5cdGdldChrZXlzKSB7XG5cdFx0Y29uc3Qge3B1YmxpY0tleX0gPSB0aGlzLl9nZXRQdWJsaWNLZXlzKGtleXMpO1xuXHRcdHJldHVybiBzdXBlci5nZXQocHVibGljS2V5KTtcblx0fVxuXG5cdGhhcyhrZXlzKSB7XG5cdFx0Y29uc3Qge3B1YmxpY0tleX0gPSB0aGlzLl9nZXRQdWJsaWNLZXlzKGtleXMpO1xuXHRcdHJldHVybiBzdXBlci5oYXMocHVibGljS2V5KTtcblx0fVxuXG5cdGRlbGV0ZShrZXlzKSB7XG5cdFx0Y29uc3Qge3B1YmxpY0tleSwgcHJpdmF0ZUtleX0gPSB0aGlzLl9nZXRQdWJsaWNLZXlzKGtleXMpO1xuXHRcdHJldHVybiBCb29sZWFuKHB1YmxpY0tleSAmJiBzdXBlci5kZWxldGUocHVibGljS2V5KSAmJiB0aGlzLl9wdWJsaWNLZXlzLmRlbGV0ZShwcml2YXRlS2V5KSk7XG5cdH1cblxuXHRjbGVhcigpIHtcblx0XHRzdXBlci5jbGVhcigpO1xuXHRcdHRoaXMuX3N5bWJvbEhhc2hlcy5jbGVhcigpO1xuXHRcdHRoaXMuX3B1YmxpY0tleXMuY2xlYXIoKTtcblx0fVxuXG5cdGdldCBbU3ltYm9sLnRvU3RyaW5nVGFnXSgpIHtcblx0XHRyZXR1cm4gJ01hbnlLZXlzTWFwJztcblx0fVxuXG5cdGdldCBzaXplKCkge1xuXHRcdHJldHVybiBzdXBlci5zaXplO1xuXHR9XG59XG4iLCJpbXBvcnQgTWFueUtleXNNYXAgZnJvbSAnbWFueS1rZXlzLW1hcCc7XG5pbXBvcnQgeyBkZWZ1IH0gZnJvbSAnZGVmdSc7XG5pbXBvcnQgeyBpc0V4aXN0IH0gZnJvbSAnLi9kZXRlY3RvcnMubWpzJztcblxuY29uc3QgZ2V0RGVmYXVsdE9wdGlvbnMgPSAoKSA9PiAoe1xuICB0YXJnZXQ6IGdsb2JhbFRoaXMuZG9jdW1lbnQsXG4gIHVuaWZ5UHJvY2VzczogdHJ1ZSxcbiAgZGV0ZWN0b3I6IGlzRXhpc3QsXG4gIG9ic2VydmVDb25maWdzOiB7XG4gICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgIHN1YnRyZWU6IHRydWUsXG4gICAgYXR0cmlidXRlczogdHJ1ZVxuICB9LFxuICBzaWduYWw6IHZvaWQgMCxcbiAgY3VzdG9tTWF0Y2hlcjogdm9pZCAwXG59KTtcbmNvbnN0IG1lcmdlT3B0aW9ucyA9ICh1c2VyU2lkZU9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKSA9PiB7XG4gIHJldHVybiBkZWZ1KHVzZXJTaWRlT3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xufTtcblxuY29uc3QgdW5pZnlDYWNoZSA9IG5ldyBNYW55S2V5c01hcCgpO1xuZnVuY3Rpb24gY3JlYXRlV2FpdEVsZW1lbnQoaW5zdGFuY2VPcHRpb25zKSB7XG4gIGNvbnN0IHsgZGVmYXVsdE9wdGlvbnMgfSA9IGluc3RhbmNlT3B0aW9ucztcbiAgcmV0dXJuIChzZWxlY3Rvciwgb3B0aW9ucykgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIHRhcmdldCxcbiAgICAgIHVuaWZ5UHJvY2VzcyxcbiAgICAgIG9ic2VydmVDb25maWdzLFxuICAgICAgZGV0ZWN0b3IsXG4gICAgICBzaWduYWwsXG4gICAgICBjdXN0b21NYXRjaGVyXG4gICAgfSA9IG1lcmdlT3B0aW9ucyhvcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgY29uc3QgdW5pZnlQcm9taXNlS2V5ID0gW1xuICAgICAgc2VsZWN0b3IsXG4gICAgICB0YXJnZXQsXG4gICAgICB1bmlmeVByb2Nlc3MsXG4gICAgICBvYnNlcnZlQ29uZmlncyxcbiAgICAgIGRldGVjdG9yLFxuICAgICAgc2lnbmFsLFxuICAgICAgY3VzdG9tTWF0Y2hlclxuICAgIF07XG4gICAgY29uc3QgY2FjaGVkUHJvbWlzZSA9IHVuaWZ5Q2FjaGUuZ2V0KHVuaWZ5UHJvbWlzZUtleSk7XG4gICAgaWYgKHVuaWZ5UHJvY2VzcyAmJiBjYWNoZWRQcm9taXNlKSB7XG4gICAgICByZXR1cm4gY2FjaGVkUHJvbWlzZTtcbiAgICB9XG4gICAgY29uc3QgZGV0ZWN0UHJvbWlzZSA9IG5ldyBQcm9taXNlKFxuICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0FzeW5jUHJvbWlzZUV4ZWN1dG9yOiBhdm9pZCBuZXN0aW5nIHByb21pc2VcbiAgICAgIGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3Qoc2lnbmFsLnJlYXNvbik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihcbiAgICAgICAgICBhc3luYyAobXV0YXRpb25zKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IF8gb2YgbXV0YXRpb25zKSB7XG4gICAgICAgICAgICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgZGV0ZWN0UmVzdWx0MiA9IGF3YWl0IGRldGVjdEVsZW1lbnQoe1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLFxuICAgICAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgICAgICBkZXRlY3RvcixcbiAgICAgICAgICAgICAgICBjdXN0b21NYXRjaGVyXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpZiAoZGV0ZWN0UmVzdWx0Mi5pc0RldGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZGV0ZWN0UmVzdWx0Mi5yZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgXCJhYm9ydFwiLFxuICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHJldHVybiByZWplY3Qoc2lnbmFsLnJlYXNvbik7XG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IG9uY2U6IHRydWUgfVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBkZXRlY3RSZXN1bHQgPSBhd2FpdCBkZXRlY3RFbGVtZW50KHtcbiAgICAgICAgICBzZWxlY3RvcixcbiAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgZGV0ZWN0b3IsXG4gICAgICAgICAgY3VzdG9tTWF0Y2hlclxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGRldGVjdFJlc3VsdC5pc0RldGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGV0ZWN0UmVzdWx0LnJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZSh0YXJnZXQsIG9ic2VydmVDb25maWdzKTtcbiAgICAgIH1cbiAgICApLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgdW5pZnlDYWNoZS5kZWxldGUodW5pZnlQcm9taXNlS2V5KTtcbiAgICB9KTtcbiAgICB1bmlmeUNhY2hlLnNldCh1bmlmeVByb21pc2VLZXksIGRldGVjdFByb21pc2UpO1xuICAgIHJldHVybiBkZXRlY3RQcm9taXNlO1xuICB9O1xufVxuYXN5bmMgZnVuY3Rpb24gZGV0ZWN0RWxlbWVudCh7XG4gIHRhcmdldCxcbiAgc2VsZWN0b3IsXG4gIGRldGVjdG9yLFxuICBjdXN0b21NYXRjaGVyXG59KSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBjdXN0b21NYXRjaGVyID8gY3VzdG9tTWF0Y2hlcihzZWxlY3RvcikgOiB0YXJnZXQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gIHJldHVybiBhd2FpdCBkZXRlY3RvcihlbGVtZW50KTtcbn1cbmNvbnN0IHdhaXRFbGVtZW50ID0gY3JlYXRlV2FpdEVsZW1lbnQoe1xuICBkZWZhdWx0T3B0aW9uczogZ2V0RGVmYXVsdE9wdGlvbnMoKVxufSk7XG5cbmV4cG9ydCB7IGNyZWF0ZVdhaXRFbGVtZW50LCBnZXREZWZhdWx0T3B0aW9ucywgd2FpdEVsZW1lbnQgfTtcbiJdLCJuYW1lcyI6WyJkZWZpbml0aW9uIiwibG9jYXRpb24iLCJfYSIsInRoaXMiLCJtb2R1bGUiLCJwcm94eVRhcmdldCIsInZhbHVlIiwicmVzdWx0IiwibWVzc2FnZSIsInByaW50IiwibG9nZ2VyIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFPLFdBQVMsb0JBQW9CQSxhQUFZO0FBQzlDLFdBQU9BO0FBQUEsRUFDVDtBQUFBLEVDQU8sTUFBTSxnQkFBNEM7QUFBQSxJQUN2RCxZQUFZLEtBQXNCO0FBQ2hDLGFBQU8sSUFBSSxTQUFTLG1CQUFtQjtBQUFBLElBQ3pDO0FBQUEsSUFFQSxNQUFNLG9CQUFnRDtBQUVwRCxZQUFNLFNBQVMsS0FBSyxtQkFBQTtBQUdwQixZQUFNLGlCQUFpQjtBQUFBLFFBQ3JCO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUFBO0FBRUYsVUFBSSxRQUFRLEtBQUsscUJBQXFCLGNBQWMsS0FBSztBQUd6RCxZQUFNLG1CQUFtQjtBQUFBLFFBQ3ZCO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FB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
