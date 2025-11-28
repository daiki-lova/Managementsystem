export type AppMode = 'write';
export type ViewState = 'dashboard' | 'editor';

export interface BlockData {
  id: string;
  type: 'p' | 'h2' | 'h3' | 'image' | 'html';
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
}

export interface ConversionItem {
    id: string;
    name: string;
    type: 'campaign' | 'evergreen' | 'app';
    url: string;
    thumbnail?: string;
    status: 'active' | 'scheduled' | 'ended';
    ctr: string;
    clicks: number;
    cv: number;
    period?: string;
    context?: string;
}
