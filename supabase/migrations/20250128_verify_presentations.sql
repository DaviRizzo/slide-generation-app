-- Verifica se a tabela presentations existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'presentations') THEN
        -- Criação da tabela presentations
        CREATE TABLE public.presentations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT,
            google_slides_id TEXT NOT NULL,
            template_id TEXT NOT NULL,
            slides_order TEXT[] NOT NULL,
            web_view_link TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );

        -- Criação de índices
        CREATE INDEX idx_presentations_user_id ON public.presentations(user_id);
        CREATE INDEX idx_presentations_google_slides_id ON public.presentations(google_slides_id);
        CREATE INDEX idx_presentations_template_id ON public.presentations(template_id);

        -- Trigger para atualizar updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = TIMEZONE('utc'::text, NOW());
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_presentations_updated_at
            BEFORE UPDATE ON public.presentations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        -- Configurar RLS (Row Level Security)
        ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

        -- Política para permitir inserção
        CREATE POLICY "Enable insert for authenticated users"
            ON public.presentations
            FOR INSERT
            WITH CHECK (true);

        -- Política para permitir leitura
        CREATE POLICY "Enable read access for all users"
            ON public.presentations
            FOR SELECT
            USING (true);
    END IF;
END
$$;
