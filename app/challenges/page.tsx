"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { DAILY_LOG_HISTORY_STORAGE_KEY, type DailyLog } from "@/app/lib/dailyScoring";

type ChallengeType = "steps" | "workout" | "no_delivery" | "no_dessert";
type Challenge = { id: string; title: string; emoji: string; description: string; type: ChallengeType; startDate: string; endDate: string; target: number; requiredDays: number; bonus: number };
const CHALLENGES_STORAGE_KEY = "sister-showdown-challenges";
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

  useEffect(() => {
    const storedChallenges = localStorage.getItem(CHALLENGES_STORAGE_KEY);
    const storedLogs = localStorage.getItem(DAILY_LOG_HISTORY_STORAGE_KEY);
    if (storedChallenges) setChallenges(JSON.parse(storedChallenges) as Challenge[]);
    if (storedLogs) setLogs(JSON.parse(storedLogs) as DailyLog[]);
  }, []);

  const choosePreset = (preset: typeof presets[number]) => { setSelectedPreset(preset); setTarget(String(preset.defaultTarget)); };
  const addChallenge = () => {
    if (endDate < startDate) return;
    const next: Challenge = { id: crypto.randomUUID(), title: selectedPreset.title, emoji: selectedPreset.emoji, description: selectedPreset.description, type: selectedPreset.type, startDate, endDate, target: Number(target) || 0, requiredDays: Math.max(1, Number(requiredDays) || 1), bonus: selectedPreset.bonus };
    const nextChallenges = [next, ...challenges];
    setChallenges(nextChallenges);
    localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(nextChallenges));
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
      <div className="d-grid gap-4">{challenges.map((challenge) => { const progress = getProgress(challenge, logs); return <section key={challenge.id} className="soft-card p-3 p-sm-4"><div className="d-flex align-items-start justify-content-between gap-3"><div><p className="section-label text-primary mb-2">{challenge.startDate > today ? "Upcoming" : challenge.endDate < today ? "Completed" : "Active"}</p><h3 className="h5 fw-bolder mb-0">{challenge.emoji} {challenge.title}</h3></div><span className="points-badge">+{challenge.bonus}</span></div><p className="mt-3 text-secondary mb-2">{challenge.description}</p><small className="text-secondary">{challenge.startDate} to {challenge.endDate}</small><div className="progress mt-3" style={{ height: 10 }}><div className="progress-bar" style={{ width: `${Math.min(100, (progress / challenge.requiredDays) * 100)}%` }} /></div><div className="d-flex justify-content-between mt-2 small fw-bold"><span>{progress} successful days</span><span>{challenge.requiredDays} required</span></div></section>; })}</div>
    </AppShell>
  );
}
