"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { LogModal } from "@/app/components/LogModal";
import { calculateDailyScore, calculateStreak, DAILY_LOG_HISTORY_STORAGE_KEY, DAILY_LOG_STORAGE_KEY, emptyDailyLog, streakRules, type DailyLog } from "@/app/lib/dailyScoring";

const habits = [
  { emoji: "🏋️", title: "Workout", points: "+3 per hour", accent: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" },
  { emoji: "🚶", title: "Steps", points: "+1 per 1k", accent: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" },
  { emoji: "🍏", title: "Fruit", points: "+1", accent: "linear-gradient(135deg, #fb7185 0%, #f97316 100%)" },
  { emoji: "🥦", title: "Vegetable", points: "+1", accent: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" },
  { emoji: "🍰", title: "Dessert", points: "-2", accent: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)" },
  { emoji: "🍟", title: "Junk Food", points: "-1", accent: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" },
  { emoji: "💧", title: "Water", points: "+1 for 3L+", accent: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)" },
  { emoji: "😴", title: "Sleep", points: "±1 to +2", accent: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
  { emoji: "🍽️", title: "Dine Out", points: "-1", accent: "linear-gradient(135deg, #f97316 0%, #fb7185 100%)" },
  { emoji: "🛵", title: "Delivery", points: "-1", accent: "linear-gradient(135deg, #64748b 0%, #334155 100%)" },
];

export default function LogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedLog, setSavedLog] = useState<DailyLog>({ ...emptyDailyLog });
  const [history, setHistory] = useState<DailyLog[]>([]);

  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    const isKnownCategory = habits.some((habit) => habit.title === requestedCategory);
    if (isKnownCategory) setSelectedCategory(requestedCategory);

    const stored = localStorage.getItem(DAILY_LOG_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DailyLog;
        setSavedLog(parsed);
      } catch {
        setSavedLog({ ...emptyDailyLog });
      }
    }

    const storedHistory = localStorage.getItem(DAILY_LOG_HISTORY_STORAGE_KEY);
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory) as DailyLog[]);
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const handleSave = (payload: DailyLog) => {
    const next = { ...payload };
    const nextHistory = [...history.filter((log) => log.logDate !== next.logDate), next].sort((a, b) => a.logDate.localeCompare(b.logDate));
    setSavedLog(next);
    setHistory(nextHistory);
    localStorage.setItem(DAILY_LOG_STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(DAILY_LOG_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setSelectedCategory(null);
  };

  const currentScore = calculateDailyScore(savedLog);

  return (
    <AppShell title="Log" subtitle="What did you accomplish today?">
      <div className="soft-card p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="section-label mb-0">Daily score</div>
          <div className="fw-bolder fs-4 text-primary">{currentScore}</div>
        </div>

            <section className="soft-card p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                  <div className="section-label mb-1">Today&apos;s check-in</div>
                  <small className="text-secondary">Missing days break every streak.</small>
                </div>
                <button
                  className={`btn rounded-pill ${savedLog.dayCheckedIn ? "btn-success" : "btn-dark"}`}
                  onClick={() => handleSave({ ...savedLog, dayCheckedIn: !savedLog.dayCheckedIn })}
                >
                  {savedLog.dayCheckedIn ? "Checked in" : "Check in"}
                </button>
              </div>
            </section>

            <section className="row g-3 mb-3">
              {[
                ["Workout streak", calculateStreak(history, streakRules.workout)],
                ["No dessert", calculateStreak(history, streakRules.noDessert)],
                ["No delivery", calculateStreak(history, streakRules.noDelivery)],
                ["10K steps", calculateStreak(history, streakRules.steps)],
              ].map(([label, value]) => (
                <div key={String(label)} className="col-6">
                  <div className="list-surface h-100">
                    <small className="text-secondary">{label}</small>
                    <div className="fw-bolder fs-4 mt-1">{value} days</div>
                  </div>
                </div>
              ))}
            </section>
      </div>

      <div className="row g-3">
        {habits.map((habit) => (
          <div key={habit.title} className="col-6">
            <button
              className="soft-card w-100 text-start p-3 border-0"
              style={{ minHeight: 170 }}
              onClick={() => setSelectedCategory(habit.title)}
            >
              <div className="d-flex align-items-center justify-content-center rounded-4 text-white" style={{ width: 56, height: 56, background: habit.accent }}>
                <span style={{ fontSize: 24 }}>{habit.emoji}</span>
              </div>
              <div className="fw-black mt-3">{habit.title}</div>
              <div className="fw-bold text-primary">{habit.points}</div>
            </button>
          </div>
        ))}
      </div>

      <LogModal
        isOpen={Boolean(selectedCategory)}
        category={selectedCategory ?? "Workout"}
        onClose={() => setSelectedCategory(null)}
        onSave={handleSave}
        initialValues={savedLog}
      />
    </AppShell>
  );
}
