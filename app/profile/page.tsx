"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { competition } from "@/app/data/mockData";
import { supabase } from "@/app/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("Member");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      setEmail(userData.user.email ?? "");
      const { data: member } = await supabase.from("app_members").select("display_name").eq("user_id", userData.user.id).maybeSingle();
      setName(member?.display_name || userData.user.user_metadata?.display_name || userData.user.email?.split("@")[0] || "Member");
    };

    void loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
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
