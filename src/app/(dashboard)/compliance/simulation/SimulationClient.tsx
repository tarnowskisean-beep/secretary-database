'use client'

import { useState } from 'react'
import { simulateRisks, SimulationModification, RiskFlag } from '@/server/actions/risk'
import { OverlapResult } from '@/server/actions/analysis'
import RiskCard from '@/components/RiskCard'

type Props = {
    initialPeople: { id: string, firstName: string, lastName: string }[]
    initialEntities: { id: string, legalName: string }[]
}

export default function SimulationClient({ initialPeople, initialEntities }: Props) {
    const [modifications, setModifications] = useState<SimulationModification[]>([])
    const [results, setResults] = useState<{ risks: RiskFlag[], overlaps: OverlapResult[] } | null>(null)
    const [loading, setLoading] = useState(false)

    // Form State
    const [actionType, setActionType] = useState<'ADD' | 'REMOVE'>('ADD')
    const [selectedPerson, setSelectedPerson] = useState(initialPeople[0]?.id || '')
    const [selectedEntity, setSelectedEntity] = useState(initialEntities[0]?.id || '')
    const [roleType, setRoleType] = useState('DIRECTOR')
    const [isCompensated, setIsCompensated] = useState(false)
    const [votingRights, setVotingRights] = useState(true)

    // Relationship Form State
    const [activeTab, setActiveTab] = useState<'ROLE' | 'RELATIONSHIP'>('ROLE')
    const [relPerson1, setRelPerson1] = useState(initialPeople[0]?.id || '')
    const [relPerson2, setRelPerson2] = useState(initialPeople.length > 1 ? initialPeople[1].id : '')
    const [relType, setRelType] = useState('BUSINESS')

    // Filter State
    const [riskFilter, setRiskFilter] = useState<string>('ALL')

    const handleAdd = async () => {
        let newMod: SimulationModification

        if (activeTab === 'ROLE') {
            newMod = {
                type: actionType,
                personId: selectedPerson,
                entityId: selectedEntity,
                roleType: actionType === 'ADD' ? roleType : undefined,
                isCompensated: actionType === 'ADD' ? isCompensated : undefined,
                votingRights: actionType === 'ADD' ? votingRights : undefined
            }
        } else {
            if (relPerson1 === relPerson2) {
                alert("Cannot create relationship with self")
                return
            }
            newMod = {
                type: 'ADD_RELATIONSHIP',
                personId: relPerson1,
                person2Id: relPerson2,
                relType
            }
        }
        const newMods = [...modifications, newMod]
        setModifications(newMods)
        await runSimulation(newMods)
    }

    const handleRemoveMod = async (index: number) => {
        const newMods = modifications.filter((_, i) => i !== index)
        setModifications(newMods)
        if (newMods.length === 0) {
            setResults(null)
        } else {
            await runSimulation(newMods)
        }
    }

    const handleClearAll = () => {
        setModifications([])
        setResults(null)
    }

    const runSimulation = async (mods: SimulationModification[]) => {
        setLoading(true)
        try {
            const res = await simulateRisks(mods)
            setResults(res)
            setRiskFilter('ALL') // Reset filter on new simulation
        } catch (e) {
            console.error(e)
            alert('Simulation failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

            {/* Controls */}
            <div className="card">
                <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Scenario Builder</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", background: "var(--muted)", padding: "0.25rem", borderRadius: "calc(var(--radius) + 2px)", marginBottom: "1.5rem" }}>
                        <button
                            onClick={() => setActiveTab('ROLE')}
                            style={{
                                flex: 1,
                                padding: "0.5rem",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                borderRadius: "var(--radius)",
                                border: "none",
                                cursor: "pointer",
                                background: activeTab === 'ROLE' ? "var(--background)" : "transparent",
                                color: activeTab === 'ROLE' ? "var(--foreground)" : "var(--muted-foreground)",
                                boxShadow: activeTab === 'ROLE' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                transition: "all 0.2s ease"
                            }}
                        >
                            Board Role
                        </button>
                        <button
                            onClick={() => setActiveTab('RELATIONSHIP')}
                            style={{
                                flex: 1,
                                padding: "0.5rem",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                borderRadius: "var(--radius)",
                                border: "none",
                                cursor: "pointer",
                                background: activeTab === 'RELATIONSHIP' ? "var(--background)" : "transparent",
                                color: activeTab === 'RELATIONSHIP' ? "var(--foreground)" : "var(--muted-foreground)",
                                boxShadow: activeTab === 'RELATIONSHIP' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                transition: "all 0.2s ease"
                            }}
                        >
                            Relationship
                        </button>
                    </div>

                    {activeTab === 'ROLE' ? (
                        <>
                            {/* Action Type Toggle */}
                            <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
                                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                    <input
                                        type="radio"
                                        name="actionType"
                                        checked={actionType === 'ADD'}
                                        onChange={() => setActionType('ADD')}
                                        style={{ marginRight: "0.5rem" }}
                                    />
                                    <span style={{ fontWeight: 500 }}>Add Person</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                    <input
                                        type="radio"
                                        name="actionType"
                                        checked={actionType === 'REMOVE'}
                                        onChange={() => setActionType('REMOVE')}
                                        style={{ marginRight: "0.5rem" }}
                                    />
                                    <span style={{ fontWeight: 500 }}>Remove Person</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Person</label>
                                <select
                                    className="input"
                                    value={selectedPerson}
                                    onChange={e => setSelectedPerson(e.target.value)}
                                >
                                    {initialPeople.map(p => (
                                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Entity</label>
                                <select
                                    className="input"
                                    value={selectedEntity}
                                    onChange={e => setSelectedEntity(e.target.value)}
                                >
                                    {initialEntities.map(e => (
                                        <option key={e.id} value={e.id}>{e.legalName}</option>
                                    ))}
                                </select>
                            </div>

                            {actionType === 'ADD' && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Role Type</label>
                                        <select
                                            className="input"
                                            value={roleType}
                                            onChange={e => setRoleType(e.target.value)}
                                        >
                                            <option value="DIRECTOR">Director</option>
                                            <option value="OFFICER">Officer</option>
                                            <option value="TRUSTEE">Trustee</option>
                                            <option value="KEY_EMPLOYEE">Key Employee</option>
                                        </select>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "1.5rem" }}>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <input
                                                type="checkbox"
                                                id="comp"
                                                checked={isCompensated}
                                                onChange={e => setIsCompensated(e.target.checked)}
                                                style={{ marginRight: "0.5rem" }}
                                            />
                                            <label htmlFor="comp">Compensated?</label>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <input
                                                type="checkbox"
                                                id="vote"
                                                checked={votingRights}
                                                onChange={e => setVotingRights(e.target.checked)}
                                                style={{ marginRight: "0.5rem" }}
                                            />
                                            <label htmlFor="vote">Voting?</label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Person 1</label>
                                <select
                                    className="input"
                                    value={relPerson1}
                                    onChange={e => setRelPerson1(e.target.value)}
                                >
                                    {initialPeople.map(p => (
                                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Person 2</label>
                                <select
                                    className="input"
                                    value={relPerson2}
                                    onChange={e => setRelPerson2(e.target.value)}
                                >
                                    {initialPeople.map(p => (
                                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Relationship Type</label>
                                <select
                                    className="input"
                                    value={relType}
                                    onChange={e => setRelType(e.target.value)}
                                >
                                    <option value="BUSINESS">Business</option>
                                    <option value="FAMILY">Family</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleAdd}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? 'Simulating...' : 'Apply Change'}
                    </button>
                </div>

                {modifications.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 className="font-semibold">Active Modifications</h3>
                            <button
                                onClick={handleClearAll}
                                style={{ fontSize: '0.75rem', color: 'var(--destructive)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                                Clear All
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {modifications.map((m, i) => {
                                const p = initialPeople.find(px => px.id === m.personId)
                                const e = initialEntities.find(ex => ex.id === m.entityId)
                                return (
                                    <li key={i} className="text-sm border p-2 rounded flex justify-between items-center bg-gray-50">
                                        <span>
                                            {m.type === 'ADD' ? (
                                                <>
                                                    <span className="font-bold text-green-600">[ADD]</span> {p?.firstName} {p?.lastName} → {e?.legalName}
                                                </>
                                            ) : m.type === 'REMOVE' ? (
                                                <>
                                                    <span className="font-bold text-red-600">[REMOVE]</span> {p?.firstName} {p?.lastName} ❌ {e?.legalName}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-bold text-blue-600">[REL]</span> {p?.firstName} {p?.lastName} ↔ {initialPeople.find(px => px.id === m.person2Id)?.firstName} {initialPeople.find(px => px.id === m.person2Id)?.lastName} ({m.relType})
                                                </>
                                            )}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveMod(i)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            ✕
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {/* Results */}
            <div>
                <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Projected Impact</h2>

                {!results && (
                    <div className="card text-center text-muted-foreground py-10">
                        Configure a scenario on the left to see projected risks and overlaps.
                    </div>
                )}

                {results && (
                    <div className="space-y-8">

                        {/* Summary Banner */}
                        {results.risks.filter(r => r.isNew).length > 0 ? (
                            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-6 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-red-700 flex items-center gap-2 mb-2">
                                            ⚠️ Compliance Issues Detected
                                        </h3>
                                        <p className="text-red-800 text-lg">
                                            This scenario creates <span className="font-bold">{results.risks.filter(r => r.isNew).length} new compliance risks</span> that require attention.
                                        </p>
                                    </div>
                                    <div className="text-4xl font-bold text-red-200">
                                        {results.risks.filter(r => r.isNew).length}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-6 shadow-sm">
                                <h3 className="text-xl font-bold text-green-700 flex items-center gap-2 mb-1">
                                    ✅ No New Compliance Risks
                                </h3>
                                <p className="text-green-800">
                                    This scenario does not trigger any new compliance flags based on current rules.
                                </p>
                            </div>
                        )}

                        {/* Risks Section */}
                        {results.risks.filter(r => r.isNew).length > 0 && (
                            <section>
                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                        Scenario Impacts (NEW)
                                    </h3>
                                    <select
                                        value={riskFilter}
                                        onChange={(e) => setRiskFilter(e.target.value)}
                                        className="text-sm border rounded px-2 py-1 bg-white"
                                    >
                                        <option value="ALL">All Issues</option>
                                        {Array.from(new Set(results.risks.filter(r => r.isNew).map(r => r.type))).map(t => (
                                            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-4">
                                    {results.risks
                                        .filter(r => r.isNew && (riskFilter === 'ALL' || r.type === riskFilter))
                                        .map(risk => (
                                            <RiskCard key={risk.id} risk={risk} />
                                        ))}
                                </div>
                            </section>
                        )}

                        {/* Overlaps Section */}
                        {/* Overlaps Section Removed as per request */}

                    </div>
                )}
            </div>
        </div>
    )
}
