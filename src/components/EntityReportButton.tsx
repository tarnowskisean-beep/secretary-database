'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getEntityReportData } from '@/server/actions/reports'
import { useState } from 'react'

export default function EntityReportButton({ entityId }: { entityId: string }) {
    const [loading, setLoading] = useState(false)

    // Helper to load image
    const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = url
            img.crossOrigin = "Anonymous"
            img.onload = () => resolve(img)
            img.onerror = reject
        })
    }

    const handleDownload = async () => {
        setLoading(true)
        try {
            const data = await getEntityReportData(entityId)
            if (!data) return

            const doc = new jsPDF()
            let y = 20

            // Logo & Header
            if (data.logoUrl) {
                try {
                    const img = await loadImage(data.logoUrl)
                    // Maintains aspect ratio roughly, fitting in 20x20 box
                    doc.addImage(img, 'PNG', 15, y, 20, 20)
                    doc.setFontSize(22)
                    doc.text(data.legalName, 40, y + 10)
                    doc.setFontSize(10)
                    doc.setTextColor(100)
                    doc.text(`EIN: ${data.ein || 'N/A'}`, 40, y + 16)
                    y += 30
                } catch (e) {
                    console.error("Logo load failed", e)
                    doc.setFontSize(22)
                    doc.text(data.legalName, 15, y + 10)
                    y += 20
                }
            } else {
                doc.setFontSize(22)
                doc.text(data.legalName, 15, y + 10)
                y += 20
            }

            // Entity Info Details
            doc.setFontSize(10)
            doc.setTextColor(0)
            doc.text(`State of Inc: ${data.stateOfIncorporation || 'N/A'}`, 15, y)
            doc.text(`Entity Type: ${data.entityType}`, 80, y)
            doc.text(`FYE: ${data.fiscalYearEnd || 'N/A'}`, 140, y)
            y += 10

            // Board Table
            doc.setFontSize(14)
            doc.text("Board of Directors / Trustees", 15, y)
            y += 5

            const board = data.roles.filter(r => r.roleType === 'DIRECTOR' || r.roleType === 'TRUSTEE')

            autoTable(doc, {
                startY: y,
                head: [['Name', 'Title', 'Voting?', 'Compensated?', 'Term End']],
                body: board.map(r => [
                    `${r.person.firstName} ${r.person.lastName}`,
                    r.title,
                    r.votingRights ? 'Yes' : 'No',
                    r.isCompensated ? 'Yes' : 'No',
                    r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Active'
                ]),
                theme: 'striped',
                headStyles: { fillColor: [41, 51, 92] }
            })

            // @ts-expect-error - jspdf-autotable annotation
            y = doc.lastAutoTable.finalY + 15

            // Officers Table
            const officers = data.roles.filter(r => r.roleType === 'OFFICER')
            if (officers.length > 0) {
                doc.text("Officers", 15, y)
                y += 5
                autoTable(doc, {
                    startY: y,
                    head: [['Name', 'Title', 'Compensated?']],
                    body: officers.map(r => [
                        `${r.person.firstName} ${r.person.lastName}`,
                        r.title,
                        r.isCompensated ? 'Yes' : 'No'
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [41, 51, 92] }
                })
                // @ts-expect-error - jspdf-autotable annotation
                y = doc.lastAutoTable.finalY + 15
            }

            // Schedule R: Ownership & Control
            if ((data.owners && data.owners.length > 0) || (data.subsidiaries && data.subsidiaries.length > 0) || data.parentAppointsGoverningBody) {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(14)
                doc.text("Schedule R: Ownership & Control", 15, y)
                y += 8
                doc.setFontSize(10)

                // Owners
                if (data.owners && data.owners.length > 0) {
                    doc.setFont('helvetica', 'bold')
                    doc.text("Owners (Parents):", 15, y)
                    doc.setFont('helvetica', 'normal')
                    y += 5
                    data.owners.forEach((o: any) => {
                        const name = o.ownerEntity
                            ? o.ownerEntity.legalName
                            : (o.ownerPerson ? `${o.ownerPerson.firstName} ${o.ownerPerson.lastName}` : 'Unknown')

                        doc.text(`• ${name} (${o.percentage}%)`, 20, y)
                        y += 5
                    })
                    y += 3
                }

                // Subsidiaries
                if (data.subsidiaries && data.subsidiaries.length > 0) {
                    doc.setFont('helvetica', 'bold')
                    doc.text("Subsidiaries:", 15, y)
                    doc.setFont('helvetica', 'normal')
                    y += 5
                    data.subsidiaries.forEach((s: any) => {
                        doc.text(`• ${s.childEntity?.legalName || 'Unknown'} (${s.percentage}%)`, 20, y)
                        y += 5
                    })
                    y += 3
                }

                if (data.parentAppointsGoverningBody) {
                    doc.setTextColor(200, 0, 0)
                    doc.text(`Governance: Parent appoints governing body (Control)`, 15, y)
                    doc.setTextColor(0)
                    y += 6
                }
                y += 10
            }

            doc.save(`${data.legalName.replace(/\s+/g, '_')}_Report.pdf`)

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
            {loading ? 'Generating...' : '📄 Download PDF'}
        </button>
    )
}
