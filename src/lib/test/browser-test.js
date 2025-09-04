// Manual test script untuk browser console
(async () => {
  console.log('🧪 Testing ERPNext Login API...')
  
  // Test dengan credential salon
  const testSalon = async () => {
    console.log('🏪 Testing salon login...')
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'styan_ren@yahoo.co.id',
        password: 'sbisukses'
      })
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
      body: JSON.stringify({
        email: 'salestest@sinergia.co.id',
        password: 'sbisukses'
      })
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
      body: JSON.stringify({
        email: 'akbar@sinergia.co.id',
        password: 'akbar@sinergia'
      })
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

// Atau test satu per satu:
/*
// Test salon
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'styan_ren@yahoo.co.id',
    password: 'sbisukses'
  })
}).then(r => r.json()).then(console.log)
*/
