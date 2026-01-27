import { getDashboardStats } from '@/server/actions/dashboard'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

export default async function Home() {
  const stats = await getDashboardStats()

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem", background: "linear-gradient(to right, #0f172a, #64748b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Governance Intelligence
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "1.1rem" }}>
          Real-time oversight of corporate structure, board composition, and compliance risks.
        </p>

        {/* Connection Error Banner */}
        {stats.counts.entities === 0 && stats.counts.people === 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '0.5rem',
            color: '#b91c1c',
            display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <strong>Connection Error:</strong> Unable to fetch data from the database.
              Please check Vercel Logs for "Dashboard Stats Error".
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <StatsCard
          title="Total Entities"
          value={stats.counts.entities}
          icon="🏢"
          link="/entities"
          color="blue"
        />
        <StatsCard
          title="Board Members"
          value={stats.counts.people}
          icon="👥"
          link="/people"
          color="indigo"
        />
        <StatsCard
          title="High Risks"
          value={stats.counts.highRisks}
          icon="⚠️"
          link="/compliance"
          color="red"
          subtext={`${stats.counts.mediumRisks} Medium Risks detected`}
        />

      </div>

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        {/* Left Column: Recent Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Recent Activity</h2>
              <Link href="/reports" style={{ fontSize: "0.875rem", color: "var(--accent)" }}>View Reports →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {stats.recentActivity.length === 0 ? (
                <p style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>No recent activity.</p>
              ) : (
                stats.recentActivity.map(role => (
                  <div key={role.id} style={{ display: "flex", alignItems: "center", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                      📝
                    </div>
                    <div>
                      <div style={{ fontSize: "0.95rem" }}>
                        <strong>{role.person.firstName} {role.person.lastName}</strong> appointed as <strong>{role.title}</strong>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                        at {role.entity.legalName} • {new Date(role.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="card" style={{ background: "linear-gradient(145deg, var(--card), #1e1e24)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Quick Actions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Link href="/people/new" className="btn btn-secondary" style={{ justifyContent: "center" }}>
                + Add Person
              </Link>
              <Link href="/entities/new" className="btn btn-secondary" style={{ justifyContent: "center" }}>
                + Add Entity
              </Link>
              <Link href="/compliance/simulation" className="btn btn-primary" style={{ gridColumn: "1 / -1", justifyContent: "center" }}>
                Run &quot;What-If&quot; Simulation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, link, color, subtext }: { title: string, value: number | string, icon: string, link: string, color: string, subtext?: string }) {
  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    indigo: "#6366f1",
    red: "#ef4444",
    emerald: "#10b981",
    amber: "#f59e0b"
  }

  const accentColor = colorMap[color] || colorMap.blue

  return (
    <Link href={link} className="card" style={{ textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: accentColor }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--muted-foreground)" }}>{title}</span>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      </div>
      <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--foreground)", lineHeight: 1 }}>{value}</div>
      {subtext && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {subtext}
        </div>
      )}
    </Link>
  )
}
