const { PrismaClient } = require('@prisma/client');
const { createDecipheriv, scryptSync } = require('node:crypto');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not set');
  if (Buffer.byteLength(key, 'utf8') !== KEY_LENGTH) {
    const salt = process.env.ENCRYPTION_SALT || 'default-salt-change-me';
    return scryptSync(key, salt, KEY_LENGTH);
  }
  return Buffer.from(key, 'utf8');
}

function decrypt(encryptedData) {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function testKeywordsEverywhereAPI() {
  const settings = await prisma.system_settings.findUnique({
    where: { id: 'default' },
    select: { searchVolumeApiKey: true }
  });
  
  if (!settings || !settings.searchVolumeApiKey) {
    console.log('Keywords Everywhere APIキーが設定されていません');
    return;
  }
  
  const apiKey = decrypt(settings.searchVolumeApiKey).trim();
  console.log('復号化されたAPIキー:', apiKey);
  console.log('APIキー長:', apiKey.length);
  
  // Keywords Everywhere APIをテスト
  const body = new URLSearchParams({
    country: 'jp',
    currency: 'jpy',
    dataSource: 'gkp',
  });
  body.append('kw[]', 'ヨガ');
  body.append('kw[]', 'ヨガ 初心者');
  
  console.log('\nKeywords Everywhere APIをテスト中...');
  const response = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  });
  
  console.log('ステータス:', response.status, response.statusText);
  const text = await response.text();
  console.log('レスポンス:', text);
}

testKeywordsEverywhereAPI().catch(console.error).finally(function() { prisma.$disconnect(); });
