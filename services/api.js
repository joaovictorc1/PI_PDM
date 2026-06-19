// services/api.js
import { Platform } from 'react-native';

// Android Emulator ↔ 10.0.2.2 aponta ao localhost do host
// Dispositivo físico na mesma rede ↔ IP local da máquina (ex: 192.168.1.x)
// iOS Simulator ↔ localhost funciona diretamente
const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3333/api'
    : 'http://localhost:3333/api';

// ─── Temporário até implementar JWT ───────────────────────
// Substituir por: extrair o userId do token após fazer login
const TEMP_USER_ID = 'substituir-pelo-id-real-do-utilizador';

// ─── Wrapper base ──────────────────────────────────────────
async function request(path, options = {}) {
  const { body, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    // 'Authorization': `Bearer ${token}`,  ← descomentar com JWT
    ...rest,
    ...(body != null && { body: JSON.stringify(body) }),
  });

  // 204 No Content — sem corpo para deserializar
  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error ?? `Erro HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

// ─── Transações ────────────────────────────────────────────
export const transacoesApi = {
  listar: (filtro = 'todas') =>
    request(`/transacoes?userId=${TEMP_USER_ID}&filtro=${filtro}`),

  criar: (payload) =>
    request('/transacoes', {
      method: 'POST',
      body:   { userId: TEMP_USER_ID, ...payload },
    }),

  atualizar: (id, payload) =>
    request(`/transacoes/${id}`, { method: 'PUT', body: payload }),

  eliminar: (id) =>
    request(`/transacoes/${id}`, { method: 'DELETE' }),

  eliminarGrupo: (grupoId) =>
    request(`/transacoes/grupo/${grupoId}`, { method: 'DELETE' }),
};

// ─── Metas ─────────────────────────────────────────────────
export const metasApi = {
  listar: () =>
    request(`/metas?userId=${TEMP_USER_ID}`),

  criar: (payload) =>
    request('/metas', {
      method: 'POST',
      body:   { userId: TEMP_USER_ID, ...payload },
    }),

  eliminar: (id) =>
    request(`/metas/${id}`, { method: 'DELETE' }),
};

// ─── Orçamentos ────────────────────────────────────────────
export const orcamentosApi = {
  listar: () =>
    request(`/orcamentos?userId=${TEMP_USER_ID}`),

  upsert: (categoria, limite) =>
    request('/orcamentos', {
      method: 'PUT',
      body:   { userId: TEMP_USER_ID, categoria, limite },
    }),

  eliminar: (categoria) =>
    request(
      `/orcamentos/${encodeURIComponent(categoria)}?userId=${TEMP_USER_ID}`,
      { method: 'DELETE' }
    ),
};