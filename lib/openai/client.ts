import OpenAI from 'openai';

// Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TextPlaceholder {
  objectId: string;
  currentContent: string;
  maxLength: number;
}

interface GeneratedContent {
  [placeholderId: string]: string;
}

export async function generateSlideContent(
  prompt: string,
  slideTheme: string,
  placeholders: TextPlaceholder[]
): Promise<GeneratedContent> {
  try {
    console.log('[generateSlideContent] Iniciando geração de conteúdo com:', {
      prompt,
      slideTheme,
      placeholders: placeholders.map(p => ({
        objectId: p.objectId,
        currentLength: p.currentContent.length,
        maxLength: p.maxLength
      }))
    });

    // Construir o prompt para a OpenAI
    const systemPrompt = `Você é um assistente especializado em criar conteúdo para apresentações. 
    Gere texto para cada placeholder do slide mantendo coerência entre eles e respeitando o limite de caracteres.
    O texto deve ser relevante ao tema do slide e ao prompt geral da apresentação. *Gere o texto no idioma do usuário ou no idioma que ele escolher*.
    Retorne apenas o JSON com o conteúdo gerado, sem explicações adicionais.`;

    const userPrompt = `
    Prompt geral da apresentação: ${prompt}
    Tema deste slide: ${slideTheme}
    
    Gere conteúdo para os seguintes placeholders. #Lembre-se de respeitar o limites de caracteres de cada placeholder na hora de criar o conteúdo#:
    ${placeholders.map(p => `- ID: ${p.objectId}
       Conteúdo atual do template (serve como contexto para você entender a função desse placeholder no slide quando gerar o texto): ${p.currentContent}
       Limite de caracteres: ${p.maxLength}`).join('\n')}
    
    Retorne um JSON no formato:
    {
      "placeholder_id": "texto gerado",
      ...
    }`;

    console.log('[generateSlideContent] Enviando requisição para OpenAI com prompts:', {
      systemPrompt,
      userPrompt
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    console.log('[generateSlideContent] Resposta recebida da OpenAI:', response.choices[0]?.message);

    // Extrair e validar o JSON da resposta
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Nenhum conteúdo gerado pela OpenAI');
    }

    console.log('[generateSlideContent] Tentando fazer parse do JSON da resposta:', content);
    const generatedContent = JSON.parse(content) as GeneratedContent;

    // Validar se todos os placeholders foram preenchidos e respeitar limites
    for (const placeholder of placeholders) {
      const generated = generatedContent[placeholder.objectId];
      if (!generated) {
        console.error(`[generateSlideContent] Conteúdo não gerado para o placeholder ${placeholder.objectId}`);
        throw new Error(`Conteúdo não gerado para o placeholder ${placeholder.objectId}`);
      }
      if (generated.length > placeholder.maxLength) {
        console.log(`[generateSlideContent] Truncando texto do placeholder ${placeholder.objectId} de ${generated.length} para ${placeholder.maxLength} caracteres`);
        generatedContent[placeholder.objectId] = generated.substring(0, placeholder.maxLength);
      }
    }

    console.log('[generateSlideContent] Conteúdo gerado com sucesso:', generatedContent);
    return generatedContent;
  } catch (error) {
    console.error('[generateSlideContent] Erro ao gerar conteúdo com OpenAI:', error);
    throw error;
  }
}
