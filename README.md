# zero-trust-lunch
A multi-agent demo built with the Microsoft Agent Framework and Azure AI Foundry

## Overview

This is a demo application showcasing a zero-trust architecture for lunch ordering using Azure AI Foundry's multi-agent capabilities. The application consists of:

- **Frontend**: React + TypeScript SPA built with Vite (plain CSS, no UI libraries)
- **Backend**: Express + TypeScript API using @azure/ai-projects

## Architecture

The application implements a 4-step pipeline:

1. **Employee Step**: Normalizes the employee list (removes duplicates, trims whitespace)
2. **HR Step**: Uses Azure AI Foundry agent to assess lunch menu safety, identifying allergens and health risks
3. **Finance Step**: Calculates costs and validates against budget
4. **Manager Step**: Makes final approval decision (blocks orders if risk is high)

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Azure AI Foundry account (optional - fallback logic included)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sazimi/zero-trust-lunch.git
cd zero-trust-lunch
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Azure AI Foundry credentials:
```
AZURE_AI_PROJECT_ENDPOINT=https://your-project.api.azureml.ms
AZURE_AI_AGENT_ID=your_agent_id_here
PORT=3001
HEADCOUNT=10
LUNCH_BUDGET_PER_PERSON=15
```

**Note**: If you don't have Azure AI Foundry credentials, the application will use fallback logic for the HR step.

## Running the Application

### Development Mode

1. Start the backend server:
```bash
cd backend
npm run dev
```

The API will run on http://localhost:3001

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:5173

### Production Mode

1. Build the backend:
```bash
cd backend
npm run build
npm start
```

2. Build the frontend:
```bash
cd frontend
npm run build
npm run preview
```

## Demo Inputs

The application includes two pre-configured demo scenarios accessible via the UI:

### Demo 1: Safe Lunch Order
- 8 employees
- Balanced, low-risk menu items
- Expected result: ✅ APPROVED

### Demo 2: High-Risk Lunch Order
- 12 employees (exceeds budget)
- Menu with allergens (peanuts, shellfish)
- Expected result: ❌ REJECTED (high risk)

## API Endpoint

### POST /api/pipeline/run

**Request Body:**
```json
{
  "employees": [
    "Alice Johnson",
    "Bob Smith"
  ],
  "lunchMenu": [
    "Grilled chicken salad",
    "Quinoa bowl"
  ]
}
```

**Response:**
```json
{
  "employee": {
    "normalizedEmployees": ["Alice Johnson", "Bob Smith"]
  },
  "hr": {
    "sanitizedMenu": ["Grilled chicken salad", "Quinoa bowl"],
    "riskLevel": "low",
    "reasons": ["Menu appears safe"],
    "threadId": "thread_abc123",
    "runId": "run_xyz789"
  },
  "finance": {
    "totalCost": 30,
    "budget": 150,
    "withinBudget": true,
    "costPerPerson": 15
  },
  "manager": {
    "approved": true,
    "message": "APPROVED: All checks passed. Cost: $30 within budget of $150",
    "finalDecision": "Lunch order fully approved"
  }
}
```

## Project Structure

```
zero-trust-lunch/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── steps/       # Pipeline step implementations
│   │   │   ├── employee.ts
│   │   │   ├── hr.ts
│   │   │   ├── finance.ts
│   │   │   └── manager.ts
│   │   ├── pipeline/    # Pipeline orchestrator
│   │   ├── types.ts     # TypeScript type definitions
│   │   └── index.ts     # Express server
│   ├── package.json
│   └── tsconfig.json
├── frontend/            # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx      # Main component
│   │   ├── App.css      # Application styles
│   │   └── main.tsx     # Entry point
│   ├── package.json
│   └── vite.config.ts
├── .env.example         # Environment variables template
├── demo-inputs.json     # Demo input examples
└── README.md
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Express, TypeScript, Node.js
- **Azure AI**: @azure/ai-projects, @azure/identity
- **Styling**: Plain CSS (no UI libraries)

## License

See LICENSE file for details.
