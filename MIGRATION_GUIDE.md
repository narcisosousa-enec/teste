# Guia de Migração - Sistema de Login Customizado

Este guia explica as mudanças feitas no sistema de autenticação e como migrar seus dados.

## Mudanças Implementadas

### 1. Arquivo `src/lib/supabase.ts`

**Antes:**
- Usava Supabase Auth para autenticação
- Gerenciava sessões via tabela `user_sessions` com functions RPC
- Armazenava sessões em cookies
- Dependia de functions do PostgreSQL

**Depois:**
- Autenticação customizada direto na tabela `users`
- Sessões armazenadas no localStorage do navegador
- Não depende de functions RPC
- Validação de senha direta (campo `password_hash`)

### 2. Arquivo `src/components/Auth/Login.tsx`

**Mudanças:**
- Removido valores padrão dos campos email e password
- Atualizado texto informativo sobre o sistema
- Mantido suporte aos botões de login rápido para demonstração

### 3. Tabela `users`

**Estrutura mantida:**
```sql
- id (uuid)
- name (text)
- email (text) - único
- role (text) - solicitante|despachante|administrador
- school (text) - opcional
- password_hash (text) - AGORA USADO para armazenar senha
- is_active (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

## Como Migrar Dados Existentes

### Se você já tem usuários no banco

1. **Adicionar senhas aos usuários existentes:**

```sql
-- Atualizar usuários existentes com senhas padrão
UPDATE users SET password_hash = 'senha123' WHERE password_hash IS NULL;

-- Ou definir senhas individuais
UPDATE users SET password_hash = 'admin123' WHERE email = 'admin@educacao.gov.br';
UPDATE users SET password_hash = 'carlos123' WHERE email = 'carlos@educacao.gov.br';
-- etc...
```

2. **Verificar se todos estão ativos:**

```sql
UPDATE users SET is_active = true WHERE is_active IS NULL;
```

### Se você está começando do zero

Execute o script `insert_demo_users.sql` para criar os usuários de demonstração.

## Limpeza (Opcional)

Se você não precisa mais das tabelas e functions antigas do sistema de sessões:

```sql
-- Remover tabela de sessões (se existir)
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Remover functions relacionadas (se existirem)
DROP FUNCTION IF EXISTS validate_session(text);
DROP FUNCTION IF EXISTS create_session(uuid, text, timestamptz, text, text);
DROP FUNCTION IF EXISTS remove_session(text);
DROP FUNCTION IF EXISTS clean_expired_sessions();
```

**ATENÇÃO:** Só faça isso se você tiver certeza que não precisa mais dessas funções!

## Testando o Sistema

### 1. Inserir um usuário de teste

```sql
INSERT INTO users (name, email, role, password_hash, is_active)
VALUES ('Teste Usuario', 'teste@example.com', 'administrador', 'senha123', true);
```

### 2. Fazer login no sistema

1. Acesse a página de login
2. Digite: `teste@example.com`
3. Senha: `senha123`
4. Clique em "Entrar"

### 3. Verificar sessão

1. Abra o DevTools (F12)
2. Vá para **Application** > **Local Storage**
3. Você deve ver a chave `inventory_user_session` com os dados do usuário

## Compatibilidade

### O que continua funcionando

- Todos os módulos existentes (Dashboard, Materiais, Solicitações, etc.)
- Controle de acesso por perfil (roles)
- Sistema de permissões (RLS)
- Todas as APIs e serviços

### O que mudou

- Forma de criar usuários (agora via SQL direto)
- Armazenamento de sessão (de cookies para localStorage)
- Validação de senha (agora comparação direta)

## Vantagens do Novo Sistema

1. **Controle Total**: Você gerencia 100% dos usuários
2. **Simplicidade**: Sem dependência de serviços externos de auth
3. **Flexibilidade**: Fácil adicionar/remover usuários via SQL
4. **Sem Limites**: Não há limites de usuários ou autenticações
5. **Debugging**: Mais fácil debugar problemas de login

## Desvantagens a Considerar

1. **Segurança**: Senhas em texto plano (deve implementar hash)
2. **Recursos**: Sem reset de senha automático
3. **Escalabilidade**: LocalStorage tem limite de ~5-10MB
4. **Sessões**: Não sincroniza entre abas/dispositivos

## Próximos Passos Recomendados

### Curto Prazo

1. Execute o script `insert_demo_users.sql`
2. Teste o login com os usuários demo
3. Verifique se todas as funcionalidades continuam funcionando

### Médio Prazo

1. Implemente hash de senhas com bcrypt
2. Adicione validação de força de senha
3. Implemente logs de auditoria

### Longo Prazo

1. Considere implementar reset de senha por email
2. Adicione autenticação de dois fatores (2FA)
3. Implemente refresh tokens para sessões mais longas

## Suporte

Se você encontrar algum problema:

1. Verifique o console do navegador (F12)
2. Verifique se os usuários existem no banco
3. Limpe o localStorage e tente novamente
4. Verifique se as políticas RLS estão configuradas

## Rollback (Reverter)

Se você precisar voltar ao sistema anterior:

1. Restaure o arquivo `src/lib/supabase.ts` do backup
2. Restaure o arquivo `src/components/Auth/Login.tsx` do backup
3. Recrie as functions do PostgreSQL (se foram removidas)
4. Limpe o localStorage dos usuários

**IMPORTANTE:** Faça backup antes de fazer essas mudanças em produção!
