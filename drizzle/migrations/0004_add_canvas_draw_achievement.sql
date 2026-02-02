-- Add canvas draw challenge achievement
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity)
VALUES ('mcp-canvas-draw', 'Pixel Picasso', 'Build a canvas drawing MCP server', '🎨', 'challenge', 250, 'rare');
