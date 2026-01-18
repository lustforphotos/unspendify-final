/*
  # Fix auto_classify_tool Function

  1. Problem
    - The auto_classify_tool function references non-existent columns 'name' and 'slug'
    - Should reference 'vendor_name' and 'normalized_vendor' instead
    - This causes all tool insertions to fail

  2. Solution
    - Replace the function with correct column references
    - Fix vendor intelligence lookup to use correct columns
*/

CREATE OR REPLACE FUNCTION auto_classify_tool()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  vendor_intel RECORD;
  relevance_score integer;
  category text;
BEGIN
  -- Look up vendor intelligence
  SELECT * INTO vendor_intel
  FROM vendor_intelligence
  WHERE LOWER(vendor_intelligence.vendor_name) = LOWER(NEW.vendor_name)
     OR LOWER(vendor_intelligence.normalized_vendor) = LOWER(NEW.normalized_vendor)
  LIMIT 1;

  IF FOUND THEN
    relevance_score := vendor_intel.default_relevance_score;
    
    -- Determine category based on score
    IF relevance_score >= 70 THEN
      category := 'marketing';
    ELSIF relevance_score >= 40 THEN
      category := 'marketing_adjacent';
    ELSE
      category := 'other';
    END IF;
    
    -- Apply classification
    NEW.marketing_relevance_score := relevance_score;
    NEW.tool_category := category;
    NEW.classification_confidence := 80;
    NEW.classification_source := 'vendor';
    NEW.last_classified_at := now();
  ELSE
    -- Default classification for unknown vendors
    NEW.marketing_relevance_score := 50;
    NEW.tool_category := 'other';
    NEW.classification_confidence := 30;
    NEW.classification_source := 'vendor';
    NEW.last_classified_at := now();
  END IF;

  RETURN NEW;
END;
$$;
