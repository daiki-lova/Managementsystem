import { defineConfig, devices } from '@playwright/test';

/**
 * E2Eテスト設定
 * 管理画面: http://localhost:5000
 * 公開サイト/API: http://localhost:3001
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list'],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // 管理画面テスト
    {
      name: 'admin',
      testMatch: /pages\/admin\/.*.spec.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5000',
      },
    },
    // 公開サイトテスト
    {
      name: 'public',
      testMatch: /pages\/public\/.*.spec.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    // 公開サイト モバイルテスト
    {
      name: 'public-mobile',
      testMatch: /pages\/public\/.*.spec.ts/,
      use: {
        ...devices['iPhone 13'],
        baseURL: 'http://localhost:3001',
      },
    },
    // APIテスト
    {
      name: 'api',
      testMatch: /api\/.*.spec.ts/,
      use: {
        baseURL: 'http://localhost:3001',
      },
    },
  ],

  // 開発サーバーの起動設定（オプション）
  // webServer: [
  //   {
  //     command: 'npm run dev -- --port 5000',
  //     url: 'http://localhost:5000',
  //     reuseExistingServer: !process.env.CI,
  //     cwd: '.',
  //   },
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:3000',
  //     reuseExistingServer: !process.env.CI,
  //     cwd: './backend',
  //   },
  // ],
});
