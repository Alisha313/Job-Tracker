const express = require('express');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/summary', auth, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.userId });

    const statusCounts = {};
    const typeCounts = {};
    const timeline = {};

    apps.forEach((app) => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      typeCounts[app.jobType] = (typeCounts[app.jobType] || 0) + 1;

      const month = new Date(app.applicationDate).toISOString().slice(0, 7);
      timeline[month] = (timeline[month] || 0) + 1;
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

    const recentActivity = apps
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
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
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
