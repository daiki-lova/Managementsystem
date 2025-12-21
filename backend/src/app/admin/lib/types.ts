export type AppMode = 'write';
export type ViewState = 'dashboard' | 'editor';

export interface BlockData {
  id: string;
  type: 'p' | 'h2' | 'h3' | 'h4' | 'image' | 'html' | 'ul' | 'ol' | 'blockquote' | 'hr';
  content: string;
  metadata?: any; // For HTML block settings or Image captions
}

export interface Article {
  id: string;
  title: string;
  status: 'published' | 'draft' | 'scheduled' | 'changed' | 'review';
  updatedAt: string;
  pv: number;
  tags: string[];
  author: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
  supervisorName?: string;
  supervisorRole?: string;
  supervisorImage?: string;
  systemPrompt?: string;
  color?: string;
  supervisorId?: string; // Link to Profile
}

// 資格情報の型
export interface Certification {
  name: string;
  year?: number;
  location?: string;
}

// エピソードの型
export interface Episode {
  type: 'transformation' | 'student' | 'teaching' | 'other';
  title: string;
  content: string;
}

export interface Profile {
  id: string;
  name: string;
  slug: string;
  role: string;
  avatar?: string;
  bio?: string;

  // === キャリアデータ（数値）===
  careerStartYear?: number;      // ヨガ・フィットネス開始年
  teachingStartYear?: number;    // 指導開始年
  totalStudentsTaught?: number;  // これまでの指導人数
  graduatesCount?: number;       // 養成講座卒業生数
  weeklyLessons?: number;        // 週あたりレッスン本数

  // === 詳細資格情報 ===
  certifications?: Certification[];

  // === エピソード・経験 ===
  episodes?: Episode[];

  // === よく使うフレーズ ===
  signaturePhrases?: string[];

  // === 専門・得意分野 ===
  specialties?: string[];

  // === 執筆スタイル・パーソナリティ ===
  writingStyle?: 'formal' | 'casual' | 'professional';  // 文体の好み
  philosophy?: string;           // 指導理念・信念
  avoidWords?: string[];         // 使わない言葉・表現
  targetAudience?: string;       // 主な指導対象
  teachingApproach?: string;     // 指導スタイル
  influences?: string[];         // 師事した先生・流派
  locationContext?: string;      // 活動拠点
}

export interface ConversionItem {
  id: string;
  name: string;
  type: 'campaign' | 'evergreen' | 'app';
  url: string;
  thumbnail?: string;
  status: 'ACTIVE' | 'INACTIVE';
  ctr: string;
  clicks: number;
  cv: number;
  period?: string;
  context?: string;
}

export interface KnowledgeItem {
  id: string;
  title?: string; // タイトル
  content: string;
  brand: string | null; // 'OREO' | 'SEQUENCE' | null
  brandName?: string | null; // Display name of the brand
  kind?: string; // 'STUDENT_VOICE' | 'AUTHOR_ARTICLE' | 'EXTERNAL' etc
  course?: string;
  categoryId?: string | null; // 紐づけカテゴリID
  authorId?: string;
  authorName?: string;
  createdAt: string;
  usageCount: number;
  source: string; // 'manual' | 'spreadsheet' | 'web'
  sourceType?: string; // 'url' | 'text' | 'file'
  relevanceScore?: number; // For search results
}
