"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { DriveFile } from "@/types/google"
import { Skeleton } from "@/components/ui/skeleton"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface TemplatePreviewProps {
  template: DriveFile
  onSelect: (template: DriveFile) => void
}

interface PageElement {
  objectId: string;
  title?: string;
  description?: string;
  shape?: {
    placeholder?: {
      type: string;
      index: number;
    };
  };
}

interface Slide {
  id: string
  title: string
  thumbnail: string
  pageElements: PageElement[]
}

interface PresentationDetails {
  id: string
  title: string
  slides: Slide[]
}

export function TemplatePreview({ template, onSelect }: TemplatePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [presentationDetails, setPresentationDetails] = useState<PresentationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPresentationDetails = useCallback(async () => {
    if (!isOpen || !template.id) return;
    
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/templates/${template.id}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar detalhes do template')
      }

      const data = await response.json()
      setPresentationDetails(data)
      setCurrentSlide(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes')
      console.error('Erro ao buscar detalhes do template:', err)
    } finally {
      setIsLoading(false)
    }
  }, [template.id, isOpen])

  useEffect(() => {
    fetchPresentationDetails()
  }, [fetchPresentationDetails])

  const handleNext = () => {
    if (presentationDetails?.slides) {
      setCurrentSlide((prev) => 
        prev < presentationDetails.slides.length - 1 ? prev + 1 : prev
      )
    }
  }

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleUseTemplate = () => {
    setIsOpen(false)
    onSelect(template)
  }

  const removeCategory = (name: string) => {
    // Remove tudo antes do primeiro "-" ou "/" e trim espaços
    return name.replace(/^[^-/]*[-/]\s*/, '').trim()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          <Image
            src={template.thumbnailLink || "/placeholder.svg"}
            alt={template.name}
            width={280}
            height={158}
            className="w-full h-full object-cover"
            quality={100}
            priority
          />
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[900px] p-0 h-[85vh] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Preview do Template {template.name}</DialogTitle>
        </VisuallyHidden>

        <div className="flex flex-col h-full overflow-hidden">
          <div className="relative bg-white flex-1 min-h-0">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : error ? (
              <div className="w-full h-full flex items-center justify-center text-red-500">
                {error}
              </div>
            ) : presentationDetails?.slides?.length ? (
              <>
                <div className="relative h-[calc(100%-120px)] flex items-center justify-center px-16 mt-4">
                  <div className="relative w-full h-full">
                    <Image
                      src={presentationDetails.slides[currentSlide].thumbnail || "/placeholder.svg"}
                      alt={`Slide ${currentSlide + 1}`}
                      fill
                      className="object-contain"
                      priority={currentSlide === 0}
                      quality={100}
                      sizes="(max-width: 900px) 90vw, 900px"
                    />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[120px] px-4 pt-5">
                  <div className="w-full h-full overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-2 py-4 w-max mx-auto">
                      {presentationDetails.slides.map((slide, index) => (
                        <button
                          key={slide.id}
                          onClick={() => setCurrentSlide(index)}
                          className={`relative flex-shrink-0 w-24 h-14 rounded-md overflow-hidden border-2 transition-all ${
                            index === currentSlide
                              ? "border-primary shadow-md"
                              : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          <Image
                            src={slide.thumbnail || "/placeholder.svg"}
                            alt={`Miniatura do slide ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                          <div className={`absolute inset-0 bg-black/5 ${
                            index === currentSlide ? "bg-transparent" : "hover:bg-transparent"
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePrevious}
                  disabled={currentSlide === 0 || isLoading}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={
                    !presentationDetails?.slides || 
                    currentSlide === presentationDetails.slides.length - 1 || 
                    isLoading
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-4 p-2 rounded-full bg-white shadow-lg z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                Nenhum slide encontrado
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold mb-1">{removeCategory(template.name)}</h3>
                <p className="text-sm text-gray-500">
                  {presentationDetails?.slides?.length || 0} slides
                </p>
              </div>
              <Button onClick={handleUseTemplate} size="lg">
                Utilizar este template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
