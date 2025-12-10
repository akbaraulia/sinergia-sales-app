'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { ThemeToggle, ThemeSelector } from "@/components/theme/ThemeToggle"
import { useAuthStore } from '@/store/authStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-isabelline via-white to-champagne-50 dark:from-dark-bg dark:via-dark-surface dark:to-jet-800">
      {/* Header */}
      <header className="border-b border-champagne-200 dark:border-dark-border bg-white/95 dark:bg-dark-surface/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-asparagus to-asparagus-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-jet-800 dark:text-white">Sinergia Sales</h1>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 bg-asparagus text-white text-xs font-semibold rounded-full">
              ERPNext Integration
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeSelector />
            <ThemeToggle />
            <Link 
              href="/login"
              className="btn btn-primary px-6 py-2 text-sm font-semibold"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-asparagus via-asparagus-600 to-asparagus-800 bg-clip-text text-transparent">
              Sinergia Sales Platform
            </h1>
            <p className="text-xl lg:text-2xl text-jet-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              Platform manajemen penjualan terintegrasi dengan Frappe ERPNext
            </p>
            <p className="text-lg text-jet-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Kelola customer, katalog produk, inventory, promo, dan laporan penjualan dalam satu platform yang powerful dan user-friendly
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                href="/login"
                className="btn btn-primary px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Mulai Sekarang
              </Link>
              <a 
                href="#features"
                className="btn btn-outline px-8 py-4 text-lg font-semibold"
              >
                Lihat Fitur
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-4 py-20 bg-white dark:bg-dark-surface">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-jet-800 dark:text-white">Fitur Unggulan</h2>
              <p className="text-lg text-jet-600 dark:text-gray-300 max-w-2xl mx-auto">
                Platform lengkap untuk mengelola seluruh aspek penjualan dan inventory bisnis Anda
              </p>
            </div>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Dashboard */}
              <div className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-content">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-asparagus to-asparagus-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-2">Sales Dashboard</h3>
                  <p className="text-jet-600 dark:text-gray-300">
                    Visualisasi data penjualan real-time dengan chart interaktif, KPI, dan analytics komprehensif
                  </p>
                </div>
              </div>

              {/* Customer Management */}
              <div className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-content">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-champagne to-champagne-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-jet-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-2">Customer Management</h3>
                  <p className="text-jet-600 dark:text-gray-300">
                    Database customer terintegrasi dengan ERP, lengkap dengan history transaksi dan customer cards
                  </p>
                </div>
              </div>

              {/* Product Catalog */}
              <div className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-content">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-asparagus-600 to-asparagus-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-2">Product Catalog</h3>
                  <p className="text-jet-600 dark:text-gray-300">
                    Browse dan search katalog produk dengan filter brand, area, kategori, dan price range
                  </p>
                </div>
              </div>

              {/* Inventory Management */}
              <div className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-content">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-jet-700 to-jet-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-2">Inventory Tracking</h3>
                  <p className="text-jet-600 dark:text-gray-300">
                    Monitor stock level, track inventory movement, dan automated replenishment suggestions
                  </p>
                </div>
              </div>

              {/* Promo Management */}
              <div className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-content">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-champagne-600 to-champagne-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-2">Promo & Vouchers</h3>
                  <p className="text-jet-600 dark:text-gray-300">
                    Kelola promo bebas pilih dengan grid layout, voucher codes, dan free items management
                  </p>
                </div>
              </div>

              {/* Reports */}
              <div className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="card-content">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-asparagus-700 to-asparagus-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-2">Advanced Reports</h3>
                  <p className="text-jet-600 dark:text-gray-300">
                    Laporan replenishment, sales performance, dan custom reports dengan export functionality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Login Information Section */}
        <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-asparagus-50 to-champagne-50 dark:from-asparagus-900/20 dark:to-champagne-900/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-jet-800 dark:text-white">Cara Login</h2>
              <p className="text-lg text-jet-600 dark:text-gray-300">
                Gunakan akun ERPNext Anda yang sudah terdaftar untuk mengakses platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Login Instructions */}
              <div className="card">
                <div className="card-content">
                  <div className="w-12 h-12 rounded-lg bg-asparagus flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-4">Informasi Login</h3>
                  <div className="space-y-3 text-jet-600 dark:text-gray-300">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-asparagus mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Gunakan <strong>email dan password</strong> akun ERPNext Anda</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-asparagus mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Akun harus sudah terdaftar di sistem ERPNext</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-asparagus mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Fitur yang dapat diakses sesuai dengan role user Anda</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Roles */}
              <div className="card">
                <div className="card-content">
                  <div className="w-12 h-12 rounded-lg bg-champagne flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-jet-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-jet-800 dark:text-white mb-4">Role & Akses</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded bg-asparagus/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-asparagus-700 dark:text-asparagus-400">A</span>
                      </div>
                      <div>
                        <p className="font-semibold text-jet-800 dark:text-white">Admin</p>
                        <p className="text-sm text-jet-600 dark:text-gray-300">Full access ke semua modul dan fitur</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded bg-champagne/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-jet-800">S</span>
                      </div>
                      <div>
                        <p className="font-semibold text-jet-800 dark:text-white">Sales</p>
                        <p className="text-sm text-jet-600 dark:text-gray-300">Akses customer, catalog, sales, dan promo</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded bg-jet-200 dark:bg-jet-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-jet-800 dark:text-white">P</span>
                      </div>
                      <div>
                        <p className="font-semibold text-jet-800 dark:text-white">Salon</p>
                        <p className="text-sm text-jet-600 dark:text-gray-300">Khusus modul salon management</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center mt-12">
              <Link 
                href="/login"
                className="inline-flex items-center btn btn-primary px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login ke Dashboard
              </Link>
              <p className="text-sm text-jet-500 dark:text-gray-400 mt-4">
                Belum punya akses? Hubungi administrator untuk pendaftaran akun ERPNext
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-jet-800 dark:text-white">Built with Modern Technology</h2>
            <p className="text-lg text-jet-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              Platform ini dibangun menggunakan teknologi web modern untuk performa optimal dan user experience terbaik
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-xl bg-jet-800 dark:bg-white flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-white dark:text-jet-800">N</span>
                </div>
                <p className="font-semibold text-jet-800 dark:text-white">Next.js 15</p>
                <p className="text-sm text-jet-600 dark:text-gray-400">React Framework</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-white">T</span>
                </div>
                <p className="font-semibold text-jet-800 dark:text-white">Tailwind CSS</p>
                <p className="text-sm text-jet-600 dark:text-gray-400">Utility-First CSS</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-white">TS</span>
                </div>
                <p className="font-semibold text-jet-800 dark:text-white">TypeScript</p>
                <p className="text-sm text-jet-600 dark:text-gray-400">Type Safety</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-white">ERP</span>
                </div>
                <p className="font-semibold text-jet-800 dark:text-white">Frappe ERP</p>
                <p className="text-sm text-jet-600 dark:text-gray-400">Backend System</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-champagne-200 dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-asparagus to-asparagus-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-jet-800 dark:text-white">Sinergia Sales</h3>
              </div>
              <p className="text-jet-600 dark:text-gray-300 text-sm">
                Platform manajemen penjualan terintegrasi dengan Frappe ERPNext untuk solusi bisnis modern yang efisien dan terukur.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-jet-800 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-jet-600 dark:text-gray-300 hover:text-asparagus dark:hover:text-asparagus-400 transition-colors">
                    Login Dashboard
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-jet-600 dark:text-gray-300 hover:text-asparagus dark:hover:text-asparagus-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <Link href="/api/health" className="text-jet-600 dark:text-gray-300 hover:text-asparagus dark:hover:text-asparagus-400 transition-colors">
                    System Health
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-jet-800 dark:text-white mb-4">Integration</h4>
              <div className="space-y-3 text-sm text-jet-600 dark:text-gray-300">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-asparagus mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <div>
                    <p className="font-medium">Frappe ERPNext</p>
                    <p className="text-xs">Production & Development</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-asparagus mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="font-medium">Secure Authentication</p>
                    <p className="text-xs">Session-based auth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-champagne-200 dark:border-dark-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-jet-600 dark:text-gray-400">
                &copy; {new Date().getFullYear()} Sinergia Sales. Built with Next.js, Tailwind CSS, and ❤️
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-jet-500 dark:text-gray-500">v1.0.0</span>
                <span className="text-xs text-jet-500 dark:text-gray-500">•</span>
                <a 
                  href="https://github.com/akbaraulia/sinergia-sales-app" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-jet-600 dark:text-gray-400 hover:text-asparagus dark:hover:text-asparagus-400 transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
