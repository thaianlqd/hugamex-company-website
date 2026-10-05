export type Role = 'USER' | 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN';
export type User = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  verified: boolean;
  mfaEnabled: boolean;
  mfaVerified: boolean;
};
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};
export type Content = {
  id: string;
  kind: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  featuredMediaId: string | null;
  featuredMediaAlt?: string | null;
  publishedAt: string | null;
  locale: string;
  title: string;
  slug: string;
  canonicalSlug?: string;
  excerpt: string;
  content: RichNode;
  seoTitle: string;
  seoDescription: string;
  metadata: Record<string, string>;
  categoryIds: string[];
};
export type PageResult<T> = { items: T[]; total: number; page: number; size: number };
export type Section = {
  id: string;
  key: string;
  enabled: boolean;
  position: number;
  headlineVi: string;
  headlineEn: string;
  subheadlineVi: string;
  subheadlineEn: string;
  contentIds: string[];
};
export type Site = {
  sections: Section[];
  settings: Record<string, string>;
  featured?: Record<string, Content[]>;
};
