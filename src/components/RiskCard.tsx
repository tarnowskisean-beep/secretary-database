import { RiskFlag } from "@/server/actions/risk"

export default function RiskCard({ risk }: { risk: RiskFlag }) {
    const color = risk.level === 'HIGH' ? 'bg-red-500' :
        risk.level === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'

    const borderColor = risk.level === 'HIGH' ? '#ef4444' :
        risk.level === 'MEDIUM' ? '#f59e0b' : '#3b82f6'

    return (
        <div key={risk.id} className="card border-l-4" style={{ borderLeftColor: borderColor }}>
            <div className="flex justify-between items-start">
                <div style={{ width: "100%" }}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${color}`}>
                            {risk.level}
                        </span>
                        <span className="font-medium text-sm text-muted-foreground">
                            {risk.type === 'INDEPENDENCE' && "Board Governance"}
                            {risk.type === 'CONFLICT' && "Conflict of Interest"}
                            {risk.type === 'CONTROL' && "Corporate Control"}
                            {risk.type === 'SCHEDULE_R' && "Related Entity"}
                            {!['INDEPENDENCE', 'CONFLICT', 'CONTROL', 'SCHEDULE_R'].includes(risk.type) && risk.type}
                        </span>
                    </div>
                    <p className="font-medium">{risk.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">{risk.details}</p>

                    {(risk.personName || risk.entity1Name) && (
                        <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--muted-foreground)", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                            {risk.personName && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    <span>👤</span>
                                    <span>{risk.personName}</span>
                                </div>
                            )}
                            {(risk.entity1Name || risk.entity2Name) && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    <span>🏢</span>
                                    <span>
                                        {risk.entity1Name}
                                        {risk.entity2Name && ` ↔ ${risk.entity2Name}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
