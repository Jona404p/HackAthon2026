-- Tabla para reportes del mapa
CREATE TABLE IF NOT EXISTS map_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  post_id UUID REFERENCES anonymous_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para posts anonimos del foro
CREATE TABLE IF NOT EXISTS anonymous_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  map_report_id UUID REFERENCES map_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para comentarios anonimos
CREATE TABLE IF NOT EXISTS anonymous_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES anonymous_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE map_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (sin autenticación requerida)
CREATE POLICY "Lectura publica de reportes" ON map_reports FOR SELECT USING (true);
CREATE POLICY "Insercion anonima de reportes" ON map_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion de reportes" ON map_reports FOR UPDATE USING (true);

CREATE POLICY "Lectura publica de posts" ON anonymous_posts FOR SELECT USING (true);
CREATE POLICY "Insercion anonima de posts" ON anonymous_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion de posts" ON anonymous_posts FOR UPDATE USING (true);

CREATE POLICY "Lectura publica de comentarios" ON anonymous_comments FOR SELECT USING (true);
CREATE POLICY "Insercion anonima de comentarios" ON anonymous_comments FOR INSERT WITH CHECK (true);

-- Habilitar Realtime para actualizaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE map_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_comments;