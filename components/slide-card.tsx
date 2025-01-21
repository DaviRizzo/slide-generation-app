"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Image from "next/image"

interface SlideCardProps {
  id: number
  image: string
  isActive: boolean
  onToggleActive: () => void
  theme: string
  onThemeChange: (value: string) => void
}

export function SlideCard({ id, image, isActive, onToggleActive, theme, onThemeChange }: SlideCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 relative cursor-move ${!isActive ? "grayscale opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="absolute top-2 left-2 z-10 bg-white rounded-full w-6 h-6 flex items-center justify-center border">
        {id}
      </div>
      <div className="absolute top-2 right-2 z-10">
        <Checkbox
          checked={isActive}
          onCheckedChange={onToggleActive}
          className="bg-white data-[state=checked]:bg-green-500 border-2"
        />
      </div>
      <Image
        src={image || "/placeholder.svg"}
        alt={`Slide ${id}`}
        width={300}
        height={169}
        className="w-full rounded-lg mb-4"
      />
      <Input
        placeholder="Define o tema do slide"
        value={theme}
        onChange={(e) => onThemeChange(e.target.value)}
        className="w-full"
      />
    </Card>
  )
}

