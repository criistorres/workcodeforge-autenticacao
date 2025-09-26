-- Seed: initial_data.sql
-- Descrição: Dados iniciais para desenvolvimento e teste

-- Inserir usuário de teste (senha: Test123!@#)
-- Hash gerado com bcrypt: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZqK2
INSERT INTO users (email, username, password_hash, name, tags, is_active) VALUES
(
    'admin@workadventure.localhost',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZqK2',
    'Administrador',
    '["admin", "developer"]'::jsonb,
    true
),
(
    'test@workadventure.localhost',
    'testuser',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZqK2',
    'Usuário de Teste',
    '["user", "tester"]'::jsonb,
    true
),
(
    'demo@workadventure.localhost',
    'demo',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZqK2',
    'Usuário Demo',
    '["demo", "guest"]'::jsonb,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Atualizar estatísticas da tabela
ANALYZE users;
