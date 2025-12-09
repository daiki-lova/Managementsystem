/**
 * 日時ユーティリティ
 *
 * タイムゾーン設計:
 * - データベース保存: UTC（Prisma のデフォルト）
 * - APIレスポンス: ISO 8601 形式（UTC）
 * - フロントエンド表示: JST（Asia/Tokyo）へ変換
 * - Inngest Cron: UTC 基準（コメントで JST 換算を明記）
 * - ユーザー入力（予約投稿等）: JST として受け取り、UTC へ変換して保存
 */

// JST オフセット（+9時間）
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * JSTの日時文字列をUTCのDateオブジェクトに変換
 * フロントエンドからの予約投稿時刻入力に使用
 *
 * @param jstDateString ISO 8601形式の日時文字列（JSTとして解釈）
 * @returns UTC の Date オブジェクト
 */
export function jstToUtc(jstDateString: string): Date {
  // 入力がISOフォーマットの場合
  const date = new Date(jstDateString);

  // すでにUTC（Zサフィックスまたは+00:00）の場合はそのまま返す
  if (jstDateString.endsWith("Z") || jstDateString.includes("+00:00")) {
    return date;
  }

  // タイムゾーン指定がない場合はJSTとして解釈
  if (!jstDateString.includes("+") && !jstDateString.includes("-", 10)) {
    // JSTとして解釈し、UTCに変換（-9時間）
    return new Date(date.getTime() - JST_OFFSET_MS);
  }

  // 他のタイムゾーン指定がある場合はそのまま
  return date;
}

/**
 * UTC の Date オブジェクトを JST の Date オブジェクトに変換
 *
 * @param utcDate UTC の Date オブジェクト
 * @returns JST の Date オブジェクト
 */
export function utcToJst(utcDate: Date): Date {
  return new Date(utcDate.getTime() + JST_OFFSET_MS);
}

/**
 * UTC の Date オブジェクトを JST の ISO 8601 文字列に変換
 *
 * @param utcDate UTC の Date オブジェクト
 * @returns JST の ISO 8601 文字列（+09:00サフィックス付き）
 */
export function formatJst(utcDate: Date): string {
  const jst = utcToJst(utcDate);
  const year = jst.getUTCFullYear();
  const month = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jst.getUTCDate()).padStart(2, "0");
  const hours = String(jst.getUTCHours()).padStart(2, "0");
  const minutes = String(jst.getUTCMinutes()).padStart(2, "0");
  const seconds = String(jst.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
}

/**
 * 現在のUTC時刻を取得
 */
export function nowUtc(): Date {
  return new Date();
}

/**
 * 現在のJST時刻を取得
 */
export function nowJst(): Date {
  return utcToJst(new Date());
}

/**
 * Cron式のUTC-JST換算表
 * Inngest Cron はUTC基準で動作
 *
 * 例:
 * - "0 3 * * *" (UTC 03:00) = JST 12:00
 * - "0 0 * * *" (UTC 00:00) = JST 09:00
 * - "0 15 * * *" (UTC 15:00) = JST 00:00（翌日）
 * - "* * * * *" (毎分) = JST でも毎分
 */
export const CRON_TZ_NOTES = {
  // 毎日午前3時（UTC）= JST 12:00
  DAILY_3AM_UTC: "0 3 * * * (UTC 03:00 = JST 12:00)",
  // 毎日午前0時（UTC）= JST 09:00
  DAILY_0AM_UTC: "0 0 * * * (UTC 00:00 = JST 09:00)",
  // 毎分
  EVERY_MINUTE: "* * * * * (毎分、TZ無関係)",
} as const;
