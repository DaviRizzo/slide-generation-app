"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface TemplatePreviewProps {
  template: {
    id: number
    image: string
    title: string
  }
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    image: template.image,
  }))

  const handleUseTemplate = () => {
    setIsOpen(false)
    router.push("/editor")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          <Image
            src={template.image || "/placeholder.svg"}
            alt={template.title}
            width={280}
            height={158}
            className="w-full h-36 object-cover"
          />
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[900px] p-0 gap-0 max-h-[85vh] overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="relative bg-white rounded-t-lg mt-6">
            <div className="relative" style={{ height: "calc(85vh - 180px)" }}>
              <Image
                src={slides[currentSlide].image || "/placeholder.svg"}
                alt={`Slide ${currentSlide + 1}`}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="p-4 bg-white rounded-b-lg">
            <div className="relative">
              <div className="flex overflow-x-auto gap-4 pb-2 px-12 scrollbar-hide justify-center">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(index)}
                    className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 ${
                      currentSlide === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <div className="w-24 aspect-video relative">
                      <Image
                        src={slide.image || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md"
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md"
                disabled={currentSlide === slides.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <Button className="mx-auto mt-4 px-8 block" onClick={handleUseTemplate}>
              Utilizar este template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

