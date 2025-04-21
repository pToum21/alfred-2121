export type WebSearchResult = {
  name: string;
  url: string;
  snippet: string;
  fullContent?: string;
  source: 'google';
  title?: string;
  datePublished: string;
};

export interface GoogleSearchResponse {
  items?: {
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
      metatags?: Array<{
        'article:published_time'?: string;
        'date'?: string;
        'og:published_time'?: string;
        'datePublished'?: string;
        'article:modified_time'?: string;
        'lastmod'?: string;
        'publication_date'?: string;
        'publish_date'?: string;
        'dc.date'?: string;
        'dc.date.issued'?: string;
        'dc.date.created'?: string;
        'article:published'?: string;
        'article:created'?: string;
        'created_time'?: string;
        'modified_time'?: string;
      }>;
      newsarticle?: Array<{
        datepublished?: string;
        datemodified?: string;
        datecreated?: string;
        publishdate?: string;
      }>;
      article?: Array<{
        datepublished?: string;
        datemodified?: string;
        datecreated?: string;
        publishdate?: string;
      }>;
      webpage?: Array<{
        datepublished?: string;
        datemodified?: string;
        datecreated?: string;
        publishdate?: string;
      }>;
    };
  }[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

export interface SearchResults {
  webResults: WebSearchResult[];
  pineconeResults: PineconeSearchResult[];
  images: string[];
  query: string;
  error?: string;
  status?: 'searching' | 'complete' | 'error';
}

export type PineconeSearchResult = {
  title: string;
  url: string;
  date: string;
  fullContent: string;
  source: 'pinecone';
  context?: string;
  documentSummary?: string;
};

export type ExaSearchResults = {
  results: ExaSearchResultItem[];
};

export type SerperSearchResults = {
  searchParameters: {
    q: string;
    type: string;
    engine: string;
  };
  videos: SerperSearchResultItem[];
};

export type ExaSearchResultItem = {
  score: number;
  title: string;
  id: string;
  url: string;
  publishedDate: Date;
  author: string;
};

export type SerperSearchResultItem = {
  title: string;
  link: string;
  snippet: string;
  imageUrl: string;
  duration: string;
  source: string;
  channel: string;
  date: string;
  position: number;
};

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  path: string;
  messages: AIMessage[];
  sharePath?: string;
}

export type AIMessage = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';
  content: string;
  id: string;
  name?: string;
  type?: 'answer' | 'related' | 'skip' | 'inquiry' | 'input' | 'input_related' | 'tool' | 'followup' | 'end' | 'tool_output' | 'system' | 'preference';
  rating?: 'up' | 'down' | null;
  ratingConfirmed?: boolean;
};

export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'mixed-use' | 'multifamily' | 'land';

export type ComparableProperty = {
  address: string;
  baths?: string | number;
  beds?: string | number;
  imageUrl: string;
  mlsId?: string;
  price: string | number;
  sqft?: string | number;
  status: 'For Rent' | 'For Sale' | 'Off Market' | 'Pending' | 'Sold';
  unitNumber?: string;
};

export type PropertySearchResult = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  description: string;
  features: string[];
  imageUrls: string[];
  virtualTourUrl?: string;
  listingDate: string;
  source: 'property';
  zoning?: string;
  buildingClass?: 'Class A' | 'Class B' | 'Class C';
  stories?: number;
  yearRenovated?: number;
  numberOfUnits?: number;
  unitBreakout?: string;
  percentOccupied?: number;
  averageRentPerUnit?: number;
  propertyTaxes?: number;
  constructionBudget?: number;
  lotSize?: string;
  comps?: ComparableProperty[];
};

export interface PropertySearchResults {
  properties: PropertySearchResult[];
  query: {
    location?: string;
    propertyType?: PropertyType;
    priceRange?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    amenities?: string[];
    yearBuilt?: number;
    zoning?: string;
    buildingClass?: 'Class A' | 'Class B' | 'Class C';
    stories?: number;
    yearRenovated?: number;
    numberOfUnits?: number;
    percentOccupied?: number;
  };
  status?: 'searching' | 'complete' | 'error';
  error?: string;
  summary?: string;
}