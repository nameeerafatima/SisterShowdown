export type DailyLog = {
  workoutMinutes: number;
  steps: number;
  fruit: string;
  vegetable: string;
  dessert: string;
  junkFood: string;
  waterMl: number;
  sleepHours: number;
};

export const emptyDailyLog: DailyLog = {
  workoutMinutes: 0,
  steps: 0,
  fruit: "",
  vegetable: "",
  dessert: "",
  junkFood: "",
  waterMl: 0,
  sleepHours: 0,
};

export const DAILY_LOG_STORAGE_KEY = "sister-showdown-daily-log";

export function calculateWorkoutPoints(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Number(((minutes / 60) * 3).toFixed(1));
}

export function calculateStepPoints(steps: number) {
  if (!Number.isFinite(steps) || steps <= 0) return 0;
  return Math.floor(steps / 1000);
}

export function calculateFruitPoints(fruit: string | null | undefined) {
  return fruit && fruit.trim() ? 1 : 0;
}

export function calculateVegetablePoints(vegetable: string | null | undefined) {
  return vegetable && vegetable.trim() ? 1 : 0;
}

export function calculateDessertPoints(dessert: string | null | undefined) {
  return dessert && dessert.trim() ? -2 : 0;
}

export function calculateJunkFoodPoints(junkFood: string | null | undefined) {
  return junkFood && junkFood.trim() ? -1 : 0;
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

  return Number(
    (
      workoutPoints +
      stepPoints +
      fruitPoints +
      vegetablePoints +
      dessertPoints +
      junkFoodPoints +
      waterPoints +
      sleepPoints
    ).toFixed(1),
  );
}

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
