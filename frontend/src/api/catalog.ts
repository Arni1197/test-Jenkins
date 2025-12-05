// src/api/catalog.ts
import { apiFetch } from "./client";

export interface CatalogItem {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  isActive?: boolean;
}

export interface CatalogListResponse {
  items: CatalogItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getCatalogItems(
  page = 1,
  limit = 20
): Promise<CatalogListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiFetch<CatalogListResponse>(`/catalog/items?${params.toString()}`);
}

export async function getCatalogItemById(
  id: number
): Promise<CatalogItem> {
  return apiFetch<CatalogItem>(`/catalog/items/${id}`);
}