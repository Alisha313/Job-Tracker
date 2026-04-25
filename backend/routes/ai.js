const express = require('express');
const OpenAI = require('openai');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const router = express.Router();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// ─── Fallback generators ──────────────────────────────────────────────────────

function generateInsights(stats, apps) {
  const insights = [];
  const total = stats.total || 0;
  const statusCounts = stats.statusCounts || {};
  const interviews = statusCounts['Interview Scheduled'] || 0;
  const offers = statusCounts['Offer Received'] || 0;
  const rejected = statusCounts['Rejected'] || 0;
  const applied = statusCounts['Applied'] || 0;
  const underReview = statusCounts['Under Review'] || 0;

  if (total === 0) {
    return {
      summary: "Your job tracker is ready — time to add your first application!",
      insights: [
        "Start by adding applications you've already submitted.",
        "Set a goal: aim for 5–10 quality applications per week.",
        "Connect your Gmail to automatically import job-related emails.",
      ],
      score: null,
    };
  }

  // Response rate
  const responded = total - applied;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  // Interview conversion rate
  const interviewRate = total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0;

  // Pipeline health score (0–100)
  let score = 50;
  if (total >= 10) score += 10;
  if (total >= 25) score += 10;
  if (interviewRate >= 20) score += 15;
  if (offers > 0) score += 20;
  if (rejected > total * 0.6) score -= 15;
  if (applied > total * 0.7) score -= 10; // Too many pending, not enough movement
  score = Math.max(0, Math.min(100, score));

  // Summary
  let summary = '';
  if (offers > 0) {
    summary = `Great work — you have ${offers} offer${offers > 1 ? 's' : ''}! Focus on evaluating your options carefully.`;
  } else if (interviews > 0) {
    summary = `You're in the game — ${interviews} interview${interviews > 1 ? 's' : ''} scheduled. Preparation is everything now.`;
  } else if (underReview > 0) {
    summary = `${underReview} application${underReview > 1 ? 's are' : ' is'} under review. Hang tight, but keep applying in parallel.`;
  } else if (total > 0) {
    summary = `You have ${total} application${total > 1 ? 's' : ''} out. Keep the momentum going — consistent effort compounds.`;
  }

  // Insight bullets
  if (interviewRate < 10 && total >= 5) {
    insights.push("Your interview rate is below 10% — try tailoring your resume more closely to each job description's keywords.");
  }
  if (interviewRate >= 20) {
    insights.push(`Strong ${interviewRate}% interview rate! Your resume is resonating. Focus now on interview performance.`);
  }
  if (applied > total * 0.5) {
    insights.push("Many applications are still in 'Applied' status — consider following up with companies after 1–2 weeks.");
  }
  if (rejected > 5) {
    insights.push("Rejections are data — review the job types and companies you're targeting and consider broadening your search.");
  }
  if (interviews > 0 && offers === 0) {
    insights.push("You're getting interviews but no offers yet — practice your closing: ask about next steps and send thank-you notes.");
  }
  if (total < 5) {
    insights.push("Increase your application volume. Aim for at least 5–10 applications per week to improve your chances.");
  }
  if (offers > 0) {
    insights.push("Before accepting an offer, research market salary (Glassdoor, Levels.fyi) and don't hesitate to negotiate.");
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push("Stay consistent — even 3–5 applications a week adds up significantly over a month.");
    insights.push("Network alongside applying: a warm referral dramatically increases your odds.");
  }

  return { summary, insights: insights.slice(0, 4), score, responseRate, interviewRate };
}

function generateResumeTips(jobTitle, companyName, notes) {
  const role = (jobTitle || '').toLowerCase();
  const tips = [];

  // Role-specific tips
  if (/engineer|developer|software|coding|programmer/i.test(role)) {
    tips.push(`Quantify impact: "Built a REST API that reduced response time by 35%" beats "Developed APIs".`);
    tips.push(`Include a GitHub link with pinned projects relevant to ${companyName}'s tech stack.`);
    tips.push("List specific technologies in a skills section — many companies use ATS keyword filters.");
    tips.push("Show ownership: mention projects where you led design decisions, not just implementation.");
  } else if (/manager|lead|director|head/i.test(role)) {
    tips.push("Highlight team size, budget managed, and business outcomes — not just responsibilities.");
    tips.push("Use metrics: 'Led team of 8, delivering project 2 weeks early and 15% under budget.'");
    tips.push("Show cross-functional collaboration and stakeholder management skills.");
  } else if (/design|ux|ui/i.test(role)) {
    tips.push("Link your portfolio directly in your resume header — it's your most important asset.");
    tips.push("Describe your design process (research → wireframe → prototype → test), not just outputs.");
    tips.push("Tailor your case studies: pick the 2–3 most relevant to the type of work this role does.");
  } else if (/data|analyst|science|ml|machine learning/i.test(role)) {
    tips.push("Include specific tools: Python, SQL, Tableau, etc. — and mention scale (e.g., '10M row datasets').");
    tips.push("Frame results as business impact: 'Model reduced churn by 8%, saving $200K annually.'");
    tips.push("List any publications, Kaggle rankings, or open-source contributions.");
  } else if (/market|content|social/i.test(role)) {
    tips.push("Include measurable results: 'Grew Instagram following from 2K to 18K in 6 months.'");
    tips.push("Show campaign ROI and any A/B testing experience.");
    tips.push("Tailor your portfolio samples to match the brand's voice and industry.");
  } else {
    tips.push(`Research ${companyName}'s job description carefully and mirror their exact keywords in your resume.`);
    tips.push("Use the STAR format for bullet points: Situation, Task, Action, Result.");
    tips.push("Keep your resume to one page (under 10 years experience) with clean, consistent formatting.");
    tips.push("Put your most impressive accomplishment first under each role — not your duties.");
  }

  // Universal tips
  tips.push(`Customize your summary line for ${companyName}: mention their mission or product specifically.`);

  return tips.slice(0, 5);
}

function generateInterviewQuestions(jobTitle, companyName) {
  const role = (jobTitle || '').toLowerCase();
  const questions = [];

  // Behavioral (universal)
  const behavioral = [
    `Tell me about yourself and why you're interested in this ${jobTitle} role at ${companyName}.`,
    "Describe a time you faced a significant challenge at work. How did you handle it?",
    "Give an example of when you had to work with a difficult teammate or stakeholder.",
    "Tell me about a time you failed. What did you learn from it?",
    "How do you prioritize when you have multiple competing deadlines?",
  ];

  // Technical/role-specific
  let technical = [];
  if (/engineer|developer|software|coding/i.test(role)) {
    technical = [
      "Walk me through how you would design a scalable REST API.",
      "How do you approach debugging a performance issue in production?",
      "Explain the difference between SQL and NoSQL databases and when you'd choose each.",
      "Describe a technical decision you made that you later regretted. What would you do differently?",
      "How do you stay up to date with new technologies?",
    ];
  } else if (/manager|lead/i.test(role)) {
    technical = [
      "How do you handle a team member who is consistently underperforming?",
      "Describe your approach to giving and receiving feedback.",
      "How do you align your team's work with broader company goals?",
      "Tell me about a time you had to make a tough resource allocation decision.",
    ];
  } else if (/data|analyst/i.test(role)) {
    technical = [
      "Walk me through how you'd approach a dataset you've never seen before.",
      "How do you communicate complex analysis to non-technical stakeholders?",
      "Describe a time your analysis led to a significant business decision.",
      "What's your experience with A/B testing and statistical significance?",
    ];
  } else if (/design|ux/i.test(role)) {
    technical = [
      "Walk me through your design process for a recent project.",
      "How do you balance business goals with user needs?",
      "Tell me about a time user research changed your design direction.",
      "How do you handle feedback that conflicts with your design vision?",
    ];
  } else {
    technical = [
      `What do you know about ${companyName}'s products or services?`,
      "What unique skills would you bring to this team?",
      "How do you measure success in your work?",
    ];
  }

  // Questions to ask them
  const toAsk = [
    `What does success look like in this ${jobTitle} role in the first 90 days?`,
    "What are the biggest challenges the team is facing right now?",
    `How would you describe the culture at ${companyName}?`,
    "What does career growth look like from this position?",
  ];

  return {
    behavioral: behavioral.slice(0, 4),
    technical: technical.slice(0, 4),
    toAsk: toAsk.slice(0, 3),
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/ai/insights — Dashboard pipeline analysis
router.post('/insights', auth, async (req, res) => {
  try {
    const { stats } = req.body;
    const apps = await Application.find({ userId: req.userId })
      .sort({ applicationDate: -1 })
      .limit(20)
      .lean();

    if (openai && stats) {
      const prompt = `You are a career coach analyzing a user's job search pipeline.
Stats: ${JSON.stringify(stats)}
Recent applications (last 20): ${JSON.stringify(apps.map(a => ({ job: a.jobTitle, company: a.companyName, status: a.status, date: a.applicationDate })))}
Provide a JSON response with:
- "summary": one encouraging sentence summarizing their pipeline (max 30 words)
- "insights": array of 3–4 actionable bullet points (each under 25 words)
- "score": a pipeline health score 0–100
- "responseRate": estimated response rate percentage
- "interviewRate": estimated interview rate percentage
Only return valid JSON.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return res.json({ ...parsed, usedOpenAI: true });
    }

    // Fallback
    const result = generateInsights(stats || { total: apps.length }, apps);
    res.json({ ...result, usedOpenAI: false });
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ message: 'AI insights unavailable' });
  }
});

// POST /api/ai/resume-tips — Resume suggestions for a specific job
router.post('/resume-tips', auth, async (req, res) => {
  try {
    const { jobTitle, companyName, notes, jobLink } = req.body;

    if (openai) {
      const prompt = `You are a professional resume coach.
Job: ${jobTitle} at ${companyName}.
${notes ? `Job notes: ${notes}` : ''}
Give 5 specific, actionable resume tips for this application. Each tip under 30 words. Return as JSON array of strings.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      const tips = Array.isArray(parsed) ? parsed : parsed.tips || parsed.resume_tips || Object.values(parsed)[0];
      return res.json({ tips, usedOpenAI: true });
    }

    const tips = generateResumeTips(jobTitle, companyName, notes);
    res.json({ tips, usedOpenAI: false });
  } catch (err) {
    console.error('Resume tips error:', err);
    res.status(500).json({ message: 'Resume tips unavailable' });
  }
});

// POST /api/ai/interview-questions — Interview prep for a specific job
router.post('/interview-questions', auth, async (req, res) => {
  try {
    const { jobTitle, companyName, notes } = req.body;

    if (openai) {
      const prompt = `You are an interview coach.
Job: ${jobTitle} at ${companyName}.
${notes ? `Job notes: ${notes}` : ''}
Generate interview questions as JSON with keys:
- "behavioral": array of 4 behavioral questions
- "technical": array of 4 role-specific technical/skill questions
- "toAsk": array of 3 thoughtful questions the candidate should ask the interviewer
Only return valid JSON.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return res.json({ ...parsed, usedOpenAI: true });
    }

    const questions = generateInterviewQuestions(jobTitle, companyName);
    res.json({ ...questions, usedOpenAI: false });
  } catch (err) {
    console.error('Interview questions error:', err);
    res.status(500).json({ message: 'Interview questions unavailable' });
  }
});

// ─── Helpers for resume analysis fallback ─────────────────────────────────────

/** Extract meaningful words from text, ignoring stop-words */
function extractKeywords(text) {
  const stop = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
    'from','is','are','was','were','be','been','being','have','has','had','do',
    'does','did','will','would','could','should','may','might','shall','can',
    'not','no','nor','so','yet','both','either','each','few','more','most',
    'other','some','such','than','too','very','s','t','just','don','your',
    'that','this','these','those','i','we','you','he','she','they','it',
    'as','if','then','than','when','where','how','all','any','every','our',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w));
}

/** Score how well resume text matches a job description (0–100) */
function scoreMatch(resumeText, jobTitle, companyName, notes) {
  const jobContext = `${jobTitle} ${companyName} ${notes || ''}`;
  const jobKw = new Set(extractKeywords(jobContext));
  const resumeKw = new Set(extractKeywords(resumeText));

  if (jobKw.size === 0) return 50;
  let hits = 0;
  for (const w of jobKw) { if (resumeKw.has(w)) hits++; }
  return Math.min(100, Math.round((hits / jobKw.size) * 100));
}

/** Find keywords in job context that are missing from the resume */
function findMissingKeywords(resumeText, jobTitle, notes) {
  const jobKw = extractKeywords(`${jobTitle} ${notes || ''}`);
  const resumeKw = new Set(extractKeywords(resumeText));
  // Dedupe and return unique missing keywords (max 10)
  const missing = [...new Set(jobKw.filter(w => !resumeKw.has(w) && w.length > 3))];
  return missing.slice(0, 10);
}

/** Generate role-specific suggestions based on resume text content */
function generateAnalysisFallback(resumeText, jobTitle, companyName, notes) {
  const role = (jobTitle || '').toLowerCase();
  const resume = resumeText.toLowerCase();

  const score = scoreMatch(resumeText, jobTitle, companyName, notes);
  const missingKeywords = findMissingKeywords(resumeText, jobTitle, notes);

  // Detect what's already in the resume
  const hasMetrics    = /\d+%|\$\d+|\d+ (users|clients|team|people|million|thousand|projects)/i.test(resumeText);
  const hasSummary    = /summary|objective|profile|about/i.test(resume);
  const hasGithub     = /github\.com/i.test(resume);
  const hasLinkedIn   = /linkedin\.com/i.test(resume);
  const hasEducation  = /university|college|bachelor|master|b\.s\.|m\.s\.|degree/i.test(resume);
  const hasBullets    = resumeText.includes('•') || resumeText.includes('-') || resumeText.includes('*');
  const wordCount     = resumeText.trim().split(/\s+/).length;

  const strengths = [];
  const improvements = [];
  const rewriteSuggestions = [];

  // Strengths
  if (hasMetrics)   strengths.push('Good use of quantified achievements — numbers make your impact concrete.');
  if (hasSummary)   strengths.push('Professional summary is present — this helps recruiters quickly understand your profile.');
  if (hasGithub)    strengths.push('GitHub link included — great for technical roles where code samples matter.');
  if (hasLinkedIn)  strengths.push('LinkedIn profile linked — recruiters often cross-reference this.');
  if (hasEducation) strengths.push('Education section is present and visible.');
  if (hasBullets)   strengths.push('Bullet-point format makes the resume easy to scan.');
  if (strengths.length === 0) strengths.push('Resume text was received — see improvement suggestions below.');

  // Improvements
  if (!hasMetrics)
    improvements.push('Add measurable results to your bullets — e.g., "Improved load time by 30%" instead of "Improved performance".');
  if (!hasSummary)
    improvements.push('Add a 2–3 sentence professional summary at the top tailored to this specific role.');
  if (wordCount > 700)
    improvements.push('Your resume may be too long — aim for one page (under ~600 words) for under 10 years of experience.');
  if (wordCount < 150)
    improvements.push('Your resume seems short — make sure all relevant experience and skills are included.');
  if (!hasGithub && /engineer|developer|software|coding/i.test(role))
    improvements.push(`Add a GitHub profile link — it's expected for ${jobTitle} roles.`);
  if (missingKeywords.length > 0)
    improvements.push(`Mirror keywords from the job description in your resume: ${missingKeywords.slice(0,5).join(', ')}.`);

  // Role-specific improvements
  if (/engineer|developer|software/i.test(role)) {
    if (!/angular|react|vue|node|python|java|sql|typescript/i.test(resume))
      improvements.push('List specific technologies clearly in a Skills section — ATS systems scan for these.');
  } else if (/manager|lead/i.test(role)) {
    if (!/led|managed|oversaw|directed|supervised/i.test(resume))
      improvements.push('Use leadership verbs: "Led", "Managed", "Directed" — not just "Helped" or "Assisted".');
  } else if (/data|analyst/i.test(role)) {
    if (!/python|sql|tableau|excel|r\b|pandas/i.test(resume))
      improvements.push('List data tools explicitly: Python, SQL, Tableau, Excel — ATS filters on these.');
  }

  if (improvements.length === 0)
    improvements.push(`Customize your opening summary specifically for ${companyName} — mention their product or mission.`);

  // Rewrite suggestions
  rewriteSuggestions.push({
    original: 'Responsible for developing features',
    rewritten: `Engineered and shipped 3 production features for ${companyName}-style products, reducing bug rate by 20%.`,
    tip: 'Replace "Responsible for" with an action verb + outcome.',
  });
  rewriteSuggestions.push({
    original: 'Worked on team projects',
    rewritten: 'Collaborated with a cross-functional team of 5 to deliver project milestones 2 weeks ahead of schedule.',
    tip: 'Add team size and a concrete result.',
  });
  if (/engineer|developer/i.test(role)) {
    rewriteSuggestions.push({
      original: 'Built REST API',
      rewritten: 'Designed and implemented a REST API using Node.js/Express that handled 10K+ daily requests with 99.9% uptime.',
      tip: 'Add technology stack and scale/impact.',
    });
  } else if (/data|analyst/i.test(role)) {
    rewriteSuggestions.push({
      original: 'Analyzed data',
      rewritten: 'Analyzed 500K+ customer records using Python and SQL, identifying trends that increased retention by 12%.',
      tip: 'Specify the data size and the business outcome.',
    });
  }

  return {
    score,
    matchLevel: score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : 'Low',
    missingKeywords,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 5),
    rewriteSuggestions: rewriteSuggestions.slice(0, 3),
    wordCount,
    summary: score >= 70
      ? `Your resume is a strong match for ${jobTitle} at ${companyName}. A few targeted tweaks will make it even stronger.`
      : score >= 45
      ? `Your resume is a moderate match for ${jobTitle} at ${companyName}. Adding missing keywords and metrics will improve it significantly.`
      : `Your resume needs tailoring for this ${jobTitle} role — focus on mirroring the job description's language and adding measurable results.`,
  };
}

// POST /api/ai/analyze-resume — Full resume vs. job analysis
router.post('/analyze-resume', auth, async (req, res) => {
  try {
    const { resumeText, jobTitle, companyName, notes, applicationId } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: 'Resume text is too short to analyze (minimum 50 characters).' });
    }

    // Optionally pull the real application from DB for more context
    let appNotes = notes || '';
    let appTitle = jobTitle || 'this role';
    let appCompany = companyName || 'this company';
    if (applicationId) {
      const dbApp = await Application.findOne({ _id: applicationId, userId: req.userId }).lean();
      if (dbApp) {
        appTitle   = dbApp.jobTitle   || appTitle;
        appCompany = dbApp.companyName || appCompany;
        appNotes   = dbApp.notes       || appNotes;
      }
    }

    if (openai) {
      const prompt = `You are an expert resume coach and ATS specialist. Analyze this resume against the job below.

JOB: ${appTitle} at ${appCompany}
JOB NOTES / DESCRIPTION: ${appNotes || 'Not provided'}

RESUME TEXT:
"""
${resumeText.slice(0, 4000)}
"""

Return ONLY valid JSON with these exact keys:
{
  "score": <integer 0-100, how well the resume matches the job>,
  "matchLevel": <"Strong" | "Moderate" | "Low">,
  "summary": <one sentence summary of the match quality>,
  "missingKeywords": <array of up to 8 important keywords/skills missing from resume>,
  "strengths": <array of 3-4 specific strengths found in the resume>,
  "improvements": <array of 4-5 specific, actionable improvement suggestions>,
  "rewriteSuggestions": <array of up to 3 objects: { "original": "weak bullet text", "rewritten": "stronger version", "tip": "why this is better" }>,
  "wordCount": <integer word count of the resume>
}`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return res.json({ ...parsed, usedOpenAI: true });
    }

    // Fallback analysis
    const result = generateAnalysisFallback(resumeText, appTitle, appCompany, appNotes);
    res.json({ ...result, usedOpenAI: false });
  } catch (err) {
    console.error('Resume analysis error:', err);
    res.status(500).json({ message: 'Resume analysis unavailable' });
  }
});

module.exports = router;
