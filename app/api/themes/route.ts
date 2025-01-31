import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, selectedSlides } = await req.json();

    if (!prompt || !selectedSlides || selectedSlides.length === 0) {
      return NextResponse.json(
        { error: 'Prompt e slides selecionados são obrigatórios' },
        { status: 400 }
      );
    }

    const systemPrompt = `Você é um especialista em criar apresentações. Com base no prompt "${prompt}", 
    gere ${selectedSlides.length} temas para slides que formem uma apresentação coerente com começo, meio e fim. 
    Cada tema deve ser conciso (máximo 50 caracteres) e direto ao ponto. 
    Retorne um JSON no seguinte formato exato: { "themes": ["tema1", "tema2", ...] }`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Gere os temas para os slides." }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    const parsedContent = JSON.parse(content);
    if (!parsedContent.themes || !Array.isArray(parsedContent.themes)) {
      throw new Error('Formato de resposta inválido da OpenAI');
    }

    // Garante que temos exatamente o número correto de temas
    const themes = parsedContent.themes.slice(0, selectedSlides.length);
    while (themes.length < selectedSlides.length) {
      themes.push("Tema a ser definido");
    }

    return NextResponse.json({ themes });
  } catch (error) {
    console.error('Erro ao gerar temas:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar temas com IA' },
      { status: 500 }
    );
  }
}
