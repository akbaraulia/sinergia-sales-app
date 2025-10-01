import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promoCode: string }> }
) {
  try {
    const { promoCode } = await params

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: 'Promo code is required' },
        { status: 400 }
      )
    }

    console.log('🎯 [PROMO_DETAIL] Fetching promo detail for:', promoCode)

    // Construct the ERP API URL - use the same endpoint as the main promo route
    const erpUrl = `${ERP_CONFIG.BASE_URL}/api/method/get_promo_bebas_pilih`
    
    console.log('🔗 [PROMO_DETAIL] ERP URL:', erpUrl)

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || ''

    // Fetch all promos from ERPNext (same as main promo endpoint)
    const response = await fetch(erpUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        ...ERP_CONFIG.HEADERS
      }
    })

    console.log('📡 [PROMO_DETAIL] ERP Response status:', response.status)

    if (!response.ok) {
      console.error('❌ [PROMO_DETAIL] ERP request failed:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          error: `ERP API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const erpData = await response.json()
    console.log('📦 [PROMO_DETAIL] ERP Response data keys:', Object.keys(erpData))

    // Check if response has the expected structure - based on main promo route
    if (erpData && Array.isArray(erpData.data)) {
      console.log(`🔍 [PROMO_DETAIL] Searching for promo code "${promoCode}" in ${erpData.data.length} promos`)
      
      // Find specific promo by code
      const promo = erpData.data.find((item: any) => item.kode === promoCode)
      
      if (promo) {
        console.log('✅ [PROMO_DETAIL] Found promo:', promo.kode, '-', promo.nama)
        
        return NextResponse.json({
          success: true,
          promo: {
            name: promo.name,
            kode: promo.kode,
            nama: promo.nama,
            nilai: promo.nilai,
            expired: promo.expired,
            brand: promo.brand,
            image: promo.image,
            nonaktif: promo.nonaktif,
            free_items: promo.free_items || []
          }
        })
      } else {
        console.warn('⚠️ [PROMO_DETAIL] Promo not found:', promoCode)
        console.log('Available promo codes:', erpData.data.map((p: any) => p.kode))
        
        return NextResponse.json(
          { success: false, error: 'Promo not found' },
          { status: 404 }
        )
      }
    } else {
      console.warn('⚠️ [PROMO_DETAIL] Unexpected data structure:', erpData)
      return NextResponse.json(
        { success: false, error: 'Invalid response from ERP' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ [PROMO_DETAIL] API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch promo detail'
      },
      { status: 500 }
    )
  }
}