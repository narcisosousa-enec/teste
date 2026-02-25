import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Chave para armazenar a sessão no localStorage
const SESSION_STORAGE_KEY = 'inventory_user_session';

// Interface para a sessão do usuário
interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'solicitante' | 'despachante' | 'administrador';
  school?: string;
  createdAt: string;
  sessionToken: string;
  expiresAt: string;
}

// Função para gerar token de sessão
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Função para salvar sessão no localStorage
const saveSession = (session: UserSession) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

// Função para obter sessão do localStorage
const getStoredSession = (): UserSession | null => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session: UserSession = JSON.parse(stored);

    // Verificar se a sessão expirou
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Erro ao ler sessão:', error);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

// Função para remover sessão do localStorage
const clearSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

// Função para validar sessão
export const validateSession = async () => {
  const session = getStoredSession();

  if (!session) {
    return null;
  }

  // Retornar os dados do usuário
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    school: session.school,
    createdAt: session.createdAt
  };
};

// Função para fazer login
export const loginWithCredentials = async (email: string, password: string) => {
  try {
    // Busca usuário por email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .limit(1);

    if (userError || !users || users.length === 0) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    const user = users[0];

    // Validação de senha simples
    // Compara a senha diretamente com o campo password_hash
    // Em produção, você pode usar bcrypt ou outro algoritmo de hash
    if (!user.password_hash || user.password_hash !== password) {
      return { success: false, error: 'Senha incorreta' };
    }

    // Gera sessão
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      createdAt: user.created_at,
      sessionToken,
      expiresAt: expiresAt.toISOString()
    };

    // Salva sessão no localStorage
    saveSession(session);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        createdAt: user.created_at
      }
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
};

// Função para fazer logout
export const logout = async () => {
  clearSession();
};

// Função para obter perfil do usuário atual (compatibilidade)
export const getCurrentUserProfile = async () => {
  return await validateSession();
};

// Função para criar perfil de usuário (compatibilidade)
export const createUserProfile = async (authUser: any, userData: {
  name: string;
  role: 'solicitante' | 'despachante' | 'administrador';
  school?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: userData.name,
      email: authUser.email,
      role: userData.role,
      school: userData.school,
      password_hash: 'senha123' // senha padrão
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
