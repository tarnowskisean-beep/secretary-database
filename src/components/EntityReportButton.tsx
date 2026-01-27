'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getEntityReportData, fetchImageBase64 } from '@/server/actions/reports'
import { useState } from 'react'

export default function EntityReportButton({ entityId }: { entityId: string }) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const data = await getEntityReportData(entityId)
            if (!data) return

            const doc = new jsPDF()
            const pageWidth = doc.internal.pageSize.width
            let y = 20

            // -- UTILS --
            const addHeader = (text: string, yPos: number) => {
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(0, 0, 0)
                doc.text(text, 15, yPos)
                doc.setDrawColor(200, 200, 200)
                doc.line(15, yPos + 2, pageWidth - 15, yPos + 2)
                return yPos + 10
            }

            const addText = (label: string, value: string, x: number, yPos: number) => {
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(80, 80, 80)
                doc.text(label, x, yPos)
                const labelWidth = doc.getTextWidth(label)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(0, 0, 0)
                doc.text(value, x + labelWidth + 2, yPos)
            }

            // -- HEADER --
            // Top Right Confidential Marker
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text("CONFIDENTIAL GOVERNANCE REPORT", pageWidth - 15, 10, { align: 'right' })

            // Logo & Title
            let logoOffset = 0
            if (data.logoUrl) {
                try {
                    // Fetch image via server to avoid CORS
                    const base64Img = await fetchImageBase64(data.logoUrl)
                    if (base64Img) {
                        // Load image to get dimensions
                        const img = new Image()
                        img.src = base64Img
                        await new Promise((resolve) => { img.onload = resolve })

                        // Calculate aspect ratio
                        const maxWidth = 50
                        const maxHeight = 25
                        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)

                        const width = img.width * ratio
                        const height = img.height * ratio

                        // Determine format from base64 header or let jspdf auto-detect
                        const format = base64Img.match(/data:image\/(\w+);base64/)?.[1]?.toUpperCase() || 'PNG'

                        doc.addImage(base64Img, format, 15, 15, width, height)
                        logoOffset = width + 5
                    }
                } catch (e) {
                    console.error("Logo load failed", e)
                }
            }

            // Entity Name (Large, Bold)
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 0)
            doc.text(data.legalName, 15 + logoOffset, 25)

            // Subtitle / EIN
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100, 100, 100)
            doc.text(`EIN: ${data.ein || 'N/A'}  |  Type: ${data.entityType}`, 15 + logoOffset, 32)

            y = 50

            // -- SECTION 1: GENERAL INFO --
            y = addHeader("ENTITY DETAILS", y)
            y += 5

            addText("State of Formation:", data.stateOfIncorporation || 'N/A', 15, y)
            addText("Tax Classification:", data.taxClassification || 'N/A', 100, y)
            y += 6
            addText("Fiscal Year End:", data.fiscalYearEnd || 'N/A', 15, y)
            addText("Status:", "Active", 100, y) // Placeholder if status isn't in data
            y += 15


            // -- SECTION 2: GOVERNANCE --
            y = addHeader("GOVERNANCE & LEADERSHIP", y)
            y += 5

            // Board Table
            const board = data.roles.filter(r => r.roleType === 'DIRECTOR' || r.roleType === 'TRUSTEE')
            if (board.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.text("Board of Directors / Trustees", 15, y)
                y += 2

                autoTable(doc, {
                    startY: y + 2,
                    head: [['Name', 'Title', 'Voting', 'Comp', 'Term End']],
                    body: board.map(r => [
                        `${r.person.firstName} ${r.person.lastName}`,
                        r.title,
                        r.votingRights ? 'Yes' : 'No',
                        r.isCompensated ? 'Yes' : 'No',
                        r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Active'
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 1, textColor: [0, 0, 0] },
                    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    columnStyles: {
                        0: { fontStyle: 'bold' }
                    }
                })
                // @ts-expect-error - jspdf-autotable annotation
                y = doc.lastAutoTable.finalY + 10
            }

            // Officers Table
            const officers = data.roles.filter(r => r.roleType === 'OFFICER')
            if (officers.length > 0) {
                // Check page break
                if (y > 250) { doc.addPage(); y = 20; }

                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.text("Officers & Key Employees", 15, y)
                y += 2

                autoTable(doc, {
                    startY: y + 2,
                    head: [['Name', 'Title', 'Compensated', 'Start Date']],
                    body: officers.map(r => [
                        `${r.person.firstName} ${r.person.lastName}`,
                        r.title,
                        r.isCompensated ? 'Yes' : 'No',
                        r.startDate ? new Date(r.startDate).toLocaleDateString() : '-'
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 1, textColor: [0, 0, 0] },
                    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    columnStyles: {
                        0: { fontStyle: 'bold' }
                    }
                })
                // @ts-expect-error - jspdf-autotable annotation
                y = doc.lastAutoTable.finalY + 15
            } else {
                y += 5
            }


            // -- SECTION 3: SCHEDULE R STRUCTURE --
            if ((data.owners && data.owners.length > 0) || (data.subsidiaries && data.subsidiaries.length > 0)) {
                if (y > 220) { doc.addPage(); y = 20; }

                y = addHeader("OWNERSHIP & CONTROL (SCHEDULE R)", y)
                y += 5

                // Owners
                if (data.owners && data.owners.length > 0) {
                    doc.setFontSize(11)
                    doc.setFont('helvetica', 'bold')
                    doc.text("Controlling Owners", 15, y)
                    y += 4

                    data.owners.forEach((o: any) => {
                        const name = o.ownerEntity
                            ? o.ownerEntity.legalName
                            : (o.ownerPerson ? `${o.ownerPerson.firstName} ${o.ownerPerson.lastName}` : 'Unknown')

                        doc.setFontSize(10)
                        doc.setFont('helvetica', 'bold')
                        doc.text(`• ${name}`, 20, y)
                        doc.setFont('helvetica', 'normal')
                        doc.text(` (${o.percentage}% Ownership)`, 20 + doc.getTextWidth(`• ${name}`), y)
                        y += 5
                    })
                    y += 5
                }

                // Subsidiaries
                if (data.subsidiaries && data.subsidiaries.length > 0) {
                    doc.setFontSize(11)
                    doc.setFont('helvetica', 'bold')
                    doc.text("Subsidiaries & Downstream Entities", 15, y)
                    y += 4

                    data.subsidiaries.forEach((s: any) => {
                        doc.setFontSize(10)
                        doc.setFont('helvetica', 'bold')
                        doc.text(`• ${s.childEntity?.legalName || 'Unknown'}`, 20, y)
                        doc.setFont('helvetica', 'normal')
                        doc.text(` (${s.percentage}% Controlled)`, 20 + doc.getTextWidth(`• ${s.childEntity?.legalName || 'Unknown'}`), y)
                        y += 5
                    })
                }
            }

            // -- FOOTER --
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} of ${pageCount}  |  Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
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
