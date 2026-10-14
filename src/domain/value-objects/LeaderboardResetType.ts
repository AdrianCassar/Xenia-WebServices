// StatsView resetType defined in XLast.
// Titles without XLast default to Never.
export enum LeaderboardResetType {
  Never = 'Never',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export function parseLeaderboardResetType(
  value: string | undefined,
): LeaderboardResetType {
  const reset_type = Object.values(LeaderboardResetType).find(
    (type) => type.toLowerCase() === value?.toLowerCase(),
  );

  return reset_type ?? LeaderboardResetType.Never;
}

// Start of the next leaderboard period in UTC, null if it never resets.
//
// Weekly leaderboards reset on Monday 00:00 UTC.
// Monthly leaderboards reset on the 1st of the month 00:00 UTC.
export function getNextLeaderboardReset(
  reset_type: LeaderboardResetType,
  now: Date = new Date(),
): Date | null {
  switch (reset_type) {
    case LeaderboardResetType.Weekly: {
      const days_until_monday = (8 - now.getUTCDay()) % 7 || 7;

      return new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + days_until_monday,
        ),
      );
    }
    case LeaderboardResetType.Monthly: {
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    }
    case LeaderboardResetType.Never:
    default:
      return null;
  }
}
