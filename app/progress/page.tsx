import { AppShell } from "@/app/components/AppShell";
import { badges } from "@/app/data/mockData";

export default function ProgressPage() {
  return (
    <AppShell title="Progress" subtitle="Your growth story">
      <section className="soft-card p-3">
        <div className="row g-3 text-center">
          <div className="col-4">
            <div className="list-surface">
              <small className="section-label">Start</small>
              <div className="fw-bold mt-2">72.4</div>
              <small className="text-secondary">kg</small>
            </div>
          </div>
          <div className="col-4">
            <div className="list-surface">
              <small className="section-label">Current</small>
              <div className="fw-bold mt-2">68.9</div>
              <small className="text-secondary">kg</small>
            </div>
          </div>
          <div className="col-4">
            <div className="list-surface" style={{ background: "#f5f3ff" }}>
              <small className="section-label">Change</small>
              <div className="fw-bold mt-2 text-primary">-3.5</div>
              <small className="text-primary">kg</small>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-4 p-3" style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff7fb 100%)" }}>
          <div className="d-flex align-items-end gap-2 h-100" style={{ height: 140 }}>
            {[42, 58, 52, 70, 68, 80, 92].map((height, index) => (
              <div key={index} className="flex-fill rounded-top" style={{ height: `${height}%`, background: "linear-gradient(180deg, #8b5cf6 0%, #ec4899 100%)", borderRadius: "12px 12px 0 0" }} />
            ))}
          </div>
        </div>
      </section>

      <section className="soft-card p-3 mt-4">
        <h3 className="section-label mb-3">Badges</h3>
        <div className="row g-3">
          {badges.map((badge) => (
            <div key={badge.name} className="col-6">
              <div className="list-surface d-flex align-items-center gap-2">
                <span className="fs-5">{badge.icon}</span>
                <span className="fw-bold small">{badge.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
