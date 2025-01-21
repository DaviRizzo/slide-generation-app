import { Layout } from "@/components/layout"
import { TemplatePreview } from "@/components/template-preview"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TemplatesPage() {
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
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-center mb-12">Escolha o estilo da sua apresentação</h1>

        <div className="space-y-12">
          {categories.map((category) => (
            <div key={category.title}>
              <h2 className="text-2xl font-semibold mb-6">{category.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {category.templates.map((template) => (
                  <TemplatePreview key={template.id} template={template} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

