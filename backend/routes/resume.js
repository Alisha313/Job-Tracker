const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Fetch job description text from a URL using a simple HTTP request.
 * Strips HTML tags and collapses whitespace.
 */
async function fetchJobDescription(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; JobTrackerBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Could not fetch ${url}`);
    }

    const html = await res.text();

    // Strip scripts, styles, nav, footer, header noise
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Cap at 8000 chars to keep tokens reasonable
    return cleaned.slice(0, 8000);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

router.post('/analyze', auth, async (req, res) => {
  const { resumeText, jobTitle, companyName, jobDescriptionUrl } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return res.status(400).json({ message: 'Please provide your resume content.' });
  }
  if (!jobTitle) {
    return res.status(400).json({ message: 'Job title is required.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      message: 'Resume analysis is not configured. Add ANTHROPIC_API_KEY to backend/.env',
    });
  }

  let jobDescriptionText = '';

  if (jobDescriptionUrl && jobDescriptionUrl.trim()) {
    try {
      new URL(jobDescriptionUrl);
      jobDescriptionText = await fetchJobDescription(jobDescriptionUrl.trim());
    } catch (err) {
      return res.status(400).json({
        message: `Could not fetch job description from URL: ${err.message}. Try pasting the URL of a public job listing.`,
      });
    }
  }

  const prompt = `You are an expert career coach and resume reviewer. Analyze this resume against the target job and provide a detailed, actionable assessment.

## Target Position
**Job Title:** ${jobTitle}
**Company:** ${companyName || 'Not specified'}

${
  jobDescriptionText
    ? `## Job Description (fetched from URL)
${jobDescriptionText}`
    : '## Note\nNo job description URL was provided — base analysis on the job title alone.'
}

## Resume Content
${resumeText}

## Your Task
Provide a structured analysis in the following JSON format (respond ONLY with valid JSON, no markdown, no extra text):

{
  "overallScore": <number 0-100>,
  "scoreLabel": "<Weak | Fair | Good | Strong | Excellent>",
  "summary": "<2-3 sentence executive summary of the resume's fit>",
  "strengths": [
    { "title": "<strength title>", "detail": "<specific detail from resume>" }
  ],
  "gaps": [
    { "title": "<gap or weakness>", "detail": "<specific improvement needed>", "priority": "<High | Medium | Low>" }
  ],
  "keywordMatches": {
    "matched": ["<keyword or skill found in both>"],
    "missing": ["<important keyword from job missing in resume>"]
  },
  "suggestions": [
    { "section": "<Resume section>", "action": "<Specific actionable rewrite suggestion>" }
  ],
  "atsScore": <number 0-100>,
  "atsTips": ["<ATS optimization tip>"]
}`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        message: data.error?.message || 'Analysis service unavailable',
      });
    }

    const rawText = data.content?.[0]?.text || '';

    let analysis;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        message: 'Could not parse analysis result. Please try again.',
      });
    }

    res.json({ analysis, jobDescriptionFetched: !!jobDescriptionText });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Analysis failed' });
  }
});

module.exports = router;
