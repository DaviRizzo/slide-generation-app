import { Layout } from "@/components/layout"
import { PresentationGrid } from "@/components/presentation-grid"
import Link from "next/link"
import { Home } from '@/components/ui/icons'
import { Button } from "@/components/ui/button"

export default function PresentationsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Menu
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-center mb-12">
          Minhas Apresentações
        </h1>

        <PresentationGrid />
      </div>
    </Layout>
  )
}

