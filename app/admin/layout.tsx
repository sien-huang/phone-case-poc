import type { Metadata } from 'next'
import AdminNavbar from './components/AdminNavbar'
import './admin.css'

export const metadata: Metadata = {
  title: 'Admin | CloudWing',
  description: 'Admin dashboard',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="container admin-content">
        {children}
      </main>
    </div>
  )
}