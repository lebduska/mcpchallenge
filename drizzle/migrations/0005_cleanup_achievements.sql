-- Remove MCP build challenge achievements (challenges moved to Learn section)
DELETE FROM user_achievements WHERE achievementId IN (
  'mcp-hello-world',
  'mcp-calculator',
  'mcp-file-reader',
  'mcp-weather-api',
  'mcp-multi-tool',
  'mcp-data-pipeline',
  'mcp-all-basics',
  'mcp-all-challenges',
  'mcp-canvas-draw'
);

DELETE FROM achievements WHERE id IN (
  'mcp-hello-world',
  'mcp-calculator',
  'mcp-file-reader',
  'mcp-weather-api',
  'mcp-multi-tool',
  'mcp-data-pipeline',
  'mcp-all-basics',
  'mcp-all-challenges',
  'mcp-canvas-draw'
);

-- Add canvas-artist achievement for creative challenges
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity)
VALUES ('canvas-artist', 'Canvas Artist', 'Create a masterpiece using MCP drawing tools', '🎨', 'challenge', 100, 'rare');
