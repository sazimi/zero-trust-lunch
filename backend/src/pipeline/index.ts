import { PipelineInput, PipelineResult } from '../types';
import { employeeStep } from '../steps/employee';
import { hrStep } from '../steps/hr';
import { financeStep } from '../steps/finance';
import { managerStep } from '../steps/manager';

/**
 * Main pipeline that orchestrates all 4 steps
 */
export async function runPipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  // Step 1: Employee - Normalize employee list
  const employeeResult = employeeStep(input);

  // Step 2: HR - Assess menu with Azure AI Foundry agent
  const hrResult = await hrStep(input);

  // Step 3: Finance - Calculate costs
  const financeResult = financeStep(employeeResult);

  // Step 4: Manager - Make final decision
  const managerResult = managerStep(hrResult, financeResult);

  return {
    employee: employeeResult,
    hr: hrResult,
    finance: financeResult,
    manager: managerResult,
  };
}
