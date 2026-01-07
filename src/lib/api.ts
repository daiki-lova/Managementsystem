// API Client for Backend Communication

import { authEvents } from './auth-events';

// Vite uses `import.meta.env` for env vars. Keep empty by default so dev server proxy (`/api` -> backend) works.
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';

// API Response Types (matching backend)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedData<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Token Management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenManager = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,

  setTokens: (access: string, refresh: string) => {
    accessToken = access;
    refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  },

  loadTokens: () => {
    if (typeof window !== 'undefined') {
      accessToken = localStorage.getItem('accessToken');
      refreshToken = localStorage.getItem('refreshToken');
    }
    return { accessToken, refreshToken };
  },

  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};

// API Error Class
export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Token Refresh Logic
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const currentRefreshToken = tokenManager.getRefreshToken();
      if (!currentRefreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        // 401/403 のみトークンをクリア（認証エラー）
        if (response.status === 401 || response.status === 403) {
          tokenManager.clearTokens();
          authEvents.emit({ type: 'SESSION_EXPIRED' });
        }
        // その他のエラー（500等）はトークンを保持
        return false;
      }

      const result: ApiResponse<{ session: { accessToken: string; refreshToken: string } }> = await response.json();

      if (result.success && result.data?.session) {
        tokenManager.setTokens(
          result.data.session.accessToken,
          result.data.session.refreshToken
        );
        authEvents.emit({ type: 'TOKEN_REFRESHED' });
        return true;
      }

      return false;
    } catch (error) {
      // ネットワークエラーの場合はトークンをクリアしない（一時的な障害の可能性）
      console.error('Token refresh network error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Core Fetch Function
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = tokenManager.getAccessToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 with token refresh
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(endpoint, options, false);
    }
    throw new ApiError('UNAUTHORIZED', '認証が必要です', 401);
  }

  const rawText = await response.text();
  if (!rawText) {
    if (!response.ok) {
      throw new ApiError('HTTP_ERROR', response.statusText || 'リクエストに失敗しました', response.status);
    }
    return { success: true } as ApiResponse<T>;
  }

  let result: ApiResponse<T>;
  try {
    result = JSON.parse(rawText) as ApiResponse<T>;
  } catch {
    // If the request is accidentally routed to a non-API server (e.g. missing proxy in dev/prod),
    // we can get HTML back; surface that clearly instead of a generic JSON parse error.
    throw new ApiError(
      'INVALID_RESPONSE',
      'APIレスポンスの形式が不正です（JSONではありません）',
      response.status,
      { url, status: response.status, contentType: response.headers.get('content-type'), bodyPreview: rawText.slice(0, 300) }
    );
  }

  if (!result.success && result.error) {
    throw new ApiError(
      result.error.code,
      result.error.message,
      response.status,
      result.error.details
    );
  }

  return result;
}

// HTTP Methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }
    return apiFetch<T>(url, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};

// File Upload (special handling for FormData)
export async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>,
  retry = true
): Promise<ApiResponse<{ id: string; url: string; filename: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {};

  const token = tokenManager.getAccessToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  // 401エラー時にトークンリフレッシュを試みる
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return uploadFile(endpoint, file, additionalData, false);
    }
    throw new ApiError('UNAUTHORIZED', '認証が必要です', 401);
  }

  const result = await response.json();

  if (!result.success && result.error) {
    throw new ApiError(
      result.error.code,
      result.error.message,
      response.status,
      result.error.details
    );
  }

  return result;
}

// ============================================
// API Endpoints
// ============================================

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{
      user: { id: string; email: string; role: string; name: string | null };
      session: { accessToken: string; refreshToken: string; expiresAt: number };
    }>('/api/auth/login', { email, password }),

  logout: () => api.post('/api/auth/logout'),

  me: () =>
    api.get<{
      id: string;
      email: string;
      role: string;
      name: string | null;
      avatarUrl: string | null;
    }>('/api/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<{
      user: { id: string; email: string; role: string; name: string | null };
      session: { accessToken: string; refreshToken: string };
    }>('/api/auth/refresh', { refreshToken }),
};

// Users
export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string }) =>
    api.get<Array<{
      id: string;
      email: string;
      role: string;
      name: string | null;
      avatarUrl: string | null;
      createdAt: string;
    }>>('/api/users', params),

  get: (id: string) =>
    api.get<{
      id: string;
      email: string;
      role: string;
      name: string | null;
      avatarUrl: string | null;
    }>(`/api/users/${id}`),

  update: (id: string, data: { name?: string; role?: string; avatarUrl?: string }) =>
    api.patch<{ id: string }>(`/api/users/${id}`, data),
};

// Categories
export const categoriesApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      color: string | null;
      articlesCount: number;
      createdAt: string;
      updatedAt: string;
    }>>('/api/categories', params),

  get: (id: string) =>
    api.get<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      color: string | null;
      articlesCount: number;
      createdAt: string;
      updatedAt: string;
    }>(`/api/categories/${id}`),

  create: (data: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
  }) => api.post<{ id: string }>('/api/categories', data),

  update: (id: string, data: {
    name?: string;
    slug?: string;
    description?: string | null;
    color?: string | null;
  }) => api.patch<{ id: string }>(`/api/categories/${id}`, data),

  delete: (id: string) => api.delete(`/api/categories/${id}`),
};

// Authors
export const authorsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<Array<{
      id: string;
      name: string;
      slug: string;
      role: string | null;
      bio: string | null;
      imageUrl: string | null;
      qualifications: string[];
      socialLinks: Record<string, string>;
      categories: string[];
      tags: string[];
      articlesCount: number;
      systemPrompt: string | null;
      createdAt: string;
      updatedAt: string;
    }>>('/api/authors', params),

  get: (id: string) =>
    api.get<{
      id: string;
      name: string;
      slug: string;
      role: string | null;
      bio: string | null;
      imageUrl: string | null;
      qualifications: string[];
      socialLinks: Record<string, string>;
      categories: string[];
      tags: string[];
      systemPrompt: string | null;
    }>(`/api/authors/${id}`),

  create: (data: {
    name: string;
    slug?: string;
    role?: string;
    bio?: string;
    imageUrl?: string;
    qualifications?: string[];
    categories?: string[];
    tags?: string[];
    socialLinks?: Record<string, string>;
    systemPrompt?: string;
  }) => api.post<{ id: string }>('/api/authors', data),

  update: (id: string, data: {
    name?: string;
    slug?: string;
    role?: string;
    bio?: string;
    imageUrl?: string;
    qualifications?: string[];
    categories?: string[];
    tags?: string[];
    socialLinks?: Record<string, string>;
    systemPrompt?: string;
  }) => api.patch<{ id: string }>(`/api/authors/${id}`, data),

  delete: (id: string) => api.delete(`/api/authors/${id}`),
};

// Conversions
export const conversionsApi = {
  list: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get<Array<{
      id: string;
      name: string;
      type: string;
      url: string;
      thumbnailUrl: string | null;
      description: string | null;
      status: string;
      startDate: string | null;
      endDate: string | null;
      _count: { articles: number };
    }>>('/api/conversions', params),

  get: (id: string) =>
    api.get<{
      id: string;
      name: string;
      type: string;
      url: string;
      thumbnailUrl: string | null;
      description: string | null;
      status: string;
    }>(`/api/conversions/${id}`),

  create: (data: {
    name: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.post<{ id: string }>('/api/conversions', data),

  update: (id: string, data: {
    name?: string;
    type?: string;
    url?: string;
    thumbnailUrl?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.patch<{ id: string }>(`/api/conversions/${id}`, data),

  delete: (id: string) => api.delete(`/api/conversions/${id}`),
};



// Brands
export const brandsApi = {
  list: () =>
    api.get<Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      logoUrl: string | null;
      isDefault: boolean;
    }>>('/api/brands'),

  get: (id: string) =>
    api.get<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      logoUrl: string | null;
    }>(`/api/brands/${id}`),

  create: (data: {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
  }) => api.post<{ id: string }>('/api/brands', data),

  update: (id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    isDefault?: boolean;
  }) => api.patch<{ id: string }>(`/api/brands/${id}`, data),

  delete: (id: string) => api.delete(`/api/brands/${id}`),
};

// Articles
export interface ArticleBlock {
  id: string;
  type: string;
  content?: string;
  data?: Record<string, unknown>;
}

export interface ArticleDetail {
  id: string;
  title: string;
  slug: string;
  status: string;
  previousSlug?: string | null;
  deletedAt?: string | null;
  blocks: ArticleBlock[] | unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogpImageUrl?: string | null;
  categories?: { id: string; name: string; slug: string; color?: string | null } | null;
  authors?: { id: string; name: string; role?: string; imageUrl?: string | null; bio?: string | null } | null;
  brands?: { id: string; name: string; slug: string } | null;
  media_assets?: { id: string; url: string; altText?: string | null } | null;
  users?: { id: string; name: string | null; email: string } | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
  conversions?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    thumbnailUrl?: string | null;
    position: number;
  }>;
  images?: Array<{ id: string; url: string; altText?: string | null; type: string; position: number }>;
  knowledgeItems?: Array<{ id: string; title: string; type: string }>;
  publishedAt: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  categories?: { id: string; name: string; slug: string; color?: string | null } | null;
  authors?: { id: string; name: string; imageUrl?: string | null } | null;
  brands?: { id: string; name: string; slug: string } | null;
  media_assets?: { id: string; url: string } | null;
  article_tags?: Array<{ tags: { id: string; name: string; slug: string } }>;
  users?: { id: string; name: string | null; email: string } | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string;
}

export const articlesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    authorId?: string;
    search?: string;
  }) => api.get<ArticleListItem[]>('/api/articles', params),

  get: (id: string) => api.get<ArticleDetail>(`/api/articles/${id}`),

  create: (data: {
    title: string;
    slug?: string;
    blocks?: Array<
      | { id: string; type: string; content?: string; data?: Record<string, unknown> }
      | { type: string; content?: string; order?: number; metadata?: Record<string, unknown> }
    >;
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    categoryId?: string;
    authorId?: string;
    brandId?: string;
    thumbnailId?: string;
    metaTitle?: string;
    metaDescription?: string;
    tagIds?: string[];
    conversionIds?: string[];
  }) => api.post<{ id: string }>('/api/articles', data),

  update: (id: string, data: {
    title?: string;
    slug?: string;
    blocks?: Array<
      | { id: string; type: string; content?: string; data?: Record<string, unknown> }
      | { type: string; content?: string; order?: number; metadata?: Record<string, unknown> }
    >;
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'DELETED';
    categoryId?: string | null;
    authorId?: string | null;
    brandId?: string | null;
    thumbnailId?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogpImageUrl?: string | null;
    tagIds?: string[];
    conversionIds?: string[];
    publishedAt?: string | null;
    version: number;
  }) => api.patch<{ id: string; version: number }>(`/api/articles/${id}`, data),

  delete: (id: string) => api.delete(`/api/articles/${id}`),

  restore: (id: string) => api.post<{ id: string }>(`/api/articles/${id}/restore`),

  publish: (id: string, version: number) =>
    api.post<{ id: string; status: string; publishedAt: string }>(`/api/articles/${id}/publish`, {
      action: "publish",
      version
    }),

  unpublish: (id: string) =>
    api.post<{ id: string; status: string }>(`/api/articles/${id}/publish`, {
      action: "unpublish"
    }),

  schedule: (id: string, scheduledAt: string, version: number) =>
    api.post<{ id: string; status: string; publishedAt: string }>(`/api/articles/${id}/schedule`, {
      scheduledAt,
      version
    }),

  unschedule: (id: string) =>
    api.delete<{ id: string }>(`/api/articles/${id}/schedule`),
};

// Media
export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  source: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  name?: string;
}

export const mediaApi = {
  list: (params?: { page?: number; limit?: number; mimeType?: string; folderId?: string; search?: string }) =>
    api.get<MediaAsset[]>('/api/media', params),

  upload: (file: File, altText?: string) =>
    uploadFile('/api/media', file, altText ? { altText } : undefined),

  delete: (id: string) => api.delete(`/api/media/${id}`),

  update: (id: string, data: { altText?: string }) =>
    api.patch<{ id: string }>(`/api/media/${id}`, data),

  generate: (prompt: string) =>
    api.post<MediaAsset>('/api/media/generate', { prompt }),
};

// Knowledge Bank
export interface KnowledgeEntry {
  id: string;
  title: string | null;
  content: string;
  url: string | null;
  sourceType: string;
  kind: string;
  brandId: string | null;
  brand: { id: string; name: string } | null;
  authorId: string | null;
  author: { id: string; name: string } | null;
  usageCount: number;
  createdAt: string;
}

export const knowledgeBankApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    kind?: string;
    brandId?: string;
    search?: string;
  }) => api.get<KnowledgeEntry[]>('/api/knowledge-bank', params),

  get: (id: string) => api.get<KnowledgeEntry>(`/api/knowledge-bank/${id}`),

  create: (data: {
    content: string;
    title?: string;
    url?: string;
    sourceType?: string;
    kind?: string;
    brandId?: string;
    authorId?: string;
  }) => api.post<{ id: string }>('/api/knowledge-bank', data),

  update: (id: string, data: {
    content?: string;
    title?: string;
    url?: string;
    kind?: string;
    brandId?: string;
    authorId?: string;
  }) => api.patch<{ id: string }>(`/api/knowledge-bank/${id}`, data),

  delete: (id: string) => api.delete(`/api/knowledge-bank/${id}`),

  fetchUrl: (url: string) =>
    api.post<{
      title: string;
      content: string;
      summary: string | null;
    }>('/api/knowledge-bank/fetch-url', { url }),
};

// Generation Jobs
export interface GenerationJob {
  id: string;
  status: string;
  keyword: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  authorId: string | null;
  author: { id: string; name: string } | null;
  conversionId: string | null;
  conversion: { id: string; name: string } | null;
  articleId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const generationJobsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<GenerationJob[]>('/api/generation-jobs', params),

  get: (id: string) => api.get<GenerationJob>(`/api/generation-jobs/${id}`),

  create: (data: {
    keywords: { keyword: string; searchVolume?: number }[];
    categoryId: string;
    authorId: string;
    brandId: string;
    conversionIds?: string[];
    knowledgeItemIds?: string[];
    publishStrategy?: 'DRAFT' | 'PUBLISH_NOW' | 'SCHEDULED';
    scheduledAt?: string;
  }) => api.post<{ jobs: GenerationJob[]; message: string }>('/api/generation-jobs', data),

  cancel: (id: string) => api.delete(`/api/generation-jobs/${id}`),
};

// Keywords
export interface CannibalMatch {
  articleId: string;
  title: string;
  slug: string;
  similarity: number;
  matchType: "title" | "slug" | "keyword";
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  trend: number[];
  score: number;
  reasoning: string;
  isRecommended: boolean;
  // カニバリ判定
  cannibalScore: number;
  cannibalMatches: CannibalMatch[];
}

export interface KeywordSuggestResponse {
  keywords: KeywordSuggestion[];
  context: {
    category: { id: string; name: string; description: string | null };
    conversion: { id: string; name: string; context: string };
    author: { id: string; name: string; role: string };
  };
  volumeRange: { min: number; max: number };
  generatedCount: number;
  tokensUsed?: number;
}

export const keywordsApi = {
  search: (keyword: string) =>
    api.get<{
      keyword: string;
      volume: number | null;
      competition: number | null;
      cpc: number | null;
      relatedKeywords: Array<{
        keyword: string;
        volume: number | null;
      }>;
    }>('/api/keywords', { keyword }),

  suggest: (data: {
    categoryId: string;
    conversionId: string;
    authorId: string;
    seedKeywords?: string[];
    candidateCount?: number;
  }) => api.post<KeywordSuggestResponse>('/api/keywords/suggest', data),
};

// Analytics
export const analyticsApi = {
  getOverview: (period: string = "30") => api.get<{
    overview: {
      pv: number;
      users: number;
      sessions: number;
      bounceRate: string;
      avgSessionDuration: string;
    };
    chartData: { name: string; pv: number; users: number; sessions: number }[];
    taskSummary: {
      draftCount: number;
      reviewCount: number;
      scheduledCount: number;
      publishedThisWeekCount: number;
    };
    ranking: {
      id: string;
      title: string;
      pv: number;
      time: string;
      ctr: string;
    }[];
  }>(`/api/analytics`, { period }),
};

// Notifications
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<Notification[]>('/api/notifications', params),

  markAsRead: (id: string) =>
    api.patch<{ id: string }>(`/api/notifications/${id}`, { isRead: true }),

  markAllAsRead: () =>
    api.post('/api/notifications/mark-all-read'),
};

// Settings
export interface SystemSettings {
  id: string;
  defaultBrandId: string | null;
  openRouterApiKey: string | null;
  gaPropertyId: string | null;
  searchConsoleSiteUrl: string | null;
  gaApiKey: string | null;
  searchConsoleApiKey: string | null;
  searchVolumeApiKey: string | null;
  dataforSeoApiKey: string | null;
  // Search Volume Settings
  minSearchVolume: number;
  maxSearchVolume: number;
  // AI Models
  imageModel: string | null;
  articleModel: string | null;
  analysisModel: string | null;
  // System Prompts
  keywordPrompt: string | null;
  keywordSuggestPrompt: string | null;
  structurePrompt: string | null;
  draftPrompt: string | null;
  proofreadingPrompt: string | null;
  seoPrompt: string | null;
  imagePrompt: string | null;
  updatedAt: string;
}

export const settingsApi = {
  get: () => api.get<SystemSettings>('/api/settings'),

  update: (data: {
    defaultBrandId?: string;
    openRouterApiKey?: string;
    gaPropertyId?: string;
    searchConsoleSiteUrl?: string;
    gaApiKey?: string;
    searchConsoleApiKey?: string;
    searchVolumeApiKey?: string;
    dataforSeoApiKey?: string;
    // Search Volume Settings
    minSearchVolume?: number;
    maxSearchVolume?: number;
    // AI Models
    imageModel?: string;
    articleModel?: string;
    analysisModel?: string;
    // System Prompts
    keywordPrompt?: string;
    keywordSuggestPrompt?: string;
    structurePrompt?: string;
    draftPrompt?: string;
    proofreadingPrompt?: string;
    seoPrompt?: string;
    imagePrompt?: string;
  }) => api.patch<SystemSettings>('/api/settings', data),
};

// Tags (used in articles)
export const tagsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
      _count: { articles: number; article_tags: number };
    }>>('/api/tags', params),

  get: (id: string) =>
    api.get<{
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
      _count: { articles: number; article_tags: number };
    }>(`/api/tags/${id}`),

  create: (data: { name: string; slug: string }) =>
    api.post<{ id: string }>('/api/tags', data),

  update: (id: string, data: { name?: string; slug?: string }) =>
    api.patch<{ id: string }>(`/api/tags/${id}`, data),

  delete: (id: string) => api.delete(`/api/tags/${id}`),
};
