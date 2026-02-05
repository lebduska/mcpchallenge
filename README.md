# MCP Challenge

Interactive platform for learning **Model Context Protocol (MCP)** through hands-on coding challenges.

**Live:** [mcpchallenge.org](https://mcpchallenge.org)

## What is MCP?

Model Context Protocol is an open standard that enables AI assistants to connect with external tools, data sources, and services. MCP Challenge helps developers learn MCP by building real MCP servers that solve interactive challenges.

## Features

- **Interactive Challenges** - Chess, Snake, Tic-Tac-Toe, Canvas Draw
- **MCP Playground** - Test your MCP servers in real-time
- **Achievements** - Earn badges for completing challenges
- **Leaderboard** - Compete with other developers
- **Multi-language** - 25+ languages supported

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Hosting:** Cloudflare Pages
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** NextAuth.js with GitHub OAuth
- **Styling:** Tailwind CSS v4
- **i18n:** next-intl

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Challenges

| Challenge | Description | Difficulty |
|-----------|-------------|------------|
| Chess | Play chess against Stockfish via MCP | Hard |
| Snake | Control the snake game with MCP tools | Medium |
| Tic-Tac-Toe | Classic game with MCP interface | Easy |
| Canvas Draw | Draw on canvas using MCP commands | Easy |

## Project Structure

```
src/
├── app/
│   ├── [locale]/        # i18n routes
│   │   ├── challenges/  # Interactive challenges
│   │   ├── learn/       # Learning resources
│   │   ├── playground/  # MCP testing sandbox
│   │   └── ...
│   └── api/             # API routes
├── components/          # React components
├── db/                  # Database schema (Drizzle)
├── i18n/                # Internationalization
├── lib/                 # Utilities
└── messages/            # Translations (25 languages)
```

## Deployment

```bash
# Build and deploy to Cloudflare Pages
npm run deploy
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT
