import prisma from "./prisma";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

// 監査ログのアクションタイプ
export type AuditAction =
  // 認証
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_PASSWORD_CHANGE"
  // ユーザー
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  // 記事
  | "ARTICLE_CREATE"
  | "ARTICLE_UPDATE"
  | "ARTICLE_PUBLISH"
  | "ARTICLE_UNPUBLISH"
  | "ARTICLE_SCHEDULE"
  | "ARTICLE_UNSCHEDULE"
  | "ARTICLE_TRASH"
  | "ARTICLE_RESTORE"
  | "ARTICLE_DELETE_PERMANENT"
  // カテゴリ
  | "CATEGORY_CREATE"
  | "CATEGORY_UPDATE"
  | "CATEGORY_DELETE"
  // 監修者
  | "AUTHOR_CREATE"
  | "AUTHOR_UPDATE"
  | "AUTHOR_DELETE"
  // コンバージョン
  | "CONVERSION_CREATE"
  | "CONVERSION_UPDATE"
  | "CONVERSION_DELETE"
  // ブランド
  | "BRAND_CREATE"
  | "BRAND_UPDATE"
  | "BRAND_DELETE"
  // メディア
  | "MEDIA_UPLOAD"
  | "MEDIA_DELETE"
  // 設定
  | "SETTINGS_UPDATE"
  // 生成ジョブ
  | "JOB_CREATE"
  | "JOB_CANCEL"
  | "JOB_COMPLETE"
  | "JOB_FAIL";

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// 監査ログを記録
export async function createAuditLog(
  request: NextRequest | null,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const ipAddress = request
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "unknown"
      : entry.ipAddress || "system";

    const userAgent = request
      ? request.headers.get("user-agent") || "unknown"
      : entry.userAgent || "system";

    await prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        action: entry.action,
        userId: entry.userId,
        userEmail: entry.userEmail,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: (entry.details || {}) as Prisma.InputJsonValue,
        ipAddress,
        userAgent: userAgent.slice(0, 500), // 長すぎる場合は切り詰め
      },
    });
  } catch (error) {
    // 監査ログの失敗はサイレントに処理（本番ではアラート推奨）
    console.error("Audit log creation failed:", error);
  }
}

// 監査ログヘルパー関数
export const auditLog = {
  // 認証
  login: (request: NextRequest, userId: string, email: string) =>
    createAuditLog(request, {
      action: "AUTH_LOGIN",
      userId,
      userEmail: email,
    }),

  loginFailed: (request: NextRequest, email: string, reason: string) =>
    createAuditLog(request, {
      action: "AUTH_LOGIN_FAILED",
      userEmail: email,
      details: { reason },
    }),

  logout: (request: NextRequest, userId: string, email: string) =>
    createAuditLog(request, {
      action: "AUTH_LOGOUT",
      userId,
      userEmail: email,
    }),

  // 記事操作
  articlePublish: (request: NextRequest, userId: string, articleId: string, title: string) =>
    createAuditLog(request, {
      action: "ARTICLE_PUBLISH",
      userId,
      resourceType: "article",
      resourceId: articleId,
      details: { title },
    }),

  articleTrash: (request: NextRequest, userId: string, articleId: string, title: string) =>
    createAuditLog(request, {
      action: "ARTICLE_TRASH",
      userId,
      resourceType: "article",
      resourceId: articleId,
      details: { title },
    }),

  articleDeletePermanent: (request: NextRequest, userId: string, articleId: string, title: string) =>
    createAuditLog(request, {
      action: "ARTICLE_DELETE_PERMANENT",
      userId,
      resourceType: "article",
      resourceId: articleId,
      details: { title },
    }),

  // 設定変更
  settingsUpdate: (request: NextRequest, userId: string, changedFields: string[]) =>
    createAuditLog(request, {
      action: "SETTINGS_UPDATE",
      userId,
      resourceType: "settings",
      resourceId: "default",
      details: { changedFields },
    }),

  // マスタデータ操作
  masterDataChange: (
    request: NextRequest,
    action: AuditAction,
    userId: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>
  ) =>
    createAuditLog(request, {
      action,
      userId,
      resourceType,
      resourceId,
      details,
    }),
};
