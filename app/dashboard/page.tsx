"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";
import { calculateDailyScore, calculateStreak, calculateStepPoints, emptyDailyLog, formatPoints, getLeadMessage, streakRules, type DailyLog } from "@/app/lib/dailyScoring";

const accents = {
  Workout: "🏋️", Steps: "🚶", Fruit: "🍏", Vegetable: "🥦", Dessert: "🍰", "Junk Food": "🍟", Water: "💧", Sleep: "😴", "Dine Out": "🍽️", Delivery: "🛵",
} as const;

type Member = { user_id: string; display_name: string };
type RankedMember = Member & { score: number; rank: number };

function mapDatabaseLog(row: Record<string, unknown>): DailyLog {
  return {
    logDate: String(row.log_date), dayCheckedIn: Boolean(row.day_checked_in), workoutMinutes: Number(row.workout_minutes), steps: Number(row.steps),
    fruit: String(row.fruit ?? ""), vegetable: String(row.vegetable ?? ""), dessert: String(row.dessert ?? ""), junkFood: String(row.junk_food ?? ""),
    waterMl: Number(row.water_ml), sleepHours: Number(row.sleep_minutes) / 60, dineOut: Boolean(row.dine_out), delivery: Boolean(row.delivery),
  };
}

function scoreTotal(logs: DailyLog[]) {
  return Number(logs.reduce((total, log) => total + calculateDailyScore(log), 0).toFixed(1));
}

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("Member");
  const [currentUserId, setCurrentUserId] = useState("");
  const [competitionName, setCompetitionName] = useState("Competition");
  const [savedLog, setSavedLog] = useState<DailyLog>({ ...emptyDailyLog });
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<RankedMember[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: memberRows, error: memberError }, { data: logRows, error: logError }, { data: competitionRow, error: competitionError }] = await Promise.all([
        supabase.from("app_members").select("user_id, display_name"),
        supabase.from("daily_logs").select("*").order("log_date", { ascending: true }),
        supabase.from("competitions").select("name, start_date, end_date").limit(1).maybeSingle(),
      ]);
      if (memberError || logError || competitionError) {
        setError(memberError?.message ?? logError?.message ?? competitionError?.message ?? "Could not load leaderboard");
        return;
      }

      const members = memberRows ?? [];
      const logs = logRows ?? [];
      setCurrentUserId(userData.user.id);
      const currentMember = members.find((member) => member.user_id === userData.user.id);
      setDisplayName(currentMember?.display_name || userData.user.user_metadata?.display_name || userData.user.email?.split("@")[0] || "Member");
      setCompetitionName(competitionRow?.name ?? "Competition");

      const startDate = competitionRow?.start_date ?? "0000-01-01";
      const endDate = competitionRow?.end_date ?? "9999-12-31";
      const scopedLogs = logs.filter((row) => row.log_date >= startDate && row.log_date <= endDate);
      const logHistory = scopedLogs.filter((row) => row.user_id === userData.user.id).map((row) => mapDatabaseLog(row as Record<string, unknown>));
      setHistory(logHistory);
      const currentDate = new Date().toISOString().slice(0, 10);
      const todayLog = logHistory.find((log) => log.logDate === currentDate);
      if (todayLog) setSavedLog(todayLog);

      const scores = members.map((member) => ({
        ...member,
        score: scoreTotal(scopedLogs.filter((row) => row.user_id === member.user_id).map((row) => mapDatabaseLog(row as Record<string, unknown>))),
      })).sort((first, second) => second.score - first.score || first.display_name.localeCompare(second.display_name));
      setLeaderboard(scores.map((member, index) => ({ ...member, rank: index + 1 })));
    };

    void loadDashboard();
  }, []);

  const todayScore = calculateDailyScore(savedLog);
  const yourMember = leaderboard.find((member) => member.user_id === currentUserId);
  const leader = leaderboard[0];
  const pointsToLeader = leader && yourMember ? Number((leader.score - yourMember.score).toFixed(1)) : 0;
  const streakDisplays: Array<{ label: string; rule: (log: DailyLog) => boolean }> = [
    { label: "Workout", rule: streakRules.workout },
    { label: "No delivery", rule: streakRules.noDelivery },
    { label: "No dessert", rule: streakRules.noDessert },
  ];
  const habitRows = [
    ["Workout", calculateDailyScore({ ...emptyDailyLog, workoutMinutes: savedLog.workoutMinutes }), savedLog.workoutMinutes > 0, savedLog.workoutMinutes ? `${savedLog.workoutMinutes} minutes` : "Not logged"],
    ["Steps", calculateStepPoints(savedLog.steps), savedLog.steps > 0, `${savedLog.steps.toLocaleString()} steps`],
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
      {error ? <div className="alert alert-danger">Could not load leaderboard: {error}</div> : null}
      <section className="brand-card">
        <p className="mb-3 fw-bold text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 11, opacity: 0.9 }}>🏆 {competitionName.toUpperCase()}</p>
        <div className="row g-3 mb-3">
          <div className="col-6"><div className="metric-box text-white"><p className="mb-2 text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>Leader · {leader?.display_name ?? "Waiting"}</p><div className="score-large">{formatPoints(leader?.score ?? 0)}</div><div className="text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>Points</div></div></div>
          <div className="col-6"><div className="metric-box text-white"><p className="mb-2 text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>Your score</p><div className="score-large">{formatPoints(yourMember?.score ?? 0)}</div><div className="text-uppercase" style={{ letterSpacing: "0.18em", fontSize: 10, opacity: 0.9 }}>Rank #{yourMember?.rank ?? "-"}</div></div></div>
        </div>
        <div className="metric-box text-white fw-semibold">{pointsToLeader === 0 ? "You are leading or tied for the lead." : `${formatPoints(pointsToLeader)} points to the leader`}</div>
        <div className="row g-2 mt-2">
          {streakDisplays.map(({ label, rule }) => <div key={label} className="col-4"><div className="metric-box text-white p-2"><span className="fs-5">🔥</span><div className="mt-2 small">{calculateStreak(history, rule)} day {label} streak</div></div></div>)}
        </div>
      </section>

      <section className="soft-card p-3 p-sm-4 mt-4">
        <div className="d-flex justify-content-between align-items-center"><h2 className="section-label mb-0">Today</h2><span className="points-badge bg-success-subtle text-success">Daily score</span></div>
        <div className="d-flex align-items-end gap-2 mt-3"><span className="score-large text-dark">{formatPoints(todayScore)}</span><span className="text-muted pb-1">points</span></div>
        <div className="d-grid gap-3 mt-4">{habitRows.map(([label, points, completed, detail]) => <div key={label} className="list-surface d-flex align-items-center justify-content-between gap-3"><div className="d-flex align-items-center gap-3"><span className="d-flex align-items-center justify-content-center rounded-3 bg-white border border-light-subtle" style={{ width: 42, height: 42, fontSize: 20 }}>{accents[label]}</span><div><div className="fw-bold">{label}</div><small className="text-secondary">{detail}</small></div></div><div className="text-end"><div className={`fw-bold ${points < 0 ? "text-danger" : "text-primary"}`}>{points > 0 ? "+" : ""}{formatPoints(points)}</div><Link href={`/log?category=${encodeURIComponent(label)}`} className="btn btn-dark btn-sm mt-2 rounded-pill px-3">{completed ? "✓ Update" : "Update"}</Link></div></div>)}</div>
      </section>
    </AppShell>
  );
}
