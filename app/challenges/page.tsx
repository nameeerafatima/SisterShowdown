import { AppShell } from "@/app/components/AppShell";
import { weeklyChallenges } from "@/app/data/mockData";

export default function ChallengesPage() {
  return (
    <AppShell title="Challenges" subtitle="Weekly challenges">
      <div className="d-grid gap-4">
        {weeklyChallenges.map((challenge) => (
          <section key={challenge.title} className="soft-card p-3 p-sm-4">
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <p className="section-label text-primary mb-2">🔥 Weekly challenge</p>
                <h3 className="h5 fw-bolder mb-0">{challenge.emoji} {challenge.title}</h3>
              </div>
              <span className="points-badge">+{challenge.bonus}</span>
            </div>

            <p className="mt-3 text-secondary">{challenge.description}</p>

            <div className="row g-3 mt-1">
              <div className="col-6">
                <div className="list-surface">
                  <small className="section-label">You</small>
                  <div className="fw-bold mt-2">{challenge.you}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="list-surface">
                  <small className="section-label">Sister</small>
                  <div className="fw-bold mt-2">{challenge.sister}</div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
