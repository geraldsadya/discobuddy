export interface TelemetryEvent {
  timestamp: string;
  sessionId: string;
  question: string;
  kb_confidence: number;
  tip_appended: boolean;
  response_time_ms: number;
  profile_context_used: string;
  error?: string;
}

export function logTelemetry(event: TelemetryEvent) {
  // In production, send to proper telemetry service
  console.log('📊 Telemetry:', {
    ...event,
    profile_context_used: event.profile_context_used.substring(0, 100) + '...' // Truncate for logging
  });
}

export function createTelemetryEvent(
  sessionId: string | undefined,
  userMessage: string,
  detectedLanguage: string,
  intent: { label: string; confidence: number; reason?: string },
  refused: boolean,
  documentsUsed: string[],
  responseLength: number,
  searchQuality: { totalHits: number; topScore: number; hasGoodQuality: boolean },
  processingTime: number,
  error?: string,
  channel?: string
): TelemetryEvent {
  return {
    sessionId,
    timestamp: new Date().toISOString(),
    userMessage,
    detectedLanguage,
    intent,
    refused,
    documentsUsed,
    responseLength,
    searchQuality,
    processingTime,
    error,
    channel
  }
} 