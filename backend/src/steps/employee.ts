import { PipelineInput, EmployeeStepResult } from '../types';

/**
 * Employee Step: Normalize the employee list
 * - Trim whitespace
 * - Remove duplicates
 * - Filter empty entries
 */
export function employeeStep(input: PipelineInput): EmployeeStepResult {
  const normalizedEmployees = Array.from(
    new Set(
      input.employees
        .map((emp) => emp.trim())
        .filter((emp) => emp.length > 0)
    )
  );

  return {
    normalizedEmployees,
  };
}
