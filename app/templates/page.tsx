"use client"

import { Layout } from "@/components/layout"
import { TemplatePreview } from "@/components/template-preview"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function TemplatesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const prompt = searchParams.get("prompt")

  const handleTemplateSelect = (template: any) => {
    // Redireciona para o editor com o prompt e o template selecionado
    router.push(`/editor?prompt=${encodeURIComponent(prompt || "")}&template=${JSON.stringify(template)}`)
  }

  const categories = [
    {
      title: "Mais Populares",
      templates: [
        {
          id: 1,
          image: "/placeholder.svg",
          title: "Hospital Resident",
        },
        { id: 2, image: "/placeholder.svg", title: "Content Creation" },
        { id: 3, image: "/placeholder.svg", title: "Tech Startup" },
      ],
    },
    {
      title: "Educação",
      templates: [
        { id: 4, image: "/placeholder.svg", title: "Scale & Surface Area" },
        { id: 5, image: "/placeholder.svg", title: "Unit Rates" },
        { id: 6, image: "/placeholder.svg", title: "Genetics" },
      ],
    },
    {
      title: "Corporativo",
      templates: [
        { id: 7, image: "/placeholder.svg", title: "Business Plan" },
        { id: 8, image: "/placeholder.svg", title: "Marketing Strategy" },
        { id: 9, image: "/placeholder.svg", title: "Annual Report" },
      ],
    },
  ]

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

        <h2 className="text-3xl font-bold mb-8">Escolha um template</h2>

        {categories.map((category) => (
          <div key={category.title} className="mb-12">
            <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.templates.map((template) => (
                <TemplatePreview
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
