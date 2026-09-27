import { AppShell } from "@/app/components/AppShell";

export default function ProfilePage() {
  return (
    <AppShell title="Profile" subtitle="Your sister showdown setup">
      <div className="d-grid gap-4">
        <section className="soft-card p-3">
          <div className="d-flex align-items-center gap-3">
            <div className="hero-avatar">👩</div>
            <div>
              <h3 className="fw-bolder mb-1">Ava</h3>
              <small className="text-secondary">ava@example.com</small>
            </div>
          </div>
        </section>

        <section className="soft-card p-3">
          <h3 className="section-label mb-3">Competition</h3>
          <div className="d-grid gap-2 text-secondary">
            <div><span className="fw-bold text-dark">Name:</span> December Wedding War</div>
            <div><span className="fw-bold text-dark">Start:</span> Sep 1, 2026</div>
            <div><span className="fw-bold text-dark">End:</span> Nov 24, 2026</div>
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
      </div>
    </AppShell>
  );
}
