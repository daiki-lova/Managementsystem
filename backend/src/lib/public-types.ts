export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    articlesCount: number;
}

export interface PublicArticle {
    id: string;
    title: string;
    slug: string;
    blocks: unknown;
    publishedAt: Date | null | string;
    metaTitle: string | null;
    metaDescription: string | null;
    ogpImageUrl: string | null;
    categories: {
        id: string;
        name: string;
        slug: string;
    };
    authors: {
        id: string;
        name: string;
        role: string;
        bio: string;
        imageUrl: string | null;
        qualifications: unknown;
    };
    media_assets: {
        url: string;
        altText: string | null;
    } | null;
    tags: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
}
