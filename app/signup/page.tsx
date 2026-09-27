"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (data.session && data.user) {
      const { error: memberError } = await supabase.from("app_members").upsert({ user_id: data.user.id, display_name: name, weight_kg: Number(weight) });
      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
    } else {
      setError("Account created. Check your email before signing in.");
    }
    setLoading(false);
  };

  return (
    <main className="app-shell d-flex align-items-center justify-content-center px-3 py-5">
      <div className="app-phone p-4"><section className="soft-card p-4 p-sm-5">
        <p className="section-label text-primary mb-2">Sister Showdown</p>
        <h1 className="h2 fw-bolder mb-2">Create your account</h1>
        <p className="text-secondary mb-4">Make a private account for the challenge.</p>
        <form className="d-grid gap-3" onSubmit={handleSubmit}>
          <input className="form-control form-control-lg" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required />
          <div>
            <label className="form-label small text-secondary">Weight (kg)</label>
            <input className="form-control form-control-lg" type="number" min="1" max="499" step="0.1" placeholder="60.5" value={weight} onChange={(event) => setWeight(event.target.value)} required />
          </div>
          <input className="form-control form-control-lg" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input className="form-control form-control-lg" type="password" placeholder="Password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <div className="alert alert-info mb-0">{error}</div> : null}
          <button className="btn btn-primary-soft btn-lg rounded-pill" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        </form>
        <p className="text-secondary text-center mt-4 mb-0">Already registered? <Link href="/login">Sign in</Link></p>
      </section></div>
    </main>
  );
}