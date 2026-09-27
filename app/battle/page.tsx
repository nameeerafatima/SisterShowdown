"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";
import { calculateDailyScore, formatPoints, getLeadMessage, type DailyLog } from "@/app/lib/dailyScoring";

type Member = { user_id: string; display_name: string };
type LogWithUser = DailyLog & { userId: string };
type Activity = { date: string; emoji: string; text: string; points: number };

function mapLog(row: Record<string, unknown>): LogWithUser {
  return {
    userId: String(row.user_id),
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

function scoreLogs(logs: LogWithUser[]) {
  return Number(logs.reduce((total, log) => total + calculateDailyScore(log), 0).toFixed(1));
}

function startOfWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 6);
  return date.toISOString().slice(0, 10);
}

function createActivities(logs: LogWithUser[], members: Member[]) {
  const names = new Map(members.map((member) => [member.user_id, member.display_name]));
  return logs
    .filter((log) => log.dayCheckedIn)
    .sort((a, b) => b.logDate.localeCompare(a.logDate))
    .slice(0, 5)
    .map((log) => {
      const name = names.get(log.userId) ?? "Member";
      if (log.workoutMinutes > 0) return { date: log.logDate, emoji: "🔥", text: `${name} completed a workout`, points: calculateDailyScore({ ...log, steps: 0, fruit: "", vegetable: "", dessert: "", junkFood: "", waterMl: 0, sleepHours: 0, dineOut: false, delivery: false }) };
      if (log.steps > 0) return { date: log.logDate, emoji: "🚶", text: `${name} logged ${log.steps.toLocaleString()} steps`, points: Math.floor(log.steps / 1000) };
      if (log.delivery) return { date: log.logDate, emoji: "🛵", text: `${name} logged delivery`, points: -1 };
      if (log.dessert) return { date: log.logDate, emoji: "🍰", text: `${name} logged dessert`, points: -2 };
      return { date: log.logDate, emoji: "✅", text: `${name} checked in`, points: calculateDailyScore(log) };
    });
}

export default function BattlePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<LogWithUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBattle = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setCurrentUserId(userData.user.id);
      const [{ data: memberRows, error: memberError }, { data: logRows, error: logError }] = await Promise.all([
        supabase.from("app_members").select("user_id, display_name"),
        supabase.from("daily_logs").select("*").order("log_date", { ascending: false }),
      ]);
      if (memberError || logError) {
        setError(memberError?.message ?? logError?.message ?? "Could not load battle data");
        return;
      }
      setMembers(memberRows ?? []);
      setLogs((logRows ?? []).map((row) => mapLog(row as Record<string, unknown>)));
    };

    void loadBattle();
  }, []);

  const sisterId = members.find((member) => member.user_id !== currentUserId)?.user_id;
  const yourLogs = logs.filter((log) => log.userId === currentUserId);
  const sisterLogs = logs.filter((log) => log.userId === sisterId);
  const weeklyLogs = logs.filter((log) => log.logDate >= startOfWeek());
  const yourWeekly = scoreLogs(weeklyLogs.filter((log) => log.userId === currentUserId));
  const sisterWeekly = scoreLogs(weeklyLogs.filter((log) => log.userId === sisterId));
  const yourScore = scoreLogs(yourLogs);
  const sisterScore = scoreLogs(sisterLogs);
  const total = yourScore + sisterScore || 1;
  const activities: Activity[] = createActivities(logs, members);

  return (
    <AppShell title="The Battle" subtitle="Live scores from your shared logs">
  {error ? <div className="alert alert-danger">Could not load battle data: {error}</div> : null}
      <section className="soft-card p-4">
        <div className="row g-3 text-center">
          <div className="col-6"><div className="section-label mb-2">{members.find((member) => member.user_id === currentUserId)?.display_name ?? "You"}</div><div className="score-large text-dark">{formatPoints(yourScore)}</div></div>
          <div className="col-6"><div className="section-label mb-2">{members.find((member) => member.user_id === sisterId)?.display_name ?? "Sister"}</div><div className="score-large text-dark">{formatPoints(sisterScore)}</div></div>
        </div>
        <div className="mt-4"><div className="d-flex overflow-hidden rounded-pill bg-light" style={{ height: 18 }}><div className="rounded-pill" style={{ width: `${(yourScore / total) * 100}%`, background: "linear-gradient(90deg, #7c3aed, #ec4899)" }} /><div className="rounded-pill" style={{ width: `${(sisterScore / total) * 100}%`, background: "linear-gradient(90deg, #34d399, #22c55e)" }} /></div><div className="d-flex justify-content-between align-items-center mt-3 small fw-bold text-secondary text-uppercase"><span>{getLeadMessage(yourScore, sisterScore)}</span><span>all time</span></div></div>
      </section>

      <section className="soft-card p-3 mt-4"><h3 className="section-label mb-3">This week</h3><div className="d-grid gap-3"><div className="list-surface d-flex align-items-center justify-content-between"><span>🥇</span><span className="fw-bold">{members.find((member) => member.user_id === currentUserId)?.display_name ?? "You"}</span><span className="fw-black text-primary">{formatPoints(yourWeekly)}</span></div><div className="list-surface d-flex align-items-center justify-content-between"><span>🥈</span><span className="fw-bold">{members.find((member) => member.user_id === sisterId)?.display_name ?? "Sister"}</span><span className="fw-black text-danger">{formatPoints(sisterWeekly)}</span></div></div><div className="row g-3 mt-2"><div className="col-6"><div className="list-surface"><small className="section-label">All time</small><div className="fw-bold mt-2">{formatPoints(yourScore)} vs {formatPoints(sisterScore)}</div><small className="text-secondary">live total</small></div></div><div className="col-6"><div className="list-surface"><small className="section-label">Window</small><div className="fw-bold mt-2">Last 7 days</div><small className="text-secondary">calculated from logs</small></div></div></div></section>

      <section className="soft-card p-3 mt-4"><h3 className="section-label mb-3">Recent activity</h3><div className="d-grid gap-3">{activities.length ? activities.map((item) => <div key={`${item.date}-${item.text}`} className="list-surface d-flex align-items-start gap-3"><span className="fs-5">{item.emoji}</span><div className="flex-grow-1"><div className="fw-semibold">{item.text}</div><small className="text-secondary">{item.date}</small><div className={`fw-bold ${item.points < 0 ? "text-danger" : "text-primary"}`}>{item.points > 0 ? "+" : ""}{formatPoints(item.points)} points</div></div></div>) : <div className="text-secondary">No checked-in activity yet.</div>}</div></section>
    </AppShell>
  );
}
