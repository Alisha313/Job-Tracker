const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

const SYSTEM = `You are a helpful assistant inside JobTracker, a job application tracking app. 
Give short, practical advice about job search, interviews, résumés, and how to use the app (statuses, dashboard, Gmail sync). 
Keep answers under 150 words unless the user asks for detail.`;

function fallbackReply(userMessage) {
  const q = (userMessage || '').toLowerCase();
  if (/interview|prepare|nervous/i.test(q)) {
    return 'For interviews: skim the job description again, prepare 2 STAR stories, and write 3 questions for the employer. Add interview dates in JobTracker so they appear on your dashboard.';
  }
  if (/status|pipeline|organize|track/i.test(q)) {
    return 'Move statuses as things change: Applied → Under Review → Interview Scheduled → Offer (or Rejected). That keeps your charts and reminders accurate.';
  }
  if (/email|gmail|sync|import/i.test(q)) {
    return 'Open Email sync in the nav, connect Gmail (Google Cloud OAuth), then click Sync from inbox. We scan recent messages for job-related keywords and add applications — always review imported rows.';
  }
  if (/follow|thank/i.test(q)) {
    return 'Send a brief thank-you within 24 hours of an interview. Mention something specific you discussed. Use Notes in each application to log follow-ups.';
  }
  if (/resume|cv|cover/i.test(q)) {
    return 'Tailor your résumé bullets to the job description. Use numbers where you can. For cover letters, one clear story that connects your experience to their role beats a generic template.';
  }
  return 'Ask me about interviews, organizing applications, Gmail sync, or job search tips. For richer AI answers, your instructor can add OPENAI_API_KEY to the backend `.env`.';
}

router.post('/', auth, async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ message: 'Send messages: [{ role, content }, ...]' });
  }

  const key = process.env.OPENAI_API_KEY;
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const lastContent = lastUser?.content || '';

  if (!key) {
    return res.json({ reply: fallbackReply(lastContent), usedOpenAI: false });
  }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM }, ...messages.slice(-12)],
        max_tokens: 600,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({
        message: data.error?.message || 'OpenAI request failed',
        usedOpenAI: true,
      });
    }
    const reply = data.choices?.[0]?.message?.content || 'No response.';
    res.json({ reply, usedOpenAI: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
