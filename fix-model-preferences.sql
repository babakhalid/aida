-- Update invalid model preferences to use Claude 3.7 Sonnet
UPDATE agents 
SET model_preference = 'claude-3-7-sonnet-20250219' 
WHERE model_preference = 'gpt-4.1-nano';

-- Fix specific policy agent
UPDATE agents 
SET model_preference = 'claude-3-7-sonnet-20250219' 
WHERE id = 'fc7d67a6-54c2-4229-a2ec-2aaf466bf7fc';

-- Also update any other invalid model references
UPDATE agents 
SET model_preference = 'claude-3-7-sonnet-20250219' 
WHERE model_preference NOT IN (
  'claude-3-7-sonnet-20250219',
  'grok-3', 
  'gpt-4o',
  'gemini-2.5-pro-preview-03-25'
) AND model_preference IS NOT NULL;

-- Set default model for agents without a preference
UPDATE agents 
SET model_preference = 'claude-3-7-sonnet-20250219' 
WHERE model_preference IS NULL;