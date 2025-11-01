import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import type { User } from '@/types'

// Export to CSV
export const exportToCSV = (data: User[], filename: string = 'employees') => {
  try {
    // Prepare data for CSV
    const csvData = data.map(emp => ({
      'Employee Code': emp.employeeCode || '',
      'Full Name': emp.fullName || '',
      'Username': emp.username || '',
      'Email': emp.email || '',
      'Job Title': emp.jobTitle || '',
      'Role': emp.role || '',
      'Department': typeof emp.department === 'object' ? emp.department?.departmentName : emp.department || '',
      'Employment Type': emp.employmentType || '',
      'Work Location': emp.workLocation || '',
      'Base Salary': emp.baseSalary || '',
      'Phone': emp.phone || '',
      'Address': emp.address || '',
      'City': emp.city || '',
      'Country': emp.country || '',
      'Date of Birth': emp.dateOfBirth || '',
      'Gender': emp.gender || '',
      'Marital Status': emp.maritalStatus || '',
      'Start Date': emp.startDate || '',
      'End Date': emp.endDate || '',
      'Status': emp.active ? 'Active' : 'Inactive',
      'Created At': emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '',
    }))

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(csvData)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return true
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return false
  }
}

// Export to Excel
export const exportToExcel = (data: User[], filename: string = 'employees') => {
  try {
    // Prepare data for Excel
    const excelData = data.map(emp => ({
      'Employee Code': emp.employeeCode || '',
      'Full Name': emp.fullName || '',
      'Username': emp.username || '',
      'Email': emp.email || '',
      'Job Title': emp.jobTitle || '',
      'Role': emp.role || '',
      'Department': typeof emp.department === 'object' ? emp.department?.departmentName : emp.department || '',
      'Employment Type': emp.employmentType || '',
      'Work Location': emp.workLocation || '',
      'Base Salary': emp.baseSalary || '',
      'Phone': emp.phone || '',
      'Address': emp.address || '',
      'City': emp.city || '',
      'Country': emp.country || '',
      'Date of Birth': emp.dateOfBirth || '',
      'Gender': emp.gender || '',
      'Marital Status': emp.maritalStatus || '',
      'Emergency Contact': emp.emergencyContact || '',
      'Emergency Phone': emp.emergencyPhone || '',
      'Start Date': emp.startDate || '',
      'End Date': emp.endDate || '',
      'Status': emp.active ? 'Active' : 'Inactive',
      'Created At': emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '',
    }))

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees')

    // Set column widths
    const maxWidth = excelData.reduce((w: any, r: any) => {
      return Object.keys(r).map((key, idx) => {
        const cellValue = r[key] ? r[key].toString() : ''
        return Math.max(w[idx] || 10, cellValue.length + 2)
      })
    }, [])
    worksheet['!cols'] = maxWidth.map((w: number) => ({ wch: Math.min(w, 50) }))

    // Write file
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    return true
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    return false
  }
}

// Export to PDF
export const exportToPDF = (data: User[], filename: string = 'employees', title: string = 'Employee List') => {
  try {
    const doc = new jsPDF('landscape')
    
    // Add title
    doc.setFontSize(18)
    doc.text(title, 14, 15)
    
    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
    
    // Prepare table data
    const tableData = data.map(emp => [
      emp.employeeCode || '',
      emp.fullName || '',
      emp.email || '',
      emp.jobTitle || '',
      typeof emp.department === 'object' ? emp.department?.departmentName : emp.department || '',
      emp.employmentType || '',
      emp.baseSalary ? `$${emp.baseSalary.toLocaleString()}` : '',
      emp.phone || '',
      emp.active ? 'Active' : 'Inactive',
    ])

    // Generate table
    autoTable(doc, {
      head: [['Code', 'Name', 'Email', 'Job Title', 'Department', 'Type', 'Salary', 'Phone', 'Status']],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 28 },
    })

    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
    
    return true
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    return false
  }
}

// Print employee list
export const printEmployeeList = (data: User[], title: string = 'Employee List') => {
  try {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      console.error('Could not open print window')
      return false
    }

    const tableRows = data.map(emp => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.employeeCode || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.fullName || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.email || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.jobTitle || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${typeof emp.department === 'object' ? emp.department?.departmentName : emp.department || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.employmentType || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">$${emp.baseSalary?.toLocaleString() || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.phone || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.active ? 'Active' : 'Inactive'}</td>
      </tr>
    `).join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .report-title {
              font-size: 18px;
              color: #666;
              margin-top: 10px;
            }
            .report-date {
              font-size: 12px;
              color: #999;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #428bca;
              color: white;
              padding: 10px;
              text-align: left;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Your Company Name</div>
            <div class="report-title">${title}</div>
            <div class="report-date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Employment Type</th>
                <th>Base Salary</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print()
    }
    
    return true
  } catch (error) {
    console.error('Error printing:', error)
    return false
  }
}

// Export to Word (DOCX)
export const exportToWord = async (data: User[], filename: string = 'employees', title: string = 'Employee List') => {
  try {
    // Create header rows
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Employee Code', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Full Name', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Email', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Job Title', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Department', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Employment Type', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Base Salary', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Phone', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '428bca' },
        }),
      ],
    })

    // Create data rows
    const dataRows = data.map((emp, index) => 
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph(emp.employeeCode || '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(emp.fullName || '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(emp.email || '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(emp.jobTitle || '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(typeof emp.department === 'object' ? emp.department?.departmentName : emp.department || '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(emp.employmentType || '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(emp.baseSalary ? `$${emp.baseSalary.toLocaleString()}` : '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(emp.phone || '')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
          new TableCell({ 
            children: [new Paragraph(emp.active ? 'Active' : 'Inactive')],
            shading: index % 2 === 0 ? undefined : { fill: 'f5f5f5' }
          }),
        ],
      })
    )

    // Create the table
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
    })

    // Create the document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: 'Heading1',
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleString()}`,
                size: 20,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Employees: ${data.length}`,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),
          table,
        ],
      }],
    })

    // Generate and save the document
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.docx`)
    
    return true
  } catch (error) {
    console.error('Error exporting to Word:', error)
    return false
  }
}
