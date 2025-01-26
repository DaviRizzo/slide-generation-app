"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PresentationGrid } from "@/components/presentation-grid"
import { DriveFile } from "@/types/google"

export default function TemplatesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const prompt = searchParams.get("prompt")

  const handleTemplateSelect = (template: DriveFile) => {
    const url = `/editor?prompt=${encodeURIComponent(prompt || "")}&template=${encodeURIComponent(
      JSON.stringify({
        id: template.id,
        title: template.name,
        thumbnailLink: template.thumbnailLink,
        webViewLink: template.webViewLink,
      })
    )}`
    router.replace(url)
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <h2 className="text-3xl font-bold mb-8 text-center">Escolha um template</h2>

        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Mais Populares</h3>
          <PresentationGrid 
            onSelect={handleTemplateSelect} 
            showCreateNew={false} 
            category="Mais Populares"
          />
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Corporativo</h3>
          <PresentationGrid 
            onSelect={handleTemplateSelect} 
            showCreateNew={false}
            category="Corporativo"
          />
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Educação</h3>
          <PresentationGrid 
            onSelect={handleTemplateSelect} 
            showCreateNew={false}
            category="Educação"
          />
        </div>
      </div>
    </Layout>
  )
}
