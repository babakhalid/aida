-- Fix SAP agent tool issues
-- 1. Update invalid model preferences
UPDATE agents 
SET model_preference = 'claude-3-7-sonnet-20250219' 
WHERE model_preference = 'gpt-4.1-nano';

-- 2. Update SAP agent specifically (if needed)
UPDATE agents 
SET model_preference = 'claude-3-7-sonnet-20250219' 
WHERE id = '03b77f32-8871-4f26-bde6-a4f699ae979c';

-- 3. Fix any other invalid model references
UPDATE agents 
SET model_preference = 'claude-3-7-sonnet-20250219' 
WHERE model_preference NOT IN (
  'claude-3-7-sonnet-20250219',
  'grok-3', 
  'gpt-4o',
  'gemini-2.5-pro-preview-03-25'
) AND model_preference IS NOT NULL;

-- 4. Clean up any problematic messages with malformed tool calls
-- This removes messages that might have invalid tool_use structures
DELETE FROM messages 
WHERE content LIKE '%tool_use%' 
AND (
  content NOT LIKE '%"input":%' 
  OR content LIKE '%"input":null%'
  OR content LIKE '%"input":{}%'
);

-- 5. Verify SAP agent tools are properly configured
-- (This is just a check query - run this separately)
-- SELECT id, name, tools, model_preference 
-- FROM agents 
-- WHERE tools @> '["createPurchaseOrder"]' OR name ILIKE '%sap%';