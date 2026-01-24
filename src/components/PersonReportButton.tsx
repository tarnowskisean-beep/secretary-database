'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getPersonReportData } from '@/server/actions/reports'
import { useState } from 'react'

export default function PersonReportButton({ personId }: { personId: string }) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const data = await getPersonReportData(personId)
            if (!data) return

            const doc = new jsPDF()

            // Header
            doc.setFontSize(22)
            doc.text(`${data.firstName} ${data.lastName}`, 14, 20)

            doc.setFontSize(10)
            doc.setTextColor(100)
            if (data.internalId) {
                doc.text(`Internal ID: ${data.internalId}`, 14, 26)
            }
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32)

            // Roles Table
            doc.setFontSize(14)
            doc.setTextColor(0)
            doc.text("Board Roles", 14, 45)

            autoTable(doc, {
                startY: 50,
                head: [['Entity', 'Title', 'Type', 'Voting', 'Comp', 'Start', 'End']],
                body: data.roles.map(r => [
                    r.entity,
                    r.title,
                    r.type,
                    r.voting ? 'Yes' : 'No',
                    r.compensated ? 'Yes' : 'No',
                    r.start,
                    r.end
                ]),
                theme: 'striped',
                headStyles: { fillColor: [41, 51, 92] }
            })

            // Relationships Table
            const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 50

            if (data.relationships.length > 0) {
                doc.setFontSize(14)
                doc.text("Relationships & Conflicts", 14, finalY + 15)

                autoTable(doc, {
                    startY: finalY + 20,
                    head: [['Related Person', 'Type', 'Details']],
                    body: data.relationships.map(r => [
                        r.otherPerson,
                        r.type,
                        r.details || ''
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [41, 51, 92] }
                })
            }

            doc.save(`${data.lastName}_${data.firstName}_Report.pdf`)

        } catch (error) {
            console.error(error)
            alert("Failed to generate report")
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="btn btn-secondary"
        >
            {loading ? 'Generating...' : '📄 Download Report'}
        </button>
    )
}
