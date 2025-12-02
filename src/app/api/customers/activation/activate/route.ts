import { NextRequest, NextResponse } from 'next/server'
import { ERP_CONFIG } from '@/lib/constants/erp'

/**
 * Get activation user session cookies
 * Uses dedicated credentials from .env
 * Independent from logged-in user session
 */
async function getActivationUserSession(): Promise<string> {
  const activationEmail = process.env.ACTIVATION_USER_EMAIL
  const activationPassword = process.env.ACTIVATION_USER_PASSWORD

  if (!activationEmail || !activationPassword) {
    throw new Error('Missing activation user credentials in .env')
  }

  console.log('🔐 [ACTIVATION AUTH] Logging in as dedicated activation user:', activationEmail)

  const loginUrl = `${ERP_CONFIG.BASE_URL}/api/method/login`
  
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      ...ERP_CONFIG.HEADERS
    },
    body: JSON.stringify({
      usr: activationEmail,
      pwd: activationPassword
    })
  })

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text().catch(() => 'No error body')
    console.error('❌ [ACTIVATION AUTH] Login failed:', loginResponse.status)
    console.error('❌ [ACTIVATION AUTH] Error:', errorText)
    throw new Error(`Failed to authenticate activation user: ${loginResponse.status}`)
  }

  // Extract session cookies
  const setCookieHeaders = loginResponse.headers.getSetCookie()
  const cookies = setCookieHeaders
    .map(cookie => cookie.split(';')[0])
    .join('; ')

  console.log('✅ [ACTIVATION AUTH] Successfully authenticated as activation user')
  
  return cookies
}

/**
 * Generate default password from customer name
 * Format: FirstWord + "Sukses123"
 * Example: "Akbar Salon" -> "AkbarSukses123"
 */
function generateDefaultPassword(customerName: string): string {
  const firstWord = customerName.trim().split(' ')[0]
  return `${firstWord}Sukses123`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, email, update_customer_email, linked_user_id } = body

    console.log('🎯 [ACTIVATION] Activation request:', { customer_name, email, update_customer_email, linked_user_id })

    // Validation
    if (!customer_name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: customer_name, email'
        },
        { status: 400 }
      )
    }

    // Generate default password
    const defaultPassword = generateDefaultPassword(customer_name)
    console.log('🔐 [ACTIVATION] Generated password for:', customer_name)

    // Get activation user session (INDEPENDENT from logged-in user)
    const cookies = await getActivationUserSession()

    console.log(`📧 [ACTIVATION] Activation details:`, {
      linked_user_id,
      email,
      update_customer_email
    })

    // Step 1: Handle User update/creation
    if (linked_user_id) {
      // Customer SUDAH PUNYA linked user - JANGAN BIKIN BARU, CUMA UPDATE PASSWORD!
      console.log(`🔄 [ACTIVATION] Customer HAS linked user: ${linked_user_id}`)
      console.log(`🔄 [ACTIVATION] ONLY updating password, NO user creation, NO customer update`)
      
      const updateUserUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User/${encodeURIComponent(linked_user_id)}`
      
      const updateResponse = await fetch(updateUserUrl, {
        method: 'PUT',
        headers: {
          'Cookie': cookies,
          ...ERP_CONFIG.HEADERS
        },
        body: JSON.stringify({
          new_password: defaultPassword
        })
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text().catch(() => 'No error body')
        console.error('❌ [ACTIVATION] Failed to update existing user password:', updateResponse.status)
        console.error('❌ [ACTIVATION] Error response:', errorText)
        throw new Error(`Failed to update user password: ${updateResponse.status} - ${errorText}`)
      }

      console.log('✅ [ACTIVATION] Existing user password updated successfully')
      
      // Mark customer as converted
      console.log('🔄 [ACTIVATION] Marking customer as converted (is_converted = 1)...')
      
      const updateCustomerUrl = `${ERP_CONFIG.BASE_URL}/api/resource/Customer/${encodeURIComponent(customer_name)}`
      
      const updateCustomerResponse = await fetch(updateCustomerUrl, {
        method: 'PUT',
        headers: {
          'Cookie': cookies,
          ...ERP_CONFIG.HEADERS
        },
        body: JSON.stringify({
          is_converted: 1
        })
      })

      if (!updateCustomerResponse.ok) {
        const errorText = await updateCustomerResponse.text().catch(() => 'No error body')
        console.error('❌ [ACTIVATION] Failed to mark customer as converted:', updateCustomerResponse.status)
        console.error('❌ [ACTIVATION] Error response:', errorText)
        // Don't throw - just log warning, password update was successful
        console.warn('⚠️ [ACTIVATION] Customer activation completed but failed to mark as converted')
      } else {
        console.log('✅ [ACTIVATION] Customer marked as converted (is_converted = 1)')
      }
      
    } else if (false) {
      // Email changed: Create/update NEW user with new email
      console.log('🔄 [ACTIVATION] Email changed - processing NEW email user...')
      console.log(`   Old email: ${linked_user_id}`)
      console.log(`   New email: ${email}`)
      
      const checkNewUserUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User/${encodeURIComponent(email)}`
      
      const newUserCheckResponse = await fetch(checkNewUserUrl, {
        method: 'GET',
        headers: {
          'Cookie': cookies,
          ...ERP_CONFIG.HEADERS
        }
      })

      if (newUserCheckResponse.ok) {
        // New email user already exists - just update password
        console.log('🔄 [ACTIVATION] New email user already exists - updating password...')
        
        const updateUserUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User/${encodeURIComponent(email)}`
        
        const updateResponse = await fetch(updateUserUrl, {
          method: 'PUT',
          headers: {
            'Cookie': cookies,
            ...ERP_CONFIG.HEADERS
          },
          body: JSON.stringify({
            new_password: defaultPassword
          })
        })

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text().catch(() => 'No error body')
          console.error('❌ [ACTIVATION] Failed to update new user:', updateResponse.status)
          console.error('❌ [ACTIVATION] Error response:', errorText)
          throw new Error(`Failed to update new user: ${updateResponse.status} - ${errorText}`)
        }

        console.log('✅ [ACTIVATION] New user password updated successfully')
      } else {
        // New email user doesn't exist - create it
        console.log('➕ [ACTIVATION] Creating new user with new email...')
        
        const createUserUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User`
        
        const createUserPayload = {
          email: email,
          first_name: customer_name,
          new_password: defaultPassword,
          send_welcome_email: 0,
          user_type: 'Website User'
        }
        console.log('📤 [ACTIVATION] Create user payload:', createUserPayload)
        
        const createResponse = await fetch(createUserUrl, {
          method: 'POST',
          headers: {
            'Cookie': cookies,
            ...ERP_CONFIG.HEADERS
          },
          body: JSON.stringify(createUserPayload)
        })

        if (!createResponse.ok) {
          const errorText = await createResponse.text().catch(() => 'No error body')
          console.error('❌ [ACTIVATION] Failed to create new user:', createResponse.status)
          console.error('❌ [ACTIVATION] Error response:', errorText)
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          throw new Error(`Failed to create new user: ${createResponse.status} - ${errorData._server_messages || errorData.message || errorText}`)
        }

        console.log('✅ [ACTIVATION] New user created successfully')
      }
    } else {
      // Email NOT changed OR no linked user: work with current email
      console.log('🔍 [ACTIVATION] Checking if user exists...')
      
      const checkUserUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User/${encodeURIComponent(email)}`
      
      const userCheckResponse = await fetch(checkUserUrl, {
        method: 'GET',
        headers: {
          'Cookie': cookies,
          ...ERP_CONFIG.HEADERS
        }
      })

      if (userCheckResponse.ok) {
        // User exists - update password
        console.log('🔄 [ACTIVATION] User exists - updating password...')
        
        const updateUserUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User/${encodeURIComponent(email)}`
        
        const updateResponse = await fetch(updateUserUrl, {
          method: 'PUT',
          headers: {
            'Cookie': cookies,
            ...ERP_CONFIG.HEADERS
          },
          body: JSON.stringify({
            new_password: defaultPassword
          })
        })

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text().catch(() => 'No error body')
          console.error('❌ [ACTIVATION] Failed to update user:', updateResponse.status)
          console.error('❌ [ACTIVATION] Error response:', errorText)
          throw new Error(`Failed to update user: ${updateResponse.status} - ${errorText}`)
        }

        console.log('✅ [ACTIVATION] User password updated successfully')
      } else {
        // User doesn't exist - create new
        console.log('➕ [ACTIVATION] Creating new user...')
        
        const createUserUrl = `${ERP_CONFIG.BASE_URL}/api/resource/User`
        
        const createUserPayload = {
          email: email,
          first_name: customer_name,
          new_password: defaultPassword,
          send_welcome_email: 0,
          user_type: 'Website User'
        }
        console.log('📤 [ACTIVATION] Create user payload:', createUserPayload)
        
        const createResponse = await fetch(createUserUrl, {
          method: 'POST',
          headers: {
            'Cookie': cookies,
            ...ERP_CONFIG.HEADERS
          },
          body: JSON.stringify(createUserPayload)
        })

        if (!createResponse.ok) {
          const errorText = await createResponse.text().catch(() => 'No error body')
          console.error('❌ [ACTIVATION] Failed to create user:', createResponse.status)
          console.error('❌ [ACTIVATION] Error response:', errorText)
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          throw new Error(`Failed to create user: ${createResponse.status} - ${errorData._server_messages || errorData.message || errorText}`)
        }

        console.log('✅ [ACTIVATION] User created successfully')
      }
    }

    // Step 2: Link User to Customer (only if no linked user before - first time activation)
    if (!linked_user_id) {
      // No linked user yet - need to link for first time
      console.log('🔗 [ACTIVATION] No linked user - creating first link...')
      
      const linkCustomerUrl = `${ERP_CONFIG.BASE_URL}/api/resource/Customer/${encodeURIComponent(customer_name)}`
      
      const linkResponse = await fetch(linkCustomerUrl, {
        method: 'PUT',
        headers: {
          'Cookie': cookies,
          ...ERP_CONFIG.HEADERS
        },
        body: JSON.stringify({
          custom_user: email
        })
      })

      if (!linkResponse.ok) {
        const errorText = await linkResponse.text().catch(() => 'No error body')
        console.error('❌ [ACTIVATION] Failed to link user to customer:', linkResponse.status)
        console.error('❌ [ACTIVATION] Error response:', errorText)
        throw new Error(`Failed to link user to customer: ${linkResponse.status} - ${errorText}`)
      }

      console.log('✅ [ACTIVATION] First user link created successfully')
      
      // Mark customer as converted (for first-time activation)
      console.log('🔄 [ACTIVATION] Marking customer as converted (is_converted = 1)...')
      
      const updateConvertedUrl = `${ERP_CONFIG.BASE_URL}/api/resource/Customer/${encodeURIComponent(customer_name)}`
      
      const convertResponse = await fetch(updateConvertedUrl, {
        method: 'PUT',
        headers: {
          'Cookie': cookies,
          ...ERP_CONFIG.HEADERS
        },
        body: JSON.stringify({
          is_converted: 1
        })
      })

      if (!convertResponse.ok) {
        const errorText = await convertResponse.text().catch(() => 'No error body')
        console.error('❌ [ACTIVATION] Failed to mark customer as converted:', convertResponse.status)
        console.error('❌ [ACTIVATION] Error response:', errorText)
        // Don't throw - just log warning, link was successful
        console.warn('⚠️ [ACTIVATION] Customer linked but failed to mark as converted')
      } else {
        console.log('✅ [ACTIVATION] Customer marked as converted (is_converted = 1)')
      }
    } else {
      console.log('⏭️ [ACTIVATION] Customer already has linked user - skipping link update (avoid hook trigger)')
    }

    console.log('✅ [ACTIVATION] Customer activated successfully!')

    return NextResponse.json({
      success: true,
      message: 'Customer activated successfully',
      data: {
        customer_name,
        user_email: email,
        default_password: defaultPassword,
        linked: true
      }
    })

  } catch (error) {
    console.error('❌ [ACTIVATION] Error:', error)
    console.error('❌ [ACTIVATION] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ [ACTIVATION] Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('❌ [ACTIVATION] Error message:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate customer',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}
