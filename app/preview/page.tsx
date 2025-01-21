"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Home, Maximize2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useRef, useCallback, useEffect } from "react"

const platforms = [
  { name: "Google Slides", icon: "/placeholder.svg", color: "bg-yellow-500" },
  { name: "Canva", icon: "/placeholder.svg", color: "bg-cyan-500" },
  { name: "PowerPoint", icon: "/placeholder.svg", color: "bg-red-500" },
  { name: "Download", icon: "/placeholder.svg", color: "bg-black" },
]

export default function PreviewPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showExitButton, setShowExitButton] = useState(false)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const slides = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    image: "/placeholder.svg",
  }))

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
                <button
                  key={platform.name}
                  className={`w-12 h-12 rounded-full ${platform.color} flex items-center justify-center`}
                >
                  <Image
                    src={platform.icon || "/placeholder.svg"}
                    alt={platform.name}
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </button>
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

        <div className="max-w-3xl mx-auto" ref={fullscreenRef} onMouseMove={isFullscreen ? handleMouseMove : undefined}>
          <Card className="relative aspect-[16/8] mb-4 flex-1">
            <Image
              src={slides[currentSlide].image || "/placeholder.svg"}
              alt={`Slide ${currentSlide + 1}`}
              fill
              className="object-cover rounded-lg"
            />
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

          {!isFullscreen && (
            <div className="relative h-24">
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
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

