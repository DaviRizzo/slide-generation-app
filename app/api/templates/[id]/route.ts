import { NextRequest, NextResponse } from 'next/server';
import { googleAPIClient } from '@/lib/google/client';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const presentationId = params.id;
    
    if (!presentationId) {
      return NextResponse.json(
        { error: 'ID da apresentação não fornecido' },
        { status: 400 }
      );
    }

    // Busca a apresentação
    const presentation = await googleAPIClient.getPresentation(presentationId);

    if (!presentation) {
      return NextResponse.json(
        { error: 'Apresentação não encontrada' },
        { status: 404 }
      );
    }

    // Busca as imagens dos slides
    const thumbnails = await Promise.all(
      (presentation.slides || []).map(async (slide: any, index: number) => {
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
    const slides = presentation.slides?.map((slide: any, index: number) => ({
      id: slide.objectId,
      title: slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId || '',
      thumbnail: thumbnails[index] || '',
      pageElements: slide.pageElements || [],
    }));

    return NextResponse.json({
      id: presentationId,
      title: presentation.title || '',
      slides: slides || [],
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=59',
      },
    });

  } catch (error) {
    console.error('Erro ao buscar slides do template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({
      error: 'Falha ao buscar slides do template',
      details: errorMessage,
    }, {
      status: 500
    });
  }
}
