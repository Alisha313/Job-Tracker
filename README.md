# Job Application Tracker

**Alisha Patel - CPS 3500 Final Project**

A full-stack web application to track job applications, built with Angular, Node.js/Express, and MongoDB.

## Features

- User registration and authentication (JWT)
- Full CRUD for job applications
- Analytics dashboard with interactive charts (Chart.js)
- CSV and PDF export
- Visual timeline of application activity
- Interview reminders with urgency indicators
- Responsive design (Bootstrap 5)
- Search and filter applications by status

## Tech Stack

- **Frontend:** Angular 19, Bootstrap 5, Chart.js (ng2-charts), jsPDF
- **Backend:** Node.js, Express, Mongoose, MongoDB Atlas
- **Auth:** bcrypt, JSON Web Tokens (JWT)

## Project Structure

```
job-tracker/
  frontend/       # Angular application
  backend/        # Express API server
  README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (free tier)

### Backend

```bash
cd backend
npm install
# Update .env with your MongoDB URI and JWT secret
node server.js
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

Open http://localhost:4200 in your browser.

## Screenshots

(Add screenshots of the running application here)
