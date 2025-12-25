async function test() {
  const apiKey = 'e21e5a0e838ec10c31aa';
  
  // 対応国をチェック
  console.log('=== 日本語キーワード + US ===');
  const body = new URLSearchParams({
    country: 'us',
    currency: 'usd',
    dataSource: 'gkp',
  });
  body.append('kw[]', 'ヨガ');
  body.append('kw[]', 'yoga japan');
  
  const response = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  });
  
  const data = await response.json();
  console.log('結果:', data.data.map(d => d.keyword + ': ' + d.vol).join(', '));
  
  // Keywords Everywhereのドキュメントによると、対応国を確認
  console.log('\n=== データソースのクレジット ===');
  console.log('残りクレジット:', data.credits);
}

test().catch(console.error);
