-- Script para inserir usuários de demonstração no banco de dados
-- Execute este script no SQL Editor do Supabase

-- Limpar usuários existentes (opcional - comente se não quiser apagar)
-- DELETE FROM users WHERE email IN (
--   'admin@educacao.gov.br',
--   'carlos@educacao.gov.br',
--   'maria@escola1.edu.br',
--   'joao@escola2.edu.br',
--   'ana@escola3.edu.br',
--   'pedro@escola4.edu.br',
--   'lucia@escola5.edu.br'
-- );

-- Inserir usuários de demonstração
-- IMPORTANTE: O campo password_hash contém a senha em texto plano
-- Para maior segurança em produção, use bcrypt ou outro algoritmo de hash

INSERT INTO users (name, email, role, school, password_hash, is_active) VALUES
  ('Administrador Sistema', 'admin@educacao.gov.br', 'administrador', NULL, 'admin123', true),
  ('Carlos Mendes', 'carlos@educacao.gov.br', 'despachante', NULL, 'carlos123', true),
  ('Maria Silva', 'maria@escola1.edu.br', 'solicitante', 'Escola Municipal João da Silva', 'maria123', true),
  ('João Santos', 'joao@escola2.edu.br', 'solicitante', 'Escola Municipal Maria das Dores', 'joao123', true),
  ('Ana Costa', 'ana@escola3.edu.br', 'solicitante', 'Escola Municipal Pedro Alvares', 'ana123', true),
  ('Pedro Lima', 'pedro@escola4.edu.br', 'solicitante', 'Escola Municipal Santa Rita', 'pedro123', true),
  ('Lucia Fernandes', 'lucia@escola5.edu.br', 'solicitante', 'Escola Municipal São José', 'lucia123', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  school = EXCLUDED.school,
  password_hash = EXCLUDED.password_hash,
  is_active = EXCLUDED.is_active;

-- Verificar os usuários inseridos
SELECT id, name, email, role, school, is_active, created_at
FROM users
ORDER BY role, name;
