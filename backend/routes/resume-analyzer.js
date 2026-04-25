const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const OpenAI = require('openai');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Fallback analyzer for when OpenAI is not available
function analyzeResumeFallback(resumeText, jobTitle, companyName, jobDescription) {
  const resumeLower = resumeText.toLowerCase();
  
  // Extract common keywords from job description
  const commonKeywords = [
    'led', 'managed', 'improved', 'designed', 'developed', 'implemented',
    'increased', 'reduced', 'optimized', 'automated', 'collaborated',
    'mentored', 'delivered', 'executed', 'launched', 'scaled',
    'results', 'metrics', 'impact', 'performance', 'revenue',
    'efficiency', 'quality', 'user', 'customer', 'team'
  ];
  
  const presentKeywords = commonKeywords.filter(kw => resumeLower.includes(kw));
  const missingKeywords = commonKeywords.filter(kw => !resumeLower.includes(kw)).slice(0, 5);
  
  // Count action verbs
  const actionVerbs = [
    'led', 'managed', 'directed', 'coordinated', 'spearheaded',
    'developed', 'engineered', 'created', 'built', 'designed',
    'improved', 'enhanced', 'optimized', 'streamlined',
    'increased', 'grew', 'expanded', 'accelerated',
    'reduced', 'cut', 'minimized', 'lowered'
  ];
  
  const actionVerbCount = actionVerbs.filter(v => resumeLower.includes(v)).length;
  
  // Basic scoring (0-100)
  let score = 50;
  
  // Length check
  if (resumeText.length > 2000) score += 10;
  if (resumeText.length > 1000) score += 5;
  
  // Action verb usage
  if (actionVerbCount > 10) score += 20;
  else if (actionVerbCount > 5) score += 10;
  else if (actionVerbCount > 0) score += 5;
  
  // Keywords found
  if (presentKeywords.length > 10) score += 15;
  else if (presentKeywords.length > 5) score += 10;
  
  score = Math.min(100, score);
  
  // Generate suggestions
  const suggestions = [];
  if (actionVerbCount < 5) {
    suggestions.push("Add more action verbs to start each bullet point. Use words like 'Led', 'Developed', 'Implemented', 'Spearheaded'.");
  }
  if (missingKeywords.length > 0) {
    suggestions.push(`Try incorporating keywords like: ${missingKeywords.slice(0, 3).join(', ')}.`);
  }
  if (resumeText.length < 1000) {
    suggestions.push("Your resume may be too brief. Aim for 1000-1500 words to showcase your experience.");
  }
  if (!resumeLower.includes('improved') && !resumeLower.includes('increased')) {
    suggestions.push("Quantify your achievements. Use metrics like 'improved by 30%' or 'increased revenue by $500K'.");
  }
  if (!resumeLower.includes('managed') && !resumeLower.includes('led')) {
    suggestions.push("Highlight leadership or team collaboration experiences if applicable.");
  }
  
  // Generate gap analysis
  const gaps = [];
  if (!resumeLower.includes('project') && !resumeLower.includes('portfolio')) {
    gaps.push({ keyword: 'Projects/Portfolio', severity: 'medium', suggestion: 'Add a section showcasing key projects or portfolio links.' });
  }
  if (!resumeLower.includes('metric') && !resumeLower.includes('result')) {
    gaps.push({ keyword: 'Quantifiable Results', severity: 'high', suggestion: 'Include metrics and measurable outcomes for each bullet point.' });
  }
  if (!resumeLower.includes('skill') && !resumeLower.includes('technical')) {
    gaps.push({ keyword: 'Skills Section', severity: 'low', suggestion: 'Consider adding a dedicated skills section with relevant technologies.' });
  }
  
  return {
    score,
    scoreBreakdown: {
      contentStrength: Math.min(100, actionVerbCount * 10),
      keywordRelevance: Math.min(100, (presentKeywords.length / commonKeywords.length) * 100),
      quantification: resumeLower.includes('%') || resumeLower.includes('$') ? 80 : 40,
    },
    presentKeywords: presentKeywords.slice(0, 10),
    missingKeywords,
    suggestions,
    gaps,
    bulletRecommendations: [
      `Add context: Instead of "Managed projects", try "Led cross-functional team of 8 to deliver $2M project 2 weeks early".`,
      `Be specific with numbers: Instead of "Improved performance", try "Improved API response time by 45%, reducing customer churn by 12%".`,
      `Show impact: Instead of "Developed features", try "Engineered payment gateway integration, increasing revenue by $300K annually".`,
    ].slice(0, 2),
  };
}

// POST /api/resume-analyzer/analyze
router.post('/analyze', auth, upload.single('resumeFile'), async (req, res) => {
  try {
    const { resumeText, jobTitle, companyName, jobDescription } = req.body;
    let resumeContent = resumeText;

    if ((!resumeContent || !resumeContent.trim()) && req.file) {
      const { mimetype, buffer, originalname } = req.file;
      if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
        const parsed = await pdf(buffer);
        resumeContent = parsed.text;
      } else {
        resumeContent = buffer.toString('utf8');
      }
    }

    if (!resumeContent || !resumeContent.trim() || !jobTitle || !companyName) {
      return res.status(400).json({ message: 'Resume text or resume file, job title, and company name required' });
    }

    if (openai) {
      const prompt = `You are an expert recruiter and resume coach. Analyze this resume for the ${jobTitle} role at ${companyName}.

Resume:
${resumeText}

${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Provide a detailed JSON analysis with:
- "score": overall match score 0-100
- "scoreBreakdown": {
    "contentStrength": 0-100,
    "keywordRelevance": 0-100,
    "quantification": 0-100
  }
- "presentKeywords": array of relevant keywords found in resume
- "missingKeywords": array of 5 important keywords that should be added
- "suggestions": array of 3-4 actionable improvement suggestions
- "gaps": array of objects with { keyword, severity ('low'/'medium'/'high'), suggestion }
- "bulletRecommendations": array of 2-3 examples of how to rewrite weak bullets (start with "Instead of...")

Only return valid JSON.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      return res.json({ ...result, usedOpenAI: true });
    }

    // Fallback
    const result = analyzeResumeFallback(resumeText, jobTitle, companyName, jobDescription);
    res.json({ ...result, usedOpenAI: false });
  } catch (err) {
    console.error('Resume analyzer error:', err);
    res.status(500).json({ message: 'Resume analysis failed' });
  }
});

module.exports = router;
