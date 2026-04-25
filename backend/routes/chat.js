const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// ─── Smart fallback engine ────────────────────────────────────────────────────

const generalTips = [
  "Follow up on applications after 1–2 weeks if you haven't heard back.",
  "Customize your resume for each job — match keywords from the job description.",
  "Prepare for interviews by researching the company's mission, products, and recent news.",
  "Network on LinkedIn: connect with employees at companies you're targeting.",
  "Set daily goals for your job search (e.g., 3 applications, 2 follow-ups).",
  "Review and update your LinkedIn profile so recruiters can find you.",
  "Practice coding problems daily if applying for technical roles.",
  "Send a thank-you email within 24 hours of every interview.",
  "Track your applications consistently so nothing falls through the cracks.",
  "Use the STAR method (Situation, Task, Action, Result) to structure interview answers.",
];

function buildContextSummary(context) {
  if (!context) return null;
  const { applications, stats } = context;

  const lines = [];
  if (stats) {
    lines.push(`User has ${stats.total || 0} total applications.`);
    if (stats.statusCounts) {
      const counts = Object.entries(stats.statusCounts)
        .map(([k, v]) => `${v} ${k}`)
        .join(', ');
      lines.push(`Status breakdown: ${counts}.`);
    }
    if (stats.upcomingInterviews && stats.upcomingInterviews.length) {
      const next = stats.upcomingInterviews[0];
      lines.push(`Next interview: ${next.jobTitle} at ${next.companyName}.`);
    }
  }
  if (applications && applications.length) {
    const recent = applications.slice(0, 5)
      .map(a => `${a.jobTitle} at ${a.companyName} (${a.status})`)
      .join('; ');
    lines.push(`Recent applications: ${recent}.`);
  }
  return lines.length ? lines.join(' ') : null;
}

function smartFallback(messages, context) {
  const last = (messages[messages.length - 1]?.content || '').toLowerCase();
  const ctxSummary = buildContextSummary(context);

  // Context-aware replies
  if (context?.stats) {
    const s = context.stats;
    const total = s.total || 0;
    const interviews = s.statusCounts?.['Interview Scheduled'] || 0;
    const offers = s.statusCounts?.['Offer Received'] || 0;
    const rejected = s.statusCounts?.['Rejected'] || 0;

    if (/how.*doing|my progress|pipeline|overview|status/i.test(last)) {
      if (total === 0) return `You haven't added any applications yet. Start by clicking "Add application" on the dashboard!`;
      let msg = `You have ${total} application${total > 1 ? 's' : ''}`;
      if (interviews) msg += `, ${interviews} interview${interviews > 1 ? 's' : ''} scheduled`;
      if (offers) msg += `, and ${offers} offer${offers > 1 ? 's' : ''}`;
      msg += `. `;
      if (rejected > 2) msg += `You've faced ${rejected} rejections — keep going, persistence is key! `;
      if (interviews > 0) msg += `Focus on your upcoming interview${interviews > 1 ? 's' : ''} — research the companies and practice your answers.`;
      return msg;
    }

    if (/interview/i.test(last) && s.upcomingInterviews?.length) {
      const next = s.upcomingInterviews[0];
      return `Your next interview is for ${next.jobTitle} at ${next.companyName}. Research their recent projects, prepare STAR-method answers, and send a thank-you email afterward!`;
    }

    if (/offer/i.test(last) && offers > 0) {
      return `Congratulations on your offer${offers > 1 ? 's' : ''}! Before accepting, research market salary for the role, consider negotiating, and review benefits carefully.`;
    }

    if (/reject|rejection/i.test(last) && rejected > 0) {
      return `${rejected} rejection${rejected > 1 ? 's' : ''} is part of the process — even strong candidates face them. Ask for feedback when possible, keep refining your resume, and keep applying. Your offer is out there!`;
    }
  }

  // Topic-based replies
  if (/resume|cv/i.test(last)) {
    return "Tailor your resume to each job by mirroring keywords from the job description. Use measurable achievements (e.g., 'Reduced load time by 40%') instead of generic duties. Keep it to one page if you have under 10 years of experience.";
  }
  if (/cover letter/i.test(last)) {
    return "A strong cover letter addresses three things: why you're excited about this company specifically, how your skills match their needs, and one concrete accomplishment that proves it. Keep it under 250 words.";
  }
  if (/interview/i.test(last)) {
    return "For interviews: research the company's mission and recent news, prepare 3–5 STAR stories, and have 2–3 thoughtful questions ready for the interviewer. Practice speaking your answers out loud beforehand.";
  }
  if (/salary|negotiat/i.test(last)) {
    return "Research market salaries on Glassdoor, LinkedIn, and Levels.fyi before negotiating. Let the employer name a number first if possible, then counter with data. Don't forget to negotiate benefits, remote work, and start date too.";
  }
  if (/network|linkedin/i.test(last)) {
    return "Message people in roles you want: 'I admire your work at [Company] and am exploring opportunities in [field]. Would you be open to a 15-minute chat?' A warm connection is 10× more effective than a cold application.";
  }
  if (/follow.?up/i.test(last)) {
    return "If you haven't heard back after 1–2 weeks, send a brief follow-up email: 'I wanted to confirm you received my application for [role] and reiterate my enthusiasm. Happy to provide any additional info.' Keep it polite and concise.";
  }
  if (/hi|hello|hey/i.test(last)) {
    return "Hi! I'm your job search assistant. I can help with interview prep, resume tips, salary negotiation, follow-up strategies, and more. What would you like to work on?";
  }

  return generalTips[Math.floor(Math.random() * generalTips.length)];
}

// ─── Chat route ───────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array required' });
    }

    if (openai) {
      const ctxSummary = buildContextSummary(context);
      const systemPrompt = [
        'You are a helpful job search assistant embedded in a Job Tracker app.',
        'Provide concise, practical advice about job applications, interviews, resumes, and career development.',
        'Keep responses under 200 words.',
        ctxSummary ? `Current user context: ${ctxSummary}` : '',
      ].filter(Boolean).join('\n');

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 250,
      });
      return res.json({ reply: completion.choices[0].message.content, usedOpenAI: true });
    }

    // Smart fallback
    const reply = smartFallback(messages, context);
    res.json({ reply, usedOpenAI: false });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Chat service unavailable' });
  }
});

module.exports = router;
