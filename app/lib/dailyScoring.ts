export type DailyLog = {
  logDate: string;
  dayCheckedIn: boolean;
  workoutMinutes: number;
  steps: number;
  fruit: string;
  vegetable: string;
  dessert: string;
  junkFood: string;
  waterMl: number;
  sleepHours: number;
  dineOut: boolean;
  delivery: boolean;
};

export const emptyDailyLog: DailyLog = {
  logDate: new Date().toISOString().slice(0, 10),
  dayCheckedIn: false,
  workoutMinutes: 0,
  steps: 0,
  fruit: "",
  vegetable: "",
  dessert: "",
  junkFood: "",
  waterMl: 0,
  sleepHours: 0,
  dineOut: false,
  delivery: false,
};

export const DAILY_LOG_STORAGE_KEY = "sister-showdown-daily-log";
export const DAILY_LOG_HISTORY_STORAGE_KEY = "sister-showdown-daily-log-history";

export function calculateWorkoutPoints(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  if (minutes < 60) return 1;
  if (minutes <= 120) return 2;
  return 3;
}

export function getWorkoutDurationLabel(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  if (minutes < 60) return "Less than 1 hour";
  if (minutes <= 120) return "1 to 2 hours";
  return "More than 2 hours";
}

export function calculateStepPoints(steps: number) {
  if (!Number.isFinite(steps) || steps <= 0) return 0;
  return Number((steps / 1000).toFixed(1));
}

export function calculateFruitPoints(fruit: string | null | undefined) {
  return fruit?.split(",").filter((item) => item.trim()).length ?? 0;
}

export function calculateVegetablePoints(vegetable: string | null | undefined) {
  return vegetable?.split(",").filter((item) => item.trim()).length ?? 0;
}

export function calculateDessertPoints(dessert: string | null | undefined) {
  return dessert && dessert.trim() ? -2 : 0;
}

export function calculateJunkFoodPoints(junkFood: string | null | undefined) {
  return junkFood && junkFood.trim() ? -1 : 0;
}

export function calculateDineOutPoints(dineOut: boolean) {
  return dineOut ? -1 : 0;
}

export function calculateDeliveryPoints(delivery: boolean) {
  return delivery ? -1 : 0;
}

export function calculateWaterPoints(waterMl: number) {
  if (!Number.isFinite(waterMl) || waterMl <= 0) return 0;
  return waterMl >= 3000 ? 1 : 0;
}

export function calculateSleepPoints(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  if (hours < 6) return -1;
  if (hours >= 6 && hours <= 8) return 2;
  return 1;
}

export function calculateDailyScore(log: DailyLog) {
  const workoutPoints = calculateWorkoutPoints(log.workoutMinutes);
  const stepPoints = calculateStepPoints(log.steps);
  const fruitPoints = calculateFruitPoints(log.fruit);
  const vegetablePoints = calculateVegetablePoints(log.vegetable);
  const dessertPoints = calculateDessertPoints(log.dessert);
  const junkFoodPoints = calculateJunkFoodPoints(log.junkFood);
  const waterPoints = calculateWaterPoints(log.waterMl);
  const sleepPoints = calculateSleepPoints(log.sleepHours);
  const dineOutPoints = calculateDineOutPoints(log.dineOut);
  const deliveryPoints = calculateDeliveryPoints(log.delivery);

  return Number(
    (
      workoutPoints +
      stepPoints +
      fruitPoints +
      vegetablePoints +
      dessertPoints +
      junkFoodPoints +
      waterPoints +
      sleepPoints +
      dineOutPoints +
      deliveryPoints
    ).toFixed(1),
  );
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previousDate(date: string) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() - 1);
  return dateKey(value);
}

export function calculateStreak(logs: DailyLog[], qualifies: (log: DailyLog) => boolean) {
  const byDate = new Map(logs.map((log) => [log.logDate, log]));
  let date = dateKey(new Date());
  let streak = 0;

  while (true) {
    const log = byDate.get(date);
    if (!log || !log.dayCheckedIn || !qualifies(log)) return streak;
    streak += 1;
    date = previousDate(date);
  }
}

export const streakRules = {
  workout: (log: DailyLog) => log.workoutMinutes > 0,
  noDessert: (log: DailyLog) => !log.dessert.trim(),
  noDelivery: (log: DailyLog) => !log.delivery,
  steps: (log: DailyLog) => log.steps >= 10000,
};

export function formatPoints(value: number) {
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(1);
}

export function getLeadMessage(userScore: number, sisterScore: number) {
  const difference = userScore - sisterScore;

  if (difference > 0) {
    return `You're leading by ${formatPoints(difference)} points 🔥`;
  }

  if (difference < 0) {
    return `You're ${formatPoints(Math.abs(difference))} points behind 👀`;
  }

  return "It's a tie! ⚖️";
}
