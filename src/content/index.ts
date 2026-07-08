import { LinkedInScraper } from '../services/scraper/LinkedInScraper';
import { ScrapedJobDetails } from '../services/scraper/types';

const scraper = new LinkedInScraper();
let currentUrl = '';
let activeOverlay: HTMLElement | null = null;
let lastClickedJobUrl = '';
const sessionTrackedUrls = new Set<string>();
const logoUrl = chrome.runtime.getURL('icons/icon48.png');

// Periodic observer to detect URL changes and bind apply button listeners
function initUrlObserver() {
  currentUrl = window.location.href;
  
  // Periodically check for page state
  setInterval(() => {
    // If URL changed, close any stale tracking cards
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      removeOverlay();
    }

    // Attach listeners to newly rendered apply buttons
    if (scraper.isSupported(window.location.href)) {
      bindApplyButtonListeners();
      bindSubmitButtonListener();
      checkEasyApplySuccess();
    }
  }, 1000);
}

// Find LinkedIn Apply and Easy Apply buttons and attach click triggers
function bindApplyButtonListeners() {
  const applyButtons = findApplyButtons();
  applyButtons.forEach(button => {
    if (button.getAttribute('data-jobflow-listened') === 'true') {
      return;
    }
    button.setAttribute('data-jobflow-listened', 'true');
    
    const text = button.textContent?.trim().toLowerCase() || '';
    const isEasyApply = text.includes('easy apply');

    if (isEasyApply) {
      // For Easy Apply, we do NOT save immediately on clicking "Easy Apply".
      // We will monitor for the final submit or success state.
      console.log('JobFlow: Easy Apply button detected. Monitoring modal...');
    } else {
      // For external Apply, save immediately when clicked
      button.addEventListener('click', () => {
        console.log('JobFlow: External Apply button clicked. Saving...');
        triggerSaveWorkflow();
      });
    }
  });
}

function findApplyButtons(): HTMLElement[] {
  const buttons: HTMLElement[] = [];
  const selectors = [
    '.jobs-apply-button',
    '.jobs-s-apply button',
    'button.jobs-apply-button--top-card',
    '[data-control-name="job_apply"]',
    '.jobs-apply-button--top-card button'
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el instanceof HTMLElement) {
        buttons.push(el);
      }
    });
  });

  // Fallback: check all buttons on page for "apply" text
  document.querySelectorAll('button').forEach(btn => {
    const text = btn.textContent?.trim().toLowerCase() || '';
    if ((text === 'apply' || text === 'easy apply' || text.includes('apply now')) && !buttons.includes(btn)) {
      buttons.push(btn);
    }
  });

  return buttons;
}

function bindSubmitButtonListener() {
  const submitButtons = document.querySelectorAll('button');
  submitButtons.forEach(button => {
    const text = button.textContent?.trim().toLowerCase() || '';
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    
    if ((text === 'submit application' || ariaLabel === 'submit application') && 
        button.getAttribute('data-jobflow-listened') !== 'true') {
      
      button.setAttribute('data-jobflow-listened', 'true');
      button.addEventListener('click', () => {
        console.log('JobFlow: Submit application button clicked! Saving...');
        triggerSaveWorkflow();
      });
    }
  });
}

function checkEasyApplySuccess() {
  const modal = document.querySelector('.jobs-easy-apply-modal, [role="dialog"], .artdeco-modal');
  if (!modal) return;

  const modalText = modal.textContent || '';
  const successPhrases = [
    'application sent',
    'application submitted',
    'your application was sent',
    'successfully applied'
  ];

  const hasSuccess = successPhrases.some(phrase => modalText.toLowerCase().includes(phrase));
  if (hasSuccess) {
    const currentJobUrl = window.location.href;
    if (!sessionTrackedUrls.has(currentJobUrl)) {
      sessionTrackedUrls.add(currentJobUrl);
      console.log('JobFlow: Detected Easy Apply success screen! Saving...');
      triggerSaveWorkflow();
    }
  }
}

// Scrape and display confirmation overlay
async function triggerSaveWorkflow() {
  if (!scraper.isSupported(window.location.href)) {
    return;
  }

  // Brief delay to allow DOM transition (especially for dynamic modal triggers)
  setTimeout(async () => {
    try {
      const details = await scraper.extractJobDetails();
      if (!details || !details.jobUrl) {
        console.warn('JobFlow: Scraper returned incomplete details.');
        return;
      }
      if (!details.title || details.title === 'Unknown Role') {
        details.title = 'Job Application';
      }
      if (!details.company || details.company === 'Unknown Company') {
        details.company = 'LinkedIn';
      }

      // Check if duplicate in storage
      chrome.runtime.sendMessage(
        { action: 'CHECK_DUPLICATE', payload: { url: details.jobUrl } },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('JobFlow duplicate check error:', chrome.runtime.lastError);
            return;
          }

          const isTracked = response && response.exists;
          const trackedApp = response && response.app;

          injectOverlay(details, isTracked, trackedApp);
        }
      );
    } catch (e) {
      console.error('JobFlow trigger error:', e);
    }
  }, 300);
}

function removeOverlay() {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
}

function injectOverlay(details: ScrapedJobDetails, isTracked: boolean, trackedApp: any) {
  removeOverlay();

  // Create host element for Shadow DOM
  const host = document.createElement('div');
  host.id = 'jobflow-tracker-root';
  host.style.position = 'fixed';
  host.style.bottom = '20px';
  host.style.right = '20px';
  host.style.zIndex = '999999';
  document.body.appendChild(host);
  activeOverlay = host;

  const shadow = host.attachShadow({ mode: 'open' });

  // Load stylesheet inside Shadow DOM
  const style = document.createElement('style');
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

  const card = document.createElement('div');
  card.className = 'jobflow-card';

  if (isTracked) {
    renderTrackedState(card, details, trackedApp);
  } else {
    saveAutomatically(card, details);
  }

  shadow.appendChild(card);
}

function renderTrackedState(card: HTMLElement, details: ScrapedJobDetails, app: any) {
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
      <strong style="color: #f1f5f9;">${app.resumeName || 'None Selected'}</strong>
    </div>
    <div class="btn-container">
      <button class="btn btn-secondary close-btn">Close Tracker</button>
    </div>
  `;

  card.querySelector('.jobflow-close')?.addEventListener('click', removeOverlay);
  card.querySelector('.close-btn')?.addEventListener('click', removeOverlay);
}

function saveAutomatically(card: HTMLElement, details: ScrapedJobDetails) {
  const now = new Date();
  const appliedDate = now.toISOString().split('T')[0];
  const appliedTime = now.toTimeString().split(' ')[0].substring(0, 5);

  const appData = {
    company: details.company,
    title: details.title,
    location: details.location,
    jobUrl: details.jobUrl,
    jobDescription: details.jobDescription,
    employmentType: details.employmentType,
    workMode: details.workMode,
    portal: details.portal,
    resumeId: undefined,
    resumeName: undefined,
    status: 'Applied',
    notes: '',
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

  card.querySelector('.jobflow-close')?.addEventListener('click', removeOverlay);

  chrome.runtime.sendMessage(
    { action: 'SAVE_APPLICATION', payload: { application: appData } },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('JobFlow save error:', chrome.runtime.lastError);
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
        card.querySelector('.jobflow-close')?.addEventListener('click', removeOverlay);
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
        card.querySelector('.jobflow-close')?.addEventListener('click', removeOverlay);
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
            Error: ${response.error || 'Failed to save'}
          </div>
        `;
        card.querySelector('.jobflow-close')?.addEventListener('click', removeOverlay);
      }
    }
  );
}

// Startup
initUrlObserver();
