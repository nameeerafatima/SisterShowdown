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
          <span className="points-badge">{dailyLogs.length} days</span>
        </div>
        {dailyLogError ? <div className="alert alert-danger">Could not load daily logs: {dailyLogError}</div> : null}
        {dailyLogs.length ? <div className="d-grid gap-3">{dailyLogs.map((log) => {
          const details = [
            ["Workout", `${log.workoutMinutes} min`],
            ["Steps", log.steps.toLocaleString()],
            ["Fruit", log.fruit || "Not logged"],
            ["Vegetable", log.vegetable || "Not logged"],
            ["Dessert", log.dessert || "None"],
            ["Junk food", log.junkFood || "None"],
            ["Water", `${log.waterMl.toLocaleString()} ml`],
            ["Sleep", `${log.sleepHours.toFixed(1)} hr`],
            ["Dine out", log.dineOut ? "Yes" : "No"],
            ["Delivery", log.delivery ? "Yes" : "No"],
          ];
          return <article key={log.logDate} className="list-surface">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div><h3 className="h6 fw-bold mb-1">{new Date(`${log.logDate}T00:00:00`).toLocaleDateString()}</h3><small className="text-secondary">{log.dayCheckedIn ? "Checked in" : "Not checked in"}</small></div>
              <div className="text-end"><div className="fw-bolder text-primary">{formatPoints(calculateDailyScore(log))}</div><small className="text-secondary">points</small></div>
            </div>
            <div className="row g-2 mt-2">{details.map(([label, value]) => <div key={label} className="col-6"><div className="d-flex justify-content-between gap-2 small"><span className="text-secondary">{label}</span><span className="fw-semibold text-end">{value}</span></div></div>)}</div>
          </article>;
        })}</div> : !dailyLogError ? <p className="text-secondary mb-0">No daily logs yet.</p> : null}
      </section>
    </AppShell>
  );
}
