export const RESUME_FREE_PERIOD_DAYS = 3;

const KOLKATA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const getKolkataDate = (date = new Date()) => new Date(date.getTime() + KOLKATA_OFFSET_MS);

const getIndiaDayIndex = (date = new Date()) => {
  const indiaDate = getKolkataDate(date);
  return Math.floor(
    Date.UTC(indiaDate.getUTCFullYear(), indiaDate.getUTCMonth(), indiaDate.getUTCDate()) / DAY_MS
  );
};

const getResumePeriodStartDayIndex = (date = new Date()) =>
  Math.floor(getIndiaDayIndex(date) / RESUME_FREE_PERIOD_DAYS) * RESUME_FREE_PERIOD_DAYS;

export const getMsUntilIndiaMidnight = (date = new Date()) => {
  const indiaDate = getKolkataDate(date);
  const nextIndiaMidnightUtc =
    Date.UTC(indiaDate.getUTCFullYear(), indiaDate.getUTCMonth(), indiaDate.getUTCDate() + 1) -
    KOLKATA_OFFSET_MS;

  return Math.max(0, nextIndiaMidnightUtc - date.getTime());
};

export const getMsUntilNextResumeReset = (date = new Date()) => {
  const nextPeriodStartDayIndex = getResumePeriodStartDayIndex(date) + RESUME_FREE_PERIOD_DAYS;
  const nextPeriodStartUtc = nextPeriodStartDayIndex * DAY_MS - KOLKATA_OFFSET_MS;

  return Math.max(0, nextPeriodStartUtc - date.getTime());
};

export const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
};
