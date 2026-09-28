import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell d-flex align-items-center justify-content-center px-3 py-5">
      <div className="app-phone p-4">
        <div className="soft-card p-4 p-sm-5 text-center">
          <p className="section-label text-primary mb-3">Ultimate Showdown</p>
          <h1 className="display-6 fw-bolder mb-3">Beat your sister, but keep it fun.</h1>
          <p className="text-secondary mb-4">
            Track habits, win challenges, and turn healthy routines into the ultimate weekly streak battle.
          </p>

          <div className="d-grid gap-3">
            <Link href="/dashboard" className="btn btn-primary-soft btn-lg rounded-pill py-3">
              Open dashboard
            </Link>
            <Link href="/log" className="btn btn-muted btn-lg rounded-pill py-3">
              Log today
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
