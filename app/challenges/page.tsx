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
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [target, setTarget] = useState(String(presets[0].defaultTarget));
  const [requiredDays, setRequiredDays] = useState("7");
  const [editingChallengeId, setEditingChallengeId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editRequiredDays, setEditRequiredDays] = useState("");
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
        supabase.from("app_members").select("user_id, display_name, is_admin"),
      ]);
      if (challengeError || logError || memberError) {
        setDatabaseError(challengeError?.message ?? logError?.message ?? memberError?.message ?? "Could not load challenge data");
        return;
      }
      const memberNames = new Map((memberRows ?? []).map((member) => [member.user_id, member.display_name]));
      setCurrentUserId(userData.user.id);
      setIsAdmin(Boolean(memberRows?.find((member) => member.user_id === userData.user.id)?.is_admin));
      setWinners(winnerError ? [] : (winnerRows ?? []).map((winner) => ({ challengeId: winner.challenge_id, userId: winner.user_id, name: memberNames.get(winner.user_id) ?? "Member", badgeName: winner.badge_name })));
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
    if (!isAdmin || endDate < startDate) return;
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

  const beginEditing = (challenge: Challenge) => {
    setEditingChallengeId(challenge.id);
    setEditStartDate(challenge.startDate);
    setEditEndDate(challenge.endDate);
    setEditTarget(String(challenge.target));
    setEditRequiredDays(String(challenge.requiredDays));
  };

  const saveChallenge = async (challenge: Challenge) => {
    if (!isAdmin || editEndDate < editStartDate) return;
    const updates = {
      start_date: editStartDate,
      end_date: editEndDate,
      target_value: Math.max(0, Number(editTarget) || 0),
      required_days: Math.max(1, Number(editRequiredDays) || 1),
    };
    const { error } = await supabase.from("challenges").update(updates).eq("id", challenge.id);
    if (error) {
      setDatabaseError(error.message);
      return;
    }
    setChallenges((current) => current.map((item) => item.id === challenge.id ? {
      ...item,
      startDate: updates.start_date,
      endDate: updates.end_date,
      target: updates.target_value,
      requiredDays: updates.required_days,
    } : item));
    setEditingChallengeId("");
  };

  const visibleChallenges = isAdmin ? challenges : challenges.filter((challenge) => challenge.endDate < today);
  const earnedBadges = winners.filter((winner) => winner.userId === currentUserId);

  return (
    <AppShell title="Challenges" subtitle="Choose a preset and make it yours">
      {isAdmin ? <section className="soft-card p-3 p-sm-4 mb-4">
        <h2 className="section-label mb-3">Create a challenge</h2>
        <div className="row g-2">{presets.map((preset) => <div key={preset.type} className="col-6"><button className={`btn w-100 text-start p-3 ${selectedPreset.type === preset.type ? "btn-dark" : "btn-light"}`} onClick={() => choosePreset(preset)}><span className="fs-4">{preset.emoji}</span><div className="fw-bold mt-1">{preset.title}</div></button></div>)}</div>
        <div className="row g-3 mt-2">
          <div className="col-6"><label className="form-label small">Start date</label><input className="form-control" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
          <div className="col-6"><label className="form-label small">End date</label><input className="form-control" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
          {(selectedPreset.type === "steps" || selectedPreset.type === "workout") && <div className="col-6"><label className="form-label small">{selectedPreset.type === "steps" ? "Target steps" : "Minimum workout minutes"}</label><input className="form-control" type="number" min="1" value={target} onChange={(event) => setTarget(event.target.value)} /></div>}
          <div className="col-6"><label className="form-label small">Required days</label><input className="form-control" type="number" min="1" value={requiredDays} onChange={(event) => setRequiredDays(event.target.value)} /></div>
        </div>
        <button className="btn btn-primary-soft rounded-pill w-100 mt-3" onClick={addChallenge}>Add challenge</button>
      </section> : <section className="soft-card p-3 p-sm-4 mb-4">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3"><h2 className="section-label mb-0">Your earned badges</h2><span className="points-badge">{earnedBadges.length}</span></div>
        {earnedBadges.length ? <div className="d-grid gap-2">{earnedBadges.map((badge) => <div key={`${badge.challengeId}-${badge.userId}`} className="list-surface d-flex align-items-center gap-3"><span className="fs-3">🏆</span><div><div className="fw-bold">{badge.badgeName}</div><small className="text-secondary">{challenges.find((challenge) => challenge.id === badge.challengeId)?.title ?? "Completed challenge"}</small></div></div>)}</div> : <p className="text-secondary mb-0">You have not earned a challenge badge yet.</p>}
      </section>}
      {databaseError ? <div className="alert alert-danger">Could not sync challenges: {databaseError}</div> : null}
      {visibleChallenges.length ? <div className="d-grid gap-4">{visibleChallenges.map((challenge) => {
        const progress = getProgress(challenge, logs);
        const challengeWinners = winners.filter((winner) => winner.challengeId === challenge.id);
        const ongoing = challenge.startDate <= today && challenge.endDate >= today;
        const editing = editingChallengeId === challenge.id;
        return <section key={challenge.id} className="soft-card p-3 p-sm-4">
          <div className="d-flex align-items-start justify-content-between gap-3"><div><p className="section-label text-primary mb-2">{challenge.startDate > today ? "Upcoming" : challenge.endDate < today ? "Completed" : "Active"}</p><h3 className="h5 fw-bolder mb-0">{challenge.emoji} {challenge.title}</h3></div><span className="points-badge">+{challenge.bonus}</span></div>
          <p className="mt-3 text-secondary mb-2">{challenge.description}</p>
          <small className="text-secondary">{challenge.startDate} to {challenge.endDate}</small>
          <div className="progress mt-3" style={{ height: 10 }}><div className="progress-bar" style={{ width: `${Math.min(100, (progress / challenge.requiredDays) * 100)}%` }} /></div>
          <div className="d-flex justify-content-between mt-2 small fw-bold"><span>{progress} successful days</span><span>{challenge.requiredDays} required</span></div>
          {challengeWinners.length ? <div className="alert alert-warning mt-3 mb-0">🏆 {challengeWinners.map((winner) => `${winner.name} · ${winner.badgeName}`).join(" and ")}</div> : challenge.endDate < today ? <p className="text-secondary small mt-3 mb-0">No winner recorded.</p> : null}
          {isAdmin && ongoing ? editing ? <>
            <div className="row g-2 mt-2">
              <div className="col-6"><label className="form-label small">Start date</label><input className="form-control" type="date" value={editStartDate} onChange={(event) => setEditStartDate(event.target.value)} /></div>
              <div className="col-6"><label className="form-label small">End date</label><input className="form-control" type="date" min={editStartDate} value={editEndDate} onChange={(event) => setEditEndDate(event.target.value)} /></div>
              {(challenge.type === "steps" || challenge.type === "workout") && <div className="col-6"><label className="form-label small">{challenge.type === "steps" ? "Target steps" : "Minimum workout minutes"}</label><input className="form-control" type="number" min="1" value={editTarget} onChange={(event) => setEditTarget(event.target.value)} /></div>}
              <div className="col-6"><label className="form-label small">Required days</label><input className="form-control" type="number" min="1" value={editRequiredDays} onChange={(event) => setEditRequiredDays(event.target.value)} /></div>
            </div>
            <div className="d-flex gap-2 mt-3"><button className="btn btn-dark rounded-pill" onClick={() => void saveChallenge(challenge)}>Save changes</button><button className="btn btn-outline-secondary rounded-pill" onClick={() => setEditingChallengeId("")}>Cancel</button></div>
          </> : <button className="btn btn-outline-dark rounded-pill mt-3" onClick={() => beginEditing(challenge)}>Modify ongoing challenge</button> : null}
        </section>;
      })}</div> : <p className="text-secondary">{isAdmin ? "No challenges yet. Start one above." : "No past challenges yet."}</p>}
    </AppShell>
  );
}
