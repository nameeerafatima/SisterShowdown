"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      const displayName = data.user.user_metadata?.display_name || email.split("@")[0];
      const { data: member, error: lookupError } = await supabase.from("app_members").select("user_id").eq("user_id", data.user.id).maybeSingle();
      if (lookupError) {
        setError(lookupError.message);
        setLoading(false);
        return;
      }
      const { error: memberError } = member ? { error: null } : await supabase.from("app_members").insert({ user_id: data.user.id, display_name: displayName });
      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }
    }
    router.replace("/dashboard");
  };

  return (
    <main className="app-shell d-flex align-items-center justify-content-center px-3 py-5">
      <div className="app-phone p-4"><section className="soft-card p-4 p-sm-5">
        <p className="section-label text-primary mb-2">Ultimate Showdown</p>
        <h1 className="h2 fw-bolder mb-2">Welcome back</h1>
        <p className="text-secondary mb-4">Sign in to continue your shared challenge.</p>
        <form className="d-grid gap-3" onSubmit={handleSubmit}>
          <input className="form-control form-control-lg" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input className="form-control form-control-lg" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <div className="alert alert-danger mb-0">{error}</div> : null}
          <button className="btn btn-primary-soft btn-lg rounded-pill" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="text-secondary text-center mt-4 mb-0">New here? <Link href="/signup">Create an account</Link></p>
      </section></div>
    </main>
  );
}