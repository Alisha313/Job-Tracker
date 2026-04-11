const express = require('express');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Application = require('../models/Application');
const { parseJobFromEmail, looksJobRelated } = require('../lib/emailParser');

const router = express.Router();

/** Must match what you add under OAuth consent screen → Scopes, or sync will return “Insufficient Permission”. */
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
  'email',
  'profile',
];

function googleApiError(err) {
  const m =
    err?.response?.data?.error?.message ||
    err?.response?.data?.error_description ||
    err?.errors?.[0]?.message ||
    err?.message ||
    'Request failed';
  return String(m);
}

function insufficientScopeHint() {
  return (
    'Fix: (1) Google Cloud → APIs & Services → OAuth consent screen → Edit app → Scopes → Add: ' +
    '“…/auth/gmail.readonly” (Gmail API / View your email messages). Save. ' +
    '(2) Open https://myaccount.google.com/permissions → remove “JobTracker”. ' +
    '(3) In JobTracker, Email → Connect Gmail again so Google issues a new token with Gmail access.'
  );
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4200/email-callback';
  if (!clientId || !clientSecret) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+gmailRefreshToken');
    res.json({
      connected: !!user?.gmailRefreshToken,
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/google-auth-url', auth, (req, res) => {
  const oauth2 = getOAuthClient();
  if (!oauth2) {
    return res.status(503).json({
      message:
        'Gmail integration is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env',
    });
  }
  const state = jwt.sign({ userId: String(req.userId) }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
  res.json({ url });
});

router.post('/google-complete', auth, async (req, res) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) return res.status(400).json({ message: 'code and state are required' });
    let payload;
    try {
      payload = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired state — try connecting again' });
    }
    if (payload.userId !== String(req.userId)) {
      return res.status(400).json({ message: 'State does not match the logged-in user' });
    }
    const oauth2 = getOAuthClient();
    if (!oauth2) return res.status(503).json({ message: 'Google OAuth not configured' });
    const { tokens } = await oauth2.getToken(code);
    const update = {};
    if (tokens.refresh_token) {
      update.gmailRefreshToken = tokens.refresh_token;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        message:
          'Google did not return a refresh token. Open https://myaccount.google.com/permissions , remove JobTracker access, then try Connect again.',
      });
    }
    await User.findByIdAndUpdate(req.userId, update);
    res.json({ ok: true, message: 'Gmail connected — use Sync to import applications from your inbox.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: googleApiError(err) || 'Token exchange failed' });
  }
});

router.post('/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+gmailRefreshToken');
    if (!user?.gmailRefreshToken) {
      return res.status(400).json({ message: 'Connect Gmail first' });
    }
    const oauth2 = getOAuthClient();
    oauth2.setCredentials({ refresh_token: user.gmailRefreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2 });

    /** Gmail search query — default: all messages in Inbox (no date limit). Override in .env e.g. `in:inbox newer_than:365d` */
    const q = (process.env.GMAIL_SYNC_QUERY || 'in:inbox').trim();
    /** Safety cap per sync run (Gmail returns newest first; raise to walk deeper into history) */
    const maxList = Math.min(
      Math.max(1, parseInt(process.env.GMAIL_SYNC_MAX_MESSAGES || '10000', 10) || 10000),
      100000
    );

    const messageRefs = [];
    let pageToken;
    do {
      const need = maxList - messageRefs.length;
      if (need <= 0) break;
      const pageSize = Math.min(500, need);
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q,
        maxResults: pageSize,
        pageToken,
      });
      const batch = listRes.data.messages || [];
      messageRefs.push(...batch);
      pageToken = listRes.data.nextPageToken;
    } while (pageToken && messageRefs.length < maxList);

    const stoppedDueToCap = !!pageToken;
    const messages = messageRefs;

    let imported = 0;
    let skippedDuplicate = 0;
    let skippedNotJobRelated = 0;

    const concurrency = Math.min(
      32,
      Math.max(1, parseInt(process.env.GMAIL_SYNC_CONCURRENCY || '12', 10) || 12)
    );

    const ids = messages.map((m) => m.id);
    const already = await Application.find({
      userId: req.userId,
      sourceMessageId: { $in: ids },
    })
      .select('sourceMessageId')
      .lean();
    const alreadyHave = new Set(already.map((d) => d.sourceMessageId));
    skippedDuplicate = ids.filter((id) => alreadyHave.has(id)).length;

    const toFetch = messages.filter((m) => !alreadyHave.has(m.id));

    const fetchMeta = async (m) => {
      const msgId = m.id;
      try {
        const meta = await gmail.users.messages.get({
          userId: 'me',
          id: msgId,
          format: 'metadata',
          metadataHeaders: ['Subject'],
        });
        const headers = meta.data.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(no subject)';
        const snippet = meta.data.snippet || '';

        if (!looksJobRelated(subject, snippet)) {
          return { kind: 'skip' };
        }

        const parsed = parseJobFromEmail(subject, snippet);

        const app = new Application({
          userId: req.userId,
          jobTitle: parsed.jobTitle,
          companyName: parsed.companyName,
          location: parsed.location,
          jobType: parsed.jobType,
          status: parsed.status,
          applicationDate: parsed.date,
          notes: `Imported from Gmail.\nSubject: ${subject}\n---\n${snippet.slice(0, 800)}`,
          sourceMessageId: msgId,
        });
        await app.save();
        return { kind: 'ok' };
      } catch (inner) {
        if (inner.code === 11000) return { kind: 'dup' };
        console.error('sync message error:', inner.message);
        return { kind: 'err' };
      }
    };

    for (let i = 0; i < toFetch.length; i += concurrency) {
      const slice = toFetch.slice(i, i + concurrency);
      const outcomes = await Promise.all(slice.map((m) => fetchMeta(m)));
      for (const o of outcomes) {
        if (o.kind === 'ok') imported++;
        else if (o.kind === 'skip') skippedNotJobRelated++;
        else if (o.kind === 'dup') skippedDuplicate++;
      }
    }

    res.json({
      imported,
      skippedDuplicate,
      skippedNotJobRelated,
      scanned: messages.length,
      query: q,
      maxMessagesCap: maxList,
      stoppedDueToCap,
      hasMoreInGmail: stoppedDueToCap,
    });
  } catch (err) {
    console.error(err);
    const msg = googleApiError(err);
    const isScope =
      /insufficient|Insufficient|authentication scopes|403/i.test(msg) ||
      err?.code === 403 ||
      err?.response?.status === 403;
    res.status(500).json({
      message: msg || 'Sync failed',
      hint: isScope ? insufficientScopeHint() : undefined,
    });
  }
});

module.exports = router;
