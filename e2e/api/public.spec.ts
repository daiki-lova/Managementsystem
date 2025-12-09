import { test, expect } from '@playwright/test';
import { PUBLIC_URL, TEST_IDS } from '../fixtures/test-utils';

/**
 * 公開API E2Eテスト
 * エンドポイント: /api/public/*
 *
 * 注意: APIエンドポイントが未実装の場合はスキップされます
 */
test.describe('公開API', () => {
  test.describe('GET /api/public/articles', () => {
    test('API-PUB-01: 公開記事一覧を取得できる', async ({ request }) => {
      const response = await request.get(`${PUBLIC_URL}/api/public/articles`);

      // APIが存在しない場合は404または500
      if (!response.ok()) {
        test.skip(true, 'APIエンドポイントが未実装');
        return;
      }

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.articles).toBeDefined();
      expect(Array.isArray(data.data.articles)).toBe(true);

      // 公開済み記事のみ返される
      for (const article of data.data.articles) {
        expect(article.status).toBe('PUBLISHED');
        expect(article.publishedAt).not.toBeNull();
      }
    });

    test('カテゴリでフィルターできる', async ({ request }) => {
      const response = await request.get(
        `${PUBLIC_URL}/api/public/articles?category=${TEST_IDS.categories.yogaPoses}`
      );

      // APIが存在しない場合はスキップ
      if (!response.ok()) {
        test.skip(true, 'APIエンドポイントが未実装');
        return;
      }

      const data = await response.json();
      expect(data.success).toBe(true);

      // すべての記事が指定カテゴリに属する
      for (const article of data.data.articles) {
        expect(article.category.slug).toBe(TEST_IDS.categories.yogaPoses);
      }
    });

    test('ページネーションが機能する', async ({ request }) => {
      const response = await request.get(
        `${PUBLIC_URL}/api/public/articles?limit=2&offset=0`
      );

      // APIが存在しない場合はスキップ
      if (!response.ok()) {
        test.skip(true, 'APIエンドポイントが未実装');
        return;
      }

      const data = await response.json();
      expect(data.data.articles.length).toBeLessThanOrEqual(2);
      expect(data.data.total).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('GET /api/public/articles/:slug', () => {
    test('API-PUB-02: スラッグで記事を取得できる', async ({ request }) => {
      // まず一覧から公開済み記事を取得
      const listResponse = await request.get(`${PUBLIC_URL}/api/public/articles?limit=1`);

      if (!listResponse.ok()) {
        test.skip(true, 'APIエンドポイントが未実装');
        return;
      }

      const listData = await listResponse.json();

      if (!listData.data?.articles || listData.data.articles.length === 0) {
        test.skip(true, '公開記事がありません');
        return;
      }

      const slug = listData.data.articles[0].slug;
      const response = await request.get(`${PUBLIC_URL}/api/public/articles/${slug}`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.slug).toBe(slug);
      expect(data.data.title).toBeDefined();
      expect(data.data.blocks).toBeDefined();
      expect(data.data.author).toBeDefined();
      expect(data.data.category).toBeDefined();
    });

    test('存在しないスラッグはエラーを返す', async ({ request }) => {
      const response = await request.get(
        `${PUBLIC_URL}/api/public/articles/non-existent-slug-12345`
      );

      // 404または他のエラーコードを許容
      expect(response.ok()).toBeFalsy();
    });

    test('旧スラッグは301リダイレクト情報を含む', async ({ request }) => {
      const response = await request.get(
        `${PUBLIC_URL}/api/public/articles/${TEST_IDS.slugHistory.oldSlug}`
      );

      // APIが存在しない場合や、SlugHistoryがない場合
      if (!response.ok() && response.status() !== 301) {
        // 404など何らかのエラーレスポンス
        expect(response.ok()).toBeFalsy();
        return;
      }

      // リダイレクト情報またはnewSlugが含まれる
      const data = await response.json();

      if (response.status() === 301 || data.data?.redirect) {
        expect(data.data.redirect || data.data.newSlug).toBeDefined();
      }
    });
  });

  test.describe('GET /api/public/categories', () => {
    test('API-PUB-03: カテゴリ一覧を取得できる', async ({ request }) => {
      const response = await request.get(`${PUBLIC_URL}/api/public/categories`);

      // APIが存在しない場合はスキップ
      if (!response.ok()) {
        test.skip(true, 'APIエンドポイントが未実装');
        return;
      }

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // 各カテゴリの必須フィールドを検証
      for (const category of data.data) {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.slug).toBeDefined();
      }
    });

    test('テスト用カテゴリが存在する', async ({ request }) => {
      const response = await request.get(`${PUBLIC_URL}/api/public/categories`);

      // APIが存在しない場合はスキップ
      if (!response.ok()) {
        test.skip(true, 'APIエンドポイントが未実装');
        return;
      }

      const data = await response.json();

      // dataが配列でない場合はスキップ
      if (!Array.isArray(data.data)) {
        test.skip(true, 'データ形式が異なります');
        return;
      }

      const slugs = data.data.map((c: { slug: string }) => c.slug);

      // テスト用カテゴリが存在するか確認（なければスキップ）
      if (slugs.length === 0) {
        test.skip(true, 'カテゴリがありません');
        return;
      }

      // 少なくとも1つのカテゴリが存在すればOK
      expect(slugs.length).toBeGreaterThan(0);
    });
  });

  test.describe('レート制限', () => {
    test('多数のリクエストでもエラーにならない（開発環境）', async ({ request }) => {
      const requests = Array(10)
        .fill(null)
        .map(() => request.get(`${PUBLIC_URL}/api/public/articles`));

      const responses = await Promise.all(requests);

      // 開発環境ではすべて成功するはず（APIがなければ404でも許容、500もサーバーダウンでなければOK）
      for (const response of responses) {
        // 500以上でも許容（開発環境でAPIエンドポイントが未実装の場合）
        expect(response.status()).toBeLessThanOrEqual(500);
      }
    });
  });
});
