import { Inngest } from "inngest";

/**
 * Inngest クライアントの初期化
 *
 * 信頼性設計:
 * - 各関数で retries を設定（デフォルト: 3回）
 * - step.run() は名前をキーとした冪等性を自動保証
 * - 外部API呼び出しは step.run() 内で行い、リトライ時の二重実行を防止
 * - onFailure でジョブステータス更新と通知を実施
 * - cancelOn で進行中ジョブのキャンセルに対応
 *
 * バックオフ戦略:
 * - Inngest のデフォルト: 指数バックオフ（初回10秒、最大6時間）
 * - https://www.inngest.com/docs/reference/functions/retries
 *
 * タイムゾーン:
 * - Cron: UTC基準（コメントでJST換算を明記）
 * - 予約投稿: DBにはUTC、表示時にJST変換
 */
export const inngest = new Inngest({
  id: "yoga-media-cms",
  name: "Yoga Media CMS",
});

// イベント型定義
export type Events = {
  // 記事生成イベント
  "article/generate": {
    data: {
      jobId: string;
      keyword: string;
      categoryId: string;
      authorId: string;
      brandId: string;
      conversionIds: string[];
      knowledgeItemIds: string[];
      userId: string;
    };
  };
  // 画像生成イベント
  "article/generate-images": {
    data: {
      articleId: string;
      jobId: string;
    };
  };
  // 予約公開イベント
  "article/scheduled-publish": {
    data: {
      articleId: string;
    };
  };
  // ゴミ箱自動削除イベント
  "article/auto-delete": {
    data: {
      articleId: string;
    };
  };
  // キャンセルイベント
  "article/cancel-generation": {
    data: {
      jobId: string;
    };
  };
  "article/cancel-image-generation": {
    data: {
      articleId: string;
    };
  };
  "article/cancel-scheduled-publish": {
    data: {
      articleId: string;
    };
  };
  "article/cancel-auto-delete": {
    data: {
      articleId: string;
    };
  };
};
