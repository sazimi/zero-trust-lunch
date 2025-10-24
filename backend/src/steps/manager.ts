import {
  HRStepResult,
  FinanceStepResult,
  ManagerStepResult,
} from '../types';

/**
 * Manager Step: Make final decision based on HR and Finance results
 * Block if risk level is high
 */
export function managerStep(
  hrResult: HRStepResult,
  financeResult: FinanceStepResult
): ManagerStepResult {
  const isHighRisk = hrResult.riskLevel === 'high';
  const overBudget = !financeResult.withinBudget;

  let approved = true;
  let message = '';
  let finalDecision = '';

  if (isHighRisk) {
    approved = false;
    message = `BLOCKED: High risk level detected in lunch menu. Reasons: ${hrResult.reasons.join(', ')}`;
    finalDecision = 'Lunch order rejected due to high health/safety risk';
  } else if (overBudget) {
    approved = false;
    message = `BLOCKED: Budget exceeded. Total cost: $${financeResult.totalCost}, Budget: $${financeResult.budget}`;
    finalDecision = 'Lunch order rejected due to budget constraints';
  } else if (hrResult.riskLevel === 'medium') {
    approved = true;
    message = `APPROVED with caution: Medium risk detected. ${hrResult.reasons.join(', ')}. Please review sanitized menu.`;
    finalDecision = 'Lunch order approved with caution - please review the sanitized menu';
  } else {
    approved = true;
    message = `APPROVED: All checks passed. Cost: $${financeResult.totalCost} within budget of $${financeResult.budget}`;
    finalDecision = 'Lunch order fully approved';
  }

  return {
    approved,
    message,
    finalDecision,
  };
}
