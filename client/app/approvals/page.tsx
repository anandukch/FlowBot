"use client"

import { ApprovalDashboard } from "@/components/approval-dashboard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

export default function ApprovalsPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ApprovalDashboard approverEmail={user?.email || "user@example.com"} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
