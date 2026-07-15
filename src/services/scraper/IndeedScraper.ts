import { JobPortalScraper, ScrapedJobDetails } from './types';

export class IndeedScraper implements JobPortalScraper {
  isSupported(url: string): boolean {
    return url.includes('indeed.com');
  }

  async extractJobDetails(): Promise<ScrapedJobDetails> {
    const jobUrl = this.getCanonicalJobUrl();

    // 1. Extract Title
    const titleSelectors = [
      'h1.jobsearch-JobInfoHeader-title',
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      '.jobsearch-JobInfoHeader-title-container h1',
      'h2[class*="jobTitle"]',
      'h1'
    ];
    let title = this.getTextFromSelectors(titleSelectors) || 'Unknown Role';

    // 2. Extract Company
    const companySelectors = [
      '[data-testid="inlineHeader-companyName"] a',
      '[data-testid="inlineHeader-companyName"]',
      'div.jobsearch-CompanyInfoWithoutHeaderImage a',
      'div.jobsearch-CompanyInfoWithoutHeaderImage',
      '[class*="companyName"]',
      '[class*="company"]'
    ];
    let company = this.getTextFromSelectors(companySelectors) || 'Unknown Company';

    // Fallback: parse document.title if scraper returns "Unknown Role" or "Unknown Company"
    if (title === 'Unknown Role' || company === 'Unknown Company') {
      const fallback = this.parseDocumentTitle();
      if (title === 'Unknown Role' && fallback.title) {
        title = fallback.title;
      }
      if (company === 'Unknown Company' && fallback.company) {
        company = fallback.company;
      }
    }

    // 3. Extract Location
    const locationSelectors = [
      '[data-testid="inlineHeader-companyLocation"]',
      'div.jobsearch-JobInfoHeader-subtitle',
      '[class*="companyLocation"]',
      '[class*="location"]'
    ];
    const locationText = this.getTextFromSelectors(locationSelectors) || 'Unknown Location';
    const location = this.cleanLocationText(locationText, company);

    // 4. Extract Description
    const descriptionSelectors = [
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      '[id*="jobDescriptionText"]'
    ];
    const jobDescription = this.getHtmlFromSelectors(descriptionSelectors) || 'No description available.';

    // 5. Work Mode
    const workMode = this.detectWorkMode(locationText, jobDescription);

    // 6. Employment Type
    const employmentType = this.detectEmploymentType(jobDescription);

    return {
      company,
      title,
      location,
      jobUrl,
      jobDescription,
      employmentType,
      workMode,
      portal: 'Indeed'
    };
  }

  private getCanonicalJobUrl(): string {
    const url = window.location.href;
    try {
      const parsed = new URL(url);
      const jk = parsed.searchParams.get('jk');
      if (jk) {
        return `https://www.indeed.com/viewjob?jk=${jk}`;
      }
      
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        const href = canonicalLink.getAttribute('href');
        if (href) return href;
      }
    } catch (e) {
      console.error('Error parsing Indeed Job URL:', e);
    }
    return url;
  }

  private getTextFromSelectors(selectors: string[]): string | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent.trim().replace(/\s+/g, ' ');
      }
    }
    return null;
  }

  private getHtmlFromSelectors(selectors: string[]): string | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.innerHTML.trim();
      }
    }
    return null;
  }

  private cleanLocationText(text: string, company: string): string {
    let cleaned = text;
    if (company && cleaned.startsWith(company)) {
      cleaned = cleaned.substring(company.length).trim();
    }
    cleaned = cleaned.replace(/^[•·\s\r\n\-\u00B7]+/, '').trim();
    const parts = cleaned.split(/[·\u00B7\n]/);
    if (parts.length > 0) {
      cleaned = parts[0].trim();
    }
    return cleaned || 'Unknown Location';
  }

  private detectWorkMode(locationText: string, description: string): string {
    const textToCheck = `${locationText} ${description}`.toLowerCase();
    if (textToCheck.includes('remote')) {
      return 'Remote';
    } else if (textToCheck.includes('hybrid')) {
      return 'Hybrid';
    } else if (textToCheck.includes('on-site') || textToCheck.includes('onsite') || textToCheck.includes('in-office')) {
      return 'On-site';
    }
    return 'On-site';
  }

  private detectEmploymentType(description: string): string {
    const descLower = description.toLowerCase();
    if (descLower.includes('full-time') || descLower.includes('full time')) {
      return 'Full-time';
    } else if (descLower.includes('part-time') || descLower.includes('part time')) {
      return 'Part-time';
    } else if (descLower.includes('contract')) {
      return 'Contract';
    } else if (descLower.includes('internship') || descLower.includes('intern')) {
      return 'Internship';
    } else if (descLower.includes('temporary')) {
      return 'Temporary';
    }
    return 'Full-time';
  }

  private parseDocumentTitle(): { title: string; company: string } {
    const docTitle = document.title;
    const cleanTitle = docTitle.replace(/^\(\d+\)\s+/, '').trim();
    
    const parts = cleanTitle.split('|')[0].split(' - ');
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
      title: cleanTitle.split('|')[0].trim(),
      company: 'Indeed Company'
    };
  }
}
