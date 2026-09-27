"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";

function formatWeight(value: number | null) {
  return value === null ? "--" : value.toFixed(1);
}

export default function ProgressPage() {
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWeight = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error: memberError } = await supabase
        .from("app_members")
        .select("weight_kg, initial_weight_kg")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (memberError) {
        setError(memberError.message);
        return;
      }

      setInitialWeight(data?.initial_weight_kg ? Number(data.initial_weight_kg) : null);
      setCurrentWeight(data?.weight_kg ? Number(data.weight_kg) : null);
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
        {error ? <div className="alert alert-danger mt-3 mb-0">Could not load weight: {error}</div> : null}
      </section>

    </AppShell>
  );
}
