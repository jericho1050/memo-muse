-- Add tags and media_tags tables

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES media(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(media_id, tag_id)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own media_tags"
  ON media_tags FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM media m
      WHERE m.id = media_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own media_tags"
  ON media_tags FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM media m
      WHERE m.id = media_id AND m.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM tags t
      WHERE t.id = tag_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own media_tags"
  ON media_tags FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM media m
      WHERE m.id = media_id AND m.user_id = auth.uid()
    )
  );

CREATE TRIGGER set_tags_updated_at
BEFORE UPDATE ON tags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
