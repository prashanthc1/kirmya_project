import { LegalDocument, CookieItem, CookiePreferences } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const legalApi = {
  async getDocument(slug: string): Promise<LegalDocument> {
    try {
      const res = await fetch(`${API_BASE}/legal/documents/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch legal document');
      const data = await res.json();
      return data.data;
    } catch {
      return {
        id: '1',
        slug,
        document_type: slug,
        title: `Kirmya ${slug.replace('-', ' ').toUpperCase()}`,
        locale: 'en',
        current_version: '1.0.0',
        status: 'published',
        effective_date: new Date().toISOString(),
        content: `Official platform terms and policies for ${slug}.`,
      };
    }
  },

  async getCookies(): Promise<CookieItem[]> {
    try {
      const res = await fetch(`${API_BASE}/cookies`);
      if (!res.ok) throw new Error('Failed to fetch cookies');
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  },

  async saveCookieConsent(visitorId: string, preferences: CookiePreferences): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/cookies/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, preferences }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
