async function testKeywordsEverywhereAPI() {
  const apiKey = 'e21e5a0e838ec10c31aa';
  
  // 日本語キーワードでdataSource違いでテスト
  const tests = [
    { country: 'jp', dataSource: 'cli', name: 'Japan + cli' },
    { country: 'jp', dataSource: 'gkp', name: 'Japan + gkp' },
  ];
  
  for (const test of tests) {
    const body = new URLSearchParams({
      country: test.country,
      currency: 'jpy',
      dataSource: test.dataSource,
    });
    body.append('kw[]', 'ヨガ');
    body.append('kw[]', 'ヨガ 初心者');
    
    console.log('\n=== ' + test.name + ' ===');
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
    console.log('vol:', data.data.map(d => d.keyword + ': ' + d.vol).join(', '));
  }
}

testKeywordsEverywhereAPI().catch(console.error);
