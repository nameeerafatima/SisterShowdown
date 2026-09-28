"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";

type EarnedBadge = { challengeId: string; badgeName: string; challengeName: string; awardedAt: string };

function formatWeight(value: number | null) {
  return value === null ? "--" : value.toFixed(1);
}

export default function ProgressPage() {
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [weightError, setWeightError] = useState("");
  const [badgeSetupNeeded, setBadgeSetupNeeded] = useState(false);

  useEffect(() => {
    const loadWeight = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data, error: memberError }, { data: winnerRows, error: winnerError }, { data: challengeRows, error: challengeError }] = await Promise.all([
        supabase.from("app_members").select("weight_kg, initial_weight_kg").eq("user_id", userData.user.id).maybeSingle(),
        supabase.from("challenge_winners").select("challenge_id, badge_name, awarded_at").eq("user_id", userData.user.id).order("awarded_at", { ascending: false }),
        supabase.from("challenges").select("id, title"),
      ]);

      if (memberError) {
        setWeightError(memberError.message);
        return;
      }

      setInitialWeight(data?.initial_weight_kg ? Number(data.initial_weight_kg) : null);
      setCurrentWeight(data?.weight_kg ? Number(data.weight_kg) : null);

      if (winnerError || challengeError) {
        setBadgeSetupNeeded(true);
        return;
      }

      const challengeNames = new Map((challengeRows ?? []).map((challenge) => [challenge.id, challenge.title]));
      setBadges((winnerRows ?? []).map((winner) => ({
        challengeId: winner.challenge_id,
        badgeName: winner.badge_name,
        challengeName: challengeNames.get(winner.challenge_id) ?? "Completed challenge",
        awardedAt: winner.awarded_at,
      })));
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
          <h2 className="section-label mb-0">Earned badges</h2>
          <span className="points-badge">{badges.length}</span>
        </div>
        {badges.length ? <div className="d-grid gap-3">{badges.map((badge) => <div key={`${badge.challengeId}-${badge.badgeName}`} className="list-surface d-flex align-items-center gap-3"><span className="fs-2">🏆</span><div><div className="fw-bold">{badge.badgeName}</div><small className="text-secondary">{badge.challengeName} · {new Date(badge.awardedAt).toLocaleDateString()}</small></div></div>)}</div> : <p className="text-secondary mb-0">{badgeSetupNeeded ? "Badge storage is not set up yet. Apply the challenge winners SQL migration." : "Challenge winner badges will appear here when you win."}</p>}
      </section>

    </AppShell>
  );
}
