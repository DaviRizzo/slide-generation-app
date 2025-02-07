"use client"

import { useAuth } from "@clerk/nextjs";
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageElement, TemplateSlide } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Loader2 } from "@/components/ui/loader2"
import { SlideCard } from "@/components/slide-card"
import { Zap, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  DragEndEvent,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"

interface Slide {
  id: UniqueIdentifier
  image: string
  isActive: boolean
  theme: string
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

interface TemplateSlide {
  id: string
  title: string
  thumbnail: string
  pageElements: PageElement[]
}

export default function EditorPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter()
  const searchParams = useSearchParams()
  const [slides, setSlides] = useState<Slide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true
    const fetchTemplateSlides = async () => {
      try {
        const templateParam = searchParams.get("template")
        if (!templateParam) {
          if (isMounted) {
            setSlides(Array.from({ length: 8 }, (_, i) => ({
              id: i + 1,
              image: "/placeholder.svg",
              isActive: true,
              theme: "",
            })))
            setIsLoading(false)
          }
          return
        }

        const template = JSON.parse(decodeURIComponent(templateParam))
        const response = await fetch(`/api/templates/${template.id}`)
        
        if (!response.ok) {
          throw new Error('Falha ao carregar os slides do template')
        }

        const data = await response.json()
        
        if (isMounted) {
          setSlides(data.slides.map((slide: TemplateSlide, index: number) => ({
            id: index + 1,
            image: slide.thumbnail || "/placeholder.svg",
            isActive: true,
            theme: "",
          })))
        }
      } catch (error) {
        console.error('Erro ao carregar template:', error)
        if (isMounted) {
          setSlides(Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            image: "/placeholder.svg",
            isActive: true,
            theme: "",
          })))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchTemplateSlides()

    return () => {
      isMounted = false
    }
  }, [searchParams])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // Retorna se "over" for undefined
    if (!over) {
    return;
}

    if (active.id !== over.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleSlideActive = (id: UniqueIdentifier) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, isActive: !slide.isActive } : slide)))
  }

  const updateSlideTheme = (id: UniqueIdentifier, theme: string) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, theme } : slide)))
  }

  const handleGeneratePresentation = async () => {
    try {
      setIsGenerating(true);

      const templateId = searchParams.get("template");
      if (!templateId) {
        toast({
          title: "Erro ao gerar apresentação",
          description: "Template não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Parse o template para obter o ID
      const template = JSON.parse(decodeURIComponent(templateId));

      const prompt = searchParams.get("prompt");
      if (!prompt) {
        toast({
          title: "Erro ao gerar apresentação",
          description: "Prompt não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Filtra apenas os slides ativos e mantém a ordem atual
      const activeSlides = slides
        .filter(item => item.isActive)
        .map(item => item.id); // Mantemos o número do slide (1-based)

      if (activeSlides.length === 0) {
        toast({
          title: "Erro ao gerar apresentação",
          description: "Selecione pelo menos um slide para gerar a apresentação.",
          variant: "destructive",
        });
        return;
      }

      // Cria um objeto com os temas dos slides ativos
      const slideThemes = slides
        .filter(item => item.isActive)
        .reduce((acc, item, index) => ({
          ...acc,
          [index.toString()]: item.theme
        }), {});

      console.log('Enviando requisição com:', {
        templateId: template.id,
        activeSlides,
        prompt,
        slideThemes
      });

      // Faz a requisição para a API
      const response = await fetch('/api/presentations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          activeSlides,
          prompt,
          slideThemes,
          metadata: {
            originalTemplate: templateId,
            generatedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar apresentação');
      }

      // Mostra mensagem de sucesso
      toast({
        title: "Apresentação gerada com sucesso!",
        description: "Você será redirecionado para visualizar sua apresentação.",
      });

      // Redireciona para a página de preview com o ID da apresentação
      router.push(`/preview?presentationId=${data.presentation.id}`);

    } catch (error) {
      console.error('Erro ao gerar apresentação:', error);
      toast({
        title: "Erro ao gerar apresentação",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateThemes = async () => {
    try {
      setIsGeneratingThemes(true);
      const selectedSlides = slides
        .filter(slide => slide.isActive)
        .map(slide => slide.id);

      if (selectedSlides.length === 0) {
        toast({
          title: "Erro ao gerar temas",
          description: "Selecione pelo menos um slide para gerar temas.",
          variant: "destructive",
        });
        return;
      }

      const prompt = searchParams.get("prompt");
      if (!prompt) {
        toast({
          title: "Erro ao gerar temas",
          description: "Prompt não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Mostra toast de carregamento
      toast({
        title: "Gerando temas...",
        description: "Aguarde enquanto a IA gera os temas para os slides selecionados.",
      });

      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          selectedSlides,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar temas');
      }

      if (!data.themes || !Array.isArray(data.themes)) {
        throw new Error('Formato de resposta inválido');
      }

      // Atualiza os temas dos slides selecionados
      let themeIndex = 0;
      const activeSlides = slides.filter(slide => slide.isActive).length;
      
      if (data.themes.length < activeSlides) {
        throw new Error('Número insuficiente de temas gerados');
      }

      setSlides(prev => prev.map(slide => {
        if (slide.isActive && themeIndex < data.themes.length) {
          return { ...slide, theme: data.themes[themeIndex++] };
        }
        return slide;
      }));

      toast({
        title: "Temas gerados com sucesso!",
        description: "Os temas foram aplicados aos slides selecionados.",
      });

    } catch (error) {
      console.error('Erro ao gerar temas:', error);
      toast({
        title: "Erro ao gerar temas",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingThemes(false);
    }
  };

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  if (!userId) {
    return <div>Você precisa estar logado para acessar esta página.</div>;
  }

  if (isLoading) {
    return <div>Carregando template...</div>;
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
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleGenerateThemes}
              disabled={isGeneratingThemes}
            >
              {isGeneratingThemes ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Gerar temas com AI
                </>
              )}
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-center flex-1">Defina os temas e ordem de cada Slide</h1>

          <Button
            onClick={handleGeneratePresentation}
            disabled={isGenerating}
            className="w-[200px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Apresentação"
            )}
          </Button>
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
      <Toaster />
    </Layout>
  )
}
