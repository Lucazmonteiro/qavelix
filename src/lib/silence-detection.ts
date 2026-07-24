export const silenceNoiseThreshold = "-50dB";
export const silenceMinimumDurationSeconds = 0.5;
export const completeSilenceToleranceSeconds = 0.35;

type SilenceInterval = {
  start: number;
  end: number;
};

function parseSilenceIntervals(stderr: string, totalDurationSeconds: number) {
  const intervals: SilenceInterval[] = [];
  let openStart: number | null = null;

  for (const line of stderr.split(/\r?\n/)) {
    const startMatch = line.match(/silence_start:\s*([0-9.]+)/);
    const endMatch = line.match(/silence_end:\s*([0-9.]+)/);

    if (startMatch?.[1]) {
      openStart = Number(startMatch[1]);
    }

    if (endMatch?.[1] && openStart !== null) {
      const start = Math.max(0, openStart);
      const end = Math.min(totalDurationSeconds, Number(endMatch[1]));

      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        intervals.push({ start, end });
      }

      openStart = null;
    }
  }

  if (openStart !== null) {
    const start = Math.max(0, openStart);

    if (start < totalDurationSeconds) {
      intervals.push({ start, end: totalDurationSeconds });
    }
  }

  return intervals;
}

function getCoveredSilenceSeconds(intervals: SilenceInterval[]) {
  const sortedIntervals = [...intervals].sort((first, second) => first.start - second.start);
  let coveredSeconds = 0;
  let current: SilenceInterval | null = null;

  for (const interval of sortedIntervals) {
    if (!current) {
      current = { ...interval };
      continue;
    }

    if (interval.start <= current.end) {
      current.end = Math.max(current.end, interval.end);
      continue;
    }

    coveredSeconds += current.end - current.start;
    current = { ...interval };
  }

  if (current) {
    coveredSeconds += current.end - current.start;
  }

  return coveredSeconds;
}

export function summarizeSilenceCoverageFromStderr(
  stderr: string,
  totalDurationSeconds: number,
) {
  const silenceIntervals = parseSilenceIntervals(stderr, totalDurationSeconds);
  const silentSeconds = getCoveredSilenceSeconds(silenceIntervals);
  const audibleSeconds = Math.max(0, totalDurationSeconds - silentSeconds);
  const isSilent =
    silentSeconds >= totalDurationSeconds - completeSilenceToleranceSeconds;

  return {
    isSilent,
    silentSeconds,
    audibleSeconds,
    durationSeconds: totalDurationSeconds,
    threshold: silenceNoiseThreshold,
    minimumSilenceDurationSeconds: silenceMinimumDurationSeconds,
    toleranceSeconds: completeSilenceToleranceSeconds,
  };
}
