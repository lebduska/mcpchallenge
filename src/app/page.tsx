import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Wrench, Trophy, Sparkles, Heart } from "lucide-react";

const features = [
  {
    title: "Learn MCP",
    description: "Interactive tutorials and documentation to master the Model Context Protocol",
    href: "/learn",
    badge: "Start Here",
    icon: BookOpen,
  },
  {
    title: "Playground",
    description: "Build and test your MCP servers in a live sandbox environment",
    href: "/playground",
    badge: "Interactive",
    icon: Wrench,
  },
  {
    title: "Challenges",
    description: "Solve problems, build MCP servers, and compete on the leaderboard",
    href: "/challenges",
    badge: "Compete",
    icon: Trophy,
  },
  {
    title: "Showcase",
    description: "Explore community-built MCP servers and get inspired",
    href: "/showcase",
    badge: "Community",
    icon: Sparkles,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          Open Source MCP Learning Platform
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          MCP Challenge
        </h1>
        <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Master the Model Context Protocol. Learn, build, and compete with
          interactive challenges and a live playground.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/learn">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/playground">Try Playground</Link>
          </Button>
        </div>
      </section>

      {/* What is MCP Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            What is MCP?
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            The <strong>Model Context Protocol</strong> is an open standard by Anthropic
            that enables AI assistants to securely access tools, data sources, and services.
            Think of it as a universal adapter between AI and the world.
          </p>
          <div className="mt-8 p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-sm text-left overflow-x-auto">
            <pre className="text-zinc-800 dark:text-zinc-200">{`// Example MCP Tool
server.tool(
  "weather.get",
  "Get current weather for a city",
  { city: z.string() },
  async ({ city }) => {
    const data = await fetchWeather(city);
    return { temperature: data.temp, conditions: data.weather };
  }
);`}</pre>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-12">
          Start Your Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <feature.icon className="h-10 w-10 text-zinc-700 dark:text-zinc-300" />
                    <Badge>{feature.badge}</Badge>
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">10+</div>
            <div className="text-zinc-600 dark:text-zinc-400">Challenges</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">5</div>
            <div className="text-zinc-600 dark:text-zinc-400">Tutorials</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">∞</div>
            <div className="text-zinc-600 dark:text-zinc-400">Possibilities</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">0</div>
            <div className="text-zinc-600 dark:text-zinc-400">Cost</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
            Built with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> for the MCP community
          </p>
          <div className="flex gap-4">
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              MCP Docs
            </a>
            <a
              href="https://github.com/anthropics/anthropic-cookbook/tree/main/misc/model_context_protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
