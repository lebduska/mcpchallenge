import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata = {
  title: "Showcase",
  description: "Explore community-built MCP servers",
};

const servers = [
  {
    id: "filesystem",
    name: "Filesystem MCP",
    description: "Read, write, and manage files securely",
    author: "Anthropic",
    tools: ["read", "write", "list", "search", "move", "delete"],
    stars: 1234,
    category: "official",
  },
  {
    id: "github",
    name: "GitHub MCP",
    description: "Interact with GitHub repositories, issues, and PRs",
    author: "Anthropic",
    tools: ["repos.list", "issues.create", "pr.review", "commits.get"],
    stars: 987,
    category: "official",
  },
  {
    id: "slack",
    name: "Slack MCP",
    description: "Send messages, search channels, manage threads",
    author: "Community",
    tools: ["message.send", "channel.list", "search", "thread.reply"],
    stars: 456,
    category: "community",
  },
  {
    id: "database",
    name: "Database MCP",
    description: "Query PostgreSQL, MySQL, and SQLite databases",
    author: "Community",
    tools: ["query", "schema.get", "tables.list"],
    stars: 321,
    category: "community",
  },
  {
    id: "notion",
    name: "Notion MCP",
    description: "Create pages, manage databases, search content",
    author: "Community",
    tools: ["page.create", "database.query", "search", "block.append"],
    stars: 278,
    category: "community",
  },
  {
    id: "browser",
    name: "Browser MCP",
    description: "Control a headless browser for web automation",
    author: "Community",
    tools: ["navigate", "screenshot", "click", "type", "extract"],
    stars: 199,
    category: "community",
  },
];

const categoryColors = {
  official: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  community: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

export default function ShowcasePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          MCP Showcase
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Explore MCP servers built by Anthropic and the community.
          Get inspired or contribute your own!
        </p>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          <Badge variant="secondary" className="cursor-pointer">All</Badge>
          <Badge variant="outline" className="cursor-pointer">Official</Badge>
          <Badge variant="outline" className="cursor-pointer">Community</Badge>
          <Badge variant="outline" className="cursor-pointer">Most Stars</Badge>
          <Badge variant="outline" className="cursor-pointer">Newest</Badge>
        </div>

        {/* Server Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {servers.map((server) => (
            <Card key={server.id} className="h-full transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge className={categoryColors[server.category as keyof typeof categoryColors]}>
                    {server.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <span>⭐</span>
                    <span>{server.stars}</span>
                  </div>
                </div>
                <CardTitle className="mt-4">{server.name}</CardTitle>
                <CardDescription>{server.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {server.author[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {server.author}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-2">Tools:</div>
                    <div className="flex flex-wrap gap-1">
                      {server.tools.slice(0, 4).map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                      {server.tools.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{server.tools.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit CTA */}
        <div className="mt-16 p-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Built something cool?
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Share your MCP server with the community and help others learn
          </p>
          <a
            href="https://github.com"
            className="mt-4 inline-block px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Submit Your Server
          </a>
        </div>
      </div>
    </div>
  );
}
