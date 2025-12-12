import { NextRequest, NextResponse } from 'next/server'
import { ReplenishmentReportRow } from '@/types/replenishment'
import {
  generateReplenishmentCSV,
  generateReplenishmentSIVFUCSV,
  generateReplenishmentCombinedCSV,
  getCSVSize,
  getCSVRowCount,
} from '@/lib/reports/csv-generator'
import { generateReportEmail, generateReportEmailText } from '@/lib/email/templates'
import { sendReportEmail } from '@/lib/email/sender'
import { executeQuery2 } from '@/lib/db/mysql2'
import fs from 'fs'
import path from 'path'

const ERP_BASE_URL = process.env.ERP_BASE_URL
const ERP_API_KEY = process.env.ERP_API_KEY
const ERP_API_SECRET = process.env.ERP_API_SECRET

const ERP_CONFIG = {
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ReportSchedulerDoctype {
  name: string
  report_type: 'Replenishment' | 'Replenishment SIVFU' | 'Replenishment Combined'
  url: string
  description?: string
  status: 'Aktif' | 'Non-Aktif'
  recipients: Array<{
    employee?: string
    email: string
  }>
}

interface TriggerRequest {
  api_key: string
  api_secret: string
}

interface TriggerResponse {
  success: boolean
  message: string
  data?: {
    scheduler_name: string
    report_type: string
    date_range: {
      start: string
      end: string
    }
    report: {
      data_count: number
      csv_generated: boolean
    }
    csv_file: {
      filename: string
      size_kb: number
      rows: number
    }
    email: {
      sent: boolean
      recipients: string[]
      message_id?: string
    }
    execution: {
      started_at: string
      completed_at: string
      processing_time_ms: number
    }
  }
  error?: string
}

// =============================================================================
// MAIN ENDPOINT
// =============================================================================

/**
 * POST /api/reports/scheduler/trigger?name=RPT-RPL-2025-00001
 * 
 * Trigger report generation based on ERP Report Scheduler doctype
 * - Fetches config from ERP doctype
 * - Validates status = Aktif
 * - Generates report based on report_type
 * - Sends email to recipients from ERP
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let body: TriggerRequest | undefined

  try {
    // Get scheduler name from query parameter
    const { searchParams } = new URL(request.url)
    const schedulerName = searchParams.get('name')

    if (!schedulerName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter "name" is required. Example: ?name=RPT-RPL-2025-00001',
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    body = await request.json()

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request body is required',
        },
        { status: 400 }
      )
    }

    // Validate API credentials
    if (!body.api_key || !body.api_secret) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key and secret are required',
        },
        { status: 401 }
      )
    }

    if (body.api_key !== ERP_API_KEY || body.api_secret !== ERP_API_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid API credentials',
        },
        { status: 401 }
      )
    }

    // ==========================================================================
    // STEP 1: Fetch Report Scheduler config from ERP
    // ==========================================================================
    console.log(`📋 [TRIGGER] Fetching config for: ${schedulerName}`)
    const schedulerConfig = await fetchSchedulerConfig(schedulerName)

    if (!schedulerConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Report Scheduler "${schedulerName}" not found in ERP`,
        },
        { status: 404 }
      )
    }

    // ==========================================================================
    // STEP 2: Validate status = Aktif
    // ==========================================================================
    if (schedulerConfig.status !== 'Aktif') {
      return NextResponse.json(
        {
          success: false,
          error: `Report Scheduler "${schedulerName}" is not active (status: ${schedulerConfig.status})`,
        },
        { status: 400 }
      )
    }

    // ==========================================================================
    // STEP 3: Get recipients from ERP doctype
    // ==========================================================================
    const recipients = schedulerConfig.recipients
      .map(r => r.email)
      .filter((email): email is string => !!email && email.length > 0)

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No recipients configured in Report Scheduler "${schedulerName}"`,
        },
        { status: 400 }
      )
    }

    console.log(`📧 [TRIGGER] Recipients: ${recipients.join(', ')}`)

    // ==========================================================================
    // STEP 4: Calculate date range
    // ==========================================================================
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }

    // ==========================================================================
    // STEP 5: Generate report based on report_type
    // ==========================================================================
    console.log(`📊 [TRIGGER] Generating report: ${schedulerConfig.report_type}`)
    
    let reportData: any[]
    let csvContent: string
    let filename: string

    switch (schedulerConfig.report_type) {
      case 'Replenishment':
        reportData = await generateReplenishmentReportData()
        csvContent = generateReplenishmentCSV(reportData)
        filename = `replenishment_${dateRange.start}_to_${dateRange.end}.csv`
        break

      case 'Replenishment SIVFU':
        reportData = await generateSIVFUReportData()
        csvContent = generateReplenishmentSIVFUCSV(reportData)
        filename = `replenishment_sivfu_${dateRange.start}_to_${dateRange.end}.csv`
        break

      case 'Replenishment Combined':
        reportData = await generateCombinedReportData()
        csvContent = generateReplenishmentCombinedCSV(reportData)
        filename = `replenishment_combined_${dateRange.start}_to_${dateRange.end}.csv`
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown report type: ${schedulerConfig.report_type}`,
          },
          { status: 400 }
        )
    }

    const csvFile = {
      filename,
      content: csvContent,
      size_kb: getCSVSize(csvContent),
      rows: getCSVRowCount(csvContent),
    }

    console.log(`✅ [TRIGGER] Report generated: ${csvFile.rows} rows, ${csvFile.size_kb} KB`)

    // ==========================================================================
    // STEP 6: Send email with CSV attachment
    // ==========================================================================
    console.log(`📧 [TRIGGER] Sending email to ${recipients.length} recipients...`)

    const htmlEmail = generateReportEmail({
      dateRange,
      csvFiles: [
        {
          filename: csvFile.filename,
          size_kb: csvFile.size_kb,
          rows: csvFile.rows,
          generated: true,
        },
      ],
      reportType: schedulerConfig.report_type,
      description: schedulerConfig.description,
    })

    const textEmail = generateReportEmailText({
      dateRange,
      csvFiles: [
        {
          filename: csvFile.filename,
          size_kb: csvFile.size_kb,
          rows: csvFile.rows,
          generated: true,
        },
      ],
      reportType: schedulerConfig.report_type,
      description: schedulerConfig.description,
    })

    const emailResult = await sendReportEmail(
      recipients,
      dateRange,
      [csvFile],
      htmlEmail,
      textEmail,
      schedulerConfig.report_type
    )

    if (!emailResult.success) {
      throw new Error(`Email send failed: ${emailResult.error}`)
    }

    // ==========================================================================
    // STEP 7: Prepare response
    // ==========================================================================
    const processingTime = Date.now() - startTime
    const completedAt = new Date().toISOString()

    const response: TriggerResponse = {
      success: true,
      message: `Report "${schedulerConfig.report_type}" generated and sent successfully`,
      data: {
        scheduler_name: schedulerName,
        report_type: schedulerConfig.report_type,
        date_range: dateRange,
        report: {
          data_count: reportData.length,
          csv_generated: true,
        },
        csv_file: {
          filename: csvFile.filename,
          size_kb: csvFile.size_kb,
          rows: csvFile.rows,
        },
        email: {
          sent: true,
          recipients: recipients,
          message_id: emailResult.messageId,
        },
        execution: {
          started_at: new Date(startTime).toISOString(),
          completed_at: completedAt,
          processing_time_ms: processingTime,
        },
      },
    }

    console.log(`✅ [TRIGGER] Completed in ${processingTime}ms`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [TRIGGER] Error:', error)

    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Fetch Report Scheduler config from ERP doctype
 */
async function fetchSchedulerConfig(name: string): Promise<ReportSchedulerDoctype | null> {
  try {
    console.log(`🔍 [ERP] Fetching Report Scheduler: ${name}`)
    
    const response = await fetch(
      `${ERP_BASE_URL}/api/resource/Report Scheduler/${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          ...ERP_CONFIG.HEADERS,
          Authorization: `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
        },
      }
    )

    if (response.status === 404) {
      console.log(`❌ [ERP] Report Scheduler "${name}" not found`)
      return null
    }

    if (!response.ok) {
      throw new Error(`ERP API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const data = result.data

    console.log(`✅ [ERP] Found: ${data.name}, Type: ${data.report_type}, Status: ${data.status}`)
    console.log(`📧 [ERP] Recipients count: ${data.recipients?.length || 0}`)

    return {
      name: data.name,
      report_type: data.report_type,
      url: data.url || '',
      description: data.description || '',
      status: data.status,
      recipients: data.recipients || [],
    }
  } catch (error) {
    console.error('❌ [ERP] Error fetching scheduler config:', error)
    throw error
  }
}

/**
 * Generate Replenishment report data (from ERP server script)
 */
async function generateReplenishmentReportData(): Promise<ReplenishmentReportRow[]> {
  console.log('📊 [REPLENISHMENT] Fetching from ERP server script...')

  const response = await fetch(
    `${ERP_BASE_URL}/api/method/get_replenishment_data`,
    {
      method: 'GET',
      headers: {
        ...ERP_CONFIG.HEADERS,
        Authorization: `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Replenishment API error: ${response.status}`)
  }

  const data = await response.json()

  // Handle different response structures
  let pivotedData: ReplenishmentReportRow[] = []

  if (data.data?.data && Array.isArray(data.data.data)) {
    pivotedData = data.data.data
  } else if (data.message && Array.isArray(data.message)) {
    pivotedData = data.message
  } else if (data.data && Array.isArray(data.data)) {
    pivotedData = data.data
  } else if (Array.isArray(data)) {
    pivotedData = data
  }

  console.log(`✅ [REPLENISHMENT] Fetched ${pivotedData.length} items`)
  return pivotedData
}

/**
 * Generate Replenishment SIVFU report data (from local MySQL)
 */
async function generateSIVFUReportData(): Promise<any[]> {
  console.log('📊 [SIVFU] Fetching from local MySQL database...')

  const sqlFilePath = path.join(process.cwd(), 'src', 'query', 'replan-sivfu.sql')
  const baseQuery = fs.readFileSync(sqlFilePath, 'utf-8')

  const rows = await executeQuery2<any>(baseQuery, [])

  console.log(`✅ [SIVFU] Fetched ${rows.length} items from MySQL`)
  return rows
}

/**
 * Generate Replenishment Combined report data
 */
async function generateCombinedReportData(): Promise<any[]> {
  console.log('📊 [COMBINED] Fetching combined report...')

  // Fetch SIVFU data
  const sivfuData = await generateSIVFUReportData()

  // Fetch ERP data
  const erpData = await generateReplenishmentReportData()

  console.log(`✅ [COMBINED] SIVFU: ${sivfuData.length}, ERP: ${erpData.length}`)

  // Return combined structure for CSV generator
  // The CSV generator handles the actual merge logic
  return sivfuData // For now, return SIVFU data - CSV generator will handle combination
}
