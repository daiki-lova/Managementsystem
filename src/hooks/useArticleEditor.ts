import { useState, useEffect, useCallback, useReducer } from 'react';
import { BlockData } from '../types';
import { useArticle } from '../lib/hooks';

// Article state shape
export interface ArticleState {
  title: string;
  blocks: BlockData[];
  thumbnail?: string;
  category: string;
  tags: string[];
  slug: string;
  description: string;
  metaTitle: string;
  ogImage?: string;
  status: 'draft' | 'review' | 'published' | 'scheduled';
  version: number;
}

// Action types
type ArticleAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_BLOCKS'; payload: BlockData[] }
  | { type: 'ADD_BLOCK'; payload: { afterId: string; block: BlockData } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; content: string } }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'SET_THUMBNAIL'; payload: string | undefined }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'SET_SLUG'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_META_TITLE'; payload: string }
  | { type: 'SET_OG_IMAGE'; payload: string | undefined }
  | { type: 'SET_STATUS'; payload: ArticleState['status'] }
  | { type: 'SET_VERSION'; payload: number }
  | { type: 'RESET'; payload: ArticleState }
  | { type: 'LOAD_ARTICLE'; payload: Partial<ArticleState> };

const initialState: ArticleState = {
  title: '',
  blocks: [{ id: '1', type: 'p', content: '' }],
  thumbnail: undefined,
  category: '',
  tags: [],
  slug: '',
  description: '',
  metaTitle: '',
  ogImage: undefined,
  status: 'draft',
  version: 1,
};

function articleReducer(state: ArticleState, action: ArticleAction): ArticleState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload };

    case 'SET_BLOCKS':
      return { ...state, blocks: action.payload };

    case 'ADD_BLOCK': {
      const { afterId, block } = action.payload;
      const index = state.blocks.findIndex((b) => b.id === afterId);
      const newBlocks = [...state.blocks];
      newBlocks.splice(index + 1, 0, block);
      return { ...state, blocks: newBlocks };
    }

    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.payload.id ? { ...b, content: action.payload.content } : b
        ),
      };

    case 'DELETE_BLOCK':
      if (state.blocks.length <= 1) return state;
      return {
        ...state,
        blocks: state.blocks.filter((b) => b.id !== action.payload),
      };

    case 'SET_THUMBNAIL':
      return { ...state, thumbnail: action.payload };

    case 'SET_CATEGORY':
      return { ...state, category: action.payload };

    case 'SET_TAGS':
      return { ...state, tags: action.payload };

    case 'SET_SLUG':
      return { ...state, slug: action.payload };

    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };

    case 'SET_META_TITLE':
      return { ...state, metaTitle: action.payload };

    case 'SET_OG_IMAGE':
      return { ...state, ogImage: action.payload };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'SET_VERSION':
      return { ...state, version: action.payload };

    case 'RESET':
      return action.payload;

    case 'LOAD_ARTICLE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export interface UseArticleEditorOptions {
  articleId: string | null;
}

export interface UseArticleEditorReturn {
  // State
  state: ArticleState;

  // Basic setters
  setTitle: (title: string) => void;
  setBlocks: (blocks: BlockData[]) => void;
  setThumbnail: (url: string | undefined) => void;
  setCategory: (category: string) => void;
  setTags: (tags: string[]) => void;
  setSlug: (slug: string) => void;
  setDescription: (description: string) => void;
  setMetaTitle: (metaTitle: string) => void;
  setOgImage: (url: string | undefined) => void;
  setStatus: (status: ArticleState['status']) => void;

  // Block operations
  addBlock: (type: BlockData['type'], afterId: string, content?: string) => void;
  updateBlockContent: (id: string, content: string) => void;
  deleteBlock: (id: string) => void;

  // Article operations
  resetToNew: () => void;
  loadMockArticle: (articleId: string, title: string) => void;

  // Loading state
  isLoading: boolean;
}

export function useArticleEditor({ articleId }: UseArticleEditorOptions): UseArticleEditorReturn {
  const [state, dispatch] = useReducer(articleReducer, initialState);

  // Fetch article data when editing existing article
  const { data: articleData, isLoading } = useArticle(articleId);

  // Sync state with fetched article data
  useEffect(() => {
    if (articleId && articleData) {
      // Merge inserted images into blocks
      const baseBlocks = (articleData.blocks as BlockData[]) || [];
      const insertedImages = articleData.images || [];

      let mergedBlocks = [...baseBlocks];

      if (insertedImages.length > 0) {
        // Get unique images by type (use the latest one for each type)
        const inserted1 = insertedImages
          .filter((img: { type: string }) => img.type === 'INSERTED_1')
          .pop();
        const inserted2 = insertedImages
          .filter((img: { type: string }) => img.type === 'INSERTED_2')
          .pop();

        const totalBlocks = mergedBlocks.length;
        const pos1 = Math.min(4, totalBlocks);
        const pos2 = Math.min(9, totalBlocks + (inserted1 ? 1 : 0));

        // Insert INSERTED_2 first (higher index) to avoid position shift
        if (inserted2) {
          const imageBlock2: BlockData = {
            id: `img-inserted-2-${inserted2.id}`,
            type: 'image',
            content: inserted2.url,
            metadata: {
              altText: inserted2.altText || '',
              source: 'AI_GENERATED',
              imageType: 'INSERTED_2',
            },
          };
          mergedBlocks.splice(pos2, 0, imageBlock2);
        }

        if (inserted1) {
          const imageBlock1: BlockData = {
            id: `img-inserted-1-${inserted1.id}`,
            type: 'image',
            content: inserted1.url,
            metadata: {
              altText: inserted1.altText || '',
              source: 'AI_GENERATED',
              imageType: 'INSERTED_1',
            },
          };
          mergedBlocks.splice(pos1, 0, imageBlock1);
        }
      }

      dispatch({
        type: 'LOAD_ARTICLE',
        payload: {
          title: articleData.title,
          blocks: mergedBlocks,
          thumbnail: articleData.media_assets?.url,
          category: articleData.categories?.name || '',
          tags: (
            articleData.tags?.map((t: { name: string }) => t.name) ??
            (articleData as Record<string, unknown>).article_tags?.map(
              (at: { tags?: { name: string } }) => at.tags?.name
            ) ??
            []
          ).filter(Boolean),
          slug: articleData.slug,
          description: articleData.metaDescription || '',
          metaTitle: articleData.metaTitle || '',
          status: (articleData.status?.toLowerCase() as ArticleState['status']) || 'draft',
          version: articleData.version || 1,
        },
      });
    }
  }, [articleId, articleData]);

  // Memoized setters
  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_TITLE', payload: title });
  }, []);

  const setBlocks = useCallback((blocks: BlockData[]) => {
    dispatch({ type: 'SET_BLOCKS', payload: blocks });
  }, []);

  const setThumbnail = useCallback((url: string | undefined) => {
    dispatch({ type: 'SET_THUMBNAIL', payload: url });
  }, []);

  const setCategory = useCallback((category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  }, []);

  const setTags = useCallback((tags: string[]) => {
    dispatch({ type: 'SET_TAGS', payload: tags });
  }, []);

  const setSlug = useCallback((slug: string) => {
    dispatch({ type: 'SET_SLUG', payload: slug });
  }, []);

  const setDescription = useCallback((description: string) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: description });
  }, []);

  const setMetaTitle = useCallback((metaTitle: string) => {
    dispatch({ type: 'SET_META_TITLE', payload: metaTitle });
  }, []);

  const setOgImage = useCallback((url: string | undefined) => {
    dispatch({ type: 'SET_OG_IMAGE', payload: url });
  }, []);

  const setStatus = useCallback((status: ArticleState['status']) => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, []);

  // Block operations
  const addBlock = useCallback(
    (type: BlockData['type'], afterId: string, content: string = '') => {
      const newBlock: BlockData = {
        id: Date.now().toString(),
        type,
        content,
      };
      dispatch({ type: 'ADD_BLOCK', payload: { afterId, block: newBlock } });
    },
    []
  );

  const updateBlockContent = useCallback((id: string, content: string) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, content } });
  }, []);

  const deleteBlock = useCallback((id: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: id });
  }, []);

  // Reset to new article
  const resetToNew = useCallback(() => {
    dispatch({ type: 'RESET', payload: initialState });
  }, []);

  // Load mock article (for demo purposes)
  const loadMockArticle = useCallback((articleId: string, title: string) => {
    if (articleId === 'a2') {
      dispatch({
        type: 'LOAD_ARTICLE',
        payload: {
          title: title || '瞑想を続けるための3つのコツ',
          blocks: [
            {
              id: '1',
              type: 'p',
              content:
                '「瞑想が良いのはわかっているけど、なかなか続かない...」そんな悩みをお持ちではありませんか？実は、瞑想の習慣化に失敗する人の多くが、ある「誤解」をしています。',
            },
            { id: '2', type: 'h2', content: 'なぜ瞑想は続かないのか？' },
            {
              id: '3',
              type: 'p',
              content:
                '瞑想が続かない最大の理由は、「無になろう」としすぎることです。雑念が浮かぶのは脳の正常な機能であり、それを無理に消そうとするとストレスになります。',
            },
            { id: '4', type: 'h2', content: '1. 「1分」から始める' },
            {
              id: '5',
              type: 'p',
              content:
                '最初から20分やろうとする必要はありません。1日1分、深呼吸をするだけでも十分な効果があります。トイレ休憩や電車待ちの時間など、隙間時間を活用しましょう。',
            },
            { id: '6', type: 'h2', content: '2. 場所と時間を決める' },
            {
              id: '7',
              type: 'p',
              content:
                '「時間があるときにやる」ではなく、「朝起きてすぐ」「寝る前」など、既存の習慣にくっつける（If-Thenプランニング）が有効です。',
            },
            { id: '8', type: 'h2', content: '3. 完璧を目指さない' },
            {
              id: '9',
              type: 'p',
              content:
                'できない日があっても自分を責めないでください。「今日はできなかったな」と気づくだけでも、それは一つのマインドフルネスです。',
            },
            { id: '10', type: 'h2', content: 'まとめ' },
            {
              id: '11',
              type: 'p',
              content:
                '瞑想は筋トレと同じで、すぐに効果が出るものではありません。しかし、細く長く続けることで、確実にメンタルは整っていきます。まずは今日の1分から始めてみませんか？',
            },
          ],
          thumbnail:
            'https://images.unsplash.com/photo-1754257320362-5982d5cd58ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
          category: 'コラム',
          tags: ['瞑想', '習慣化', 'マインドフルネス'],
          slug: 'meditation-tips',
          description:
            '瞑想が続かない人向けに、脳科学に基づいた習慣化のコツを3つ紹介します。',
          status: 'draft',
          version: 1,
        },
      });
    }
  }, []);

  return {
    state,
    setTitle,
    setBlocks,
    setThumbnail,
    setCategory,
    setTags,
    setSlug,
    setDescription,
    setMetaTitle,
    setOgImage,
    setStatus,
    addBlock,
    updateBlockContent,
    deleteBlock,
    resetToNew,
    loadMockArticle,
    isLoading,
  };
}
