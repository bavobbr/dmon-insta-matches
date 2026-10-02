export interface SchedulerConfig {
  enabled: boolean;
  dayOfWeek: number; // 5 = Friday
  timeOfDay: string; // "10:00"
  skipIfNoMatches: boolean;
  notifyOnSkip: boolean;
  lastRunTimestamp?: string;
  lastRunStatus?: 'success' | 'skipped' | 'failed';
  lastRunMessage?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  triggerType: 'scheduled_weekly' | 'manual_test';
  homeMatchesCount: number;
  decision: 'POSTED' | 'SKIPPED_NO_MATCHES' | 'FAILED_AUTH' | 'PREVIEW_GENERATED';
  details: string;
  graphicUrl?: string;
  instagramPostId?: string;
}
