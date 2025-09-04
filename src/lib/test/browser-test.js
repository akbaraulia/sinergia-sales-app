// Manual test script untuk browser console - USE ENVIRONMENT VARIABLES
(async () => {
  console.log('🧪 Testing ERPNext Login API...')
  
  // Get credentials from environment variables or use defaults
  const getTestCredentials = () => ({
    salon: {
      email: process.env.DEMO_SALON_EMAIL || 'salon@example.com',
      password: process.env.DEMO_SALON_PASSWORD || 'demo_password'
    },
    sales: {
      email: process.env.DEMO_SALES_EMAIL || 'sales@example.com',
      password: process.env.DEMO_SALES_PASSWORD || 'demo_password'
    },
    admin: {
      email: process.env.DEMO_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.DEMO_ADMIN_PASSWORD || 'demo_password'
    }
  })

  const credentials = getTestCredentials()
  
  // Test dengan credential salon
  const testSalon = async () => {
    console.log('🏪 Testing salon login...')
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials.salon)
    })

    const result = await response.json()
    console.log('Salon login result:', result)
    return result
  }

  // Test dengan credential sales
  const testSales = async () => {
    console.log('💼 Testing sales login...')
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials.sales)
    })

    const result = await response.json()
    console.log('Sales login result:', result)
    return result
  }

  // Test dengan credential admin
  const testAdmin = async () => {
    console.log('👑 Testing admin login...')
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials.admin)
    })

    const result = await response.json()
    console.log('Admin login result:', result)
    return result
  }

  // Jalankan test
  try {
    await testSalon()
    await testSales() 
    await testAdmin()
  } catch (error) {
    console.error('Test error:', error)
  }
})()

// WARNING: Update your .env.local with real credentials for testing
console.warn('⚠️  Make sure to set DEMO_* environment variables in .env.local for testing')
