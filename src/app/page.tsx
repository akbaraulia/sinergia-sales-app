import { ThemeToggle, ThemeSelector } from "@/components/theme/ThemeToggle";
import { THEME_COLORS, EXTENDED_PALETTE } from "@/lib/utils/constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-jet">Sinergia Sales</h1>
            <span className="px-2 py-1 bg-asparagus text-white text-xs rounded-full">
              ERPNext Integration
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-asparagus via-asparagus-600 to-asparagus-700 bg-clip-text text-transparent">
            Sinergia Sales Web
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Platform manajemen penjualan terintegrasi dengan Frappe ERPNext. 
            Clean, readable, robust, dan secure untuk kebutuhan bisnis modern.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="btn btn-primary px-8 py-3 text-lg">
              Get Started
            </button>
            <button className="btn btn-outline px-8 py-3 text-lg">
              View Demo
            </button>
          </div>
        </section>

        {/* Color Palette Demo */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center text-jet">Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
            {EXTENDED_PALETTE.map((color) => (
              <div key={color.name} className="text-center">
                <div 
                  className="w-full h-24 rounded-lg shadow-md mb-4 border border-gray-200"
                  style={{ backgroundColor: `#${color.hex}` }}
                />
                <h3 className="font-semibold text-sm text-jet">{color.name}</h3>
                <p className="text-xs text-gray-600">#{color.hex}</p>
                <p className="text-xs text-gray-600">
                  RGB({color.rgb.join(', ')})
                </p>
                <p className="text-xs text-gray-600">
                  HSL({color.hsl.join(', ')})
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center text-jet">Features</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
            <div className="stats-card hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-asparagus flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-jet">Sales Dashboard</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Real-time analytics dan insights untuk performa penjualan
              </p>
            </div>

            <div className="stats-card hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-champagne flex items-center justify-center">
                  <svg className="w-5 h-5 text-jet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-jet">Inventory Management</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Kelola stock dan inventory dengan integrasi ERPNext
              </p>
            </div>

            <div className="stats-card hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-jet flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-jet">Customer Management</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Database customer terintegrasi dengan ERP system
              </p>
            </div>

            <div className="stats-card hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-asparagus-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-jet">Advanced Reports</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Laporan komprehensif dengan visualisasi data interaktif
              </p>
            </div>
          </div>
        </section>

        {/* Component Demo */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center text-jet">UI Components</h2>
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Buttons */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-jet">Buttons</h3>
              </div>
              <div className="card-content">
                <div className="flex flex-wrap gap-4">
                  <button className="btn btn-primary">Primary</button>
                  <button className="btn btn-secondary">Secondary</button>
                  <button className="btn btn-outline">Outline</button>
                  <button className="btn btn-ghost">Ghost</button>
                </div>
              </div>
            </div>

            {/* Form Elements */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-jet">Form Elements</h3>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="form-label">Message</label>
                    <textarea 
                      className="form-input min-h-[80px] resize-none" 
                      placeholder="Enter your message"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-jet">Statistics</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="stats-value">₹2.4M</div>
                    <div className="stats-label">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="stats-value">1,234</div>
                    <div className="stats-label">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="stats-value">98%</div>
                    <div className="stats-label">Customer Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Sinergia Sales. Built with Next.js, Tailwind CSS v3, and ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
