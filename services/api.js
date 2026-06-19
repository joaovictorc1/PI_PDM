import { Platform } from 'react-native';

const BASE_URL = 'http://192.168.1.28:3333/api';

// TODO: substituir por userId real após implementar auth (JWT)
const TEMP_USER_ID = null;

// Nunca serializa null/undefined/'' como string literal na query string
function toQueryString(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

async function request(path, options = {}) {
  const { body, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...rest,
    ...(body != null && { body: JSON.stringify(body) }),
  });

  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error ?? `Erro HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const transacoesApi = {
  listar: (filtro = 'todas') =>
    request(`/transacoes${toQueryString({ userId: TEMP_USER_ID, filtro })}`),
  criar: (payload) =>
    request('/transacoes', { method: 'POST', body: { userId: TEMP_USER_ID, ...payload } }),
  atualizar: (id, payload) => request(`/transacoes/${id}`, { method: 'PUT', body: payload }),
  eliminar: (id) => request(`/transacoes/${id}`, { method: 'DELETE' }),
  eliminarGrupo: (grupoId) => request(`/transacoes/grupo/${grupoId}`, { method: 'DELETE' }),
};

export const metasApi = {
  listar: () => request(`/metas${toQueryString({ userId: TEMP_USER_ID })}`),
  criar: (payload) =>
    request('/metas', { method: 'POST', body: { userId: TEMP_USER_ID, ...payload } }),
  eliminar: (id) => request(`/metas/${id}`, { method: 'DELETE' }),
};

export const orcamentosApi = {
  listar: () => request(`/orcamentos${toQueryString({ userId: TEMP_USER_ID })}`),
  upsert: (categoria, limite) =>
    request('/orcamentos', { method: 'PUT', body: { userId: TEMP_USER_ID, categoria, limite } }),
  eliminar: (categoria) =>
    request(`/orcamentos/${encodeURIComponent(categoria)}${toQueryString({ userId: TEMP_USER_ID })}`, { method: 'DELETE' }),
};