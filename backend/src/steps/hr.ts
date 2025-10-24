import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import { PipelineInput, HRStepResult } from '../types';

/**
 * HR Step: Use Azure AI Foundry agent to assess lunch menu safety
 * Returns sanitized menu, risk level, reasons, threadId, and runId
 */
export async function hrStep(input: PipelineInput): Promise<HRStepResult> {
  try {
    const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT;
    const agentId = process.env.AZURE_AI_AGENT_ID;

    if (!endpoint || !agentId) {
      console.warn('Azure AI configuration not found, using fallback logic');
      return fallbackHRStep(input);
    }

    // Initialize Azure AI Projects client
    const credential = new DefaultAzureCredential();
    const client = new AIProjectClient(endpoint, credential);

    // Create a thread for the conversation
    const thread = await client.agents.threads.create();
    
    // Create a message with the lunch menu for analysis
    const menuText = input.lunchMenu.join(', ');
    await client.agents.messages.create(
      thread.id,
      'user',
      `Analyze this lunch menu for potential allergens, dietary restrictions, and health risks: ${menuText}. Provide a risk assessment (low, medium, or high) and list any concerns.`
    );

    // Run the agent
    const run = await client.agents.runs.create(thread.id, agentId);

    // Wait for completion
    let runStatus = await client.agents.runs.get(thread.id, run.id);
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.agents.runs.get(thread.id, run.id);
    }

    // Get the response
    const messagesList = client.agents.messages.list(thread.id);
    const messages = [];
    for await (const message of messagesList) {
      messages.push(message);
    }
    const assistantMessage = messages.find((m: any) => m.role === 'assistant');
    
    // Parse the response (simplified for demo)
    const textContent = assistantMessage?.content[0];
    const response = textContent && 'text' in textContent ? textContent.text.value : '';
    const riskLevel = response.toLowerCase().includes('high') ? 'high' 
                    : response.toLowerCase().includes('medium') ? 'medium' 
                    : 'low';
    
    const reasons: string[] = [];
    if (response.toLowerCase().includes('allergen')) reasons.push('Contains potential allergens');
    if (response.toLowerCase().includes('dietary')) reasons.push('Dietary restriction concerns');
    if (response.toLowerCase().includes('health')) reasons.push('Health risk identified');
    
    return {
      sanitizedMenu: input.lunchMenu.filter(item => !item.toLowerCase().includes('peanut')),
      riskLevel: riskLevel as 'low' | 'medium' | 'high',
      reasons: reasons.length > 0 ? reasons : ['Menu appears safe'],
      threadId: thread.id,
      runId: run.id
    };
  } catch (error) {
    console.error('Error in HR step with Azure AI:', error);
    return fallbackHRStep(input);
  }
}

/**
 * Fallback HR logic when Azure AI is not available
 */
function fallbackHRStep(input: PipelineInput): HRStepResult {
  const lowerMenu = input.lunchMenu.map(item => item.toLowerCase());
  const risks: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check for common allergens
  const allergens = ['peanut', 'shellfish', 'dairy', 'gluten', 'soy', 'egg'];
  const foundAllergens = allergens.filter(allergen => 
    lowerMenu.some(item => item.includes(allergen))
  );

  if (foundAllergens.length > 0) {
    risks.push(`Contains allergens: ${foundAllergens.join(', ')}`);
    riskLevel = foundAllergens.length > 2 ? 'high' : 'medium';
  }

  // Check for unhealthy items
  const unhealthy = ['fried', 'processed', 'high-sodium'];
  const foundUnhealthy = unhealthy.filter(term => 
    lowerMenu.some(item => item.includes(term))
  );

  if (foundUnhealthy.length > 2) {
    risks.push('Multiple unhealthy items detected');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  // Sanitize menu by removing high-risk items
  const sanitizedMenu = input.lunchMenu.filter(item => 
    !item.toLowerCase().includes('peanut') &&
    !item.toLowerCase().includes('shellfish')
  );

  return {
    sanitizedMenu,
    riskLevel,
    reasons: risks.length > 0 ? risks : ['Menu appears safe'],
  };
}
