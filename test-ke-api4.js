async function testKeywordsEverywhereAPI() {
  const apiKey = 'e21e5a0e838ec10c31aa';
  
  // アカウント情報を取得
  console.log('=== アカウント情報 ===');
  const accResponse = await fetch('https://api.keywordseverywhere.com/v1/account_info', {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
  });
  const accData = await accResponse.json();
  console.log(JSON.stringify(accData, null, 2));
  
  // 対応国リストを確認
  console.log('\n=== 国リスト確認 ===');
  const countryResponse = await fetch('https://api.keywordseverywhere.com/v1/get_countries', {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
  });
  const countryData = await countryResponse.json();
  const jpCountry = countryData.data ? countryData.data.find(c => c.code === 'jp') : null;
  console.log('日本:', jpCountry ? JSON.stringify(jpCountry) : 'NOT FOUND');
}

testKeywordsEverywhereAPI().catch(console.error);
