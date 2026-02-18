'use client'

import { generateEntityBoardReport, generatePersonBoardReport } from '@/server/actions/reports'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useState } from 'react'

export default function ReportsPage() {
    const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ALL')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')

    const handleDownloadCSV = async (type: 'ENTITY' | 'PERSON') => {
        let csvData = ''
        let filename = ''

        if (type === 'ENTITY') {
            csvData = await generateEntityBoardReport(statusFilter)
            filename = `entity_boards_${statusFilter}_${new Date().toISOString().split('T')[0]}.csv`
        } else {
            csvData = await generatePersonBoardReport(statusFilter)
            filename = `person_boards_${statusFilter}_${new Date().toISOString().split('T')[0]}.csv`
        }

        const blob = new Blob([csvData], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        window.URL.revokeObjectURL(url)
    }



    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem" }}>
                <Link href="/" style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                    ← Back to Dashboard
                </Link>
                <h1 style={{ marginTop: "0.5rem" }}>Reports Center</h1>
                <p style={{ color: "var(--muted-foreground)" }}>
                    Export detailed governance data.
                </p>
            </header>

            <div style={{ display: "grid", gap: "1.5rem" }}>

                {/* CSV SECTION */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: "1.25rem", margin: 0 }}>CSV Data Exports</h2>

                        {/* Filter Control */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Status:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'ACTIVE' | 'INACTIVE' | 'ALL')}
                                className="input"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            >
                                <option value="ALL">All Records</option>
                                <option value="ACTIVE">Active Only</option>
                                <option value="INACTIVE">Inactive Only</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: "1rem" }}>
                        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ marginBottom: "0.25rem", fontSize: "1rem" }}>Entity Board List</h3>
                                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Rows for every board seat by entity.</p>
                            </div>
                            <button onClick={() => handleDownloadCSV('ENTITY')} className="btn btn-secondary">Download CSV</button>
                        </div>
                        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ marginBottom: "0.25rem", fontSize: "1rem" }}>Person Board Seats</h3>
                                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Rows for every board seat by person.</p>
                            </div>
                            <button onClick={() => handleDownloadCSV('PERSON')} className="btn btn-secondary">Download CSV</button>
                        </div>
                    </div>
                </section>

                {/* PDF SECTION */}
                <section>
                    <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", marginTop: "1rem" }}>Official Board Books (PDF)</h2>

                    <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--muted)', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Date Range Filter (Optional)</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', display: 'block' }}>Start Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', display: 'block' }}>End Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--muted-foreground)' }}>
                            If dates are set, status filter is ignored and roles active during this range are included.
                        </p>
                    </div>

                    <div className="card">
                        <div style={{ marginBottom: "1rem" }}>
                            <h3 style={{ marginBottom: "0.5rem" }}>Generate Board Book</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                Creates a formal PDF report including Entity Logos, Board Rosters, and Officer lists.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <PDFButton statusFilter={statusFilter} startDate={startDate} endDate={endDate} />
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}

function PDFButton({
    statusFilter,
    startDate,
    endDate
}: {
    statusFilter: 'ACTIVE' | 'INACTIVE' | 'ALL',
    startDate: string,
    endDate: string
}) {
    const handleDownload = async () => {
        const doc = new jsPDF()

        try {
            // Fetch data
            const data = await getReportData(statusFilter, startDate, endDate)

            let y = 20

            for (const entity of data) {
                // Add New Page for each entity (except first)
                if (y > 20) {
                    doc.addPage()
                    y = 20
                }

                // Logo
                if (entity.logoUrl) {
                    try {
                        const loadingImage = new Promise<HTMLImageElement>((resolve, reject) => {
                            const img = new Image()
                            img.src = entity.logoUrl!
                            img.onload = () => resolve(img)
                            img.onerror = reject
                        })

                        const img = await loadingImage
                        doc.addImage(img, 'PNG', 15, y, 20, 20)

                        // Title next to logo
                        doc.setFontSize(18)
                        doc.text(entity.legalName, 40, y + 10)
                        doc.setFontSize(10)
                        doc.text(`EIN: ${entity.ein || 'N/A'}`, 40, y + 16)
                        y += 30
                    } catch {
                        // Fallback if logo fails
                        doc.setFontSize(18)
                        doc.text(entity.legalName, 15, y + 10)
                        y += 20
                    }
                } else {
                    doc.setFontSize(18)
                    doc.text(entity.legalName, 15, y + 10)
                    y += 20
                }

                // Board Table
                doc.setFontSize(12)
                doc.text("Board of Directors", 15, y)
                y += 5

                const directors = entity.roles.filter((r) => r.roleType === 'DIRECTOR' || r.roleType === 'TRUSTEE')

                autoTable(doc, {
                    startY: y,
                    head: [['Name', 'Title', 'Voting', 'Term End']],
                    body: directors.map((r) => [
                        `${r.person.firstName} ${r.person.lastName}`,
                        r.title,
                        r.votingRights ? 'Yes' : 'No',
                        r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Active'
                    ])
                })

                // @ts-expect-error - jspdf-autotable annotation
                y = doc.lastAutoTable.finalY + 15

                // Officers Table
                doc.text("Officers", 15, y)
                y += 5
                const officers = entity.roles.filter((r) => r.roleType === 'OFFICER')

                autoTable(doc, {
                    startY: y,
                    head: [['Name', 'Title', 'Compensated', 'Term End']],
                    body: officers.map((r) => [
                        `${r.person.firstName} ${r.person.lastName}`,
                        r.title,
                        r.isCompensated ? 'Yes' : 'No',
                        r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Active'
                    ])
                })
                // @ts-expect-error - jspdf-autotable annotation
                y = doc.lastAutoTable.finalY + 15
            }

            doc.save('board_book.pdf')
        } catch (e) {
            console.error(e)
            alert("Failed to generate PDF")
        }
    }

    return (
        <button
            onClick={handleDownload}
            className="btn btn-primary"
        >
            Download Official PDF
        </button>
    )
}

// Server Action to fetch JSON data for PDF
import { getReportData } from '@/server/actions/reports'
