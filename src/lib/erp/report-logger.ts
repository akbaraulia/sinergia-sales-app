import { ReportSchedulerLog } from '@/types/report-scheduler'

const ERP_BASE_URL = process.env.ERP_BASE_URL
const ERP_API_KEY = process.env.ERP_API_KEY
const ERP_API_SECRET = process.env.ERP_API_SECRET

/**
 * Log report execution to ERP Report Scheduler doctype
 */
export async function logReportExecution(
  log: ReportSchedulerLog,
  apiKey?: string,
  apiSecret?: string
): Promise<{
  success: boolean
  log_id?: string
  error?: string
}> {
  try {
    // Use provided API credentials or fallback to env
    const authKey = apiKey || ERP_API_KEY
    const authSecret = apiSecret || ERP_API_SECRET

    if (!authKey || !authSecret) {
      throw new Error('ERP API credentials not configured')
    }

    // Prepare the log data for ERP
    // Keep response field under 140 chars (ERP field limit)
    const responseData = log.status === 'success'
      ? `OK: ${log.reports_generated} reports, ${log.total_data_rows} rows, ${log.email_recipients_count} emails sent`
      : `FAIL: ${log.error_message || 'Unknown error'}`
    
    const erpLogData = {
      doctype: 'Report Scheduler',
      report_type: log.report_type,
      url: log.url || '',
      description: log.description || '',
      execute_time: log.execution_time,
      status: log.status === 'success' ? 'Aktif' : 'Non-Aktif',
      response: responseData.substring(0, 140), // Ensure max 140 chars
      recipients: [], // Will be populated if needed
    }

    // POST to ERP API with API Key authentication
    const response = await fetch(
      `${ERP_BASE_URL}/api/resource/Report Scheduler`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${authKey}:${authSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(erpLogData),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `ERP API error: ${response.status} - ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()

    return {
      success: true,
      log_id: data.data?.name,
    }
  } catch (error) {
    console.error('ERP log error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update existing Report Scheduler log
 */
export async function updateReportLog(
  logId: string,
  updateData: Partial<ReportSchedulerLog>,
  cookies: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const erpUpdateData: any = {}

    if (updateData.status) {
      erpUpdateData.status = updateData.status === 'success' ? 'Aktif' : 'Non-Aktif'
    }

    if (updateData.execution_time) {
      erpUpdateData.execute_time = updateData.execution_time
    }

    if (updateData.error_message || updateData.processing_time_ms) {
      // Fetch current response to merge
      const getResponse = await fetch(
        `${ERP_BASE_URL}/api/resource/Report Scheduler/${logId}`,
        {
          headers: {
            'Cookie': cookies,
            'Content-Type': 'application/json',
          },
        }
      )

      if (getResponse.ok) {
        const currentData = await getResponse.json()
        const currentResponse = currentData.data?.response
          ? JSON.parse(currentData.data.response)
          : {}

        erpUpdateData.response = JSON.stringify({
          ...currentResponse,
          error_message: updateData.error_message || currentResponse.error_message,
          processing_time_ms: updateData.processing_time_ms || currentResponse.processing_time_ms,
        }, null, 2)
      }
    }

    const response = await fetch(
      `${ERP_BASE_URL}/api/resource/Report Scheduler/${logId}`,
      {
        method: 'PUT',
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(erpUpdateData),
      }
    )

    if (!response.ok) {
      throw new Error(`ERP API error: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('ERP update log error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
