import { NextRequest, NextResponse } from 'next/server';
import { googleAPIClient } from '@/lib/google/client';

interface GoogleSlide {
  objectId: string;
  slideProperties?: {
    notesPage?: {
      notesProperties?: {
        speakerNotesObjectId?: string;
      };
    };
  };
  pageElements?: GooglePageElement[];
}

interface GooglePageElement {
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

interface GooglePresentation {
  slides?: GoogleSlide[];
}

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const { id: presentationId } = await context.params;

    if (!presentationId) {
      return NextResponse.json(
        { error: 'ID da apresentação não fornecido' },
        { status: 400 }
      );
    }

    // Busca a apresentação
    const presentation = await googleAPIClient.getPresentation(presentationId) as GooglePresentation;

    if (!presentation) {
      return NextResponse.json(
        { error: 'Apresentação não encontrada' },
        { status: 404 }
      );
    }

    // Busca as imagens dos slides
    const thumbnails = await Promise.all(
      (presentation.slides || []).map(async (slide: GoogleSlide) => {
        try {
          const response = await googleAPIClient.slides.presentations.pages.getThumbnail({
            presentationId,
            pageObjectId: slide.objectId,
          });
          return response.data.contentUrl;
        } catch (error) {
          console.error(`Erro ao buscar thumbnail do slide ${slide.objectId}:`, error);
          return null;
        }
      })
    );

    // Extrai informações relevantes dos slides
    const slides = presentation.slides?.map((slide: GoogleSlide, i: number) => ({
      id: slide.objectId,
      title: slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId || '',
      thumbnail: thumbnails[i] || '',
      pageElements: slide.pageElements || [],
    }));

    return NextResponse.json({
      id: presentationId,
      slides,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da apresentação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
