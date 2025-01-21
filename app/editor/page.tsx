"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { SlideCard } from "@/components/slide-card"
import { Zap, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable"

interface Slide {
  id: number
  image: string
  isActive: boolean
  theme: string
}

export default function EditorPage() {
  const router = useRouter()
  const [slides, setSlides] = useState<Slide[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      image: "/placeholder.svg",
      isActive: true,
      theme: "",
    })),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleSlideActive = (id: number) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, isActive: !slide.isActive } : slide)))
  }

  const updateSlideTheme = (id: number, theme: string) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, theme } : slide)))
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/templates" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Gerar temas com AI
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-center flex-1">Defina os temas e ordem de cada Slide</h1>

          <Button onClick={() => router.push("/preview")}>Gerar Apresentação</Button>
        </div>

        <div className="overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {slides.map((slide) => (
                  <SlideCard
                    key={slide.id}
                    id={slide.id}
                    image={slide.image}
                    isActive={slide.isActive}
                    onToggleActive={() => toggleSlideActive(slide.id)}
                    theme={slide.theme}
                    onThemeChange={(value) => updateSlideTheme(slide.id, value)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </Layout>
  )
}

