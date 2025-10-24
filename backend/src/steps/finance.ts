import { EmployeeStepResult, FinanceStepResult } from '../types';

/**
 * Finance Step: Calculate cost and compare against budget
 */
export function financeStep(
  employeeResult: EmployeeStepResult
): FinanceStepResult {
  const headcount = employeeResult.normalizedEmployees.length;
  const budgetPerPerson = Number(process.env.LUNCH_BUDGET_PER_PERSON) || 15;
  const totalBudget = Number(process.env.HEADCOUNT) * budgetPerPerson;

  const totalCost = headcount * budgetPerPerson;
  const withinBudget = totalCost <= totalBudget;

  return {
    totalCost,
    budget: totalBudget,
    withinBudget,
    costPerPerson: budgetPerPerson,
  };
}
