/**
 * 認証イベントバス
 * トークンのクリアやセッション期限切れをAuth Contextに通知するためのシンプルなイベントシステム
 */

export type AuthEvent =
  | { type: 'SESSION_EXPIRED' }
  | { type: 'TOKEN_REFRESHED' }
  | { type: 'FORCE_LOGOUT'; reason: string };

type AuthEventListener = (event: AuthEvent) => void;

class AuthEventBus {
  private listeners: Set<AuthEventListener> = new Set();

  /**
   * イベントリスナーを登録
   * @returns クリーンアップ関数
   */
  subscribe(listener: AuthEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * イベントを発行
   */
  emit(event: AuthEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Auth event listener error:', error);
      }
    });
  }
}

export const authEvents = new AuthEventBus();
