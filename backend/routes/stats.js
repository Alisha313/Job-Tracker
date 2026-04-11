const express = require('express');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const router = express.Router();

function monthKey(app) {
  const raw = app.applicationDate ?? app.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 7);
}

router.get('/summary', auth, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.userId });

    const statusCounts = {};
    const typeCounts = {};
    const timeline = {};

    apps.forEach((app) => {
      statusCounts[app.status] = (Number(statusCounts[app.status]) || 0) + 1;
      typeCounts[app.jobType] = (Number(typeCounts[app.jobType]) || 0) + 1;

      const month = monthKey(app);
      if (month) {
        timeline[month] = (Number(timeline[month]) || 0) + 1;
      }
    });

    const now = new Date();
    const upcomingInterviews = apps
      .filter((app) => app.interviewDate && new Date(app.interviewDate) >= now)
      .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))
      .slice(0, 10)
      .map((app) => ({
        id: app._id,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        interviewDate: app.interviewDate,
        status: app.status,
      }));

    const pastDueInterviews = apps
      .filter(
        (app) =>
          app.interviewDate &&
          new Date(app.interviewDate) < now &&
          app.status === 'Interview Scheduled'
      )
      .map((app) => ({
        id: app._id,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        interviewDate: app.interviewDate,
      }));

    const interviewSpotlight = apps
      .filter((a) => a.status === 'Interview Scheduled')
      .map((app) => {
        const d = app.interviewDate ? new Date(app.interviewDate) : null;
        const valid = d && !Number.isNaN(d.getTime());
        let bucket = 'tbd';
        if (valid) {
          bucket = d >= now ? 'upcoming' : 'past';
        }
        return { app, bucket, sortTime: valid ? d.getTime() : null };
      })
      .sort((a, b) => {
        const tier = { upcoming: 0, tbd: 1, past: 2 };
        if (tier[a.bucket] !== tier[b.bucket]) return tier[a.bucket] - tier[b.bucket];
        if (a.bucket === 'upcoming') return (a.sortTime || 0) - (b.sortTime || 0);
        if (a.bucket === 'past') return (b.sortTime || 0) - (a.sortTime || 0);
        return 0;
      })
      .slice(0, 20)
      .map(({ app, bucket }) => ({
        id: app._id,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        interviewDate: app.interviewDate,
        bucket,
      }));

    const recentActivity = apps
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 12)
      .map((app) => ({
        id: app._id,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        status: app.status,
        applicationDate: app.applicationDate,
        updatedAt: app.updatedAt,
      }));

    res.json({
      total: apps.length,
      statusCounts,
      typeCounts,
      timeline,
      upcomingInterviews,
      pastDueInterviews,
      interviewSpotlight,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
