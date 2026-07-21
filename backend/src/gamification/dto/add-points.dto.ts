import { IsInt, IsString, IsUUID, MaxLength, Min, Max } from 'class-validator';

/**
 * Bounds for the admin-only points grant.
 *
 * This endpoint used to be callable by ANY logged-in user and awarded to
 * `req.user.id` — i.e. a self-service XP faucet: `{ points: 999999999 }` would
 * top the leaderboard and unlock every badge via checkBadges(). It is now
 * admin-gated, and the amount is validated/bounded here as defence in depth
 * (the body was an inline TS type before, which the global ValidationPipe
 * cannot see, so nothing was validated at all).
 */
export class AddPointsDto {
  /** Who receives the points. Declared here so forbidNonWhitelisted accepts it. */
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(-10000)
  @Max(10000)
  points: number;

  @IsString()
  @MaxLength(200)
  reason: string;
}
