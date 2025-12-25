import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// .envファイルを読み込む（環境変数を上書き）
config({ path: resolve(__dirname, "../.env"), override: true });

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function createAuthUser() {
  const email = "owner@example.com";
  const password = "owner123456"; // テスト用パスワード

  console.log(`Creating Supabase Auth user: ${email}`);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("✓ User already exists in Supabase Auth");
      return;
    }
    console.error("Error creating user:", error.message);
    process.exit(1);
  }

  console.log("✓ User created successfully!");
  console.log(`  ID: ${data.user.id}`);
  console.log(`  Email: ${data.user.email}`);
  console.log(`\n  Login credentials:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
}

createAuthUser().catch(console.error);
