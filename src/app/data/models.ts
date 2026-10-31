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
  screenshots: Screenshot[];
  links: ReviewLink[];
}

export interface Screenshot {
  file: string;
  name: string;
  description: string;
}

export interface ReviewLink {
  url: string;
  description: string;
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
