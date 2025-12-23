// DataForSEO API クライアント

interface KeywordData {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  trend: number[];
}

interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

interface DataForSEOKeywordResult {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: string;
  competition_index: number;
  monthly_searches: MonthlySearch[];
}

interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  cost: number;
  tasks: {
    status_code: number;
    status_message: string;
    result: DataForSEOKeywordResult[];
  }[];
}

interface SearchParams {
  keywords: string[];
  locationCode?: number;
  languageCode?: string;
}

export class DataForSEOClient {
  private authKey: string;
  private baseUrl = "https://api.dataforseo.com/v3";

  constructor(authKey: string) {
    const trimmed = authKey.trim();
    // login:password形式の場合は自動でBase64エンコード
    if (trimmed.includes(':') && !this.isBase64(trimmed)) {
      this.authKey = Buffer.from(trimmed).toString('base64');
      console.log("DataForSEO: Auto-encoded credentials to Base64");
    } else {
      this.authKey = trimmed;
    }
  }

  // Base64形式かどうかをチェック
  private isBase64(str: string): boolean {
    if (!str || str.length === 0) return false;
    try {
      // Base64デコードして再エンコードして一致するか確認
      const decoded = Buffer.from(str, 'base64').toString('utf8');
      const reencoded = Buffer.from(decoded).toString('base64');
      return reencoded === str && /^[A-Za-z0-9+/]*={0,2}$/.test(str);
    } catch {
      return false;
    }
  }

  // キーワードのボリュームデータを取得
  async getKeywordData(params: SearchParams): Promise<KeywordData[]> {
    const { keywords, locationCode = 2392, languageCode = "ja" } = params;

    const payload = [{
      keywords,
      location_code: locationCode, // 2392 = Japan
      language_code: languageCode,
    }];

    const response = await fetch(`${this.baseUrl}/keywords_data/google_ads/search_volume/live`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("DataForSEO API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.slice(0, 500),
      });
      throw new Error(
        `DataForSEO API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText.slice(0, 500)}` : ""}`
      );
    }

    const data: DataForSEOResponse = await response.json();

    if (data.status_code !== 20000) {
      throw new Error(`DataForSEO API error: ${data.status_message}`);
    }

    const results = data.tasks[0]?.result || [];

    // DataForSEOのレスポンスをKeywordData形式に変換
    return results.map((item) => ({
      keyword: item.keyword,
      volume: item.search_volume || 0,
      cpc: item.cpc || 0,
      competition: this.convertCompetition(item.competition, item.competition_index),
      trend: this.extractTrend(item.monthly_searches),
    }));
  }

  // 競合度を0-1の数値に変換
  private convertCompetition(competition: string, competitionIndex: number): number {
    if (competitionIndex !== undefined) {
      return competitionIndex / 100;
    }
    switch (competition) {
      case "HIGH":
        return 0.8;
      case "MEDIUM":
        return 0.5;
      case "LOW":
        return 0.2;
      default:
        return 0;
    }
  }

  // 月次検索データからトレンド配列を抽出
  private extractTrend(monthlySearches: MonthlySearch[]): number[] {
    if (!monthlySearches || monthlySearches.length === 0) {
      return [];
    }
    // 古い順にソートしてボリューム配列を返す
    return monthlySearches
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map((m) => m.search_volume);
  }

  // 関連キーワードを取得
  async getRelatedKeywords(keyword: string, locationCode = 2392): Promise<KeywordData[]> {
    const payload = [{
      keyword,
      location_code: locationCode,
      language_code: "ja",
      include_seed_keyword: true,
      depth: 2,
    }];

    const response = await fetch(`${this.baseUrl}/keywords_data/google_ads/keywords_for_keywords/live`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("DataForSEO API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.slice(0, 500),
      });
      throw new Error(
        `DataForSEO API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText.slice(0, 500)}` : ""}`
      );
    }

    const data: DataForSEOResponse = await response.json();

    if (data.status_code !== 20000) {
      throw new Error(`DataForSEO API error: ${data.status_message}`);
    }

    const results = data.tasks[0]?.result || [];

    return results.map((item) => ({
      keyword: item.keyword,
      volume: item.search_volume || 0,
      cpc: item.cpc || 0,
      competition: this.convertCompetition(item.competition, item.competition_index),
      trend: this.extractTrend(item.monthly_searches),
    }));
  }
}

// 日本のロケーションコード
export const JAPAN_LOCATION_CODE = 2392;

// デフォルト推奨検索ボリュームゾーン
export const DEFAULT_VOLUME_RANGE = {
  min: 300,
  max: 2000,
};

// 検索ボリューム範囲の型
export interface VolumeRange {
  min: number;
  max: number;
}

// キーワードが推奨ゾーン内かチェック
export function isInRecommendedRange(
  volume: number,
  range: VolumeRange = DEFAULT_VOLUME_RANGE
): boolean {
  return volume >= range.min && volume <= range.max;
}

// キーワードデータをスコアリング
export function scoreKeyword(
  keyword: KeywordData,
  range: VolumeRange = DEFAULT_VOLUME_RANGE
): number {
  let score = 0;

  // ボリュームスコア（推奨範囲内で高得点）
  if (isInRecommendedRange(keyword.volume, range)) {
    score += 50;
  } else if (keyword.volume > 0 && keyword.volume < range.min) {
    score += 20;
  } else if (keyword.volume > range.max) {
    score += 30;
  }

  // 競合スコア（低いほど良い）
  if (keyword.competition < 0.3) {
    score += 30;
  } else if (keyword.competition < 0.6) {
    score += 20;
  } else {
    score += 10;
  }

  // トレンドスコア（上昇傾向で高得点）
  if (keyword.trend && keyword.trend.length >= 2) {
    const recentTrend = keyword.trend.slice(-3);
    const isUpward = recentTrend[recentTrend.length - 1] > recentTrend[0];
    if (isUpward) {
      score += 20;
    }
  }

  return score;
}

// ========================================
// SERP API: 検索意図分析用
// ========================================

// People Also Ask（関連質問）
export interface PeopleAlsoAskItem {
  question: string;
  answer?: string;
}

// 上位記事の情報
export interface TopResultItem {
  rank: number;
  url: string;
  title: string;
  description?: string;
}

// SERP分析結果
export interface SerpAnalysisResult {
  keyword: string;
  peopleAlsoAsk: PeopleAlsoAskItem[];
  topResults: TopResultItem[];
  relatedSearches: string[];
  fetchedAt: Date;
}

// DataForSEO SERP APIレスポンスの型
interface SerpOrgItem {
  type: string;
  rank_group?: number;
  rank_absolute?: number;
  url?: string;
  title?: string;
  description?: string;
  items?: Array<{
    question?: string;
    answer?: string;
    title?: string;
  }>;
}

interface SerpTaskResult {
  keyword: string;
  items?: SerpOrgItem[];
}

interface SerpApiResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    result?: SerpTaskResult[];
  }>;
}

// DataForSEOClient に SERP メソッドを追加
export async function getSerpAnalysis(
  authKey: string,
  keyword: string,
  locationCode = 2392
): Promise<SerpAnalysisResult> {
  const baseUrl = "https://api.dataforseo.com/v3";

  // 認証キーの処理
  let encodedKey = authKey.trim();
  if (encodedKey.includes(':') && !isBase64(encodedKey)) {
    encodedKey = Buffer.from(encodedKey).toString('base64');
  }

  const payload = [{
    keyword,
    location_code: locationCode,
    language_code: "ja",
    device: "desktop",
    os: "windows",
  }];

  const response = await fetch(`${baseUrl}/serp/google/organic/live/advanced`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("DataForSEO SERP API error:", response.status, errorText.slice(0, 300));
    // エラー時は空の結果を返す（Graceful Degradation）
    return {
      keyword,
      peopleAlsoAsk: [],
      topResults: [],
      relatedSearches: [],
      fetchedAt: new Date(),
    };
  }

  const data: SerpApiResponse = await response.json();

  if (data.status_code !== 20000 || !data.tasks?.[0]?.result?.[0]) {
    console.warn("DataForSEO SERP: No results for keyword:", keyword);
    return {
      keyword,
      peopleAlsoAsk: [],
      topResults: [],
      relatedSearches: [],
      fetchedAt: new Date(),
    };
  }

  const items = data.tasks[0].result[0].items || [];

  // People Also Ask を抽出
  const peopleAlsoAsk: PeopleAlsoAskItem[] = [];
  const paaItems = items.filter(item => item.type === "people_also_ask");
  for (const paaItem of paaItems) {
    if (paaItem.items) {
      for (const q of paaItem.items) {
        if (q.question) {
          peopleAlsoAsk.push({
            question: q.question,
            answer: q.answer,
          });
        }
      }
    }
  }

  // 上位オーガニック結果を抽出（最大10件）
  const topResults: TopResultItem[] = items
    .filter(item => item.type === "organic" && item.url && item.title)
    .slice(0, 10)
    .map((item, index) => ({
      rank: item.rank_group || index + 1,
      url: item.url!,
      title: item.title!,
      description: item.description,
    }));

  // 関連検索を抽出
  const relatedSearches: string[] = [];
  const relatedItems = items.filter(item => item.type === "related_searches");
  for (const relItem of relatedItems) {
    if (relItem.items) {
      for (const r of relItem.items) {
        if (r.title) {
          relatedSearches.push(r.title);
        }
      }
    }
  }

  return {
    keyword,
    peopleAlsoAsk: peopleAlsoAsk.slice(0, 8), // 最大8件
    topResults,
    relatedSearches: relatedSearches.slice(0, 10), // 最大10件
    fetchedAt: new Date(),
  };
}

// Base64チェック（モジュールレベル）
function isBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    const reencoded = Buffer.from(decoded).toString('base64');
    return reencoded === str && /^[A-Za-z0-9+/]*={0,2}$/.test(str);
  } catch {
    return false;
  }
}
