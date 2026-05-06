# MorphoCheck App

**Advanced Clinical and Anthropometric Analysis Platform**

MorphoCheck is a web application for medical and anthropometric assessment. It processes patient measurements, calculates BMI, Z-score based indicators and body-type metrics, then generates clinical PDF and DOCX reports.

## Key Features

- Advanced anthropometric analytics with BMI, Z-score and normative comparisons.
- PDF and DOCX report generation for patient records.
- Admin and superadmin dashboards with filters, visual analytics and activity tracking.
- Clinical CMS for configurable recommendations and analysis rules.
- Offline-friendly data entry and synchronization support.
- Secure FastAPI backend with rate limiting, validation and security headers.

## Technology Stack

### Frontend

- React.js (Create React App + CRACO)
- Material UI and Tailwind CSS
- React hooks and local/offline state management

### Backend

- FastAPI
- SQLAlchemy
- SQLite by default
- ReportLab and python-docx for document rendering

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.9+
- npm or yarn

### Backend Setup

```bash
cd morphocheck_backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend runs at `http://localhost:8000`.

### Frontend Setup

```bash
npm install
npm start
```

The frontend runs at `http://localhost:3000`.

## Project Structure

```text
morpho-check-app/
|-- morphocheck_backend/      FastAPI backend and application logic
|   |-- main.py               FastAPI entry point
|   |-- models/               SQLAlchemy models
|   |-- routers/              API routers
|   |-- services/             PDF, DOCX, analysis and clinical services
|-- src/                      React frontend source code
|   |-- components/           Reusable UI components
|   |-- pages/                Main app pages
|   |-- services/             API clients
|-- public/                   Static assets
|-- package.json              Frontend dependencies and scripts
|-- README.md                 Project documentation
```

## Security Practices

- Rate limiting with `slowapi`.
- Strict security headers including HSTS, CSP and X-Frame-Options.
- Input validation on both client and server.
- Safe error handling for internal server errors.

## Contribution

1. Fork the project.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a pull request.

Developed and maintained for reliable clinical assessments.
