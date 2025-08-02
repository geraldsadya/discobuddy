export interface IntentResult {
  label: 'in' | 'out' | 'ambiguous'
  confidence: number
  reason?: string
}

export function classifyIntent(query: string): IntentResult {
  const s = query.toLowerCase()
  
  // 1️⃣ Discovery-related patterns FIRST (higher priority)
  const discoveryPatterns = [
    /\bdiscovery\b/i,
    /\bvitality\b/i,
    /\bkeycare\b/i,
    /\bplan\b/i,
    /\bclaim\b/i,
    /\bbenefit\b/i,
    /\bmiles\b/i,
    /\bintegrator\b/i,
    /\bbank\b/i,
    /\blife\b/i,
    /\binsure\b/i,
    /\bmedical\s+scheme\b/i,
    /\bhealth\s+cover\b/i,
    /\bgp\b|\bdoctor\b/i,
    /\bconsultation\b/i,
    /\bpremium\b/i,
    /\bcontribution\b/i,
    /\bwaiting\s+period\b/i,
    /\blate\s+joiner\b/i,
    /\bpersonal\s+health\s+pathways\b/i,
    /\bhealthyfood\b/i,
    /\bhealthycare\b/i,
    /\bhealthybaby\b/i,
    /\bactive\s+gear\b/i,
    /\bvirgin\s+active\b/i,
    /\bplanet\s+fitness\b/i,
    /\bster\s+kinekor\b/i,
    /\bclicks\b/i,
    /\bdis\s+chem\b/i,
    /\bwoolworths\b/i,
    /\bcheckers\b/i
  ]
  
  // Check for Discovery-related patterns FIRST
  for (const pattern of discoveryPatterns) {
    if (pattern.test(s)) {
      return {
        label: 'in',
        confidence: 0.9,
        reason: 'Contains Discovery-related terms'
      }
    }
  }
  
  // 2️⃣ Out-of-scope patterns (lower priority)
  const outPatterns = [
    /\bworld cup\b|\bscore\b|\bfixture\b|\briddle\b|\bprime\b|\b2\+2\b|\bbitcoin\b|\betf\b|\bcapitec\b|\bozempic\b|\bdose\b|\blawsuit\b|\bpolitics\b|\bheadline\b/i,
    /\bweather\b|\btemperature\b|\bforecast\b/i,
    /\brecipe\b|\bcooking\b|\bfood\b(?!\s+(benefit|plan|cover))/i,
    /\btravel\b(?!\s+(benefit|plan|cover))/i,
    /\bsports\b(?!\s+(benefit|plan|cover))/i,
    /\bentertainment\b|\bmovie\b|\bshow\b/i,
    /\bnews\b|\bcurrent\s+events\b/i,
    /\bmath\b|\bcalculation\b|\bcalculator\b/i,
    /\bcode\b|\bprogramming\b|\bsoftware\b/i
  ]
  
  // Check for out-of-scope patterns SECOND
  for (const pattern of outPatterns) {
    if (pattern.test(s)) {
      return {
        label: 'out',
        confidence: 0.9,
        reason: 'Contains out-of-scope topic'
      }
    }
  }
  
  // Check for potential jailbreak attempts
  const jailbreakPatterns = [
    /\bignore\s+(instructions|rules)\b/i,
    /\bpretend\s+to\s+be\b/i,
    /\bact\s+as\b/i,
    /\bbypass\b/i,
    /\boverride\b/i,
    /\bdisregard\b/i,
    /\bforget\b/i
  ]
  
  for (const pattern of jailbreakPatterns) {
    if (pattern.test(s)) {
      return {
        label: 'out',
        confidence: 0.95,
        reason: 'Potential jailbreak attempt'
      }
    }
  }
  
  // Default to ambiguous
  return {
    label: 'ambiguous',
    confidence: 0.5,
    reason: 'No clear Discovery or out-of-scope indicators'
  }
}

export function isOutOfScope(intent: IntentResult): boolean {
  return intent.label === 'out'
}

export function isUnsafe(query: string): boolean {
  const s = query.toLowerCase()
  
  // Check for potentially harmful content
  const unsafePatterns = [
    /\bkill\b|\bmurder\b|\bharm\b|\bviolence\b/i,
    /\bhack\b|\bexploit\b|\bbreach\b/i,
    /\bpersonal\s+information\b|\bprivate\s+data\b/i,
    /\bcredit\s+card\b|\bpassword\b|\bpin\b/i
  ]
  
  return unsafePatterns.some(pattern => pattern.test(s))
}

export function getClarifierQuestion(): string {
  const clarifiers = [
    "Which Discovery product or service are you asking about? (e.g., Vitality, KeyCare, medical scheme)",
    "Could you please specify which Discovery benefit or plan you're interested in?",
    "Are you asking about Discovery Health, Discovery Life, or another Discovery product?"
  ]
  
  return clarifiers[Math.floor(Math.random() * clarifiers.length)]
} 