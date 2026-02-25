# Sistema de Login Customizado

O sistema agora usa autenticação customizada **SEM Supabase Auth**, permitindo que você insira usuários manualmente no banco de dados.

## Como Funciona

1. **Autenticação**: O login valida o email e senha diretamente na tabela `users`
2. **Armazenamento**: A sessão é salva no `localStorage` do navegador
3. **Duração**: A sessão expira automaticamente após 7 dias
4. **Senha**: Armazenada no campo `password_hash` (atualmente em texto plano)

## Como Adicionar Usuários

### Opção 1: Via SQL Editor do Supabase

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Execute o script `insert_demo_users.sql` para inserir usuários de demonstração
4. Ou crie seus próprios usuários:

```sql
INSERT INTO users (name, email, role, school, password_hash, is_active)
VALUES (
  'Nome do Usuário',
  'email@exemplo.com',
  'solicitante', -- ou 'despachante' ou 'administrador'
  'Nome da Escola', -- opcional, apenas para solicitantes
  'suasenha123', -- senha em texto plano
  true
);
```

### Opção 2: Via Table Editor do Supabase

1. Acesse o Supabase Dashboard
2. Vá para **Table Editor** > **users**
3. Clique em **Insert** > **Insert row**
4. Preencha os campos:
   - **name**: Nome completo do usuário
   - **email**: Email (único)
   - **role**: `solicitante`, `despachante` ou `administrador`
   - **school**: Nome da escola (opcional, apenas para solicitantes)
   - **password_hash**: A senha em texto plano
   - **is_active**: `true`

## Usuários de Demonstração

O arquivo `insert_demo_users.sql` inclui 7 usuários:

| Email | Senha | Perfil | Escola |
|-------|-------|--------|--------|
| admin@educacao.gov.br | admin123 | Administrador | - |
| carlos@educacao.gov.br | carlos123 | Despachante | - |
| maria@escola1.edu.br | maria123 | Solicitante | Escola Municipal João da Silva |
| joao@escola2.edu.br | joao123 | Solicitante | Escola Municipal Maria das Dores |
| ana@escola3.edu.br | ana123 | Solicitante | Escola Municipal Pedro Alvares |
| pedro@escola4.edu.br | pedro123 | Solicitante | Escola Municipal Santa Rita |
| lucia@escola5.edu.br | lucia123 | Solicitante | Escola Municipal São José |

## Segurança

### Senhas em Produção

Atualmente, as senhas são armazenadas em **texto plano** no campo `password_hash`. Para ambientes de produção, você deve:

1. **Instalar bcrypt**:
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

2. **Modificar a validação** em `src/lib/supabase.ts`:

```typescript
import bcrypt from 'bcrypt';

// No loginWithCredentials, substituir a validação por:
const isPasswordValid = user.password_hash
  ? await bcrypt.compare(password, user.password_hash)
  : false;
```

3. **Criar hash das senhas** ao inserir usuários:

```typescript
const hashedPassword = await bcrypt.hash('senha123', 10);
```

Ou via SQL (requer extensão pgcrypto):

```sql
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Inserir usuário com senha hasheada
INSERT INTO users (name, email, role, password_hash, is_active)
VALUES (
  'Nome',
  'email@exemplo.com',
  'administrador',
  crypt('senha123', gen_salt('bf')), -- bcrypt hash
  true
);
```

### Políticas de Segurança (RLS)

As políticas RLS já estão configuradas na tabela `users` para proteger os dados:

- Usuários podem ver apenas seus próprios dados
- Apenas administradores podem ver todos os usuários
- Apenas administradores podem criar/editar usuários

## Estrutura da Tabela Users

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('solicitante', 'despachante', 'administrador')),
  school text,
  password_hash text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Troubleshooting

### Não consigo fazer login

1. Verifique se o email está correto
2. Verifique se a senha está correta (case-sensitive)
3. Verifique se o usuário está ativo (`is_active = true`)
4. Verifique se o usuário existe no banco de dados

### Sessão expira muito rápido

A sessão expira em 7 dias por padrão. Para alterar, modifique em `src/lib/supabase.ts`:

```typescript
// Altere de 7 para o número de dias desejado
expiresAt.setDate(expiresAt.getDate() + 7);
```

### Erro ao validar sessão

1. Limpe o localStorage do navegador:
   - Abra o DevTools (F12)
   - Vá para **Application** > **Local Storage**
   - Remova a chave `inventory_user_session`
2. Tente fazer login novamente

## Diferenças do Sistema Anterior

| Aspecto | Anterior (Supabase Auth) | Atual (Customizado) |
|---------|-------------------------|---------------------|
| Criação de usuários | Via Supabase Auth signup | Inserção direta no banco |
| Armazenamento de senha | Hash bcrypt pelo Supabase | Campo password_hash na tabela |
| Sessão | Cookies HTTP-only do Supabase | localStorage |
| Expiração | Tokens JWT com refresh | Data de expiração fixa |
| Validação | Via Supabase Auth API | Query direta na tabela |
| Reset de senha | Email automático | Não implementado |

## Próximos Passos (Opcional)

Para melhorar ainda mais o sistema:

1. Implementar hash de senhas com bcrypt
2. Adicionar funcionalidade de reset de senha
3. Implementar refresh token
4. Adicionar logs de tentativas de login
5. Implementar bloqueio após múltiplas tentativas
6. Adicionar autenticação de dois fatores (2FA)
