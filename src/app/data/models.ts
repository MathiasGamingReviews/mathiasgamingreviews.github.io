export interface ReviewSummary {
  slug: string;
  name: string;
  logo: string;
  platform: string;
  stars: number;
  reviewDate: string;
}

export interface Review extends ReviewSummary {
  body: string;
}

export interface NewsItem {
  id: number;
  title: string;
  body: string;
  newsDate: string;
}

export type ReviewSort = 'date' | 'platform' | 'score' | 'name';

export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
}
