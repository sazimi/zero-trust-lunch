import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import { PipelineInput, HRStepResult } from '../types';

/**
 * Validates Azure credentials and configuration
 */
async function validateAzureCredentials(credential: DefaultAzureCredential): Promise<boolean> {
  try {
    const tokenResponse = await credential.getToken('https://management.azure.com/.default');
    return !!tokenResponse?.token;
  } catch (error) {
    console.error('Failed to validate Azure credentials:', error);
    return false;
  }
}

/**
 * Checks if item contains prohibited tobacco products
 */
function containsTobacco(item: string): boolean {
  const itemLower = item.toLowerCase();
  const tobaccoKeywords = ['tobacco', 'cigarette', 'cigar', 'vape', 'smoking', 'nicotine'];
  return tobaccoKeywords.some(keyword => itemLower.includes(keyword));
}

/**
 * Checks if item contains prohibited hard liquor
 */
function containsHardLiquor(item: string): boolean {
  const itemLower = item.toLowerCase();
  const hardLiquors = ['vodka', 'whiskey', 'rum', 'gin', 'tequila', 'brandy', 'cognac', 'bourbon', 'scotch', 'liqueur'];
  return hardLiquors.some(liquor => itemLower.includes(liquor));
}

/**
 * Checks if item contains allowed alcohol (beer, wine, champagne)
 */
function containsAllowedAlcohol(item: string): boolean {
  const itemLower = item.toLowerCase();
  const allowedAlcohol = ['beer', 'wine', 'champagne', 'sparkling wine', 'prosecco', 'lager', 'ale'];
  return allowedAlcohol.some(alcohol => itemLower.includes(alcohol));
}

/**
 * Checks if item contains major allergens
 */
function containsMajorAllergens(item: string): boolean {
  const itemLower = item.toLowerCase();
  const majorAllergens = ['peanut', 'shellfish', 'tree nut'];
  return majorAllergens.some(allergen => itemLower.includes(allergen));
}

/**
 * Checks if menu has inclusivity options
 */
function checkInclusivity(menu: string[]): { hasVegetarian: boolean; isPorkHeavy: boolean } {
  const menuText = menu.join(' ').toLowerCase();
  
  const hasVegetarian = menuText.includes('vegetarian') || menuText.includes('vegan') || 
                       menuText.includes('salad') || menuText.includes('veggie');
  
  const porkCount = (menuText.match(/pork|bacon|ham|sausage/g) || []).length;
  const totalItems = menu.length;
  const isPorkHeavy = porkCount > totalItems * 0.5; // More than 50% pork items
  
  return { hasVegetarian, isPorkHeavy };
}

/**
 * Parses AI response to determine risk level
 */
function parseRiskLevel(response: string): 'low' | 'medium' | 'high' {
  const responseLower = response.toLowerCase();
  
  // High risk: tobacco, hard liquor, major allergens
  if (responseLower.includes('tobacco') || responseLower.includes('hard liquor') ||
      responseLower.includes('peanut') || responseLower.includes('shellfish') ||
      responseLower.includes('high risk') || responseLower.includes('dangerous')) {
    return 'high';
  }
  
  // Medium risk: inclusivity issues, other allergens
  if (responseLower.includes('medium risk') || responseLower.includes('moderate') ||
      responseLower.includes('inclusivity') || responseLower.includes('dietary restriction') ||
      responseLower.includes('allergen')) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Extracts risk reasons from AI response based on company policy
 */
function extractRiskReasons(response: string): string[] {
  const responseLower = response.toLowerCase();
  const reasons: string[] = [];
  
  // 🚫 Tobacco products (completely prohibited)
  if (responseLower.includes('tobacco') || responseLower.includes('cigarette') || 
      responseLower.includes('cigar') || responseLower.includes('vape') || responseLower.includes('smoking')) {
    reasons.push('🚫 Contains tobacco products (cigars, cigarettes, vapes) - not allowed');
  }
  
  // 🍷 Hard liquor (prohibited, but beer/wine allowed)
  if (responseLower.includes('vodka') || responseLower.includes('whiskey') || 
      responseLower.includes('rum') || responseLower.includes('tequila') || 
      responseLower.includes('gin') || responseLower.includes('brandy') || 
      responseLower.includes('liqueur') || responseLower.includes('hard liquor')) {
    reasons.push('🍷 Contains hard liquor - not allowed (beer, wine, champagne are permitted)');
  }
  
  // ⚠️ Major allergens
  if (responseLower.includes('peanut') || responseLower.includes('tree nut')) {
    reasons.push('⚠️ Contains nuts/peanuts - major allergen risk');
  }
  if (responseLower.includes('shellfish')) {
    reasons.push('⚠️ Contains shellfish - major allergen risk');
  }
  
  // Other allergen concerns
  if (responseLower.includes('gluten') && !responseLower.includes('gluten-free')) {
    reasons.push('⚠️ Contains gluten - dietary restriction concern');
  }
  if (responseLower.includes('dairy') || responseLower.includes('lactose')) {
    reasons.push('⚠️ Contains dairy/lactose - dietary restriction concern');
  }
  if (responseLower.includes('soy')) {
    reasons.push('⚠️ Contains soy - allergen concern');
  }
  if (responseLower.includes('egg')) {
    reasons.push('Contains eggs - allergen concern');
  }
  
  // 🫶 Inclusivity concerns
  if (responseLower.includes('pork') && responseLower.includes('only')) {
    reasons.push('🫶 Menu may exclude religious dietary restrictions (pork-heavy)');
  }
  if (!responseLower.includes('vegetarian') && !responseLower.includes('vegan')) {
    reasons.push('🫶 No vegetarian/vegan options identified - inclusivity concern');
  }
  
  return reasons;
}

/**
 * Sanitizes menu based on company policy rules
 */
function sanitizeMenuBasedOnPolicy(menu: string[]): { sanitizedMenu: string[]; violations: string[] } {
  const violations: string[] = [];
  
  const sanitizedMenu = menu.filter(item => {
    if (containsTobacco(item)) {
      violations.push(`🚫 Tobacco product removed: ${item}`);
      return false;
    }
    
    if (containsHardLiquor(item)) {
      violations.push(`🍷 Hard liquor removed: ${item}`);
      return false;
    }
    
    if (containsMajorAllergens(item)) {
      violations.push(`⚠️ Major allergen removed: ${item}`);
      return false;
    }
    
    return true;
  });
  
  return { sanitizedMenu, violations };
}

/**
 * Checks menu for inclusivity compliance
 */
function validateInclusivity(menu: string[]): string[] {
  const issues: string[] = [];
  const inclusivity = checkInclusivity(menu);
  
  if (!inclusivity.hasVegetarian) {
    issues.push('🫶 No vegetarian/vegan options available - consider adding plant-based choices');
  }
    
  if (inclusivity.isPorkHeavy) {
    issues.push('🫶 Menu is pork-heavy - may exclude religious dietary restrictions');
  }
  
  return issues;
}



/**
 * HR Step: Use Azure AI Foundry agent to assess lunch menu safety
 * Returns sanitized menu, risk level, reasons, threadId, and runId
 */
export async function hrStep(input: PipelineInput): Promise<HRStepResult> {
  try {
    const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT;
    const agentId = process.env.AZURE_AI_AGENT_ID;
    
    if (!endpoint || !agentId) {
      console.warn('Azure AI configuration missing, using fallback logic');
      return fallbackHRStep(input);
    }

    const credential = new DefaultAzureCredential();
    
    const isValidCredential = await validateAzureCredentials(credential);
    if (!isValidCredential) {
      console.error('Azure credential validation failed');
      return fallbackHRStep(input);
    }
    
    const client = new AIProjectClient(endpoint, credential);

    const thread = await client.agents.threads.create();
    
    const menuText = input.lunchMenu.join(', ');
    await client.agents.messages.create(
      thread.id,
      'user',
      `Analyze this lunch menu according to company policy: ${menuText}.
      
      Company Policy:
      1. 🚫 No tobacco products (cigars, cigarettes, vapes)
      2. 🍷 Alcohol: Beer/wine/champagne allowed, hard liquor prohibited
      3. 🫶 Inclusivity: Need vegetarian options, avoid pork-heavy menus
      4. ⚠️ Allergens: Flag major allergens (peanuts, shellfish)
      
      Provide a risk assessment (low, medium, or high) and list concerns.`
    );

    // Run the agent
    const run = await client.agents.runs.create(thread.id, agentId);
    console.log('Started agent run:', run.id);

    // Wait for completion with timeout and proper error handling
    let runStatus = await client.agents.runs.get(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    
    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.agents.runs.get(thread.id, run.id);
      attempts++;
      console.log(`Agent run status: ${runStatus.status} (attempt ${attempts}/${maxAttempts})`);
    }
    
    if (attempts >= maxAttempts) {
      console.error('Agent run timed out');
      return fallbackHRStep(input);
    }
    
    if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
      console.error('Agent run failed or was cancelled:', runStatus.status);
      return fallbackHRStep(input);
    }

    const messagesList = client.agents.messages.list(thread.id);
    const messages = [];
    for await (const message of messagesList) {
      messages.push(message);
    }
    
    const assistantMessages = messages.filter((m: any) => m.role === 'assistant');
    if (assistantMessages.length === 0) {
      return fallbackHRStep(input);
    }
    
    const textContent = assistantMessages[0]?.content?.[0];
    const response = textContent && 'text' in textContent ? textContent.text.value : '';
    
    if (!response) {
      return fallbackHRStep(input);
    }
    
    const riskLevel = parseRiskLevel(response);
    const aiReasons = extractRiskReasons(response);
    const { sanitizedMenu, violations } = sanitizeMenuBasedOnPolicy(input.lunchMenu);
    const inclusivityIssues = validateInclusivity(sanitizedMenu);
    
    const allReasons = [...aiReasons, ...violations, ...inclusivityIssues];
    const uniqueReasons = [...new Set(allReasons)];
    
    return {
      sanitizedMenu,
      riskLevel,
      reasons: uniqueReasons.length > 0 ? uniqueReasons : ['✅ Menu complies with company policy'],
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
  const { sanitizedMenu, violations } = sanitizeMenuBasedOnPolicy(input.lunchMenu);
  const inclusivityIssues = validateInclusivity(sanitizedMenu);
  
  const hasTobacco = input.lunchMenu.some(containsTobacco);
  const hasHardLiquor = input.lunchMenu.some(containsHardLiquor);
  const hasMajorAllergens = input.lunchMenu.some(containsMajorAllergens);
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (hasTobacco || hasMajorAllergens) riskLevel = 'high';
  else if (hasHardLiquor || inclusivityIssues.length > 0) riskLevel = 'medium';
  
  const allReasons = [...violations, ...inclusivityIssues];
  const uniqueReasons = [...new Set(allReasons)];

  return {
    sanitizedMenu,
    riskLevel,
    reasons: uniqueReasons.length > 0 ? uniqueReasons : ['✅ Menu complies with company policy'],
  };
}
