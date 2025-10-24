import { useState } from 'react';
import './App.css';

interface PipelineInput {
  employees: string[];
  lunchMenu: string[];
}

interface PipelineResult {
  employee: {
    normalizedEmployees: string[];
  };
  hr: {
    sanitizedMenu: string[];
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    threadId?: string;
    runId?: string;
  };
  finance: {
    totalCost: number;
    budget: number;
    withinBudget: boolean;
    costPerPerson: number;
  };
  manager: {
    approved: boolean;
    message: string;
    finalDecision: string;
  };
}

const DEMO_INPUTS = {
  demo1: {
    name: 'Safe Lunch Order',
    description: 'A balanced, low-risk lunch menu for 8 employees',
    input: {
      employees: [
        'Alice Johnson',
        'Bob Smith',
        'Carol White',
        'David Lee',
        'Eve Martinez',
        'Frank Chen',
        'Grace Taylor',
        'Henry Wilson',
      ],
      lunchMenu: [
        'Grilled chicken salad',
        'Quinoa bowl with vegetables',
        'Turkey sandwich on whole wheat',
        'Fresh fruit platter',
        'Sparkling water',
        'Green tea',
      ],
    },
  },
  demo2: {
    name: 'High-Risk Lunch Order',
    description: 'A menu with allergens and excessive employee count',
    input: {
      employees: [
        'Alice Johnson',
        'Bob Smith',
        'Carol White',
        'David Lee',
        'Eve Martinez',
        'Frank Chen',
        'Grace Taylor',
        'Henry Wilson',
        'Ivy Brown',
        'Jack Davis',
        'Kelly Moore',
        'Leo Garcia',
      ],
      lunchMenu: [
        'Peanut butter cookies',
        'Shellfish pasta',
        'Fried chicken with high-sodium sauce',
        'Dairy-based creamy soup',
        'Processed meat sandwiches',
        'Soy sauce glazed salmon',
      ],
    },
  },
};

function App() {
  const [employees, setEmployees] = useState('');
  const [lunchMenu, setLunchMenu] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: PipelineInput = {
        employees: employees.split('\n').filter((e) => e.trim()),
        lunchMenu: lunchMenu.split('\n').filter((m) => m.trim()),
      };

      const response = await fetch('http://localhost:3001/api/pipeline/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Pipeline result:', data);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = (demoKey: 'demo1' | 'demo2') => {
    const demo = DEMO_INPUTS[demoKey];
    setEmployees(demo.input.employees.join('\n'));
    setLunchMenu(demo.input.lunchMenu.join('\n'));
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔒 Zero Trust Lunch</h1>
        <p>Multi-agent pipeline for secure lunch ordering with Azure AI Foundry</p>
      </header>

      <main className="main">
        <div className="demo-buttons">
          <button onClick={() => loadDemo('demo1')} className="demo-btn">
            Load Demo 1: Safe Order
          </button>
          <button onClick={() => loadDemo('demo2')} className="demo-btn">
            Load Demo 2: High-Risk Order
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="employees">
              Employee List (one per line):
            </label>
            <textarea
              id="employees"
              value={employees}
              onChange={(e) => setEmployees(e.target.value)}
              rows={8}
              placeholder="Alice Johnson&#10;Bob Smith&#10;Carol White"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lunchMenu">
              Lunch Menu Items (one per line):
            </label>
            <textarea
              id="lunchMenu"
              value={lunchMenu}
              onChange={(e) => setLunchMenu(e.target.value)}
              rows={8}
              placeholder="Grilled chicken salad&#10;Quinoa bowl&#10;Fresh fruit platter"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Running Pipeline...' : 'Run Pipeline'}
          </button>
        </form>

        {error && (
          <div className="error">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="results">
            <h2>Pipeline Results</h2>

            <div className="result-section">
              <h3>👥 Step 1: Employee Normalization</h3>
              <p>
                Normalized {result.employee.normalizedEmployees.length}{' '}
                employees
              </p>
              <ul>
                {result.employee.normalizedEmployees.map((emp, idx) => (
                  <li key={idx}>{emp}</li>
                ))}
              </ul>
            </div>

            <div className="result-section">
              <h3>🏥 Step 2: HR Risk Assessment</h3>
              <div className={`risk-badge risk-${result.hr.riskLevel}`}>
                Risk Level: {result.hr.riskLevel.toUpperCase()}
              </div>
              <div className="subsection">
                <h4>Reasons:</h4>
                <ul>
                  {result.hr.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="subsection">
                <h4>Sanitized Menu:</h4>
                <ul>
                  {result.hr.sanitizedMenu.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              {result.hr.threadId && (
                <p className="detail">Thread ID: {result.hr.threadId}</p>
              )}
              {result.hr.runId && (
                <p className="detail">Run ID: {result.hr.runId}</p>
              )}
            </div>

            <div className="result-section">
              <h3>💰 Step 3: Finance Review</h3>
              <p>
                Total Cost: <strong>${result.finance.totalCost}</strong>
              </p>
              <p>
                Budget: <strong>${result.finance.budget}</strong>
              </p>
              <p>
                Cost per Person: <strong>${result.finance.costPerPerson}</strong>
              </p>
              <div
                className={`budget-status ${
                  result.finance.withinBudget ? 'within' : 'exceeded'
                }`}
              >
                {result.finance.withinBudget
                  ? '✅ Within Budget'
                  : '⚠️ Budget Exceeded'}
              </div>
            </div>

            <div className="result-section">
              <h3>👔 Step 4: Manager Decision</h3>
              <div
                className={`decision ${
                  result.manager.approved ? 'approved' : 'rejected'
                }`}
              >
                {result.manager.approved ? '✅ APPROVED' : '❌ REJECTED'}
              </div>
              <p className="message">{result.manager.message}</p>
              <p className="final-decision">{result.manager.finalDecision}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
