import nodemailer from 'nodemailer'

export interface EmailAttachment {
  filename: string
  content: string
  contentType: string
}

export interface SendEmailOptions {
  to: string[]
  subject: string
  html: string
  text: string
  attachments?: EmailAttachment[]
}

/**
 * Send email using SMTP configuration from environment variables
 */
export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    // Validate SMTP configuration
    const smtpHost = process.env.MAIL_HOST
    const smtpPort = process.env.MAIL_PORT
    const smtpUser = process.env.MAIL_USERNAME
    const smtpPassword = process.env.MAIL_PASSWORD
    const smtpFromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@sinergia.co.id'
    const smtpFromName = process.env.MAIL_FROM_NAME || 'Sinergia ERP APPS'
    const smtpEncryption = process.env.MAIL_ENCRYPTION

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      throw new Error('SMTP configuration missing in environment variables')
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpEncryption === 'ssl', // true for SSL (465), false for TLS/STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    // Verify connection configuration
    await transporter.verify()

    // Send email
    const info = await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpFromAddress}>`,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'utf-8'),
        contentType: att.contentType,
      })),
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send report email with CSV attachments
 */
export async function sendReportEmail(
  recipients: string[],
  dateRange: { start: string; end: string },
  csvFiles: Array<{
    filename: string
    content: string
    size_kb: number
    rows: number
  }>,
  htmlTemplate: string,
  textTemplate: string,
  reportType?: string
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const attachments: EmailAttachment[] = csvFiles.map(file => ({
    filename: file.filename,
    content: file.content,
    contentType: 'text/csv',
  }))

  // Use specific report type in subject if provided
  const subjectTitle = reportType ? `Report ${reportType}` : 'Report Replenishment'

  return sendEmail({
    to: recipients,
    subject: `📊 ${subjectTitle} - ${dateRange.start} s/d ${dateRange.end}`,
    html: htmlTemplate,
    text: textTemplate,
    attachments,
  })
}
