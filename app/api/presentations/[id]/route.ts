import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { googleAPIClient } from '@/lib/google/client';

interface GoogleSlideThumbnail {
  thumbnailUrl: string | null | undefined;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da apresentação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a apresentação no Supabase
    const { data: presentation, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('google_slides_id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar apresentação:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar apresentação' },
        { status: 500 }
      );
    }

    if (!presentation) {
      return NextResponse.json(
        { error: 'Apresentação não encontrada' },
        { status: 404 }
      );
    }

    // Buscar os thumbnails da apresentação no Google Slides
    const slides = await googleAPIClient.getPresentationThumbnails(id);

    return NextResponse.json({
      presentation,
      slides: slides
        .filter((slide): slide is GoogleSlideThumbnail & { thumbnailUrl: string } => 
          typeof slide.thumbnailUrl === 'string' && slide.thumbnailUrl !== '')
        .map((slide, index) => ({
          id: index,
          thumbnail: slide.thumbnailUrl,
          contentUrl: slide.thumbnailUrl
        })),
    });
  } catch (error) {
    console.error('Erro ao buscar apresentação:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
