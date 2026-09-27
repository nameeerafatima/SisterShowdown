import { AppShell } from "@/app/components/AppShell";
import { competition, activityFeed } from "@/app/data/mockData";
import { getLeadMessage } from "@/app/lib/dailyScoring";

export default function BattlePage() {
  const you = competition.leaderboard.you;
  const sister = competition.leaderboard.sister;

  return (
    <AppShell title="The Battle" subtitle="Who is winning the war?">
      <section className="soft-card p-4">
        <div className="row g-3 text-center">
          <div className="col-6">
            <div className="section-label mb-2">You</div>
            <div className="score-large text-dark">{you}</div>
          </div>
          <div className="col-6">
            <div className="section-label mb-2">Sister</div>
            <div className="score-large text-dark">{sister}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="d-flex overflow-hidden rounded-pill bg-light" style={{ height: 18 }}>
            <div className="rounded-pill" style={{ width: "51%", background: "linear-gradient(90deg, #7c3aed, #ec4899)" }} />
            <div className="rounded-pill" style={{ width: "49%", background: "linear-gradient(90deg, #34d399, #22c55e)" }} />
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3 small fw-bold text-secondary text-uppercase">
            <span>{getLeadMessage(you, sister)}</span>
            <span>this week</span>
          </div>
        </div>
      </section>

      <section className="soft-card p-3 mt-4">
        <h3 className="section-label mb-3">This week</h3>
        <div className="d-grid gap-3">
          <div className="list-surface d-flex align-items-center justify-content-between">
            <span>🥇</span>
            <span className="fw-bold">You</span>
            <span className="fw-black text-primary">58</span>
          </div>
          <div className="list-surface d-flex align-items-center justify-content-between">
            <span>🥈</span>
            <span className="fw-bold">Sister</span>
            <span className="fw-black text-danger">51</span>
          </div>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-6">
            <div className="list-surface">
              <small className="section-label">All time</small>
              <div className="fw-bold mt-2">You {you}</div>
              <small className="text-secondary">Sister {sister}</small>
            </div>
          </div>
          <div className="col-6">
            <div className="list-surface">
              <small className="section-label">Recent</small>
              <div className="fw-bold mt-2">Lead changes</div>
              <small className="text-secondary">3 times</small>
            </div>
          </div>
        </div>
      </section>

      <section className="soft-card p-3 mt-4">
        <h3 className="section-label mb-3">Activity</h3>
        <div className="d-grid gap-3">
          {activityFeed.slice(0, 3).map((item) => (
            <div key={item.text} className="list-surface d-flex align-items-start gap-3">
              <span className="fs-5">{item.emoji}</span>
              <div className="flex-grow-1">
                <div className="fw-semibold">{item.text}</div>
                <div className="fw-bold text-primary">{item.points}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
