const express = require('express');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.userId });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const application = new Application({ ...req.body, userId: req.userId });
    await application.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(400).json({ message: 'Update error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
