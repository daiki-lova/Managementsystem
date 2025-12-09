import { test, expect } from '@playwright/test';
import { PUBLIC_URL } from '../fixtures/test-utils';

/**
 * 認証API E2Eテスト
 * エンドポイント: /api/auth/*
 *
 * 注意: Supabase認証が必要なため、一部テストはスキップされる可能性あり
 */
test.describe('認証API', () => {
  test.describe('POST /api/auth/login', () => {
    test('API-AUTH-01: 正常ログイン', async ({ request }) => {
      // 本番環境では実際のSupabaseユーザーでテスト
      // テスト環境ではスキップ
      test.skip(true, 'Supabase認証が必要なためスキップ');

      const response = await request.post(`${PUBLIC_URL}/api/auth/login`, {
        data: {
          email: 'e2e-owner@example.com',
          password: 'test-password',
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
      expect(data.data.session.accessToken).toBeDefined();
      expect(data.data.session.refreshToken).toBeDefined();
    });

    test('API-AUTH-02: 不正パスワードでエラー', async ({ request }) => {
      const response = await request.post(`${PUBLIC_URL}/api/auth/login`, {
        data: {
          email: 'e2e-owner@example.com',
          password: 'wrong-password',
        },
      });

      expect(response.ok()).toBeFalsy();
      // 401または403（APIの実装による）
      expect([400, 401, 403]).toContain(response.status());
    });

    test('メールアドレスが空だとバリデーションエラー', async ({ request }) => {
      const response = await request.post(`${PUBLIC_URL}/api/auth/login`, {
        data: {
          email: '',
          password: 'test-password',
        },
      });

      expect(response.ok()).toBeFalsy();
      // 400または403（APIの実装による）
      expect([400, 403]).toContain(response.status());
    });

    test('パスワードが空だとバリデーションエラー', async ({ request }) => {
      const response = await request.post(`${PUBLIC_URL}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: '',
        },
      });

      expect(response.ok()).toBeFalsy();
      // 400または403（APIの実装による）
      expect([400, 403]).toContain(response.status());
    });

    test('不正なメール形式だとバリデーションエラー', async ({ request }) => {
      const response = await request.post(`${PUBLIC_URL}/api/auth/login`, {
        data: {
          email: 'invalid-email',
          password: 'test-password',
        },
      });

      expect(response.ok()).toBeFalsy();
      // 400または403（APIの実装による）
      expect([400, 403]).toContain(response.status());
    });
  });

  test.describe('POST /api/auth/logout', () => {
    test('API-AUTH-03: ログアウト', async ({ request }) => {
      test.skip(true, 'Supabase認証が必要なためスキップ');

      // 認証トークンが必要
      const response = await request.post(`${PUBLIC_URL}/api/auth/logout`, {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(response.ok()).toBeTruthy();
    });

    test('トークンなしでログアウトはエラー', async ({ request }) => {
      const response = await request.post(`${PUBLIC_URL}/api/auth/logout`);

      // 401または403（APIの実装による）
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('GET /api/auth/me', () => {
    test('API-AUTH-04: ユーザー情報取得', async ({ request }) => {
      test.skip(true, 'Supabase認証が必要なためスキップ');

      const response = await request.get(`${PUBLIC_URL}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.email).toBeDefined();
      expect(data.data.role).toBeDefined();
    });

    test('トークンなしでエラー', async ({ request }) => {
      const response = await request.get(`${PUBLIC_URL}/api/auth/me`);

      // 401または403（APIの実装による）
      expect([401, 403]).toContain(response.status());
    });

    test('無効なトークンでエラー', async ({ request }) => {
      const response = await request.get(`${PUBLIC_URL}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      });

      // 401または403（APIの実装による）
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('POST /api/auth/refresh', () => {
    test('リフレッシュトークンでセッション更新', async ({ request }) => {
      test.skip(true, 'Supabase認証が必要なためスキップ');

      const response = await request.post(`${PUBLIC_URL}/api/auth/refresh`, {
        data: {
          refreshToken: 'valid-refresh-token',
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.data.session.accessToken).toBeDefined();
    });

    test('無効なリフレッシュトークンでエラー', async ({ request }) => {
      const response = await request.post(`${PUBLIC_URL}/api/auth/refresh`, {
        data: {
          refreshToken: 'invalid-refresh-token',
        },
      });

      // 401または403（APIの実装による）
      expect([401, 403]).toContain(response.status());
    });
  });
});
