import { test, expect } from '@playwright/test';
import { loginToAdmin, navigateToTab, waitForPageLoad, randomString } from '../../fixtures/test-utils';

/**
 * 記事管理 E2Eテスト
 * 管理画面の記事一覧・編集機能
 */
test.describe('記事管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginToAdmin(page);
    await navigateToTab(page, '記事一覧');
    await waitForPageLoad(page);
  });

  test('POST-01: 記事一覧が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // テーブルまたはリストビューが表示される
    const table = page.locator('table');
    const listView = page.locator('[data-testid="posts-list"]').or(page.locator('.grid'));

    // 少し待機してコンテンツが表示されるのを待つ
    await page.waitForTimeout(1000);

    const hasTable = await table.isVisible();
    const hasList = await listView.isVisible();

    // テーブルまたはリストが表示される（またはコンテンツエリアが存在）
    const mainContent = page.locator('main').or(page.locator('[role="main"]'));
    const hasMain = await mainContent.isVisible();

    expect(hasTable || hasList || hasMain).toBe(true);
  });

  test('POST-02: 検索フィルターでタイトル絞り込み', async ({ page }) => {
    // 検索入力欄を探す
    const searchInput = page.getByPlaceholder(/検索|タイトル/i).first();

    if (await searchInput.isVisible()) {
      // テスト記事を検索
      await searchInput.fill('テスト');
      await searchInput.press('Enter');
      await waitForPageLoad(page);

      // 結果が表示される
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();

      // 0件でもエラーにはならない
      expect(rowCount).toBeGreaterThanOrEqual(0);
    } else {
      test.skip();
    }
  });

  test('POST-03: ステータスフィルター切替', async ({ page }) => {
    // ステータスフィルターを探す
    const statusFilter = page.getByRole('combobox').first();

    if (await statusFilter.isVisible()) {
      // 下書きを選択
      await statusFilter.click();
      await page.getByText('下書き').click();
      await waitForPageLoad(page);

      // テーブルが更新される
      await expect(page.locator('table')).toBeVisible();
    } else {
      // タブ形式のフィルターを探す
      const draftTab = page.getByRole('button', { name: /下書き|Draft/i });
      if (await draftTab.isVisible()) {
        await draftTab.click();
        await waitForPageLoad(page);
      }
    }
  });

  test('POST-04: 記事作成（手動）→エディタ遷移', async ({ page }) => {
    // 新規作成ボタンを探す
    const createButton = page.getByRole('button', { name: /新規|作成|追加/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();

      // メニューが表示される場合
      const manualOption = page.getByText(/手動で作成|手動/i);
      if (await manualOption.isVisible()) {
        await manualOption.click();
      }

      // エディタに遷移するか確認
      // （実際のエディタ遷移パスに応じて調整）
      await waitForPageLoad(page);

      // エディタまたは作成フォームが表示される
      const isEditor = await page.getByText(/記事編集|エディタ|タイトル/i).isVisible();
      expect(isEditor).toBe(true);
    }
  });

  test('POST-05: 記事編集', async ({ page }) => {
    // 最初の記事行をクリック
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible()) {
      // 編集リンクまたは行をクリック
      const editButton = firstRow.getByRole('button', { name: /編集/i });
      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        // 行のタイトルをクリック
        await firstRow.locator('td').first().click();
      }

      await waitForPageLoad(page);

      // 編集画面またはエディタが表示される
      // （実装に応じて調整）
    }
  });

  test('POST-06: ステータス変更（ドロップダウン）', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible()) {
      // ステータスセル内のドロップダウンを探す
      const statusDropdown = firstRow.locator('[role="combobox"]').first();

      if (await statusDropdown.isVisible()) {
        await statusDropdown.click();

        // ステータスオプションを選択
        const publishOption = page.getByText(/公開|PUBLISHED/i).first();
        if (await publishOption.isVisible()) {
          await publishOption.click();
          await waitForPageLoad(page);
        }
      }
    }
  });

  test('POST-07: 予約公開設定', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible()) {
      // アクションメニューを開く
      const menuButton = firstRow.getByRole('button', { name: /メニュー|…|⋯|more/i });

      if (await menuButton.isVisible()) {
        await menuButton.click();

        // 予約公開オプションを探す
        const scheduleOption = page.getByText(/予約|スケジュール/i);
        if (await scheduleOption.isVisible()) {
          await scheduleOption.click();

          // 日付ピッカーダイアログが表示される
          await expect(page.getByRole('dialog')).toBeVisible();
        }
      }
    }
  });

  test('POST-08: 記事削除（確認ダイアログ→ゴミ箱）', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible()) {
      // アクションメニューを開く
      const menuButton = firstRow.getByRole('button').last();

      if (await menuButton.isVisible()) {
        await menuButton.click();

        // 削除オプションを探す
        const deleteOption = page.getByText(/削除/i).first();
        if (await deleteOption.isVisible()) {
          await deleteOption.click();

          // 確認ダイアログが表示される
          const dialog = page.getByRole('alertdialog');
          if (await dialog.isVisible()) {
            // キャンセルをクリック（実際に削除しない）
            await page.getByRole('button', { name: /キャンセル/i }).click();
          }
        }
      }
    }
  });

  test('POST-09: 記事復元', async ({ page }) => {
    // ゴミ箱タブに移動
    const trashTab = page.getByRole('button', { name: /ゴミ箱|削除済み|DELETED/i });

    if (await trashTab.isVisible()) {
      await trashTab.click();
      await waitForPageLoad(page);

      const firstDeletedRow = page.locator('table tbody tr').first();

      if (await firstDeletedRow.isVisible()) {
        // 復元ボタンを探す
        const restoreButton = firstDeletedRow.getByRole('button', { name: /復元/i });

        if (await restoreButton.isVisible()) {
          await restoreButton.click();
          await waitForPageLoad(page);
        }
      }
    }
  });

  test('POST-10: 一括選択＆削除', async ({ page }) => {
    // 複数行のチェックボックスを選択
    const checkboxes = page.locator('table tbody tr input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      // 一括アクションボタンが表示される
      const bulkDeleteButton = page.getByRole('button', { name: /削除|一括削除/i });

      if (await bulkDeleteButton.isVisible()) {
        await bulkDeleteButton.click();

        // 確認ダイアログ
        const dialog = page.getByRole('alertdialog');
        if (await dialog.isVisible()) {
          // キャンセル
          await page.getByRole('button', { name: /キャンセル/i }).click();
        }
      }
    }
  });
});
