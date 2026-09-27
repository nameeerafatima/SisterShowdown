"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { competition } from "@/app/data/mockData";
import { supabase } from "@/app/lib/supabase";
import { calculateDailyScore, calculateStreak, emptyDailyLog, formatPoints, getLeadMessage, streakRules, type DailyLog } from "@/app/lib/dailyScoring";

const accents = {
  Workout: ["🏋️", "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"],
  Steps: ["🚶", "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"],
  Fruit: ["🍏", "linear-gradient(135deg, #fb7185 0%, #f97316 100%)"],
  Vegetable: ["🥦", "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"],
  Dessert: ["🍰", "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)"],
  "Junk Food": ["🍟", "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"],
  Water: ["💧", "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)"],
  Sleep: ["😴", "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"],
  "Dine Out": ["🍽️", "linear-gradient(135deg, #f97316 0%, #fb7185 100%)"],
  Delivery: ["🛵", "linear-gradient(135deg, #64748b 0%, #334155 100%)"],
} as const;

function mapDatabaseLog(row: Record<string, unknown>): DailyLog {
  return {
    logDate: String(row.log_date),
    dayCheckedIn: Boolean(row.day_checked_in),
    workoutMinutes: Number(row.workout_minutes),
    steps: Number(row.steps),
    fruit: String(row.fruit ?? ""),
    vegetable: String(row.vegetable ?? ""),
    dessert: String(row.dessert ?? ""),
    junkFood: String(row.junk_food ?? ""),
    waterMl: Number(row.water_ml),
    sleepHours: Number(row.sleep_minutes) / 60,
    dineOut: Boolean(row.dine_out),
    delivery: Boolean(row.delivery),
  };
}

function scoreTotal(logs: DailyLog[]) {
  return Number(logs.reduce((total, log) => total + calculateDailyScore(log), 0).toFixed(1));
}

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("Dashboard");
  const [sisterName, setSisterName] = useState("Sister");
  const [savedLog, setSavedLog] = useState<DailyLog>({ ...emptyDailyLog });
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [sisterScore, setSisterScore] = useState(0);
  const [yourScore, setYourScore] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: memberRows }, { data: logRows }] = await Promise.all([
        supabase.from("app_members").select("user_id, display_name"),
        supabase.from("daily_logs").select("*").order("log_date", { ascending: true }),
      ]);

      const currentUser = memberRows?.find((member) => member.user_id === userData.user.id);
      const otherMember = memberRows?.find((member) => member.user_id !== userData.user.id);
      setDisplayName(currentUser?.display_name || userData.user.user_metadata?.display_name || userData.user.email?.split("@")[0] || "Dashboard");
      setSisterName(otherMember?.display_name || "Sister");

      const yourLogs = (logRows ?? []).filter((row) => row.user_id === userData.user.id).map((row) => mapDatabaseLog(row as Record<string, unknown>));
      const sisterLogs = (logRows ?? []).filter((row) => row.user_id !== userData.user.id).map((row) => mapDatabaseLog(row as Record<string, unknown>));
      setHistory(yourLogs);
      setYourScore(scoreTotal(yourLogs));
      setSisterScore(scoreTotal(sisterLogs));
      const todayLog = yourLogs.find((log) => log.logDate === new Date().toISOString().slice(0, 10));
      if (todayLog) setSavedLog(todayLog);
    };

    void loadDashboard();
  }, []);

  const todayScore = calculateDailyScore(savedLog);
  const habitRows = [
    ["Workout", calculateDailyScore({ ...emptyDailyLog, workoutMinutes: savedLog.workoutMinutes }), savedLog.workoutMinutes > 0, savedLog.workoutMinutes ? `${savedLog.workoutMinutes} minutes` : "Not logged"],
    ["Steps", Math.floor(savedLog.steps / 1000), savedLog.steps > 0, `${savedLog.steps.toLocaleString()} steps`],
    ["Fruit", savedLog.fruit.trim() ? 1 : 0, Boolean(savedLog.fruit.trim()), savedLog.fruit || "Not logged"],
    ["Vegetable", savedLog.vegetable.trim() ? 1 : 0, Boolean(savedLog.vegetable.trim()), savedLog.vegetable || "Not logged"],
    ["Dessert", savedLog.dessert.trim() ? -2 : 0, Boolean(savedLog.dessert.trim()), savedLog.dessert || "None logged"],
    ["Junk Food", savedLog.junkFood.trim() ? -1 : 0, Boolean(savedLog.junkFood.trim()), savedLog.junkFood || "None logged"],
    ["Water", savedLog.waterMl >= 3000 ? 1 : 0, savedLog.waterMl > 0, `${savedLog.waterMl.toLocaleString()} ml`],
    ["Sleep", savedLog.sleepHours > 0 ? calculateDailyScore({ ...emptyDailyLog, sleepHours: savedLog.sleepHours }) : 0, savedLog.sleepHours > 0, `${savedLog.sleepHours.toFixed(1)} hours`],
    ["Dine Out", savedLog.dineOut ? -1 : 0, savedLog.dineOut, savedLog.dineOut ? "Logged" : "Not logged"],
    ["Delivery", savedLog.delivery ? -1 : 0, savedLog.delivery, savedLog.delivery ? "Logged" : "Not logged"],
  ] as const;

  return (
    <AppShell title={displayName} subtitle="Your daily battle is live">
      <section className="brand-card">
        <p className="mb-3 fw-bold text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 11, opacity: 0.9 }}>💍 {competition.name.toUpperCase()}</p>
        <div className="d-flex justify-content-between align-items-center mb-4"><span className="text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 11, opacity: 0.9 }}>Shared leaderboard</span></div>
        <div className="row g-3 mb-3">
          {[[displayName, yourScore], [sisterName, sisterScore]].map(([label, value]) => <div key={String(label)} className="col-6"><div className="metric-box text-white"><p className="mb-2 text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>{label}</p><div className="score-large">{formatPoints(Number(value))}</div><div className="text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>Points</div></div></div>)}
        </div>
        <div className="row g-3 mb-3"><div className="col-6"><div className="metric-box text-white"><span className="fs-5">🔥</span><div className="mt-2">{calculateStreak(history, streakRules.workout)} day workout streak</div></div></div><div className="col-6"><div className="metric-box text-white"><span className="fs-5">🔥</span><div className="mt-2">{calculateStreak(history, streakRules.noDelivery)} day no-delivery streak</div></div></div></div>
        <div className="metric-box text-white fw-semibold">{getLeadMessage(yourScore, sisterScore)}</div>
      </section>

      <section className="soft-card p-3 p-sm-4 mt-4">
        <div className="d-flex justify-content-between align-items-center"><h2 className="section-label mb-0">Today</h2><span className="points-badge bg-success-subtle text-success">Daily score</span></div>
        <div className="d-flex align-items-end gap-2 mt-3"><span className="score-large text-dark">{formatPoints(todayScore)}</span><span className="text-muted pb-1">points</span></div>
        <div className="d-grid gap-3 mt-4">{habitRows.map(([label, points, completed, detail]) => { const [emoji] = accents[label]; return <div key={label} className="list-surface d-flex align-items-center justify-content-between gap-3"><div className="d-flex align-items-center gap-3"><span className="d-flex align-items-center justify-content-center rounded-3 bg-white border border-light-subtle" style={{ width: 42, height: 42, fontSize: 20 }}>{emoji}</span><div><div className="fw-bold">{label}</div><small className="text-secondary">{detail}</small></div></div><div className="text-end"><div className={`fw-bold ${points < 0 ? "text-danger" : "text-primary"}`}>{points > 0 ? "+" : ""}{formatPoints(points)}</div><Link href={`/log?category=${encodeURIComponent(label)}`} className="btn btn-dark btn-sm mt-2 rounded-pill px-3">{completed ? "✓ Update" : "Update"}</Link></div></div>; })}</div>
      </section>
    </AppShell>
  );
}
