"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { supabase } from "@/app/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("Member");
  const [email, setEmail] = useState("");
  const [weight, setWeight] = useState("");
  const [weightMessage, setWeightMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [competitionId, setCompetitionId] = useState("");
  const [competitionStart, setCompetitionStart] = useState("2026-09-28");
  const [competitionEnd, setCompetitionEnd] = useState("2027-01-01");
  const [competitionMessage, setCompetitionMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      setEmail(userData.user.email ?? "");
      const [{ data: member }, { data: competition }] = await Promise.all([
        supabase.from("app_members").select("display_name, weight_kg, is_admin").eq("user_id", userData.user.id).maybeSingle(),
        supabase.from("competitions").select("id, start_date, end_date").limit(1).maybeSingle(),
      ]);
      setName(member?.display_name || userData.user.user_metadata?.display_name || userData.user.email?.split("@")[0] || "Member");
      setWeight(member?.weight_kg ? String(member.weight_kg) : "");
      setIsAdmin(Boolean(member?.is_admin));
      if (competition) {
        setCompetitionId(competition.id);
        setCompetitionStart(competition.start_date);
        setCompetitionEnd(competition.end_date);
      }
    };

    void loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const updateWeight = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !weight || Number(weight) <= 0) return;

    const { error } = await supabase.from("app_members").update({ weight_kg: Number(weight) }).eq("user_id", userData.user.id);
    setWeightMessage(error ? error.message : "Weight updated");
  };

  const updateCompetition = async () => {
    if (!isAdmin || !competitionId || competitionEnd < competitionStart) return;
    const { error } = await supabase.from("competitions").update({ start_date: competitionStart, end_date: competitionEnd, updated_at: new Date().toISOString() }).eq("id", competitionId);
    setCompetitionMessage(error ? error.message : "Competition settings updated");
  };

  return (
    <AppShell title={name} subtitle="Your Ultimate Showdown setup">
      <div className="d-grid gap-4">
        <section className="soft-card p-3">
          <div className="d-flex align-items-center gap-3">
            <div className="hero-avatar">👩</div>
            <div>
              <h3 className="fw-bolder mb-1">{name}</h3>
              <small className="text-secondary">{email}</small>
            </div>
          </div>
        </section>

        <section className="soft-card p-3">
          <h3 className="section-label mb-3">Weight</h3>
          <div className="input-group">
            <input className="form-control form-control-lg" type="number" min="1" max="499" step="0.1" placeholder="Enter weight" value={weight} onChange={(event) => setWeight(event.target.value)} />
            <span className="input-group-text">kg</span>
            <button className="btn btn-dark" onClick={updateWeight}>Update</button>
          </div>
          {weightMessage ? <small className="text-secondary d-block mt-2">{weightMessage}</small> : null}
        </section>

        <section className="soft-card p-3">
          <h3 className="section-label mb-3">Competition</h3>
          <div className="d-grid gap-2 text-secondary">
            <div><span className="fw-bold text-dark">Name:</span> Year End Challenge</div>
            {isAdmin ? <>
              <label className="form-label small mb-0 mt-2">Start</label>
              <input className="form-control" type="date" value={competitionStart} onChange={(event) => setCompetitionStart(event.target.value)} />
              <label className="form-label small mb-0 mt-2">End</label>
              <input className="form-control" type="date" min={competitionStart} value={competitionEnd} onChange={(event) => setCompetitionEnd(event.target.value)} />
              <button className="btn btn-dark rounded-pill mt-2" onClick={updateCompetition}>Save competition</button>
            </> : <>
              <div><span className="fw-bold text-dark">Start:</span> {new Date(`${competitionStart}T00:00:00`).toLocaleDateString()}</div>
              <div><span className="fw-bold text-dark">End:</span> {new Date(`${competitionEnd}T00:00:00`).toLocaleDateString()}</div>
            </>}
          </div>
          {competitionMessage ? <small className="text-secondary d-block mt-2">{competitionMessage}</small> : null}
        </section>

        <button className="btn btn-outline-danger btn-lg rounded-pill" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
