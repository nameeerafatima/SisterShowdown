export const competition = {
  name: "December Wedding War",
  daysLeft: 72,
  leaderboard: {
    you: 487,
    sister: 472,
    streakYou: 6,
    streakSister: 4,
  },
  leadMessage: "You're 15 points behind 👀",
};

export const dailyHabits = [
  {
    id: "workout",
    label: "Workout",
    emoji: "🏋️",
    points: 3,
    completed: true,
    detail: "Workout complete",
  },
  {
    id: "steps",
    label: "Steps",
    emoji: "🚶",
    points: 7,
    completed: false,
    detail: "7,432 steps = 7 points",
  },
  {
    id: "fruit",
    label: "Fruit",
    emoji: "🍏",
    points: 1,
    completed: true,
    detail: "Fruit logged",
  },
  {
    id: "vegetable",
    label: "Vegetable",
    emoji: "🥦",
    points: 1,
    completed: true,
    detail: "Vegetable logged",
  },
  {
    id: "dessert",
    label: "Dessert",
    emoji: "🍰",
    points: -2,
    completed: false,
    detail: "-2 if logged",
  },
  {
    id: "junk-food",
    label: "Junk Food",
    emoji: "🍟",
    points: -1,
    completed: false,
    detail: "-1 if logged",
  },
  {
    id: "water",
    label: "Water",
    emoji: "💧",
    points: 1,
    completed: false,
    detail: "1.5L / 3.0L",
  },
  {
    id: "sleep",
    label: "Sleep",
    emoji: "😴",
    points: 1,
    completed: true,
    detail: "7h 32m",
  },
];

export const weeklyChallenges = [
  {
    title: "10K Step Battle",
    emoji: "🚶",
    description: "Hit 10,000 steps on as many days as possible this week.",
    you: "4 / 7",
    sister: "5 / 7",
    bonus: 10,
  },
  {
    title: "Gym Warrior",
    emoji: "🏋️",
    description: "Complete 4 workouts this week.",
    you: "3 / 4",
    sister: "4 / 4",
    bonus: 10,
  },
  {
    title: "No Delivery",
    emoji: "🚫",
    description: "Go 7 days without ordering food delivery.",
    you: "3 / 7",
    sister: "2 / 7",
    bonus: 10,
  },
];

export const activityFeed = [
  { emoji: "🔥", text: "Your sister completed a workout", points: "+3 points" },
  { emoji: "🚶", text: "You logged 7,432 steps", points: "+7 points" },
  { emoji: "🍏", text: "You logged fruit", points: "+1 point" },
  { emoji: "🍰", text: "Dessert was logged", points: "-2 points" },
  { emoji: "🏆", text: "Your sister won the weekly challenge", points: "+10 points" },
  { emoji: "🔥", text: "You reached a 7-day streak", points: "+1 badge" },
];

export const rewards = [
  { name: "Weekly Reward", detail: "Coffee paid for by loser", status: "Locked", type: "weekly" },
  { name: "Monthly Reward", detail: "₹1,000 Glow-Up Budget", status: "Locked", type: "monthly" },
  { name: "Final Reward", detail: "Wedding Glow-Up • ₹5,000", status: "Current leader: You", type: "final" },
];

export const badges = [
  { icon: "🔥", name: "3 Day Streak" },
  { icon: "🔥", name: "7 Day Streak" },
  { icon: "🏋️", name: "First Workout" },
  { icon: "🚶", name: "10K Steps" },
  { icon: "💧", name: "Hydration Hero" },
  { icon: "🏆", name: "First Weekly Win" },
  { icon: "👑", name: "3 Weekly Wins" },
  { icon: "⚔️", name: "Comeback Queen" },
];
