"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";
import { calculateDailyScore, formatPoints, type DailyLog } from "@/app/lib/dailyScoring";

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

function formatWeight(value: number | null) {
  return value === null ? "--" : value.toFixed(1);
}

function getLogDetails(log: DailyLog) {
  const details: Array<[string, string]> = [];
  if (log.workoutMinutes > 0) details.push(["Workout", `${log.workoutMinutes} min`]);
  if (log.steps > 0) details.push(["Steps", log.steps.toLocaleString()]);
  if (log.fruit.trim()) details.push(["Fruit", log.fruit]);
  if (log.vegetable.trim()) details.push(["Vegetable", log.vegetable]);
  if (log.dessert.trim()) details.push(["Dessert", log.dessert]);
  if (log.junkFood.trim()) details.push(["Junk food", log.junkFood]);
  if (log.waterMl > 0) details.push(["Water", `${log.waterMl.toLocaleString()} ml`]);
  if (log.sleepHours > 0) details.push(["Sleep", `${log.sleepHours.toFixed(1)} hr`]);
  if (log.dineOut) details.push(["Dine out", "Logged"]);
  if (log.delivery) details.push(["Delivery", "Logged"]);
  return details;
}

export default function ProgressPage() {
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [weightError, setWeightError] = useState("");
  const [dailyLogError, setDailyLogError] = useState("");

  useEffect(() => {
    const loadWeight = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data, error: memberError }, { data: logRows, error: logError }] = await Promise.all([
        supabase.from("app_members").select("weight_kg, initial_weight_kg").eq("user_id", userData.user.id).maybeSingle(),
        supabase.from("daily_logs").select("*").eq("user_id", userData.user.id).order("log_date", { ascending: false }),
      ]);

      if (memberError) setWeightError(memberError.message);
      else {
        setInitialWeight(data?.initial_weight_kg ? Number(data.initial_weight_kg) : null);
        setCurrentWeight(data?.weight_kg ? Number(data.weight_kg) : null);
      }
      if (logError) setDailyLogError(logError.message);
      else setDailyLogs((logRows ?? []).map((row) => mapDatabaseLog(row as Record<string, unknown>)));
    };

    void loadWeight();
  }, []);

  const change = initialWeight !== null && currentWeight !== null ? Number((currentWeight - initialWeight).toFixed(1)) : null;
  const changeLabel = change === null ? "--" : change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
  const loggedDays = dailyLogs.filter((log) => log.dayCheckedIn || getLogDetails(log).length > 0);

  return (
    <AppShell title="Progress" subtitle="Your growth story">
      <section className="soft-card p-3">
        <div className="row g-3 text-center">
          <div className="col-4"><div className="list-surface"><small className="section-label">Start</small><div className="fw-bold mt-2">{formatWeight(initialWeight)}</div><small className="text-secondary">kg</small></div></div>
          <div className="col-4"><div className="list-surface"><small className="section-label">Current</small><div className="fw-bold mt-2">{formatWeight(currentWeight)}</div><small className="text-secondary">kg</small></div></div>
          <div className="col-4"><div className="list-surface" style={{ background: "#f5f3ff" }}><small className="section-label">Change</small><div className={`fw-bold mt-2 ${change !== null && change > 0 ? "text-danger" : "text-primary"}`}>{changeLabel}</div><small className="text-primary">kg</small></div></div>
        </div>
        <div className="mt-4 rounded-4 p-3 text-center" style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff7fb 100%)" }}>
          {currentWeight === null ? "Add your weight from Profile to start tracking." : "Your current weight is live from your profile."}
        </div>
        {weightError ? <div className="alert alert-danger mt-3 mb-0">Could not load weight: {weightError}</div> : null}
      </section>

      <section className="soft-card p-3 mt-4">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <h2 className="section-label mb-0">Daily log</h2>
          <span className="points-badge">{loggedDays.length} {loggedDays.length === 1 ? "day" : "days"}</span>
        </div>
        {dailyLogError ? <div className="alert alert-danger">Could not load daily logs: {dailyLogError}</div> : null}
        {loggedDays.length ? <div className="d-grid gap-3">{loggedDays.map((log) => {
          const details = getLogDetails(log);
          return <article key={log.logDate} className="border rounded-3 bg-white p-3">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div><h3 className="h6 fw-bold mb-1">{new Date(`${log.logDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</h3><small className={log.dayCheckedIn ? "text-success fw-semibold" : "text-secondary"}>{log.dayCheckedIn ? "Checked in" : "Activities logged"}</small></div>
              <div className="text-end"><div className="fw-bolder text-primary fs-5">{formatPoints(calculateDailyScore(log))}</div><small className="text-secondary">points</small></div>
            </div>
            {details.length ? <div className="row g-0 border-top mt-3 pt-2">{details.map(([label, value]) => <div key={label} className="col-6 col-sm-4 py-2 pe-2"><small className="d-block text-secondary">{label}</small><span className="fw-semibold text-break">{value}</span></div>)}</div> : <p className="text-secondary small border-top mt-3 pt-3 mb-0">Checked in, with no activities logged.</p>}
          </article>;
        })}</div> : !dailyLogError ? <p className="text-secondary mb-0">No check-ins or activities logged yet.</p> : null}
      </section>
    </AppShell>
  );
}
