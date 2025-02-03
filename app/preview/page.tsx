"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Home, Maximize2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useRef, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"

const platforms = [
  { 
    name: "Google Slides", 
    icon: "/logos/google_slides.svg", 
    color: "transparent",
    action: (id: string) => window.open(`https://docs.google.com/presentation/d/${id}/edit`, '_blank')
  },
  { 
    name: "Canva", 
    icon: "/logos/canva.svg", 
    color: "transparent",
    action: () => {} // Implementação futura
  },
  { 
    name: "PowerPoint", 
    icon: "/logos/powerpoint.svg", 
    color: "transparent",
    action: (id: string) => window.open(`https://docs.google.com/presentation/d/${id}/export/pptx`, '_blank')
  },
  { 
    name: "Download", 
    icon: "/placeholder.svg", 
    color: "bg-black",
    action: () => {} // Implementação futura
  },
]

export default function PreviewPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showExitButton, setShowExitButton] = useState(false)
  const [slides, setSlides] = useState<{ id: number; image: string; contentUrl: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        const id = searchParams.get('presentationId')
        if (!id) {
          setError('ID da apresentação não fornecido')
          return
        }

        setPresentationId(id)

        const response = await fetch(`/api/presentations/${id}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Falha ao carregar a apresentação')
        }

        const data = await response.json()
        if (!data.slides || !Array.isArray(data.slides)) {
          throw new Error('Formato de dados inválido')
        }

        setSlides(data.slides.map((slide: any) => ({
          id: slide.id,
          image: slide.thumbnail,
          contentUrl: slide.contentUrl
        })))
      } catch (error) {
        console.error('Erro ao carregar apresentação:', error)
        setError(error instanceof Error ? error.message : 'Erro ao carregar apresentação')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPresentation()
  }, [searchParams])

  const handleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await fullscreenRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowExitButton(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setShowExitButton(false)
    }, 2000)
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isFullscreen) {
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          setCurrentSlide((prev) => Math.max(0, prev - 1))
        } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
        }
      }
    },
    [isFullscreen, slides.length],
  )

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const navigateSlide = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentSlide((prev) => Math.max(0, prev - 1))
    } else {
      setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-lg">Abra com:</span>
            <div className="flex gap-2">
              {platforms.map((platform) => (
                <Button
                  key={platform.name}
                  onClick={() => {
                    if (presentationId && platform.action) {
                      platform.action(presentationId)
                    }
                  }}
                  className={`w-12 h-12 p-0 rounded-full ${platform.color} flex items-center justify-center hover:opacity-90 transition-opacity`}
                  variant="ghost"
                >
                  <Image
                    src={platform.icon}
                    alt={platform.name}
                    width={48}
                    height={48}
                    className="w-10 h-10 object-contain"
                  />
                </Button>
              ))}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center flex-1">Edite na plataforma que mais gosta!</h1>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleFullscreen} className="h-9 w-9">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Voltar ao Menu
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div
            className={`flex-1 ${isFullscreen ? "fixed inset-0 flex items-center justify-center bg-black" : "h-[calc(100%-7rem)]"}`}
            ref={fullscreenRef}
            onMouseMove={isFullscreen ? handleMouseMove : undefined}
          >
            <Card className={`relative h-full w-auto ${isFullscreen ? 'w-screen h-screen flex items-center justify-center bg-black' : ''}`}>
              <div className={`relative w-full h-full flex items-center justify-center`}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Carregando...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p>{error}</p>
                  </div>
                ) : slides.length > 0 ? (
                  <Image
                    src={slides[currentSlide]?.contentUrl || "/placeholder.svg"}
                    alt={`Slide ${currentSlide + 1}`}
                    fill
                    sizes={isFullscreen ? "100vw" : "(max-width: 768px) 100vw, 768px"}
                    className={`object-contain ${!isFullscreen ? 'rounded-lg' : ''}`}
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>Nenhum slide disponível</p>
                  </div>
                )}
              </div>
              {!isFullscreen && (
                <>
                  <button
                    onClick={() => navigateSlide("prev")}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2"
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => navigateSlide("next")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2"
                    disabled={currentSlide === slides.length - 1}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              {isFullscreen && showExitButton && (
                <button
                  onClick={handleFullscreen}
                  className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-2 transition-opacity"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </Card>
          </div>

          {!isFullscreen && (
            <div className="h-24 mt-2">
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide justify-center">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(index)}
                    className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 ${
                      currentSlide === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={slide.image || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      width={120}
                      height={67}
                      className="w-28 aspect-video object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
