"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";
import { type DailyLog } from "@/app/lib/dailyScoring";

type ChallengeType = "steps" | "workout" | "no_delivery" | "no_dessert";
type Challenge = { id: string; title: string; emoji: string; description: string; type: ChallengeType; startDate: string; endDate: string; target: number; requiredDays: number; bonus: number };
type ChallengeWinner = { challengeId: string; userId: string; name: string; badgeName: string };
const today = new Date().toISOString().slice(0, 10);
const presets = [
  { title: "10K Step Battle", emoji: "🚶", description: "Reach your step target on as many days as possible.", type: "steps" as const, bonus: 10, defaultTarget: 10000 },
  { title: "Gym Warrior", emoji: "🏋️", description: "Complete a workout above your chosen minimum duration.", type: "workout" as const, bonus: 10, defaultTarget: 30 },
  { title: "No Delivery", emoji: "🛵", description: "Complete checked-in days without ordering delivery.", type: "no_delivery" as const, bonus: 10, defaultTarget: 0 },
  { title: "No Dessert", emoji: "🍰", description: "Complete checked-in days without logging dessert.", type: "no_dessert" as const, bonus: 10, defaultTarget: 0 },
];

function getProgress(challenge: Challenge, logs: DailyLog[]) {
  return logs.filter((log) => {
    if (!log.dayCheckedIn || log.logDate < challenge.startDate || log.logDate > challenge.endDate) return false;
    if (challenge.type === "steps") return log.steps >= challenge.target;
    if (challenge.type === "workout") return log.workoutMinutes >= challenge.target;
    if (challenge.type === "no_delivery") return !log.delivery;
    return !log.dessert.trim();
  }).length;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [target, setTarget] = useState(String(presets[0].defaultTarget));
  const [requiredDays, setRequiredDays] = useState("7");
  const [databaseError, setDatabaseError] = useState("");
  const [winners, setWinners] = useState<ChallengeWinner[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const [{ data: challengeRows, error: challengeError }, { data: logRows, error: logError }, { data: winnerRows, error: winnerError }, { data: memberRows, error: memberError }] = await Promise.all([
        supabase.from("challenges").select("*").order("created_at", { ascending: false }),
        supabase.from("daily_logs").select("*").eq("user_id", userData.user.id).order("log_date", { ascending: true }),
        supabase.from("challenge_winners").select("challenge_id, user_id, badge_name"),
        supabase.from("app_members").select("user_id, display_name"),
      ]);
      if (challengeError || logError || winnerError || memberError) {
        setDatabaseError(challengeError?.message ?? logError?.message ?? winnerError?.message ?? memberError?.message ?? "Could not load challenge data");
        return;
      }
      const memberNames = new Map((memberRows ?? []).map((member) => [member.user_id, member.display_name]));
      setWinners((winnerRows ?? []).map((winner) => ({ challengeId: winner.challenge_id, userId: winner.user_id, name: memberNames.get(winner.user_id) ?? "Member", badgeName: winner.badge_name })));
      setChallenges((challengeRows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        emoji: row.challenge_type === "steps" ? "🚶" : row.challenge_type === "workout" ? "🏋️" : row.challenge_type === "no_delivery" ? "🛵" : "🍰",
        description: row.description,
        type: row.challenge_type,
        startDate: row.start_date,
        endDate: row.end_date,
        target: row.target_value,
        requiredDays: row.required_days,
        bonus: Number(row.bonus_points),
      })) as Challenge[]);
      setLogs((logRows ?? []).map((row) => ({
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
      })) as DailyLog[]);
    };

    void loadData();
  }, []);

  const choosePreset = (preset: typeof presets[number]) => { setSelectedPreset(preset); setTarget(String(preset.defaultTarget)); };
  const addChallenge = async () => {
    if (endDate < startDate) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase.from("challenges").insert({
      title: selectedPreset.title,
      description: selectedPreset.description,
      challenge_type: selectedPreset.type,
      start_date: startDate,
      end_date: endDate,
      target_value: Number(target) || 0,
      required_days: Math.max(1, Number(requiredDays) || 1),
      bonus_points: selectedPreset.bonus,
      created_by: userData.user.id,
    }).select().single();
    if (error) {
      setDatabaseError(error.message);
      return;
    }
    if (!data) return;
    setChallenges((current) => [{ id: data.id, title: data.title, emoji: selectedPreset.emoji, description: data.description, type: data.challenge_type, startDate: data.start_date, endDate: data.end_date, target: data.target_value, requiredDays: data.required_days, bonus: Number(data.bonus_points) }, ...current]);
  };

  return (
    <AppShell title="Challenges" subtitle="Choose a preset and make it yours">
      <section className="soft-card p-3 p-sm-4 mb-4">
        <h2 className="section-label mb-3">Create a challenge</h2>
        <div className="row g-2">{presets.map((preset) => <div key={preset.type} className="col-6"><button className={`btn w-100 text-start p-3 ${selectedPreset.type === preset.type ? "btn-dark" : "btn-light"}`} onClick={() => choosePreset(preset)}><span className="fs-4">{preset.emoji}</span><div className="fw-bold mt-1">{preset.title}</div></button></div>)}</div>
        <div className="row g-3 mt-2">
          <div className="col-6"><label className="form-label small">Start date</label><input className="form-control" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
          <div className="col-6"><label className="form-label small">End date</label><input className="form-control" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
          {(selectedPreset.type === "steps" || selectedPreset.type === "workout") && <div className="col-6"><label className="form-label small">{selectedPreset.type === "steps" ? "Target steps" : "Minimum workout minutes"}</label><input className="form-control" type="number" min="1" value={target} onChange={(event) => setTarget(event.target.value)} /></div>}
          <div className="col-6"><label className="form-label small">Required days</label><input className="form-control" type="number" min="1" value={requiredDays} onChange={(event) => setRequiredDays(event.target.value)} /></div>
        </div>
        <button className="btn btn-primary-soft rounded-pill w-100 mt-3" onClick={addChallenge}>Add challenge</button>
      </section>
      {databaseError ? <div className="alert alert-danger">Could not sync challenges: {databaseError}</div> : null}
      <div className="d-grid gap-4">{challenges.map((challenge) => { const progress = getProgress(challenge, logs); const challengeWinners = winners.filter((winner) => winner.challengeId === challenge.id); return <section key={challenge.id} className="soft-card p-3 p-sm-4"><div className="d-flex align-items-start justify-content-between gap-3"><div><p className="section-label text-primary mb-2">{challenge.startDate > today ? "Upcoming" : challenge.endDate < today ? "Completed" : "Active"}</p><h3 className="h5 fw-bolder mb-0">{challenge.emoji} {challenge.title}</h3></div><span className="points-badge">+{challenge.bonus}</span></div><p className="mt-3 text-secondary mb-2">{challenge.description}</p><small className="text-secondary">{challenge.startDate} to {challenge.endDate}</small><div className="progress mt-3" style={{ height: 10 }}><div className="progress-bar" style={{ width: `${Math.min(100, (progress / challenge.requiredDays) * 100)}%` }} /></div><div className="d-flex justify-content-between mt-2 small fw-bold"><span>{progress} successful days</span><span>{challenge.requiredDays} required</span></div>{challengeWinners.length > 0 ? <div className="alert alert-warning mt-3 mb-0">🏆 {challengeWinners.map((winner) => `${winner.name} · ${winner.badgeName}`).join(" and ")}</div> : null}</section>; })}</div>
    </AppShell>
  );
}
