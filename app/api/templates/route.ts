import { NextResponse } from 'next/server';
import { googleAPIClient } from '@/lib/google/client';

// Interface para os arquivos do Drive
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

// Interface para a resposta da API
interface APIResponse {
  files: {
    presentations: DriveFile[];
    images: DriveFile[];
  };
  totalCount: number;
}

export async function GET(): Promise<NextResponse<APIResponse | { error: string, details?: string, code?: string }>> {
  try {
    // Verifica se o ID da pasta está configurado
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      console.error('GOOGLE_DRIVE_FOLDER_ID não está configurado');
      return NextResponse.json(
        { error: 'ID da pasta de templates não está configurado' },
        { status: 500 }
      );
    }

    // Define os tipos MIME que queremos buscar
    const mimeTypes = [
      'application/vnd.google-apps.presentation',
      'image/png',
      'image/jpeg'
    ];

    // Busca os arquivos usando o cliente Google
    const files = await googleAPIClient.listFiles(folderId, mimeTypes);

    if (!files || files.length === 0) {
      return NextResponse.json({ 
        files: { presentations: [], images: [] }, 
        totalCount: 0 
      });
    }

    // Separa apresentações e imagens
    const presentations = files.filter(
      file => file.mimeType === 'application/vnd.google-apps.presentation'
    );
    const images = files.filter(
      file => file.mimeType === 'image/png' || file.mimeType === 'image/jpeg'
    );

    // Busca thumbnails de alta qualidade para cada apresentação
    const presentationsWithHighQualityThumbnails = await Promise.all(
      presentations.map(async (presentation) => {
        const highQualityThumbnail = await googleAPIClient.getFirstSlideThumbnail(presentation.id);
        return {
          ...presentation,
          thumbnailLink: highQualityThumbnail || presentation.thumbnailLink // Fallback para thumbnailLink original
        };
      })
    );

    return NextResponse.json({
      files: {
        presentations: presentationsWithHighQualityThumbnails,
        images
      },
      totalCount: files.length
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=59',
      },
    });

  } catch (error) {
    // Log detalhado do erro
    console.error('Erro ao buscar templates do Google Drive:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao buscar templates';
    const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'UNKNOWN_ERROR';
    
    // Retorna resposta de erro
    return NextResponse.json({
      error: 'Falha ao buscar templates',
      details: errorMessage,
      code: errorCode,
    }, {
      status: 500
    });
  }
}
