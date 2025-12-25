/**
 * Supabase Authに管理者ユーザーを作成するスクリプト
 *
 * 使用方法: npx tsx scripts/create-admin-user.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// .envファイルを読み込む
config();

const supabaseUrl = 'https://towhsfpfillkftcgqflp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2hzZnBmaWxsa2Z0Y2dxZmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2MTEwNSwiZXhwIjoyMDgwODM3MTA1fQ.5VkurH3RA4T4lpVMNDAHQfAeVqzYDoVp5ejjzNdk51w';

// Service Role キーでSupabaseクライアントを作成（管理者権限）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const email = 'admin@radiance.jp';
  const password = 'admin123456';

  console.log('管理者ユーザーを作成中...');
  console.log(`メール: ${email}`);
  console.log(`パスワード: ${password}`);

  try {
    // 既存ユーザーを確認
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('既存ユーザーが見つかりました。パスワードを更新します...');

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('パスワード更新エラー:', updateError.message);
        return;
      }

      console.log('パスワードを更新しました！');
    } else {
      // 新規ユーザー作成
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // メール確認をスキップ
      });

      if (error) {
        console.error('ユーザー作成エラー:', error.message);
        return;
      }

      console.log('ユーザーを作成しました！');
      console.log('ユーザーID:', data.user?.id);
    }

    console.log('\n========================================');
    console.log('ログイン情報:');
    console.log(`  メール: ${email}`);
    console.log(`  パスワード: ${password}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('エラー:', error);
  }
}

createAdminUser();
