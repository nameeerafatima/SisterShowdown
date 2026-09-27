"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { competition, dailyHabits } from "@/app/data/mockData";
import { supabase } from "@/app/lib/supabase";
import { calculateDailyScore, calculateStreak, emptyDailyLog, formatPoints, streakRules, type DailyLog, getLeadMessage } from "@/app/lib/dailyScoring";

const scoreCards = [
  { label: "YOU", value: 487 },
  { label: "SISTER", value: 472 },
];

export default function DashboardPage() {
  const [savedLog, setSavedLog] = useState<DailyLog>({ ...emptyDailyLog });
  const [history, setHistory] = useState<DailyLog[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from("daily_logs").select("*").eq("user_id", userData.user.id).order("log_date", { ascending: true });
      const logs = (data ?? []).map((row) => ({
        logDate: row.log_date,
        dayCheckedIn: row.day_checked_in,
        workoutMinutes: row.workout_minutes,
        steps: row.steps,
        fruit: row.fruit,
        vegetable: row.vegetable,
        dessert: row.dessert,
        junkFood: row.junk_food,
        waterMl: row.water_ml,
        sleepHours: Number(row.sleep_minutes) / 60,
        dineOut: row.dine_out,
        delivery: row.delivery,
      })) as DailyLog[];
      setHistory(logs);
      const todayLog = logs.find((log) => log.logDate === new Date().toISOString().slice(0, 10));
      if (todayLog) setSavedLog(todayLog);
    };

    void loadLogs();
  }, []);

  const todayScore = calculateDailyScore(savedLog);
  const leadMessage = getLeadMessage(487, 472);

  return (
    <AppShell title="Dashboard" subtitle="Your daily battle is live">
      <section className="brand-card">
        <p className="mb-3 fw-bold text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 11, opacity: 0.9 }}>
          💍 {competition.name.toUpperCase()}
        </p>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <span className="text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 11, opacity: 0.9 }}>
            {competition.daysLeft} DAYS TO GO
          </span>
        </div>

        <div className="row g-3 mb-3">
          {scoreCards.map((card) => (
            <div key={card.label} className="col-6">
              <div className="metric-box text-white">
                <p className="mb-2 text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>{card.label}</p>
                <div className="score-large">{card.value}</div>
                <div className="text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>Points</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <div className="metric-box text-white">
              <span className="fs-5">🔥</span>
              <div className="mt-2">{calculateStreak(history, streakRules.workout)} day workout streak</div>
            </div>
          </div>
          <div className="col-6">
            <div className="metric-box text-white">
              <span className="fs-5">🔥</span>
              <div className="mt-2">{calculateStreak(history, streakRules.noDelivery)} day no-delivery streak</div>
            </div>
          </div>
        </div>

        <div className="metric-box text-white fw-semibold">{leadMessage}</div>
      </section>

      <section className="soft-card p-3 p-sm-4 mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="section-label mb-0">Today</h2>
          <span className="points-badge bg-success-subtle text-success">Daily score</span>
        </div>

        <div className="d-flex align-items-end gap-2 mt-3">
          <span className="score-large text-dark">{todayScore}</span>
          <span className="text-muted pb-1">points</span>
        </div>

        <div className="d-grid gap-3 mt-4">
          {dailyHabits.map((habit) => (
            <div key={habit.id} className="list-surface d-flex align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <span className="d-flex align-items-center justify-content-center rounded-3 bg-white border border-light-subtle" style={{ width: 42, height: 42, fontSize: 20 }}>
                  {habit.emoji}
                </span>
                <div>
                  <div className="fw-bold">{habit.label}</div>
                  <small className="text-secondary">{habit.detail}</small>
                </div>
              </div>

              <div className="text-end">
                <div className={`fw-bold ${habit.points < 0 ? "text-danger" : "text-primary"}`}>
                  {habit.points > 0 ? "+" : ""}{formatPoints(habit.points)}
                </div>
                <Link href={`/log?category=${encodeURIComponent(habit.label)}`} className="btn btn-dark btn-sm mt-2 rounded-pill px-3">
                  {habit.completed ? "✓ Complete" : "Update"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="soft-card p-3 p-sm-4 mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="section-label mb-0">Quick wins</h2>
          <small className="text-primary fw-bold">What can you do next?</small>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-6">
            <Link href="/log" className="d-block rounded-4 p-3 text-decoration-none text-dark" style={{ background: "#eafaf0", border: "1px solid #d1fae5" }}>
              <div className="fs-2">🚶</div>
              <div className="fw-bold mt-2">Log 10k steps</div>
              <small className="text-success fw-bold">+10 points</small>
            </Link>
          </div>
          <div className="col-6">
            <Link href="/log" className="d-block rounded-4 p-3 text-decoration-none text-dark" style={{ background: "#f5f3ff", border: "1px solid #e9d5ff" }}>
              <div className="fs-2">💧</div>
              <div className="fw-bold mt-2">Drink water</div>
              <small className="text-primary fw-bold">+1 point</small>
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
