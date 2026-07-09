/**
 * DI token for the weekly-digest job. Kept in its own dependency-free file so the
 * scheduler (which owns the token) and the digest module (which provides it) can
 * both import it without forming an import cycle — a cycle here caused a runtime
 * "Cannot access 'WeeklyDigestRunner' before initialization" TDZ error.
 */
export abstract class WeeklyDigestRunner {
  abstract runWeeklyDigest(): Promise<void>;
}
