"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cloud, CheckCircle2, Lightbulb } from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import { ChallengeCompletion } from "@/components/challenges";

const completionSteps = [
  { id: "understand-api", title: "Understood the Open-Meteo API (free, no key required)" },
  { id: "create-coords", title: "Created get_weather tool with lat/lon coordinates" },
  { id: "create-city", title: "Created get_weather_by_city with geocoding" },
  { id: "handle-errors", title: "Implemented error handling for API failures" },
  { id: "test-playground", title: "Tested with real city names in the playground" },
];

const weatherApiCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "weather-server",
  version: "1.0.0",
});

// Get current weather
// Using Open-Meteo API (free, no API key required)
server.tool(
  "get_weather",
  "Get current weather for a location",
  {
    latitude: z.number().describe("Latitude of the location"),
    longitude: z.number().describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    try {
      const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current=temperature_2m,wind_speed_10m,weather_code\`;

      const response = await fetch(url);
      const data = await response.json();

      const current = data.current;
      const weatherDescriptions: Record<number, string> = {
        0: "Clear sky ☀️",
        1: "Mainly clear 🌤️",
        2: "Partly cloudy ⛅",
        3: "Overcast ☁️",
        45: "Foggy 🌫️",
        48: "Depositing rime fog 🌫️",
        51: "Light drizzle 🌧️",
        53: "Moderate drizzle 🌧️",
        55: "Dense drizzle 🌧️",
        61: "Slight rain 🌧️",
        63: "Moderate rain 🌧️",
        65: "Heavy rain 🌧️",
        71: "Slight snow 🌨️",
        73: "Moderate snow 🌨️",
        75: "Heavy snow 🌨️",
        95: "Thunderstorm ⛈️",
      };

      const weather = weatherDescriptions[current.weather_code] || "Unknown";

      return {
        content: [{
          type: "text",
          text: \`Weather at (\${latitude}, \${longitude}):

🌡️ Temperature: \${current.temperature_2m}°C
💨 Wind Speed: \${current.wind_speed_10m} km/h
🌤️ Conditions: \${weather}\`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: \`Error fetching weather: \${error.message}\`,
        }],
        isError: true,
      };
    }
  }
);

// Get weather by city name (using geocoding)
server.tool(
  "get_weather_by_city",
  "Get weather for a city by name",
  {
    city: z.string().describe("City name"),
  },
  async ({ city }) => {
    try {
      // First, geocode the city
      const geoUrl = \`https://geocoding-api.open-meteo.com/v1/search?name=\${encodeURIComponent(city)}&count=1\`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        return {
          content: [{
            type: "text",
            text: \`City "\${city}" not found\`,
          }],
          isError: true,
        };
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Then get weather
      const weatherUrl = \`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current=temperature_2m,wind_speed_10m,weather_code\`;
      const weatherResponse = await fetch(weatherUrl);
      const weatherData = await weatherResponse.json();

      const current = weatherData.current;

      return {
        content: [{
          type: "text",
          text: \`Weather in \${name}, \${country}:

🌡️ Temperature: \${current.temperature_2m}°C
💨 Wind Speed: \${current.wind_speed_10m} km/h\`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: \`Error: \${error.message}\`,
        }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

export default function WeatherApiChallengePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/challenges"
            className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Challenges
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="h-8 w-8 text-sky-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Weather API Integration
            </h1>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Build Server
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
              Intermediate
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create an MCP server that fetches real weather data from an API.
          </p>
        </div>

        {/* API Info */}
        <Card className="mb-6 border-sky-200 dark:border-sky-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Lightbulb className="h-5 w-5" />
              About the API
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600 dark:text-zinc-400">
            <p className="mb-2">
              This challenge uses the <strong>Open-Meteo API</strong> - a free weather API that requires no API key!
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Free for non-commercial use</li>
              <li>• No registration required</li>
              <li>• Supports geocoding (city → coordinates)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">get_weather</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Get weather by latitude/longitude coordinates
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">get_weather_by_city</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Get weather by city name (auto-geocodes)
            </CardContent>
          </Card>
        </div>

        {/* Playground */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weather MCP Server</CardTitle>
          </CardHeader>
          <CardContent>
            <MCPPlayground
              initialCode={weatherApiCode}
              height="500px"
              showToolTester={true}
              title="Weather Server"
              description="Real weather data from Open-Meteo"
            />
          </CardContent>
        </Card>

        {/* Success Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Success Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Fetches real weather data from API
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Handles API errors gracefully
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Supports both coordinates and city name
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Progress Tracking */}
        <ChallengeCompletion
          challengeId="weather-api"
          steps={completionSteps}
        />
      </div>
    </div>
  );
}
