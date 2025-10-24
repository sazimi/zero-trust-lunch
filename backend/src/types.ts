export interface PipelineInput {
  employees: string[];
  lunchMenu: string[];
}

export interface EmployeeStepResult {
  normalizedEmployees: string[];
}

export interface HRStepResult {
  sanitizedMenu: string[];
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  threadId?: string;
  runId?: string;
}

export interface FinanceStepResult {
  totalCost: number;
  budget: number;
  withinBudget: boolean;
  costPerPerson: number;
}

export interface ManagerStepResult {
  approved: boolean;
  message: string;
  finalDecision: string;
}

export interface PipelineResult {
  employee: EmployeeStepResult;
  hr: HRStepResult;
  finance: FinanceStepResult;
  manager: ManagerStepResult;
}
