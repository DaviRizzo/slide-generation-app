"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Plus } from "@/components/ui/icons"
import Link from "next/link"
import { DriveFile, TemplatesResponse } from "@/types/google"
import { Skeleton } from "@/components/ui/skeleton"
import { TemplatePreview } from "@/components/template-preview"

interface PresentationGridProps {
  onSelect?: (template: DriveFile) => void;
  showCreateNew?: boolean;
  category?: string;
}

export function PresentationGrid({ onSelect, showCreateNew = true, category }: PresentationGridProps) {
  const [templates, setTemplates] = useState<TemplatesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/templates")
        if (!response.ok) {
          throw new Error("Falha ao carregar templates")
        }
        const data: TemplatesResponse = await response.json()
        setTemplates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar templates")
        console.error("Erro ao buscar templates:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Erro ao carregar templates: {error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {showCreateNew && (
        <Link href="/">
          <Card className="h-full p-6 flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-accent transition-colors">
            <Plus className="h-12 w-12 mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Crie uma nova apresentação
            </p>
          </Card>
        </Link>
      )}

      {templates?.files.presentations
        .filter(template => !category || template.name.startsWith(category))
        .map((template) => (
          <TemplatePreview
            key={template.id}
            template={template}
            onSelect={onSelect || (() => {})}
          />
      ))}
    </div>
  )
}
