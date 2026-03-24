-- Migration 008: Políticas de Supabase Storage para fotos de estudios
-- REQUISITO PREVIO: Crear el bucket manualmente en:
--   Supabase Dashboard > Storage > New Bucket
--   Nombre: studio-photos
--   Public: true (URLs públicas para mostrar en Radar)
--
-- Luego ejecutar este SQL en: Supabase Dashboard > SQL Editor

-- Lectura pública (para que Radar cargue las fotos sin autenticación)
create policy "studio_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'studio-photos');

-- El productor puede subir fotos (cualquier productor autenticado)
create policy "studio_photos_producer_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'studio-photos'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from producers where user_id = auth.uid()
    )
  );

-- El productor puede eliminar sus propias fotos
-- owner_id se asigna automáticamente al subir, así que solo el que subió puede borrar
create policy "studio_photos_producer_delete"
  on storage.objects for delete
  using (
    bucket_id = 'studio-photos'
    and owner = auth.uid()
  );
