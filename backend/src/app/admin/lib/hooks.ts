'use client';

// Custom hooks for data fetching with TanStack Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoriesApi,
  authorsApi,
  conversionsApi,
  articlesApi,
  mediaApi,
  knowledgeBankApi,
  generationJobsApi,
  keywordsApi,
  analyticsApi,
  notificationsApi,
  settingsApi,
  brandsApi,
  tagsApi,
  ApiError,
  ArticleDetail,
  ArticleListItem,
} from './api';
import { toast } from 'sonner';

// ============================================
// Categories
// ============================================

export function useCategories(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: async () => {
      const response = await categoriesApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('カテゴリーを作成しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'カテゴリーの作成に失敗しました');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof categoriesApi.update>[1] }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('カテゴリーを更新しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'カテゴリーの更新に失敗しました');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('カテゴリーを削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'カテゴリーの削除に失敗しました');
    },
  });
}

// ============================================
// Authors
// ============================================

export function useAuthors(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['authors', params],
    queryFn: async () => {
      const response = await authorsApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
  });
}

export function useAuthor(id: string) {
  return useQuery({
    queryKey: ['authors', id],
    queryFn: async () => {
      const response = await authorsApi.get(id);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('監修者を作成しました');
    },
    onError: (error: ApiError) => {
      // バリデーションエラーの場合は詳細を表示
      if (error.code === 'VALIDATION_ERROR' && error.details) {
        const details = error.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
        const fieldErrors = details.fieldErrors;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          const firstField = Object.keys(fieldErrors)[0];
          const firstError = fieldErrors[firstField]?.[0];
          toast.error(`${firstField}: ${firstError || '入力値が不正です'}`);
          return;
        }
      }
      toast.error(error.message || '監修者の作成に失敗しました');
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof authorsApi.update>[1] }) =>
      authorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('監修者を更新しました');
    },
    onError: (error: ApiError) => {
      // バリデーションエラーの場合は詳細を表示
      if (error.code === 'VALIDATION_ERROR' && error.details) {
        const details = error.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
        const fieldErrors = details.fieldErrors;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          const firstField = Object.keys(fieldErrors)[0];
          const firstError = fieldErrors[firstField]?.[0];
          toast.error(`${firstField}: ${firstError || '入力値が不正です'}`);
          return;
        }
      }
      toast.error(error.message || '監修者の更新に失敗しました');
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast.success('監修者を削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '監修者の削除に失敗しました');
    },
  });
}

// ============================================
// Conversions
// ============================================

export function useConversions(params?: { page?: number; limit?: number; type?: string; status?: string }) {
  return useQuery({
    queryKey: ['conversions', params],
    queryFn: async () => {
      const response = await conversionsApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
  });
}

export function useCreateConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversions'] });
      toast.success('コンバージョンを作成しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'コンバージョンの作成に失敗しました');
    },
  });
}

export function useUpdateConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof conversionsApi.update>[1] }) =>
      conversionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversions'] });
      toast.success('コンバージョンを更新しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'コンバージョンの更新に失敗しました');
    },
  });
}

export function useDeleteConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversions'] });
      toast.success('コンバージョンを削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'コンバージョンの削除に失敗しました');
    },
  });
}

// ============================================
// Articles
// ============================================

export function useArticles(params?: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  authorId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: async () => {
      const response = await articlesApi.list(params);
      return { data: response.data as ArticleListItem[], meta: response.meta };
    },
  });
}

export function useArticle(id: string | null) {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: async () => {
      const response = await articlesApi.get(id!);
      return response.data as ArticleDetail;
    },
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('記事を作成しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '記事の作成に失敗しました');
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof articlesApi.update>[1] }) =>
      articlesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles', variables.id] });
    },
    onError: (error: ApiError) => {
      if (error.code === 'CONFLICT') {
        toast.error('記事は他のユーザーによって更新されました。ページを再読み込みしてください。');
      } else {
        toast.error(error.message || '記事の更新に失敗しました');
      }
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('記事をゴミ箱に移動しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '記事の削除に失敗しました');
    },
  });
}

export function useDeleteArticlePermanent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.deletePermanent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('記事を完全に削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '記事の完全削除に失敗しました');
    },
  });
}

export function useRestoreArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articlesApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('記事を復元しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '記事の復元に失敗しました');
    },
  });
}

export function usePublishArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      articlesApi.publish(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('記事を公開しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '記事の公開に失敗しました');
    },
  });
}

export function useScheduleArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt, version }: { id: string; scheduledAt: string; version: number }) =>
      articlesApi.schedule(id, scheduledAt, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('公開予約を設定しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '公開予約の設定に失敗しました');
    },
  });
}

export function useUnscheduleArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) =>
      articlesApi.unschedule(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('公開予約を解除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '公開予約の解除に失敗しました');
    },
  });
}

// ============================================
// Media
// ============================================

export function useMedia(params?: { page?: number; limit?: number; mimeType?: string }) {
  return useQuery({
    queryKey: ['media', params],
    queryFn: async () => {
      const response = await mediaApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, altText }: { file: File; altText?: string }) =>
      mediaApi.upload(file, altText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('ファイルをアップロードしました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'アップロードに失敗しました');
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mediaApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('ファイルを削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'ファイルの削除に失敗しました');
    },
  });
}

export function useGenerateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) => mediaApi.generate(prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('AI画像を生成しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'AI画像の生成に失敗しました');
    },
  });
}

// ============================================
// Knowledge Bank
// ============================================

export function useKnowledgeBank(params?: {
  page?: number;
  limit?: number;
  kind?: string;
  brandId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['knowledge-bank', params],
    queryFn: async () => {
      const response = await knowledgeBankApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
  });
}

export function useCreateKnowledgeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: knowledgeBankApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bank'] });
      toast.success('情報を追加しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '情報の追加に失敗しました');
    },
  });
}

export function useUpdateKnowledgeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof knowledgeBankApi.update>[1] }) =>
      knowledgeBankApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bank'] });
      toast.success('情報を更新しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '情報の更新に失敗しました');
    },
  });
}

export function useDeleteKnowledgeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: knowledgeBankApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bank'] });
      toast.success('情報を削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '情報の削除に失敗しました');
    },
  });
}

export function useFetchUrl() {
  return useMutation({
    mutationFn: (url: string) => knowledgeBankApi.fetchUrl(url),
    onError: (error: ApiError) => {
      toast.error(error.message || 'URLの取得に失敗しました');
    },
  });
}

// ============================================
// Generation Jobs
// ============================================

export function useGenerationJobs(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['generation-jobs', params],
    queryFn: async () => {
      const response = await generationJobsApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });
}

export function useGenerationJob(id: string | null) {
  return useQuery({
    queryKey: ['generation-jobs', id],
    queryFn: async () => {
      const response = await generationJobsApi.get(id!);
      return response.data!;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll while job is in progress
      const status = query.state.data?.status;
      if (status === 'PENDING' || status === 'PROCESSING') {
        return 3000;
      }
      return false;
    },
  });
}

export function useCreateGenerationJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generationJobsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
      // 情報バンクのusageCountが更新されるため、再取得が必要
      queryClient.invalidateQueries({ queryKey: ['knowledge-bank'] });
      toast.success('記事生成を開始しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '記事生成の開始に失敗しました');
    },
  });
}

export function useCancelGenerationJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generationJobsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
      toast.success('生成ジョブをキャンセルしました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'キャンセルに失敗しました');
    },
  });
}

// ============================================
// Keyword Suggestions
// ============================================

export function useKeywordSuggestions() {
  return useMutation({
    mutationFn: keywordsApi.suggest,
    onSuccess: () => {
      toast.success('キーワード候補を生成しました');
    },
    onError: (error: ApiError) => {
      if (error.code === 'RATE_LIMITED') {
        toast.error('生成回数の制限に達しました。しばらく待ってから再試行してください');
      } else {
        toast.error(error.message || 'キーワード提案の生成に失敗しました');
      }
    },
  });
}

// ============================================
// Analytics
// ============================================

export function useAnalyticsOverview(period?: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: async () => {
      const response = await analyticsApi.getOverview(period || "30");
      return response.data!;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============================================
// Notifications
// ============================================

export function useNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await notificationsApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ============================================
// Settings
// ============================================

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await settingsApi.get();
      return response.data!;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('設定を保存しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || '設定の保存に失敗しました');
    },
  });
}

// ============================================
// Tags
// ============================================

export function useTags(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['tags', params],
    queryFn: async () => {
      const response = await tagsApi.list(params);
      return { data: response.data!, meta: response.meta };
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('タグを作成しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'タグの作成に失敗しました');
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof tagsApi.update>[1] }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('タグを更新しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'タグの更新に失敗しました');
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('タグを削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'タグの削除に失敗しました');
    },
  });
}

// ============================================
// Brands
// ============================================

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await brandsApi.list();
      return response.data!;
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('ブランドを作成しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'ブランドの作成に失敗しました');
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof brandsApi.update>[1] }) =>
      brandsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('ブランドを更新しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'ブランドの更新に失敗しました');
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('ブランドを削除しました');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'ブランドの削除に失敗しました');
    },
  });
}
