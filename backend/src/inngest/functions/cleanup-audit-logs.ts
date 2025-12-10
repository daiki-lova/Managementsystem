import { inngest } from "../client";
import prisma from "@/lib/prisma";

// 監査ログの保持期間（日数）
const AUDIT_LOG_RETENTION_DAYS = 90;

/**
 * 監査ログクリーンアップ（週1回実行）
 *
 * Cron: UTC 04:00 = JST 13:00（毎週日曜日）
 * - 負荷の低い時間帯に実行
 * - 90日より古いログを削除
 */
export const cleanupAuditLogsCron = inngest.createFunction(
  {
    id: "cleanup-audit-logs-cron",
    name: "Cleanup Old Audit Logs",
    retries: 3,
    onFailure: async ({ error }) => {
      console.error("Audit log cleanup failed:", error?.message);
    },
  },
  // Cron: UTC 04:00 日曜日 = JST 13:00 日曜日
  { cron: "0 4 * * 0" },
  async ({ step }) => {
    // 保持期間の閾値を計算
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUDIT_LOG_RETENTION_DAYS);

    // 古いログを削除
    const result = await step.run("delete-old-logs", async () => {
      const { count } = await prisma.audit_logs.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return { deletedCount: count, cutoffDate: cutoffDate.toISOString() };
    });

    console.log(
      `Audit log cleanup completed: ${result.deletedCount} logs deleted (older than ${result.cutoffDate})`
    );

    return result;
  }
);
