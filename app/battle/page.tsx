"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";
import { calculateDailyScore, calculateDeliveryPoints, calculateDessertPoints, calculateDineOutPoints, calculateFruitPoints, calculateJunkFoodPoints, calculateSleepPoints, calculateStepPoints, calculateVegetablePoints, calculateWaterPoints, calculateWorkoutPoints, formatPoints, type DailyLog } from "@/app/lib/dailyScoring";

type Member = { user_id: string; display_name: string };
type LogWithUser = DailyLog & { userId: string; updatedAt: string };
type RankedMember = Member & { score: number; weeklyScore: number; rank: number };
type ActivityCategory = "workout" | "steps" | "nutrition" | "treat" | "hydration" | "rest" | "dining" | "check-in";
type Activity = { date: string; updatedAt: string; category: ActivityCategory; emoji: string; text: string; points: number };

const activityCategoryLabels: Record<ActivityCategory, string> = {
  workout: "Workout",
  steps: "Steps",
  nutrition: "Nutrition",
  treat: "Treat",
  hydration: "Hydration",
  rest: "Rest",
  dining: "Dining",
  "check-in": "Check-in",
};

function mapLog(row: Record<string, unknown>): LogWithUser {
  return {
    userId: String(row.user_id), updatedAt: String(row.updated_at ?? ""), logDate: String(row.log_date), dayCheckedIn: Boolean(row.day_checked_in), workoutMinutes: Number(row.workout_minutes),
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

function splitItems(value: string) {
  return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function activitiesFor(log: LogWithUser, name: string): Activity[] {
  const activities: Activity[] = [];
  const addActivity = (category: ActivityCategory, emoji: string, text: string, points: number) => {
    activities.push({ date: log.logDate, updatedAt: log.updatedAt, category, emoji, text, points });
  };

  if (log.workoutMinutes > 0) addActivity("workout", "🏋️", `${name} logged a ${log.workoutMinutes}-minute workout`, calculateWorkoutPoints(log.workoutMinutes));
  if (log.steps > 0) addActivity("steps", "🚶", `${name} walked ${log.steps.toLocaleString()} steps`, calculateStepPoints(log.steps));

  const fruits = splitItems(log.fruit);
  if (fruits.length) addActivity("nutrition", "🍎", `${name} logged fruit: ${fruits.join(", ")}`, calculateFruitPoints(log.fruit));
  const vegetables = splitItems(log.vegetable);
  if (vegetables.length) addActivity("nutrition", "🥦", `${name} logged vegetables: ${vegetables.join(", ")}`, calculateVegetablePoints(log.vegetable));

  if (log.dessert) addActivity("treat", "🍰", `${name} logged dessert: ${log.dessert}`, calculateDessertPoints(log.dessert));
  if (log.junkFood) addActivity("treat", "🍟", `${name} logged junk food: ${log.junkFood}`, calculateJunkFoodPoints(log.junkFood));
  if (log.waterMl > 0) addActivity("hydration", "💧", `${name} drank ${log.waterMl.toLocaleString()} ml of water`, calculateWaterPoints(log.waterMl));
  if (log.sleepHours > 0) addActivity("rest", "😴", `${name} logged ${formatPoints(log.sleepHours)} hours of sleep`, calculateSleepPoints(log.sleepHours));
  if (log.dineOut) addActivity("dining", "🍽️", `${name} dined out`, calculateDineOutPoints(log.dineOut));
  if (log.delivery) addActivity("dining", "🛵", `${name} ordered delivery`, calculateDeliveryPoints(log.delivery));
  if (log.dayCheckedIn) addActivity("check-in", "✅", `${name} checked in`, 0);
  return activities;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function activityDateLabel(date: string) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === localDateKey(today)) return "Today";
  if (date === localDateKey(yesterday)) return "Yesterday";

  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(year, month - 1, day, 12));
}

function activityTimeLabel(updatedAt: string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "Log updated";
  return `Log updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)}`;
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
      setActivities(logs.flatMap((log) => activitiesFor(log, names.get(log.userId) ?? "Member")).slice(0, 12));
    };

    void loadBattle();
  }, []);

  const yourRank = leaderboard.find((member) => member.user_id === currentUserId)?.rank;
  const leaderScore = leaderboard[0]?.score ?? 0;
  const yourScore = leaderboard.find((member) => member.user_id === currentUserId)?.score ?? 0;
  const pointsToLeader = Number((leaderScore - yourScore).toFixed(1));
  const progressToLeader = !leaderboard.length ? 0 : pointsToLeader === 0 ? 100 : leaderScore > 0 ? Math.min(100, Math.max(0, (yourScore / leaderScore) * 100)) : 0;
  const activityGroups = activities.reduce<Array<{ date: string; label: string; items: Activity[] }>>((groups, activity) => {
    const group = groups.find((item) => item.date === activity.date);
    if (group) group.items.push(activity);
    else groups.push({ date: activity.date, label: activityDateLabel(activity.date), items: [activity] });
    return groups;
  }, []);

  return (
    <AppShell title="The Battle" subtitle="Live competition standings">
      {error ? <div className="alert alert-danger">Could not load leaderboard: {error}</div> : null}
      <section className="battle-summary" aria-labelledby="battle-summary-title">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <p className="section-label mb-1">Your standing</p>
            <h2 id="battle-summary-title" className="h3 fw-bolder mb-0">Rank #{yourRank ?? "-"}</h2>
          </div>
          <div className="text-end">
            <p className="section-label mb-1">Leader score</p>
            <div className="h4 fw-bolder mb-0">{formatPoints(leaderScore)} pts</div>
          </div>
        </div>
        <p className="battle-gap mb-3 mt-3">
          {!leaderboard.length ? "Standings are loading" : pointsToLeader === 0 ? "You're leading or tied for #1" : `${formatPoints(pointsToLeader)} pts behind #1`}
        </p>
        <div className="battle-progress" role="progressbar" aria-label="Progress toward the leader's score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressToLeader)}>
          <span style={{ width: `${progressToLeader}%` }} />
        </div>
        <div className="d-flex justify-content-between gap-3 mt-2 battle-score-caption">
          <span>You: {formatPoints(yourScore)} pts</span>
          <span>Leader: {formatPoints(leaderScore)} pts</span>
        </div>
      </section>

      <section className="soft-card p-3 mt-4" aria-labelledby="battle-leaderboard-title">
        <div className="d-flex justify-content-between align-items-center"><h2 id="battle-leaderboard-title" className="section-label mb-0">Leaderboard</h2><span className="points-badge">{leaderboard.length} players</span></div>
        <div className="d-grid gap-3 mt-3">{leaderboard.map((member) => <div key={member.user_id} className={`list-surface d-flex align-items-center justify-content-between gap-3 ${member.user_id === currentUserId ? "border border-primary" : ""}`}><div className="d-flex align-items-center gap-3"><span>{member.rank === 1 ? "🥇" : member.rank === 2 ? "🥈" : member.rank === 3 ? "🥉" : `#${member.rank}`}</span><div><div className="fw-bold">{member.display_name}{member.user_id === currentUserId ? " (You)" : ""}</div><small className="text-secondary">Last 7 days: {formatPoints(member.weeklyScore)}</small></div></div><span className="fw-bolder">{formatPoints(member.score)} pts</span></div>)}</div>
      </section>

      <section className="soft-card p-3 mt-4" aria-labelledby="recent-activity-title">
        <h2 id="recent-activity-title" className="section-label mb-3">Recent activity</h2>
        {activityGroups.length ? activityGroups.map((group) => (
          <div className="activity-day" key={group.date}>
            <h3 className="activity-day-title">{group.label}</h3>
            <div className="activity-list">
              {group.items.map((activity, index) => (
                <div className="activity-row" key={`${activity.date}-${activity.category}-${index}`}>
                  <span className={`activity-icon activity-category-${activity.category}`} aria-hidden="true">{activity.emoji}</span>
                  <div className="activity-copy">
                    <div className="activity-title">{activity.text}</div>
                    <div className="activity-meta">
                      <span className={`activity-category activity-category-${activity.category}`}>{activityCategoryLabels[activity.category]}</span>
                      <span className="activity-time">{activityTimeLabel(activity.updatedAt)}</span>
                    </div>
                  </div>
                  <span className={`activity-points ${activity.points < 0 ? "negative" : ""}`}>
                    {activity.points > 0 ? "+" : ""}{formatPoints(activity.points)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )) : <p className="activity-empty mb-0">No activity logged yet.</p>}
      </section>
    </AppShell>
  );
}
