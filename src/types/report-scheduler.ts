/**
 * Report Scheduler Types
 * Maps to ERPNext Report Scheduler doctype
 * 
 * Architecture:
 * - ERP doctype is SOURCE CONFIG (not log destination)
 * - Cronjob hits /api/reports/scheduler/trigger?name=RPT-RPL-2025-00001
 * - System fetches config + recipients from ERP
 * - Each report type has its own scheduler entry
 */

export interface ReportSchedulerRecipient {
  employee?: string
  email: string
}

/**
 * Report Scheduler doctype from ERP
 * naming_series: RPT-RPL-.YYYY.-, RPT-RSV-.YYYY.-, RPT-SAL-.YYYY.-
 */
export interface ReportScheduler {
  name: string
  report_type: 'Replenishment' | 'Replenishment SIVFU' | 'Replenishment Combined'
  url: string
  description?: string
  status: 'Aktif' | 'Non-Aktif'
  recipients: ReportSchedulerRecipient[]
}

/**
 * Scheduler Trigger Request
 * POST body for /api/reports/scheduler/trigger?name=RPT-XXX-YYYY-NNNNN
 */
export interface SchedulerTriggerRequest {
  api_key: string
  api_secret: string
}

/**
 * Scheduler Trigger Response
 * Response from /api/reports/scheduler/trigger
 */
export interface SchedulerTriggerResponse {
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
  processing_time_ms?: number
}

/**
 * Legacy: All-reports trigger request (backward compatible)
 * Used by /api/reports/scheduler/trigger-replenishment
 */
export interface LegacySchedulerTriggerRequest {
  api_key: string
  api_secret: string
  branch_filter?: string
}

/**
 * Legacy: All-reports trigger response (backward compatible)
 * Used by /api/reports/scheduler/trigger-replenishment
 */
export interface LegacySchedulerTriggerResponse {
  success: boolean
  message: string
  data?: {
    date_range: {
      start: string
      end: string
    }
    reports_generated: {
      replenishment: {
        data_count: number
        csv_generated: boolean
      }
      replenishment_sivfu: {
        data_count: number
        csv_generated: boolean
      }
      replenishment_combined: {
        data_count: number
        csv_generated: boolean
      }
    }
    csv_files: Array<{
      filename: string
      size_kb: number
      rows: number
    }>
    email: {
      sent: boolean
      recipients: string[]
      message_id?: string
    }
    erp_log: {
      posted: boolean
      log_id?: string
      error?: string
    }
    execution: {
      started_at: string
      completed_at: string
      processing_time_ms: number
    }
  }
  error?: string
}

/**
 * Legacy: Report Scheduler Log (for backward compatibility)
 * Used by /api/reports/scheduler/trigger-replenishment to log to ERP
 */
export interface ReportSchedulerLog {
  report_type: string
  url: string
  description: string
  execution_time: string
  status: 'success' | 'failed'
  date_range: { start: string; end: string }
  reports_generated: number
  csv_files_generated: number
  total_data_rows: number
  total_csv_size_kb: number
  email_sent: boolean
  email_recipients_count: number
  processing_time_ms: number
  error_message?: string
}
