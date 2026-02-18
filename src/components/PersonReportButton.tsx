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

            // -- APP LOGO (Compass Professional) --
            try {
                const response = await fetch('/logo.png')
                const blob = await response.blob()
                const base64AppLogo = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                })

                if (base64AppLogo) {
                    doc.addImage(base64AppLogo, 'PNG', 14, 5, 30, 8)
                }
            } catch (e) {
                console.error("App logo load failed", e)
            }

            // Header Text (Shifted Down)
            doc.setFontSize(22)
            doc.text(`${data.firstName} ${data.lastName}`, 14, 25)

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
                styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0], valign: 'middle' },
                headStyles: { fillColor: [14, 76, 146], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: {
                    0: { fontStyle: 'bold' }, // Entity Name
                    3: { cellWidth: 20, halign: 'center' }, // Voting
                    4: { cellWidth: 20, halign: 'center' }, // Comp
                    5: { cellWidth: 25 }, // Start
                    6: { cellWidth: 25 }  // End
                }
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
                    styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0], valign: 'middle' },
                    headStyles: { fillColor: [14, 76, 146], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    columnStyles: {
                        0: { fontStyle: 'bold' }
                    }
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
