/**
 * Enhanced Search Library for GrowLokal
 * 
 * Provides full-text search with:
 * - Fuzzy matching (handles spelling variations)
 * - Partial matches
 * - Relevance ranking
 * - Category boosting
 * - Search suggestions
 */

import mongoose from "mongoose";

// Common Filipino spelling variations and synonyms
const SPELLING_VARIATIONS: Record<string, string[]> = {
  // Common misspellings
  "basket": ["baskit", "bascet", "basquet"],
  "weaving": ["weaving", "weeving", "weavng"],
  "pottery": ["potery", "poterry", "potary"],
  "embroidery": ["embrodery", "embroidary", "embrodiery"],
  "jewelry": ["jewellery", "jewelery", "jewlery"],
  "leather": ["lether", "leatherr"],
  "textile": ["textil", "texile"],
  "handicraft": ["handcraft", "handicrafts", "hand craft"],
  "rattan": ["ratan", "rataan", "rattan"],
  "bamboo": ["bambu", "bambuu"],
  "coconut": ["cocnut", "coconot"],
  "shell": ["shel", "shells"],
  "wood": ["wooden", "woods"],
  "bag": ["bags", "purse", "purses", "handbag"],
  "shirt": ["shirts", "tshirt", "t-shirt"],
  "dress": ["dresses", "gown", "gowns"],
  // Filipino terms
  "banig": ["mat", "sleeping mat"],
  "abel": ["fabric", "cloth", "textile"],
  "inabel": ["woven fabric", "ilocano weave"],
  "tinalak": ["tinalak", "tboli fabric"],
  "salakot": ["hat", "farmer hat"],
};

// Category synonyms for better matching
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "handicrafts": ["crafts", "handmade", "artisan", "traditional", "native", "local"],
  "fashion": ["clothing", "clothes", "apparel", "wear", "dress", "outfit"],
  "home": ["house", "living", "decor", "decoration", "furniture", "interior"],
  "food": ["eat", "snack", "delicacy", "delicacies", "pasalubong", "kakanin"],
  "beauty": ["cosmetics", "skincare", "makeup", "personal care", "soap", "lotion"],
};

// Craft type synonyms
const CRAFT_TYPE_SYNONYMS: Record<string, string[]> = {
  "weaving": ["woven", "loom", "fabric", "textile", "cloth"],
  "woodwork": ["wood", "wooden", "carving", "carved", "carpentry"],
  "pottery": ["clay", "ceramic", "earthenware", "terracotta"],
  "embroidery": ["embroidered", "stitching", "needlework", "cross-stitch"],
  "basketry": ["basket", "wicker", "rattan", "bamboo"],
  "cooking": ["food", "culinary", "recipe", "homemade"],
  "textile": ["fabric", "cloth", "woven", "sewn"],
  "jewelry making": ["jewelry", "accessories", "beads", "necklace", "bracelet", "earrings"],
  "leatherwork": ["leather", "hide", "bag", "wallet", "belt"],
  "cosmetics": ["beauty", "skincare", "soap", "lotion", "organic"],
};

export interface SearchOptions {
  query: string;
  limit?: number;
  page?: number;
  category?: string;
  craftType?: string;
  minPrice?: number;
  maxPrice?: number;
  barangay?: string;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "rating" | "newest" | "popularity";
  fuzzyMatch?: boolean;
}

export interface SearchResult {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  artistName: string;
  images: string[];
  thumbnailUrl: string;
  averageRating: number;
  totalReviews: number;
  craftType?: string;
  barangay?: string;
  stock: number;
  isAvailable: boolean;
  relevanceScore: number;
  matchType: "exact" | "partial" | "fuzzy" | "synonym";
  highlights?: {
    name?: string;
    description?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  suggestions: string[];
  totalResults: number;
  page: number;
  totalPages: number;
  searchTime: number;
  query: string;
  didYouMean?: string;
  categories: { name: string; count: number }[];
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // substitution
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1      // insertion
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Check if two strings are similar (fuzzy match)
 */
function isFuzzyMatch(str1: string, str2: string, threshold = 0.7): boolean {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return true;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  // Levenshtein similarity
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return true;
  
  const distance = levenshteinDistance(s1, s2);
  const similarity = 1 - distance / maxLen;
  
  return similarity >= threshold;
}

/**
 * Expand query with synonyms and variations
 */
export function expandQuery(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/);
  const expanded = new Set<string>(terms);

  terms.forEach(term => {
    // Add spelling variations
    Object.entries(SPELLING_VARIATIONS).forEach(([correct, variations]) => {
      if (term === correct || variations.includes(term)) {
        expanded.add(correct);
        variations.forEach(v => expanded.add(v));
      }
    });

    // Add category synonyms
    Object.entries(CATEGORY_SYNONYMS).forEach(([category, synonyms]) => {
      if (term === category || synonyms.includes(term)) {
        expanded.add(category);
        synonyms.forEach(s => expanded.add(s));
      }
    });

    // Add craft type synonyms
    Object.entries(CRAFT_TYPE_SYNONYMS).forEach(([craftType, synonyms]) => {
      if (term === craftType.toLowerCase() || synonyms.includes(term)) {
        expanded.add(craftType.toLowerCase());
        synonyms.forEach(s => expanded.add(s));
      }
    });
  });

  return Array.from(expanded);
}

/**
 * Generate search suggestions based on partial input
 */
export function generateSuggestions(query: string, allProducts: any[]): string[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const suggestions = new Set<string>();
  
  // Product name suggestions
  allProducts.forEach(product => {
    const name = product.name.toLowerCase();
    if (name.includes(q)) {
      suggestions.add(product.name);
    }
  });

  // Category suggestions
  Object.keys(CATEGORY_SYNONYMS).forEach(cat => {
    if (cat.includes(q)) {
      suggestions.add(cat.charAt(0).toUpperCase() + cat.slice(1));
    }
  });

  // Craft type suggestions
  Object.keys(CRAFT_TYPE_SYNONYMS).forEach(craft => {
    if (craft.toLowerCase().includes(q)) {
      suggestions.add(craft);
    }
  });

  return Array.from(suggestions).slice(0, 8);
}

/**
 * Calculate relevance score for a product
 */
export function calculateRelevanceScore(
  product: any,
  queryTerms: string[],
  originalQuery: string
): { score: number; matchType: "exact" | "partial" | "fuzzy" | "synonym" } {
  let score = 0;
  let matchType: "exact" | "partial" | "fuzzy" | "synonym" = "fuzzy";
  const q = originalQuery.toLowerCase();

  const name = product.name?.toLowerCase() || "";
  const description = product.description?.toLowerCase() || "";
  const category = product.category?.toLowerCase() || "";
  const artistName = product.artistName?.toLowerCase() || "";
  const tags = (product.tags || []).map((t: string) => t.toLowerCase());
  const craftType = product.craftType?.toLowerCase() || "";

  // Exact name match (highest priority)
  if (name === q) {
    score += 100;
    matchType = "exact";
  } else if (name.startsWith(q)) {
    score += 80;
    matchType = "exact";
  } else if (name.includes(q)) {
    score += 60;
    matchType = "partial";
  }

  // Word-level matching in name
  queryTerms.forEach(term => {
    if (name.includes(term)) {
      score += 15;
      if (matchType !== "exact") matchType = "partial";
    }
  });

  // Category match
  if (category.includes(q) || q.includes(category)) {
    score += 30;
  }

  // Craft type match
  if (craftType.includes(q) || q.includes(craftType)) {
    score += 25;
  }

  // Artist name match
  if (artistName.includes(q)) {
    score += 20;
  }

  // Tag matches
  tags.forEach((tag: string) => {
    if (tag.includes(q) || q.includes(tag)) {
      score += 10;
    }
    queryTerms.forEach(term => {
      if (tag.includes(term)) {
        score += 5;
      }
    });
  });

  // Description match (lower weight)
  queryTerms.forEach(term => {
    if (description.includes(term)) {
      score += 3;
    }
  });

  // Boost for featured products
  if (product.isFeatured) {
    score += 10;
  }

  // Boost for higher-rated products
  if (product.averageRating >= 4.5) {
    score += 8;
  } else if (product.averageRating >= 4.0) {
    score += 5;
  }

  // Boost for products in stock
  if (product.isAvailable && product.stock > 0) {
    score += 5;
  }

  // Penalty for out of stock
  if (!product.isAvailable || product.stock === 0) {
    score -= 20;
  }

  return { score, matchType };
}

/**
 * Highlight matching terms in text
 */
export function highlightMatches(text: string, queryTerms: string[]): string {
  let highlighted = text;
  queryTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, "gi");
    highlighted = highlighted.replace(regex, "<mark>$1</mark>");
  });
  return highlighted;
}

/**
 * Build MongoDB aggregation pipeline for enhanced search
 */
export function buildSearchPipeline(options: SearchOptions): any[] {
  const { 
    query, 
    limit = 20, 
    page = 1, 
    category, 
    craftType,
    minPrice, 
    maxPrice,
    barangay,
    sortBy = "relevance"
  } = options;

  const skip = (page - 1) * limit;
  const expandedTerms = expandQuery(query);
  
  // Build the match stage
  const matchStage: any = {
    isActive: true,
  };

  // Category filter
  if (category) {
    matchStage.category = category.toLowerCase();
  }

  // Craft type filter
  if (craftType) {
    matchStage.craftType = craftType;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    matchStage.price = {};
    if (minPrice !== undefined) matchStage.price.$gte = minPrice;
    if (maxPrice !== undefined) matchStage.price.$lte = maxPrice;
  }

  // Barangay filter
  if (barangay) {
    matchStage.barangay = barangay;
  }

  // Build regex pattern for flexible matching
  const regexPatterns = expandedTerms.map(term => 
    new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  );

  const pipeline: any[] = [
    // Match basic filters
    { $match: matchStage },
    
    // Add search score computation
    {
      $addFields: {
        searchScore: {
          $add: [
            // Exact name match (highest weight)
            {
              $cond: [
                { $regexMatch: { input: { $toLower: "$name" }, regex: query.toLowerCase() } },
                50,
                0
              ]
            },
            // Name starts with query
            {
              $cond: [
                { 
                  $eq: [
                    { $indexOfCP: [{ $toLower: "$name" }, query.toLowerCase()] },
                    0
                  ]
                },
                30,
                0
              ]
            },
            // Category match
            {
              $cond: [
                { $regexMatch: { input: { $toLower: "$category" }, regex: query.toLowerCase() } },
                20,
                0
              ]
            },
            // Artist name match
            {
              $cond: [
                { $regexMatch: { input: { $toLower: "$artistName" }, regex: query.toLowerCase() } },
                15,
                0
              ]
            },
            // Rating boost
            { $multiply: ["$averageRating", 2] },
            // Featured boost
            { $cond: ["$isFeatured", 10, 0] },
            // In-stock boost
            { $cond: [{ $and: ["$isAvailable", { $gt: ["$stock", 0] }] }, 5, -10] },
          ]
        }
      }
    },
    
    // Filter by search relevance (at least some match)
    {
      $match: {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { artistName: { $regex: query, $options: 'i' } },
          { tags: { $elemMatch: { $regex: query, $options: 'i' } } },
          { craftType: { $regex: query, $options: 'i' } },
          { searchKeywords: { $elemMatch: { $regex: query, $options: 'i' } } },
          // Also match expanded terms
          ...expandedTerms.map(term => ({ name: { $regex: term, $options: 'i' } })),
          ...expandedTerms.map(term => ({ tags: { $elemMatch: { $regex: term, $options: 'i' } } })),
        ]
      }
    },
  ];

  // Add sort stage based on sortBy option
  switch (sortBy) {
    case "price_asc":
      pipeline.push({ $sort: { price: 1, searchScore: -1 } });
      break;
    case "price_desc":
      pipeline.push({ $sort: { price: -1, searchScore: -1 } });
      break;
    case "rating":
      pipeline.push({ $sort: { averageRating: -1, searchScore: -1 } });
      break;
    case "newest":
      pipeline.push({ $sort: { createdAt: -1, searchScore: -1 } });
      break;
    case "popularity":
      pipeline.push({ $sort: { viewCount: -1, totalReviews: -1, searchScore: -1 } });
      break;
    case "relevance":
    default:
      pipeline.push({ $sort: { searchScore: -1, averageRating: -1 } });
  }

  // Pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // Project final fields
  pipeline.push({
    $project: {
      _id: 1,
      name: 1,
      description: 1,
      shortDescription: 1,
      category: 1,
      price: 1,
      originalPrice: 1,
      artistName: 1,
      artistId: 1,
      images: 1,
      thumbnailUrl: 1,
      averageRating: 1,
      totalReviews: 1,
      craftType: 1,
      barangay: 1,
      stock: 1,
      isAvailable: 1,
      isFeatured: 1,
      tags: 1,
      searchScore: 1,
      createdAt: 1,
    }
  });

  return pipeline;
}

/**
 * Suggest spelling corrections for queries with no results
 */
export function suggestSpellingCorrection(query: string): string | null {
  const terms = query.toLowerCase().split(/\s+/);
  const correctedTerms: string[] = [];
  let hasSuggestion = false;

  terms.forEach(term => {
    let corrected = term;
    
    // Check spelling variations
    for (const [correct, variations] of Object.entries(SPELLING_VARIATIONS)) {
      if (variations.includes(term)) {
        corrected = correct;
        hasSuggestion = true;
        break;
      }
      // Fuzzy match for close misspellings
      if (isFuzzyMatch(term, correct, 0.75) && term !== correct) {
        corrected = correct;
        hasSuggestion = true;
        break;
      }
    }

    correctedTerms.push(corrected);
  });

  return hasSuggestion ? correctedTerms.join(" ") : null;
}

/**
 * Extract category counts from search results
 */
export function getCategoryCounts(results: any[]): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  
  results.forEach(result => {
    const cat = result.category || "other";
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
