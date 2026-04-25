const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('Missing MONGO_URI. Create backend/.env from .env.example and set your Atlas connection string.');
  process.exit(1);
}
const mongoUriLooksLikeTemplate =
  /xxxxx/i.test(mongoUri) ||
  /your_username|your_password/i.test(mongoUri) ||
  /<password>/i.test(mongoUri);
if (mongoUriLooksLikeTemplate) {
  console.error(`
[!] MONGO_URI is still a placeholder — DNS cannot resolve a fake host like cluster0.xxxxx.mongodb.net.

Fix: MongoDB Atlas → your cluster → Connect → Drivers → copy the mongodb+srv://… string.
     Put your real database username and password in the URI, save as backend/.env
`);
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const statsRoutes = require('./routes/stats');
const emailRoutes = require('./routes/email');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const resumeAnalyzerRoutes = require('./routes/resume-analyzer');
const resumeRoutes = require('./routes/resume');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resume-analyzer', resumeAnalyzerRoutes);
app.use('/api/resume', resumeRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Job Application Tracker API - Alisha Patel' });
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (err.code === 'ENOTFOUND' || err.syscall === 'querySrv') {
      console.error(
        'Hint: Check the hostname in MONGO_URI (Atlas → Connect). Ensure this machine can reach the internet/DNS.'
      );
    }
    if (/whitelist|not authorized|ECONNREFUSED|timed out|connect/i.test(err.message || '')) {
      console.error(
        'Hint: In MongoDB Atlas, allow this computer IP (Network Access) or temporarily allow 0.0.0.0/0 for development.'
      );
    }
    process.exit(1);
  }
}

startServer();
