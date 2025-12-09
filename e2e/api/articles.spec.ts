import { test, expect } from '@playwright/test';
import { PUBLIC_URL } from '../fixtures/test-utils';

/**
 * 記事管理API E2Eテスト
 * エンドポイント: /api/articles/*
 *
 * 注意: 実際のAPI認証が必要なため、モック認証環境ではスキップされる可能性あり
 */
test.describe('記事管理API', () => {
  // 認証トークン（テスト環境用）
  let authToken: string | null = null;

  test.beforeAll(async ({ request }) => {
    // モック認証環境のため、実際のAPIテストはスキップ
    // 本番環境では実際のログインを行う
    test.skip(true, 'モック認証環境のためスキップ');
  });

  test.describe('GET /api/articles', () => {
    test('API-ART-01: 記事一覧を取得できる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      const response = await request.get(`${PUBLIC_URL}/api/articles`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.articles).toBeDefined();
      expect(data.data.total).toBeGreaterThanOrEqual(0);
    });

    test('ステータスでフィルターできる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      const response = await request.get(
        `${PUBLIC_URL}/api/articles?status=DRAFT`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      for (const article of data.data.articles) {
        expect(article.status).toBe('DRAFT');
      }
    });

    test('カテゴリでフィルターできる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      const response = await request.get(
        `${PUBLIC_URL}/api/articles?categoryId=some-category-id`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.ok()).toBeTruthy();
    });

    test('検索クエリでフィルターできる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      const response = await request.get(
        `${PUBLIC_URL}/api/articles?search=テスト`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('POST /api/articles', () => {
    test('API-ART-02: 新規記事を作成できる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      const newArticle = {
        title: 'E2Eテスト記事',
        slug: `e2e-test-${Date.now()}`,
        blocks: [
          { id: 'block-1', type: 'p', content: 'テスト本文です。' },
        ],
        status: 'DRAFT',
        categoryId: 'some-category-id',
        authorId: 'some-author-id',
      };

      const response = await request.post(`${PUBLIC_URL}/api/articles`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: newArticle,
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(newArticle.title);
      expect(data.data.slug).toBe(newArticle.slug);
    });

    test('必須フィールドがないとエラー', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      const response = await request.post(`${PUBLIC_URL}/api/articles`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { title: 'タイトルのみ' },
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);
    });
  });

  test.describe('PATCH /api/articles/:id', () => {
    test('API-ART-03: 記事を更新できる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      // まず記事を作成
      const createResponse = await request.post(`${PUBLIC_URL}/api/articles`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          title: '更新テスト記事',
          slug: `update-test-${Date.now()}`,
          blocks: [],
          status: 'DRAFT',
          categoryId: 'some-category-id',
          authorId: 'some-author-id',
        },
      });

      const createData = await createResponse.json();
      const articleId = createData.data.id;

      // 更新
      const updateResponse = await request.patch(
        `${PUBLIC_URL}/api/articles/${articleId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { title: '更新後のタイトル' },
        }
      );

      expect(updateResponse.ok()).toBeTruthy();

      const updateData = await updateResponse.json();
      expect(updateData.data.title).toBe('更新後のタイトル');
    });
  });

  test.describe('DELETE /api/articles/:id', () => {
    test('API-ART-04: 記事を削除できる（ソフトデリート）', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      // まず記事を作成
      const createResponse = await request.post(`${PUBLIC_URL}/api/articles`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          title: '削除テスト記事',
          slug: `delete-test-${Date.now()}`,
          blocks: [],
          status: 'DRAFT',
          categoryId: 'some-category-id',
          authorId: 'some-author-id',
        },
      });

      const createData = await createResponse.json();
      const articleId = createData.data.id;

      // 削除
      const deleteResponse = await request.delete(
        `${PUBLIC_URL}/api/articles/${articleId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(deleteResponse.ok()).toBeTruthy();

      // 削除後、記事はDELETEDステータスになる
      const getResponse = await request.get(
        `${PUBLIC_URL}/api/articles/${articleId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const getData = await getResponse.json();
      expect(getData.data.status).toBe('DELETED');
    });
  });

  test.describe('POST /api/articles/:id/publish', () => {
    test('API-ART-05: 記事を公開できる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      // まず下書き記事を作成
      const createResponse = await request.post(`${PUBLIC_URL}/api/articles`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          title: '公開テスト記事',
          slug: `publish-test-${Date.now()}`,
          blocks: [{ id: 'b1', type: 'p', content: '本文' }],
          status: 'DRAFT',
          categoryId: 'some-category-id',
          authorId: 'some-author-id',
        },
      });

      const createData = await createResponse.json();
      const articleId = createData.data.id;

      // 公開
      const publishResponse = await request.post(
        `${PUBLIC_URL}/api/articles/${articleId}/publish`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { action: 'publish' },
        }
      );

      expect(publishResponse.ok()).toBeTruthy();

      const publishData = await publishResponse.json();
      expect(publishData.data.status).toBe('PUBLISHED');
      expect(publishData.data.publishedAt).not.toBeNull();
    });

    test('予約公開を設定できる', async ({ request }) => {
      test.skip(!authToken, '認証トークンが必要');

      // 記事を作成
      const createResponse = await request.post(`${PUBLIC_URL}/api/articles`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          title: '予約公開テスト',
          slug: `schedule-test-${Date.now()}`,
          blocks: [{ id: 'b1', type: 'p', content: '本文' }],
          status: 'DRAFT',
          categoryId: 'some-category-id',
          authorId: 'some-author-id',
        },
      });

      const createData = await createResponse.json();
      const articleId = createData.data.id;

      // 予約公開
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const scheduleResponse = await request.post(
        `${PUBLIC_URL}/api/articles/${articleId}/publish`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            action: 'schedule',
            scheduledAt: futureDate.toISOString(),
          },
        }
      );

      expect(scheduleResponse.ok()).toBeTruthy();

      const scheduleData = await scheduleResponse.json();
      expect(scheduleData.data.status).toBe('SCHEDULED');
    });
  });
});
