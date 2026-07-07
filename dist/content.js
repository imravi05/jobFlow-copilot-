(function() {
  "use strict";
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
      const title = this.getTextFromSelectors(titleSelectors) || "Unknown Role";
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
      const company = this.getTextFromSelectors(companySelectors) || "Unknown Company";
      const locationSelectors = [
        ".job-details-jobs-unified-top-card__primary-description",
        ".jobs-unified-top-card__bullet",
        ".jobs-details-top-card__bullet",
        ".topcard__flavor--metadata",
        ".topcard__flavor"
      ];
      let locationText = this.getTextFromSelectors(locationSelectors) || "Unknown Location";
      const location = this.cleanLocationText(locationText, company);
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
        location,
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
  }
  const scraper = new LinkedInScraper();
  let currentUrl = "";
  let activeOverlay = null;
  function initUrlObserver() {
    currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        removeOverlay();
      }
      if (scraper.isSupported(window.location.href)) {
        bindApplyButtonListeners();
      }
    }, 1e3);
  }
  function bindApplyButtonListeners() {
    const applyButtons = findApplyButtons();
    applyButtons.forEach((button) => {
      if (button.getAttribute("data-jobflow-listened") === "true") {
        return;
      }
      button.setAttribute("data-jobflow-listened", "true");
      button.addEventListener("click", () => {
        console.log("JobFlow: Apply button clicked. Triggering scraper...");
        triggerSaveWorkflow();
      });
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
  async function triggerSaveWorkflow() {
    if (!scraper.isSupported(window.location.href)) {
      return;
    }
    setTimeout(async () => {
      try {
        const details = await scraper.extractJobDetails();
        if (!details || !details.jobUrl || details.title === "Unknown Role") {
          console.warn("JobFlow: Scraper returned incomplete details.");
          return;
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
    chrome.runtime.sendMessage({ action: "GET_RESUMES" }, (resumesResponse) => {
      if (chrome.runtime.lastError) {
        console.warn("Could not fetch resumes from background:", chrome.runtime.lastError);
      }
      const resumes = resumesResponse && resumesResponse.resumes || [];
      if (isTracked) {
        renderTrackedState(card, details, trackedApp);
      } else {
        renderSaveState(card, details, resumes);
      }
    });
    shadow.appendChild(card);
  }
  function renderTrackedState(card, details, app) {
    var _a, _b;
    card.innerHTML = `
    <div class="jobflow-header">
      <div class="jobflow-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
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
  function renderSaveState(card, details, resumes) {
    var _a, _b;
    const resumeOptions = resumes.map((r) => `<option value="${r.id}">${r.name}</option>`).join("");
    card.innerHTML = `
    <div class="jobflow-header">
      <div class="jobflow-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
        Track in JobFlow?
      </div>
      <button class="jobflow-close">&times;</button>
    </div>
    <div class="job-info">
      <div class="job-role">${details.title}</div>
      <div class="job-company">${details.company} — <span style="font-style: italic;">${details.workMode}</span></div>
    </div>
    <div class="form-group">
      <label class="form-label">Select Resume</label>
      <select class="form-select" id="jf-resume">
        <option value="">-- No Resume --</option>
        ${resumeOptions}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="jf-notes" placeholder="Notes about application..."></textarea>
    </div>
    <div class="btn-container">
      <button class="btn btn-secondary cancel-btn">Dismiss</button>
      <button class="btn btn-primary save-btn">Track Job</button>
    </div>
    <div id="jf-msg"></div>
  `;
    (_a = card.querySelector(".jobflow-close")) == null ? void 0 : _a.addEventListener("click", removeOverlay);
    (_b = card.querySelector(".cancel-btn")) == null ? void 0 : _b.addEventListener("click", removeOverlay);
    const saveBtn = card.querySelector(".save-btn");
    saveBtn == null ? void 0 : saveBtn.addEventListener("click", () => {
      const resumeSelect = card.querySelector("#jf-resume");
      const notesArea = card.querySelector("#jf-notes");
      const msgDiv = card.querySelector("#jf-msg");
      const selectedResumeId = resumeSelect.value ? parseInt(resumeSelect.value, 10) : void 0;
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);
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
        resumeId: selectedResumeId,
        resumeName: selectedResume ? selectedResume.name : void 0,
        status: "Applied",
        notes: notesArea.value.trim(),
        appliedDate,
        appliedTime,
        reminderSent: false
      };
      saveBtn.setAttribute("disabled", "true");
      saveBtn.textContent = "Saving...";
      chrome.runtime.sendMessage(
        { action: "SAVE_APPLICATION", payload: { application: appData } },
        (response) => {
          var _a2;
          if (chrome.runtime.lastError) {
            msgDiv.innerHTML = `<div style="color: #ef4444; font-size: 11px; margin-top: 8px;">Error: ${chrome.runtime.lastError.message}</div>`;
            saveBtn.removeAttribute("disabled");
            saveBtn.textContent = "Track Job";
            return;
          }
          if (response && response.success) {
            card.innerHTML = `
            <div class="jobflow-header">
              <div class="jobflow-title">JobFlow Tracker</div>
              <button class="jobflow-close">&times;</button>
            </div>
            <div style="text-align: center; padding: 12px 0;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 10px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <div class="success-msg">Application Tracked Successfully!</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Follow-up alarm set for 6 days.</div>
            </div>
          `;
            (_a2 = card.querySelector(".jobflow-close")) == null ? void 0 : _a2.addEventListener("click", removeOverlay);
            setTimeout(removeOverlay, 2500);
          } else {
            msgDiv.innerHTML = `<div style="color: #ef4444; font-size: 11px; margin-top: 8px;">Error: ${response.error || "Failed to save"}</div>`;
            saveBtn.removeAttribute("disabled");
            saveBtn.textContent = "Track Job";
          }
        }
      );
    });
  }
  initUrlObserver();
})();
