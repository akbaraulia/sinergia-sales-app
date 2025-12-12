/**
 * Email Template Helper
 * HTML email templates for report scheduler
 */

export interface EmailTemplateData {
  dateRange: {
    start: string
    end: string
  }
  csvFiles: Array<{
    filename: string
    size_kb: number
    rows: number
    generated: boolean
  }>
  /** Optional: Report type for single report emails */
  reportType?: string
  /** Optional: Description from ERP scheduler config */
  description?: string
}

/**
 * Generate HTML email for report scheduler
 */
export function generateReportEmail(data: EmailTemplateData): string {
  const { dateRange, csvFiles, reportType, description } = data

  // Use specific report type if provided, otherwise generic title
  const emailTitle = reportType ? `Report ${reportType}` : 'Report Replenishment'
  const headerSubtitle = description || 'Sinergia Beaute Indonesia'

  // Generate report items HTML
  const reportItemsHtml = csvFiles.map(file => {
    if (file.generated) {
      return `
      <div class="report-item">
        <div class="report-item-title">
          <span class="icon">✅</span>
          <span>${file.filename.includes('sivfu') ? 'Replenishment SIVFU' : file.filename.includes('combined') ? 'Replenishment Combined' : 'Replenishment (ERP)'}</span>
        </div>
        <div class="report-item-details">
          <span>📄 ${file.filename}</span>
          <span>📊 ${file.rows} rows</span>
          <span>💾 ${file.size_kb.toFixed(2)} KB</span>
        </div>
      </div>
      `
    } else {
      return `
      <div class="report-item disabled">
        <div class="report-item-title">
          <span class="icon">⚠️</span>
          <span>${file.filename} - Not Generated</span>
        </div>
      </div>
      `
    }
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Replenishment - Sinergia Beaute Indonesia</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #729A4B 0%, #5a7a3a 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -30px -30px 20px -30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .date-range {
      background-color: #f8f9fa;
      border-left: 4px solid #729A4B;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .date-range strong {
      color: #729A4B;
    }
    .reports-section {
      margin: 25px 0;
    }
    .reports-section h2 {
      color: #2c3e50;
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 2px solid #729A4B;
      padding-bottom: 8px;
    }
    .report-item {
      background-color: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 4px solid #729A4B;
    }
    .report-item.disabled {
      opacity: 0.5;
      border-left-color: #ccc;
    }
    .report-item-title {
      font-weight: 600;
      color: #2c3e50;
      font-size: 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    .report-item-title .icon {
      margin-right: 8px;
      font-size: 20px;
    }
    .report-item-details {
      font-size: 13px;
      color: #666;
      margin-left: 28px;
    }
    .report-item-details span {
      display: inline-block;
      margin-right: 15px;
      padding: 3px 8px;
      background-color: white;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .footer .logo {
      font-weight: 600;
      color: #729A4B;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .attachments-note {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 12px 15px;
      margin: 20px 0;
      color: #856404;
      font-size: 13px;
    }
    .attachments-note strong {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${emailTitle}</h1>
      <p>${headerSubtitle}</p>
    </div>

    <div class="date-range">
      <strong>📅 Period Laporan:</strong> ${dateRange.start} s/d ${dateRange.end}
    </div>

    <div class="reports-section">
      <h2>📥 Laporan Terlampir</h2>
      ${reportItemsHtml}
    </div>

    <div class="attachments-note">
      <strong>📎 Catatan:</strong>
      Silakan buka file CSV terlampir untuk melihat detail lengkap laporan replenishment.
      File dapat dibuka dengan Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
    </div>

    <div class="footer">
      <div class="logo">Sinergia Beaute Indonesia</div>
      <p>Email ini dikirim secara otomatis oleh sistem Report Scheduler</p>
      <p>© ${new Date().getFullYear()} Sinergia Beaute Indonesia. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generateReportEmailText(data: EmailTemplateData): string {
  const { dateRange, csvFiles, reportType, description } = data

  const emailTitle = reportType ? `REPORT ${reportType.toUpperCase()}` : 'REPORT REPLENISHMENT'
  const subtitle = description || 'Sinergia Beaute Indonesia'

  let text = `
${emailTitle}
${subtitle}

Period Laporan: ${dateRange.start} s/d ${dateRange.end}

Laporan Terlampir:
------------------

`

  csvFiles.forEach(file => {
    if (file.generated) {
      const reportName = file.filename.includes('sivfu') 
        ? 'Replenishment SIVFU' 
        : file.filename.includes('combined') 
        ? 'Replenishment Combined' 
        : 'Replenishment (ERP)'
      
      text += `✅ ${reportName}
   File: ${file.filename}
   Rows: ${file.rows}
   Size: ${file.size_kb.toFixed(2)} KB

`
    } else {
      text += `⚠️ ${file.filename} - Not Generated

`
    }
  })

  text += `
Catatan: Silakan buka file CSV terlampir untuk melihat detail lengkap laporan replenishment.

---
Sinergia Beaute Indonesia
Email ini dikirim secara otomatis oleh sistem Report Scheduler
© ${new Date().getFullYear()} Sinergia Beaute Indonesia. All rights reserved.
  `.trim()

  return text
}
