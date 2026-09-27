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

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      setEmail(userData.user.email ?? "");
      const { data: member } = await supabase.from("app_members").select("display_name, weight_kg").eq("user_id", userData.user.id).maybeSingle();
      setName(member?.display_name || userData.user.user_metadata?.display_name || userData.user.email?.split("@")[0] || "Member");
      setWeight(member?.weight_kg ? String(member.weight_kg) : "");
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

  return (
    <AppShell title={name} subtitle="Your sister showdown setup">
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
            <div><span className="fw-bold text-dark">Name:</span> December Wedding War</div>
            <div><span className="fw-bold text-dark">Start:</span> December 1, 2026</div>
            <div><span className="fw-bold text-dark">End:</span> January 1, 2027</div>
          </div>
        </section>

        <section className="soft-card p-3">
          <h3 className="section-label mb-3">Settings</h3>
          <div className="d-grid gap-2 text-secondary">
            <div>Daily reminder</div>
            <div>Sister activity</div>
            <div>Weekly results</div>
            <div>Challenge reminders</div>
          </div>
        </section>

        <button className="btn btn-outline-danger btn-lg rounded-pill" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
