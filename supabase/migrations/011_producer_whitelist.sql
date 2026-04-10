-- Permite que un usuario autenticado consulte la tabla producers por su propio email.
-- Necesario para que ProtectedRoute pueda verificar si el email está pre-registrado
-- antes de vincular el user_id (primer login del productor).
create policy "producers_check_own_email" on producers
  for select using (email = (auth.jwt() ->> 'email'));
