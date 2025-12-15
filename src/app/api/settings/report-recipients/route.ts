import { NextRequest, NextResponse } from 'next/server'
import * as sqlite from '@/lib/db/sqlite'

/**
 * GET /api/settings/report-recipients
 * Fetch recipients from local SQLite database
 */
export async function GET(_request: NextRequest) {
  try {
    // Fetch recipients from SQLite (only employee_id and name stored locally)
    const recipients = sqlite.getAllRecipients()

    return NextResponse.json({
      success: true,
      data: recipients,
      count: recipients.length,
    })
  } catch (error) {
    console.error('Fetch recipients error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/report-recipients
 * Add a new recipient to local SQLite database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employee_id, employee_name, designation } = body

    if (!employee_id || !employee_name) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and name are required' },
        { status: 400 }
      )
    }

    // Check if already exists
    if (sqlite.recipientExists(employee_id)) {
      return NextResponse.json(
        { success: false, error: 'Recipient already exists' },
        { status: 409 }
      )
    }

    // Add to SQLite
    const recipient = sqlite.addRecipient(employee_id, employee_name, designation)

    return NextResponse.json({
      success: true,
      message: 'Recipient added successfully',
      data: recipient,
    })
  } catch (error) {
    console.error('Add recipient error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/report-recipients
 * Remove a recipient from local SQLite database
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get('employee_id')

    if (!employee_id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID parameter is required' },
        { status: 400 }
      )
    }

    // Remove from SQLite
    const removed = sqlite.removeRecipient(employee_id)

    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Recipient removed successfully',
    })
  } catch (error) {
    console.error('Remove recipient error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
