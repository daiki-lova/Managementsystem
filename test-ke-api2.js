async function testKeywordsEverywhereAPI() {
  const apiKey = 'e21e5a0e838ec10c31aa';
  
  // 英語キーワードでテスト
  const body = new URLSearchParams({
    country: 'us',
    currency: 'usd',
    dataSource: 'gkp',
  });
  body.append('kw[]', 'yoga');
  body.append('kw[]', 'yoga for beginners');
  
  console.log('英語キーワード（US）でテスト中...');
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

testKeywordsEverywhereAPI().catch(console.error);
