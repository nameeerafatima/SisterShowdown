"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";
import { calculateDailyScore, formatPoints, type DailyLog } from "@/app/lib/dailyScoring";

type Member = { user_id: string; display_name: string };
type LogWithUser = DailyLog & { userId: string };
type RankedMember = Member & { score: number; weeklyScore: number; rank: number };
type Activity = { date: string; emoji: string; text: string; points: number };

function mapLog(row: Record<string, unknown>): LogWithUser {
  return {
    userId: String(row.user_id), logDate: String(row.log_date), dayCheckedIn: Boolean(row.day_checked_in), workoutMinutes: Number(row.workout_minutes),
    steps: Number(row.steps), fruit: String(row.fruit ?? ""), vegetable: String(row.vegetable ?? ""), dessert: String(row.dessert ?? ""),
    junkFood: String(row.junk_food ?? ""), waterMl: Number(row.water_ml), sleepHours: Number(row.sleep_minutes) / 60,
    dineOut: Boolean(row.dine_out), delivery: Boolean(row.delivery),
  };
}

function scoreLogs(logs: LogWithUser[]) {
  return Number(logs.reduce((total, log) => total + calculateDailyScore(log), 0).toFixed(1));
}

function recentWeekStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 6);
  return date.toISOString().slice(0, 10);
}

function activityFor(log: LogWithUser, name: string): Activity {
  const score = calculateDailyScore(log);
  if (log.workoutMinutes > 0) return { date: log.logDate, emoji: "🏋️", text: `${name} logged a ${log.workoutMinutes}-minute workout`, points: Number(((log.workoutMinutes / 60) * 3).toFixed(1)) };
  if (log.steps > 0) return { date: log.logDate, emoji: "🚶", text: `${name} logged ${log.steps.toLocaleString()} steps`, points: Math.floor(log.steps / 1000) };
  if (log.delivery) return { date: log.logDate, emoji: "🛵", text: `${name} logged delivery`, points: -1 };
  if (log.dessert) return { date: log.logDate, emoji: "🍰", text: `${name} logged dessert`, points: -2 };
  return { date: log.logDate, emoji: "✅", text: `${name} checked in`, points: score };
}

export default function BattlePage() {
  const [leaderboard, setLeaderboard] = useState<RankedMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBattle = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setCurrentUserId(userData.user.id);

      const [{ data: memberRows, error: memberError }, { data: logRows, error: logError }, { data: competitionRow, error: competitionError }] = await Promise.all([
        supabase.from("app_members").select("user_id, display_name"),
        supabase.from("daily_logs").select("*").order("log_date", { ascending: false }),
        supabase.from("competitions").select("start_date, end_date").limit(1).maybeSingle(),
      ]);
      if (memberError || logError || competitionError) {
        setError(memberError?.message ?? logError?.message ?? competitionError?.message ?? "Could not load leaderboard");
        return;
      }

      const startDate = competitionRow?.start_date ?? "0000-01-01";
      const endDate = competitionRow?.end_date ?? "9999-12-31";
      const logs = (logRows ?? []).map((row) => mapLog(row as Record<string, unknown>)).filter((log) => log.logDate >= startDate && log.logDate <= endDate);
      const weekStart = recentWeekStart();
      const members = memberRows ?? [];
      const standings = members.map((member) => {
        const memberLogs = logs.filter((log) => log.userId === member.user_id);
        return { ...member, score: scoreLogs(memberLogs), weeklyScore: scoreLogs(memberLogs.filter((log) => log.logDate >= weekStart)) };
      }).sort((first, second) => second.score - first.score || first.display_name.localeCompare(second.display_name));
      setLeaderboard(standings.map((member, index) => ({ ...member, rank: index + 1 })));
      const names = new Map(members.map((member) => [member.user_id, member.display_name]));
      setActivities(logs.filter((log) => log.dayCheckedIn).slice(0, 8).map((log) => activityFor(log, names.get(log.userId) ?? "Member")));
    };

    void loadBattle();
  }, []);

  const yourRank = leaderboard.find((member) => member.user_id === currentUserId)?.rank;
  const leaderScore = leaderboard[0]?.score ?? 0;
  const yourScore = leaderboard.find((member) => member.user_id === currentUserId)?.score ?? 0;
  const pointsToLeader = Number((leaderScore - yourScore).toFixed(1));

  return (
    <AppShell title="The Battle" subtitle="Live competition standings">
      {error ? <div className="alert alert-danger">Could not load leaderboard: {error}</div> : null}
      <section className="soft-card p-3 p-sm-4">
        <div className="d-flex justify-content-between align-items-start gap-3"><div><p className="section-label mb-1">Your place</p><div className="display-6 fw-bolder">#{yourRank ?? "-"}</div></div><div className="text-end"><p className="section-label mb-1">Leader score</p><div className="h2 fw-bolder mb-0">{formatPoints(leaderScore)}</div></div></div>
        <div className="mt-3 list-surface fw-bold">{pointsToLeader === 0 ? "You are leading or tied for first." : `${formatPoints(pointsToLeader)} points to first place`}</div>
      </section>

      <section className="soft-card p-3 mt-4">
        <div className="d-flex justify-content-between align-items-center"><h2 className="section-label mb-0">Leaderboard</h2><span className="points-badge">{leaderboard.length} players</span></div>
        <div className="d-grid gap-3 mt-3">{leaderboard.map((member) => <div key={member.user_id} className={`list-surface d-flex align-items-center justify-content-between gap-3 ${member.user_id === currentUserId ? "border border-primary" : ""}`}><div className="d-flex align-items-center gap-3"><span>{member.rank === 1 ? "🥇" : member.rank === 2 ? "🥈" : member.rank === 3 ? "🥉" : `#${member.rank}`}</span><div><div className="fw-bold">{member.display_name}{member.user_id === currentUserId ? " (You)" : ""}</div><small className="text-secondary">Last 7 days: {formatPoints(member.weeklyScore)}</small></div></div><span className="fw-bolder">{formatPoints(member.score)} pts</span></div>)}</div>
      </section>

      <section className="soft-card p-3 mt-4"><h2 className="section-label mb-3">Recent activity</h2><div className="d-grid gap-3">{activities.length ? activities.map((activity, index) => <div key={`${activity.date}-${index}`} className="list-surface d-flex align-items-start gap-3"><span className="fs-5">{activity.emoji}</span><div className="flex-grow-1"><div className="fw-semibold">{activity.text}</div><small className="text-secondary">{activity.date}</small><div className={`fw-bold ${activity.points < 0 ? "text-danger" : "text-primary"}`}>{activity.points > 0 ? "+" : ""}{formatPoints(activity.points)} points</div></div></div>) : <p className="text-secondary mb-0">No checked-in activity yet.</p>}</div></section>
    </AppShell>
  );
}
