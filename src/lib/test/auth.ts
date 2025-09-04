// Test credentials untuk development
export const TEST_CREDENTIALS = {
  // Production ERP accounts
  ADMIN: {
    email: 'akbar@sinergia.co.id',
    password: 'akbar@sinergia',
    expected_role: 'admin'
  },
  SALES: {
    email: 'salestest@sinergia.co.id',
    password: 'sbisukses', 
    expected_role: 'sales'
  },
  SALON: {
    email: 'styan_ren@yahoo.co.id',
    password: 'sbisukses', // Update password sesuai yang benar
    expected_role: 'salon'
  }
} as const

// Helper untuk testing login
export const testLogin = async (credential: keyof typeof TEST_CREDENTIALS) => {
  const { email, password, expected_role } = TEST_CREDENTIALS[credential]
  
  console.log(`🧪 Testing login for ${credential}: ${email}`)
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Login successful for ${credential}:`, {
        name: result.user.name,
        role: result.user.role,
        permissions: result.user.permissions,
        expected_role
      })
      
      if (result.user.role === expected_role) {
        console.log(`✅ Role matches expected: ${expected_role}`)
      } else {
        console.warn(`⚠️  Role mismatch! Expected: ${expected_role}, Got: ${result.user.role}`)
      }
      
      return result
    } else {
      console.error(`❌ Login failed for ${credential}:`, result.error)
      return result
    }
    
  } catch (error) {
    console.error(`❌ Network error for ${credential}:`, error)
    return { success: false, error: 'Network error' }
  }
}
