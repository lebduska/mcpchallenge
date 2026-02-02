-- Add MCP Build Challenge achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('mcp-hello-world', 'Hello MCP', 'Complete the Hello World MCP server challenge', '👋', 'challenge', 50, 'common'),
  ('mcp-calculator', 'Number Cruncher', 'Build a calculator MCP server', '🔢', 'challenge', 75, 'common'),
  ('mcp-file-reader', 'File Explorer', 'Create a file reading MCP server', '📁', 'challenge', 100, 'uncommon'),
  ('mcp-weather-api', 'Weather Watcher', 'Build a weather API MCP server', '🌤️', 'challenge', 150, 'rare'),
  ('mcp-multi-tool', 'Swiss Army Knife', 'Create a multi-tool MCP server', '🛠️', 'challenge', 200, 'rare'),
  ('mcp-data-pipeline', 'Data Architect', 'Build a data pipeline MCP server', '🔄', 'challenge', 300, 'legendary'),
  ('mcp-all-basics', 'MCP Fundamentals', 'Complete all beginner MCP challenges', '📚', 'milestone', 100, 'rare'),
  ('mcp-all-challenges', 'MCP Master', 'Complete all MCP build challenges', '🎓', 'milestone', 500, 'legendary');
