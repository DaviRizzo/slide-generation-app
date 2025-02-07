import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { googleAPIClient } from '@/lib/google/client';

// Interface para o corpo da requisição
interface CreatePresentationRequest {
  templateId: string;
  activeSlides: number[];
  metadata?: Record<string, unknown>;
  prompt?: string;
  slideThemes?: Record<string, string>;
}

interface Template {
  id: string;
  title: string;
  thumbnailLink: string;
  webViewLink: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/presentations] Iniciando criação de apresentação...');
    
    // Obter dados do corpo da requisição
    const body: CreatePresentationRequest = await request.json();
    let { templateId, activeSlides, metadata, prompt, slideThemes } = body;

    // Se templateId for um objeto stringificado, extrair o ID
    try {
      const template = JSON.parse(templateId) as Template;
      templateId = template.id;
    } catch (e) {
      // Se não for um JSON válido, assume que é o ID direto
      console.log('[POST /api/presentations] templateId não é um objeto JSON, usando como ID direto');
    }

    console.log('[POST /api/presentations] Dados processados:', JSON.stringify({ templateId, activeSlides, metadata, prompt, slideThemes }, null, 2));

    if (!templateId) {
      console.error('[POST /api/presentations] ID do template inválido:', { templateId });
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    if (!activeSlides || activeSlides.length === 0) {
      console.error('[POST /api/presentations] Nenhum slide ativo especificado');
      return NextResponse.json(
        { error: 'É necessário especificar pelo menos um slide ativo' },
        { status: 400 }
      );
    }

    console.log('[POST /api/presentations] Criando cópia da apresentação no Google Drive...');
    
    // Criar uma cópia do template no Google Drive
    const newPresentation = await googleAPIClient.copyPresentation(templateId, activeSlides);

    console.log('[POST /api/presentations] Apresentação criada:', newPresentation);

    // Verificar se o ID da apresentação foi gerado
    if (!newPresentation.presentationId) {
      console.error('[POST /api/presentations] Falha ao criar apresentação: ID não gerado');
      return NextResponse.json(
        { error: 'Falha ao criar apresentação: ID não gerado' },
        { status: 500 }
      );
    }

    // Se houver prompt e temas, gerar e substituir texto nos slides
    if (prompt && slideThemes) {
      console.log('[POST /api/presentations] Gerando texto para os slides...');
      await googleAPIClient.replaceTextPlaceholders(
        newPresentation.presentationId,
        prompt,
        slideThemes
      );
      console.log('[POST /api/presentations] Texto gerado e substituído com sucesso');
    }

    const presentationData = {
      google_slides_id: newPresentation.presentationId,
      template_id: templateId,
      slides_order: activeSlides,
      metadata: {
        ...metadata || {},
        prompt,
        slideThemes
      },
      web_view_link: newPresentation.webViewLink
    };

    console.log('[POST /api/presentations] Tentando salvar no Supabase:', JSON.stringify(presentationData, null, 2));

    // Verificar conexão com Supabase
    try {
      const { data: testData, error: testError } = await supabase
        .from('presentations')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('[POST /api/presentations] Erro ao testar conexão com Supabase:', testError);
        throw new Error('Erro na conexão com Supabase');
      }

      console.log('[POST /api/presentations] Conexão com Supabase OK');
    } catch (error) {
      console.error('[POST /api/presentations] Erro ao testar Supabase:', error);
      throw error;
    }

    // Inserir registro na tabela presentations
    const { data, error } = await supabase
      .from('presentations')
      .insert([presentationData])
      .select()
      .single();

    if (error) {
      console.error('[POST /api/presentations] Erro ao salvar no Supabase:', error);
      
      // Log detalhado do erro do Supabase
      if (error.code) {
        console.error('Código do erro:', error.code);
        console.error('Detalhes:', error.details);
        console.error('Dica:', error.hint);
      }
      
      return NextResponse.json(
        { error: 'Erro ao salvar apresentação: ' + error.message },
        { status: 500 }
      );
    }

    console.log('[POST /api/presentations] Apresentação salva com sucesso:', data);

    return NextResponse.json({
      presentation: {
        id: newPresentation.presentationId,
        webViewLink: newPresentation.webViewLink
      }
    });
  } catch (error) {
    console.error('[POST /api/presentations] Erro ao criar apresentação:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
