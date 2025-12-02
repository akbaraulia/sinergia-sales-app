import { NextResponse } from 'next/server'
import { executeQuery2 } from '@/lib/db/mysql2'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    console.log('📊 [SIVFU] Fetching replenishment SIVFU data...', { search, page, limit })

    // Read SQL query from file
    const sqlFilePath = path.join(process.cwd(), 'src', 'query', 'replan-sivfu.sql')
    let baseQuery = fs.readFileSync(sqlFilePath, 'utf-8')

    // Add search filter if provided (filter by kode_item or nama_item)
    if (search) {
      // Wrap the entire query in a subquery for filtering
      baseQuery = `
        SELECT * FROM (
          ${baseQuery}
        ) AS filtered
        WHERE kode_item LIKE ? OR nama_item LIKE ?
      `
    }

    // Execute query with search params
    const searchPattern = `%${search}%`
    const queryParams = search ? [searchPattern, searchPattern] : []
    
    console.log('🔍 [SIVFU] Executing query with params:', queryParams)
    const startTime = Date.now()
    
    const rows = await executeQuery2<any>(baseQuery, queryParams)
    
    const queryTime = Date.now() - startTime
    console.log(`✅ [SIVFU] Query executed in ${queryTime}ms, returned ${rows.length} rows`)

    // Apply pagination in-memory (since MySQL 5.x doesn't support LIMIT on complex queries easily)
    const total = rows.length
    const totalPages = Math.ceil(total / limit)
    const paginatedRows = rows.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedRows,
      total,
      page,
      limit,
      totalPages,
      queryTime: `${queryTime}ms`
    })

  } catch (error) {
    console.error('❌ [SIVFU] Error fetching replenishment SIVFU data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0
      },
      { status: 500 }
    )
  }
}
