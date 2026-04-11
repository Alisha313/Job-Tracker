const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobTitle: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: '' },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'],
      default: 'Full-time',
    },
    salary: { type: String, trim: true, default: '' },
    applicationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Offer Received', 'Rejected', 'Accepted', 'Withdrawn'],
      default: 'Applied',
    },
    interviewDate: { type: Date, default: null },
    jobLink: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    /** Gmail message id when imported from email sync */
    sourceMessageId: { type: String, default: null },
  },
  { timestamps: true }
);

applicationSchema.index(
  { userId: 1, sourceMessageId: 1 },
  { unique: true, partialFilterExpression: { sourceMessageId: { $type: 'string' } } }
);

module.exports = mongoose.model('Application', applicationSchema);
