/**
 * Heuristic parsing of job-related Gmail subjects/snippets (not perfect — good for demos).
 */

/** Rejection phrasing — checked before interview to avoid “moving forward” false positives */
const REJECTION_RE =
  /unfortunately|regret to inform|not (?:be )?selected|won'?t be moving forward|will not be moving forward|not be moving forward|not moving forward with your application|decided to pursue other|unable to (?:offer|continue)|not (?:able to )?continue with your application|no longer (?:be )?considering|have decided (?:not|to go) with other|chosen (?:another|other) candidate/i;

function parseJobFromEmail(subject, snippet) {
  const sub = (subject || '').trim();
  const snip = snippet || '';
  const combined = `${sub} ${snip}`;

  let status = 'Applied';
  if (REJECTION_RE.test(combined)) {
    status = 'Rejected';
  } else if (/interview|phone screen|schedule (a )?call|zoom invite|teams meeting/i.test(combined)) {
    status = 'Interview Scheduled';
  } else if (/offer|congratulations.*\boffer\b|pleased to extend/i.test(combined)) {
    status = 'Offer Received';
  } else if (/under review|being reviewed|reviewing your (application|candidacy)|next round/i.test(combined)) {
    status = 'Under Review';
  }

  let companyName = '';
  let jobTitle = '';

  const thank = sub.match(/thank you for (?:your )?application(?: to| at)?\s+(.+)/i);
  if (thank) {
    const rest = thank[1].replace(/\s*[-–—|].*$/, '').trim();
    companyName = rest;
  }

  const tyApp = sub.match(/thank you for applying (?:to|at)\s+(.+)/i);
  if (tyApp) {
    const chunk = tyApp[1].trim();
    const dashParts = chunk.split(/\s*[-–—]\s*/);
    if (dashParts.length >= 2) {
      jobTitle = dashParts[0].trim();
      companyName = dashParts[dashParts.length - 1].trim();
    } else {
      companyName = chunk;
    }
  }

  /** “…application for the X role at Company” */
  const appForRole = sub.match(/application for (?:the )?(.+?)\s+(?:role|position)\s+at\s+(.+)/i);
  if (appForRole) {
    jobTitle = appForRole[1].trim();
    companyName = appForRole[2].replace(/\s*[-–—].*$/, '').trim();
  }

  const atPos = sub.match(/\b(?:at|@)\s+([^\-–—|]+?)(?:\s*[-–—]|$)/i);
  if (atPos && !companyName) {
    companyName = atPos[1].trim();
  }

  const dash = sub.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dash && !jobTitle) {
    const left = dash[1].trim();
    const right = dash[2].trim();
    if (/engineer|developer|analyst|intern|manager|designer|scientist/i.test(left)) {
      jobTitle = left;
      companyName = right;
    } else if (/engineer|developer|analyst|intern|manager|designer|scientist/i.test(right)) {
      jobTitle = right;
      companyName = left;
    }
  }

  if (!jobTitle) {
    jobTitle = sub.replace(/^re:\s*/i, '').slice(0, 120) || 'Application update';
  }
  if (!companyName) {
    const m = snip.match(/(?:@|from)\s*([A-Z][a-zA-Z0-9 &]+?)(?:\.|\s|$)/);
    companyName = m ? m[1].trim() : '';
  }
  if (!companyName) {
    companyName = 'Unknown company';
  }

  let jobType = 'Full-time';
  if (/intern(ship)?/i.test(combined)) jobType = 'Internship';
  else if (/contract|contractor/i.test(combined)) jobType = 'Contract';
  else if (/\bremote\b/i.test(combined)) jobType = 'Remote';

  return {
    jobTitle: jobTitle.slice(0, 200),
    companyName: companyName.slice(0, 200),
    status,
    location: '',
    jobType,
    date: new Date(),
  };
}

function looksJobRelated(subject, snippet) {
  const t = `${subject} ${snippet}`.toLowerCase();
  if (t.length < 8) return false;
  return (
    /apply|application|applied|thank you for|candidat|position|role|interview|screening|greenhouse|lever|workday|indeed|linkedin|ashby|job alert|offer|rejection|unfortunately|regret|not moving forward|will not be|moving forward with your application|information about your application/i.test(
      t
    ) || REJECTION_RE.test(t)
  );
}

module.exports = { parseJobFromEmail, looksJobRelated, REJECTION_RE };
