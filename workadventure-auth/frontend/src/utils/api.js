const API_BASE = '';

export async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    // TODO: Adicionar token JWT aqui quando implementado
    'X-User-Id': localStorage.getItem('userId') || '',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Admin API calls
export const adminAPI = {
  // Current User
  getCurrentUser: () => {
    return apiRequest('/admin/me');
  },

  updateCurrentUser: (data) => {
    return apiRequest('/admin/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    return apiRequest('/admin/logout', {
      method: 'POST',
    });
  },

  // Users
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users?${query}`);
  },

  getUserDetails: (userId) => {
    return apiRequest(`/admin/users/${userId}`);
  },

  createUser: (data) => {
    return apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: (userId, data) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  blockUser: (userId, blocked, reason = '') => {
    return apiRequest(`/admin/users/${userId}/block`, {
      method: 'PUT',
      body: JSON.stringify({ blocked, reason }),
    });
  },

  deleteUser: (userId) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  assignRoles: (userId, roleIds) => {
    return apiRequest(`/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleIds }),
    });
  },

  // Roles
  getRoles: () => {
    return apiRequest('/admin/roles');
  },

  createRole: (data) => {
    return apiRequest('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRole: (roleId, data) => {
    return apiRequest(`/admin/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteRole: (roleId) => {
    return apiRequest(`/admin/roles/${roleId}`, {
      method: 'DELETE',
    });
  },

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/audit-logs?${query}`);
  },

  // Stats
  getStats: () => {
    return apiRequest('/admin/stats');
  },

  // Maps
  getMaps: () => {
    return apiRequest('/admin/maps');
  },

  createMap: (data) => {
    return apiRequest('/admin/maps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateMap: (mapId, data) => {
    return apiRequest(`/admin/maps/${mapId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteMap: (mapId) => {
    return apiRequest(`/admin/maps/${mapId}`, {
      method: 'DELETE',
    });
  },
};
