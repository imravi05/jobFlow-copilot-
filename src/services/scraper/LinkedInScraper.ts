import { JobPortalScraper, ScrapedJobDetails } from './types';

export class LinkedInScraper implements JobPortalScraper {
  isSupported(url: string): boolean {
    return url.includes('linkedin.com/jobs');
  }

  async extractJobDetails(): Promise<ScrapedJobDetails> {
    // 1. Extract Job ID & URL
    const jobUrl = this.getCanonicalJobUrl();

    // 2. Extract Title
    const titleSelectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      '.jobs-details-top-card__job-title',
      'h2.jobs-details-top-card__job-title',
      '.topcard__title',
    ];
    let title = this.getTextFromSelectors(titleSelectors) || 'Unknown Role';

    // 3. Extract Company
    const companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.jobs-details-top-card__company-name a',
      '.jobs-details-top-card__company-name',
      '.topcard__flavor--metadata a',
      '.topcard__flavor a',
    ];
    let company = this.getTextFromSelectors(companySelectors) || 'Unknown Company';

    // Fallback using first h1 on page if title is still Unknown
    if (title === 'Unknown Role') {
      const firstH1 = document.querySelector('h1');
      if (firstH1 && firstH1.textContent) {
        title = firstH1.textContent.trim().replace(/\s+/g, ' ');
      }
    }

    // Fallback using document.title if title or company is still Unknown
    if (title === 'Unknown Role' || company === 'Unknown Company') {
      const fallback = this.parseDocumentTitle();
      if (title === 'Unknown Role' && fallback.title) {
        title = fallback.title;
      }
      if (company === 'Unknown Company' && fallback.company) {
        company = fallback.company;
      }
    }

    // 4. Extract Location
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__primary-description',
      '.jobs-unified-top-card__bullet',
      '.jobs-details-top-card__bullet',
      '.topcard__flavor--metadata',
      '.topcard__flavor',
    ];
    let locationText = this.getTextFromSelectors(locationSelectors) || 'Unknown Location';
    // Clean up location text (LinkedIn sometimes prefixes with company name or details)
    const location = this.cleanLocationText(locationText, company);

    // 5. Extract Job Description
    const descriptionSelectors = [
      '#job-details',
      '.jobs-description-content__text',
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.description__text',
    ];
    const jobDescription = this.getHtmlFromSelectors(descriptionSelectors) || 'No description available.';

    // 6. Determine Work Mode (Remote / Hybrid / On-site)
    const workMode = this.detectWorkMode(locationText, jobDescription);

    // 7. Determine Employment Type
    const employmentType = this.detectEmploymentType(jobDescription);

    return {
      company,
      title,
      location,
      jobUrl,
      jobDescription,
      employmentType,
      workMode,
      portal: 'LinkedIn',
    };
  }

  private getCanonicalJobUrl(): string {
    const url = window.location.href;
    try {
      const parsed = new URL(url);
      
      // Try path pattern first: /jobs/view/123456789/
      const jobIdMatch = parsed.pathname.match(/\/jobs\/view\/(\d+)/);
      if (jobIdMatch) {
        return `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}/`;
      }
      
      // Try query parameter: ?currentJobId=123456789
      const currentJobId = parsed.searchParams.get('currentJobId');
      if (currentJobId) {
        return `https://www.linkedin.com/jobs/view/${currentJobId}/`;
      }

      // Try reading job ID from active elements on page
      const activeJobCard = document.querySelector('.jobs-search-results-list__list-item--active, [data-job-id]');
      if (activeJobCard) {
        const jobId = activeJobCard.getAttribute('data-job-id') || activeJobCard.getAttribute('data-occludable-job-id');
        if (jobId) {
          return `https://www.linkedin.com/jobs/view/${jobId}/`;
        }
      }
    } catch (e) {
      console.error('Error parsing Job URL:', e);
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
        // Return innerHTML but clean it up slightly
        return element.innerHTML.trim();
      }
    }
    return null;
  }

  private cleanLocationText(text: string, company: string): string {
    let cleaned = text;
    // Remove company name prefix if present
    if (company && cleaned.startsWith(company)) {
      cleaned = cleaned.substring(company.length).trim();
    }
    // Remove leading bullet/dots/newlines
    cleaned = cleaned.replace(/^[•·\s\r\n\-\u00B7]+/, '').trim();
    
    // Split by common separators (like "·" or "over 10 applicants") and keep the first chunk
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

    // Default based on general info or fallback
    return 'On-site';
  }

  private detectEmploymentType(description: string): string {
    const descLower = description.toLowerCase();

    // Look for employment type badges in the top card if they exist
    const jobDetailsCard = document.querySelector('.job-details-jobs-unified-top-card__job-insight');
    const cardText = jobDetailsCard?.textContent?.toLowerCase() || '';

    const textToSearch = `${cardText} ${descLower}`;

    if (textToSearch.includes('full-time') || textToSearch.includes('full time')) {
      return 'Full-time';
    } else if (textToSearch.includes('part-time') || textToSearch.includes('part time')) {
      return 'Part-time';
    } else if (textToSearch.includes('contract')) {
      return 'Contract';
    } else if (textToSearch.includes('internship') || textToSearch.includes('intern')) {
      return 'Internship';
    } else if (textToSearch.includes('temporary')) {
      return 'Temporary';
    }

    return 'Full-time'; // Default to Full-time as standard
  }

  private parseDocumentTitle(): { title: string; company: string } {
    const docTitle = document.title;
    // Remove notification count like (1) or (12)
    const cleanTitle = docTitle.replace(/^\(\d+\)\s+/, '').trim();
    
    // Check for "Company hiring Role..." or "Role at Company..." or "Role - Company..."
    // Pattern 1: "Company hiring Role in Location | LinkedIn"
    const hiringMatch = cleanTitle.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+/i);
    if (hiringMatch) {
      return {
        company: hiringMatch[1].trim(),
        title: hiringMatch[2].trim()
      };
    }

    // Pattern 2: "Role at Company | LinkedIn"
    const atMatch = cleanTitle.match(/^(.+?)\s+at\s+(.+?)(?:\s+\||$)/i);
    if (atMatch) {
      return {
        title: atMatch[1].trim(),
        company: atMatch[2].trim()
      };
    }

    // Pattern 3: "Role - Company | LinkedIn" or similar separators
    const parts = cleanTitle.split('|')[0].split(' - ');
    if (parts.length >= 2) {
      return {
        title: parts[0].trim(),
        company: parts[1].trim()
      };
    }

    // Fallback split by comma or other common dividers
    const commaParts = cleanTitle.split('|')[0].split(',');
    if (commaParts.length >= 2) {
      return {
        title: commaParts[0].trim(),
        company: commaParts[1].trim()
      };
    }

    return {
      title: cleanTitle.split('|')[0].trim(),
      company: 'LinkedIn Company'
    };
  }
}
