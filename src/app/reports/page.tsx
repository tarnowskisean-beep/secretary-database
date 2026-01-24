'use client'

import { generateEntityBoardReport, generatePersonBoardReport } from '@/server/actions/reports'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportsPage() {

    const handleDownloadCSV = async (type: 'ENTITY' | 'PERSON') => {
        let csvData = ''
        let filename = ''

        if (type === 'ENTITY') {
            csvData = await generateEntityBoardReport()
            filename = `entity_boards_${new Date().toISOString().split('T')[0]}.csv`
        } else {
            csvData = await generatePersonBoardReport()
            filename = `person_boards_${new Date().toISOString().split('T')[0]}.csv`
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
                    <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>CSV Data Exports</h2>
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
                    <div className="card">
                        <div style={{ marginBottom: "1rem" }}>
                            <h3 style={{ marginBottom: "0.5rem" }}>Generate Board Book</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                Creates a formal PDF report including Entity Logos, Board Rosters, and Officer lists.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <PDFButton />
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}

function PDFButton() {
    const handleDownload = async () => {
        const doc = new jsPDF()

        try {
            // Fetch data
            const data = await getReportData()

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
                    head: [['Name', 'Title', 'Compensated']],
                    body: officers.map((r) => [
                        `${r.person.firstName} ${r.person.lastName}`,
                        r.title,
                        r.isCompensated ? 'Yes' : 'No'
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
