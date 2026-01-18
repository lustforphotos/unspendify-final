import { supabase } from './supabase';

export interface ToolClassification {
  marketing_relevance_score: number;
  tool_category: 'marketing' | 'marketing_adjacent' | 'other';
  classification_confidence: number;
  classification_source: string;
}

export interface VendorIntelligence {
  id: string;
  vendor_name: string;
  normalized_vendor: string;
  default_relevance_score: number;
  category_hint: string;
  common_keywords: string[];
}

const MARKETING_KEYWORDS = [
  'campaign', 'ads', 'advertising', 'marketing', 'crm', 'leads',
  'subscribers', 'newsletter', 'email marketing', 'automation',
  'seo', 'analytics', 'growth', 'engagement', 'conversion',
];

const INFRA_KEYWORDS = [
  'cloud', 'server', 'hosting', 'database', 'deployment', 'ci/cd',
  'monitoring', 'infrastructure', 'compute', 'storage', 'dyno',
];

const ENGINEERING_KEYWORDS = [
  'repository', 'code', 'commits', 'pull request', 'issues', 'tickets',
  'sprint', 'project management', 'version control', 'devops',
];

export async function getVendorIntelligence(vendorName: string): Promise<VendorIntelligence | null> {
  const { data, error } = await supabase
    .from('vendor_intelligence')
    .select('*')
    .or(`vendor_name.ilike.%${vendorName}%,normalized_vendor.ilike.%${vendorName}%`)
    .maybeSingle();

  if (error) {
    console.error('Error fetching vendor intelligence:', error);
    return null;
  }

  return data;
}

export function analyzeEmailContext(subject: string, body: string): {
  marketingScore: number;
  confidence: number;
} {
  const text = `${subject} ${body}`.toLowerCase();
  let marketingMatches = 0;
  let infraMatches = 0;
  let engineeringMatches = 0;

  MARKETING_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword)) marketingMatches++;
  });

  INFRA_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword)) infraMatches++;
  });

  ENGINEERING_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword)) engineeringMatches++;
  });

  const totalMatches = marketingMatches + infraMatches + engineeringMatches;
  if (totalMatches === 0) {
    return { marketingScore: 0, confidence: 0 };
  }

  const marketingRatio = marketingMatches / totalMatches;
  const marketingScore = Math.min(30, Math.round(marketingRatio * 30));
  const confidence = Math.min(40, Math.round((totalMatches / 5) * 40));

  return { marketingScore, confidence };
}

export function adjustScoreForOwnership(
  baseScore: number,
  ownerRole?: string
): number {
  if (!ownerRole) return baseScore;

  const roleLower = ownerRole.toLowerCase();

  if (roleLower.includes('market') || roleLower.includes('growth')) {
    return Math.min(100, baseScore + 15);
  }

  if (roleLower.includes('engineer') || roleLower.includes('dev')) {
    return Math.max(0, baseScore - 20);
  }

  if (roleLower.includes('infra') || roleLower.includes('ops')) {
    return Math.max(0, baseScore - 25);
  }

  return baseScore;
}

export function determineCategory(score: number): ToolClassification['tool_category'] {
  if (score >= 70) return 'marketing';
  if (score >= 40) return 'marketing_adjacent';
  return 'other';
}

export async function recordCorrection(
  toolId: string,
  userId: string,
  correctionType: 'not_marketing' | 'belongs_to' | 'ignore' | 'is_marketing',
  previousCategory?: string,
  newCategory?: string,
  relevanceAdjustment: number = 0
): Promise<void> {
  const { error } = await supabase
    .from('tool_classification_corrections')
    .insert({
      tool_id: toolId,
      user_id: userId,
      correction_type: correctionType,
      previous_category: previousCategory,
      new_category: newCategory,
      relevance_adjustment: relevanceAdjustment,
    });

  if (error) {
    console.error('Error recording correction:', error);
    throw error;
  }

  if (correctionType === 'not_marketing') {
    await updateToolClassification(toolId, {
      marketing_relevance_score: Math.max(0, relevanceAdjustment),
      tool_category: 'other',
      classification_source: 'user_correction',
      classification_confidence: 90,
    });
  } else if (correctionType === 'is_marketing') {
    await updateToolClassification(toolId, {
      marketing_relevance_score: Math.min(100, 90 + relevanceAdjustment),
      tool_category: 'marketing',
      classification_source: 'user_correction',
      classification_confidence: 90,
    });
  }
}

export async function updateToolClassification(
  toolId: string,
  updates: Partial<ToolClassification>
): Promise<void> {
  const updateData: Record<string, any> = { ...updates };
  updateData.last_classified_at = new Date().toISOString();

  const { error } = await supabase
    .from('detected_tools')
    .update(updateData)
    .eq('id', toolId);

  if (error) {
    console.error('Error updating tool classification:', error);
    throw error;
  }
}

export function shouldAlertMarketing(
  toolCategory: string,
  ownershipStatus: string,
  userRole?: string
): boolean {
  if (userRole?.toLowerCase().includes('founder')) {
    return true;
  }

  if (ownershipStatus === 'unconfirmed' || ownershipStatus === 'disputed') {
    return true;
  }

  return toolCategory === 'marketing' || toolCategory === 'marketing_adjacent';
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    marketing: 'Marketing',
    marketing_adjacent: 'Marketing-Related',
    other: 'Other',
  };
  return labels[category] || category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    marketing: 'text-blue-400',
    marketing_adjacent: 'text-slate-400',
    other: 'text-slate-600',
  };
  return colors[category] || 'text-slate-500';
}
