import { DashboardLayout } from "@/components/dashboard-layout"
import { KnowledgeBase } from "@/components/knowledge-base"
import { ProtectedRoute } from "@/components/protected-route"

export default function KnowledgePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <KnowledgeBase />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
