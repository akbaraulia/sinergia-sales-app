'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Input, 
  Textarea, 
  Checkbox, 
  Select 
} from '@/components/ui/Form'
import { 
  Alert, 
  Toast 
} from '@/components/ui/Alert'
import { 
  Modal, 
  ConfirmModal 
} from '@/components/ui/Modal'
import { 
  Badge, 
  StatusBadge, 
  PriorityBadge 
} from '@/components/ui/Badge'
import { 
  DataTable 
} from '@/components/ui/Table'
import { 
  Spinner, 
  LoadingDots, 
  Skeleton, 
  LoadingCard 
} from '@/components/ui/Loading'

export default function ComponentsDemo() {
  const [showModal, setShowModal] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    category: '',
    notifications: false
  })

  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', priority: 'high' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending', priority: 'medium' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', priority: 'low' },
  ]

  const tableColumns = [
    { key: 'id' as const, label: 'ID', sortable: true },
    { key: 'name' as const, label: 'Name', sortable: true },
    { key: 'email' as const, label: 'Email', sortable: true },
    { 
      key: 'status' as const, 
      label: 'Status', 
      render: (value: any) => <StatusBadge status={value} />
    },
    { 
      key: 'priority' as const, 
      label: 'Priority', 
      render: (value: any) => <PriorityBadge priority={value} />
    },
  ]

  const addToast = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const selectOptions = [
    { value: '', label: 'Select Category', disabled: true },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'home', label: 'Home & Garden' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">UI Components Demo</h1>
          <p className="mt-2 text-gray-600">Comprehensive showcase of all UI components</p>
        </div>

        <div className="space-y-12">
          {/* Buttons Section */}
          <section className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Buttons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Sizes</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">States</h3>
                <div className="flex flex-wrap gap-2">
                  <Button disabled>Disabled</Button>
                  <Button onClick={() => addToast('success', 'Button clicked!')}>
                    Click Me
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Form Components */}
          <section className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={formData.email && !formData.email.includes('@') ? 'Invalid email' : ''}
                />

                <Select
                  label="Category"
                  options={selectOptions}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Choose a category"
                />

                <Checkbox
                  label="Email Notifications"
                  description="Receive notifications about updates"
                  checked={formData.notifications}
                  onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                />
              </div>

              <div>
                <Textarea
                  label="Description"
                  placeholder="Tell us more about yourself..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-40"
                />
              </div>
            </div>
          </section>

          {/* Alerts */}
          <section className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts</h2>
            <div className="space-y-4">
              <Alert variant="info" title="Information">
                This is an informational alert with some additional context.
              </Alert>
              
              <Alert variant="success" title="Success">
                Your action was completed successfully!
              </Alert>
              
              <Alert 
                variant="warning" 
                title="Warning"
                onClose={() => console.log('Warning dismissed')}
              >
                This is a dismissible warning alert.
              </Alert>
              
              <Alert variant="error" title="Error">
                Something went wrong. Please try again.
              </Alert>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-3">Toast Notifications</h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => addToast('info', 'This is an info toast')}
                >
                  Info Toast
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => addToast('success', 'Success! Action completed')}
                >
                  Success Toast
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => addToast('warning', 'Warning: Check your input')}
                >
                  Warning Toast
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => addToast('error', 'Error: Something went wrong')}
                >
                  Error Toast
                </Button>
              </div>
            </div>
          </section>

          {/* Badges */}
          <section className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Badges</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Basic Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-3">Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="active" />
                  <StatusBadge status="inactive" />
                  <StatusBadge status="pending" />
                  <StatusBadge status="approved" />
                  <StatusBadge status="rejected" />
                  <StatusBadge status="draft" />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-3">Priority Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <PriorityBadge priority="low" />
                  <PriorityBadge priority="medium" />
                  <PriorityBadge priority="high" />
                  <PriorityBadge priority="urgent" />
                </div>
              </div>
            </div>
          </section>

          {/* Loading Components */}
          <section className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Loading Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center space-y-4">
                <h3 className="font-medium text-gray-700">Spinners</h3>
                <div className="flex items-center justify-center gap-4">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="font-medium text-gray-700">Loading Dots</h3>
                <div className="flex items-center justify-center gap-4">
                  <LoadingDots size="sm" />
                  <LoadingDots size="md" />
                  <LoadingDots size="lg" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Skeleton</h3>
                <Skeleton className="h-4" />
                <Skeleton rows={3} />
              </div>
            </div>
          </section>

          {/* Data Table */}
          <section className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Table</h2>
            <DataTable
              data={sampleData}
              columns={tableColumns}
              onRowClick={(row) => addToast('info', `Clicked on ${row.name}`)}
            />
          </section>

          {/* Modals */}
          <section className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Modals</h2>
            <div className="flex gap-4">
              <Button onClick={() => setShowModal(true)}>
                Open Modal
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowConfirm(true)}
              >
                Confirm Dialog
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            variant={toast.type}
            onDismiss={removeToast}
          >
            {toast.message}
          </Toast>
        ))}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This is an example modal dialog. You can put any content here.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowModal(false)
              addToast('success', 'Modal action completed!')
            }}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false)
          addToast('success', 'Action confirmed!')
        }}
        title="Confirm Action"
        message="Are you sure you want to perform this action? This cannot be undone."
        type="danger"
      />
    </div>
  )
}
