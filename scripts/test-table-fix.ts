/**
 * テーブルHTML修正のデバッグスクリプト
 */

// 実際にAIが生成する壊れたHTMLパターン
const brokenTable = `<table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <th style="padding:12px 16px;border:1px solid #e5e7eb;text-align:left;font-weight:600;color:#374151;background:#f3f4f6;">
          <tr>
            <th style="padding:12px 16px;border:1px solid #e5e7eb;text-align:left;font-weight:600;color:#374151;background:#f3f4f6;">効果</th>
            <th style="padding:12px 16px;border:1px solid #e5e7eb;text-align:left;font-weight:600;color:#374151;background:#f3f4f6;">説明</th>
          </tr>
        </th>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;vertical-align:top;">発汗</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;vertical-align:top;">大量の汗をかく</td>
        </tr>
      </table>`;

console.log("=== 壊れたHTML ===");
console.log(brokenTable);
console.log("\n");

/**
 * テーブルHTMLの構造とスタイルを修正する
 */
export function fixTableHtml(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    let result = tableHtml;

    // ステップ1: <table>直後の壊れた<th>...</th>ブロックを検出して置換
    // パターン: <table...>...空白...<th...>...空白...<tr>...</tr>...空白...</th>
    // これは <thead> の代わりに誤って <th> を使っているケース
    const brokenPattern = /(<table[^>]*>)(\s*)<th[^>]*>(\s*)(<tr>[\s\S]*?<\/tr>)(\s*)<\/th>/i;

    if (brokenPattern.test(result)) {
      result = result.replace(brokenPattern, '$1$2<thead>$3$4$5</thead>');
    }

    // ステップ2: theadの後のtrをtbodyで囲む
    if (result.includes('<thead>') && !result.includes('<tbody>')) {
      result = result.replace(
        /(<\/thead>)(\s*)(<tr>[\s\S]*?)(<\/table>)/i,
        '$1$2<tbody>$3</tbody>$4'
      );
    }

    // ステップ3: スタイル適用
    // 重要: <th> と <thead> を区別するため、負の先読みを使用
    const tableStyle = 'width:100%;border-collapse:collapse;margin:24px 0;';
    result = result.replace(/<table[^>]*>/gi, `<table style="${tableStyle}">`);

    // <th> タグのみにマッチ（<thead> にはマッチしない）
    const thStyle = 'padding:12px 16px;border:1px solid #e5e7eb;text-align:left;font-weight:600;color:#374151;background:#f3f4f6;';
    result = result.replace(/<th(?![ea])[^>]*>/gi, `<th style="${thStyle}">`);

    const tdStyle = 'padding:12px 16px;border:1px solid #e5e7eb;vertical-align:top;';
    result = result.replace(/<td[^>]*>/gi, `<td style="${tdStyle}">`);

    result = result.replace(/<tr[^>]*>/gi, '<tr>');
    result = result.replace(/<thead[^>]*>/gi, '<thead>');
    result = result.replace(/<tbody[^>]*>/gi, '<tbody>');

    return result;
  });
}

console.log("=== fixTableHtml テスト ===\n");
const fixed = fixTableHtml(brokenTable);
console.log("=== 最終結果 ===");
console.log(fixed);

// 正常なHTMLかどうか確認
console.log("\n=== 構造確認 ===");
console.log("thead存在:", fixed.includes('<thead>'));
console.log("tbody存在:", fixed.includes('<tbody>'));
console.log("壊れた<th>ラッパー残存:", /<table[^>]*>\s*<th[^>]*>\s*<tr>/i.test(fixed));
console.log("壊れた</th>残存:", /<\/tr>\s*<\/th>/i.test(fixed));
