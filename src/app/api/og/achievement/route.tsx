import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Rarity colors and styling
const rarityStyles = {
  common: {
    bg: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)",
    border: "#a1a1aa",
    text: "#52525b",
    badge: "#e4e4e7",
    badgeText: "#52525b",
    glow: "none",
  },
  rare: {
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "#3b82f6",
    text: "#1d4ed8",
    badge: "#dbeafe",
    badgeText: "#1d4ed8",
    glow: "0 0 40px rgba(59, 130, 246, 0.3)",
  },
  epic: {
    bg: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    border: "#a855f7",
    text: "#7c3aed",
    badge: "#f3e8ff",
    badgeText: "#7c3aed",
    glow: "0 0 50px rgba(168, 85, 247, 0.4)",
  },
  legendary: {
    bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)",
    border: "#f59e0b",
    text: "#b45309",
    badge: "linear-gradient(90deg, #fde68a 0%, #fcd34d 50%, #fbbf24 100%)",
    badgeText: "#92400e",
    glow: "0 0 60px rgba(251, 191, 36, 0.5)",
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get params
  const name = searchParams.get("name") || "Achievement Unlocked";
  const description = searchParams.get("description") || "";
  const icon = searchParams.get("icon") || "🏆";
  const rarity = (searchParams.get("rarity") || "common") as keyof typeof rarityStyles;
  const points = searchParams.get("points") || "100";
  const username = searchParams.get("username") || "";
  const percentile = searchParams.get("percentile") || "";
  const rank = searchParams.get("rank") || "";
  const date = searchParams.get("date") || "";

  const style = rarityStyles[rarity] || rarityStyles.common;
  const isLegendary = rarity === "legendary";
  const isEpic = rarity === "epic";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "#18181b",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Main card */}
        <div
          style={{
            flex: 1,
            margin: "40px",
            padding: "48px",
            borderRadius: "24px",
            background: style.bg,
            border: `4px solid ${style.border}`,
            boxShadow: style.glow,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "32px",
            }}
          >
            {/* Rarity badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                borderRadius: "999px",
                background: style.badge,
                color: style.badgeText,
                fontSize: "18px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {isLegendary && "✨ "}
              {isEpic && "💜 "}
              {rarity}
            </div>

            {/* Points */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: style.text,
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              🏆 +{points} pts
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "40px",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "24px",
                background: isLegendary
                  ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                  : isEpic
                    ? "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)"
                    : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "80px",
                boxShadow: isLegendary
                  ? "0 8px 32px rgba(251, 191, 36, 0.3)"
                  : isEpic
                    ? "0 8px 32px rgba(168, 85, 247, 0.2)"
                    : "0 4px 16px rgba(0,0,0,0.1)",
              }}
            >
              {icon}
            </div>

            {/* Text content */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "48px",
                  fontWeight: 800,
                  color: "#18181b",
                  lineHeight: 1.1,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  display: description ? "flex" : "none",
                  fontSize: "24px",
                  color: "#52525b",
                  lineHeight: 1.4,
                }}
              >
                {description || ""}
              </div>
            </div>
          </div>

          {/* Footer stats */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "2px solid rgba(0,0,0,0.1)",
            }}
          >
            {/* User info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "20px",
                  color: "#71717a",
                  fontWeight: 500,
                }}
              >
                {username ? `@${username}` : ""}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "18px",
                  color: "#a1a1aa",
                }}
              >
                {date || ""}
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <div
                style={{
                  display: percentile ? "flex" : "none",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  background: "rgba(0,0,0,0.05)",
                  color: style.text,
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                📊 Top {percentile}%
              </div>
              <div
                style={{
                  display: rank ? "flex" : "none",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  background: "rgba(0,0,0,0.05)",
                  color: style.text,
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                #{rank} to unlock
              </div>
            </div>
          </div>
        </div>

        {/* Branding footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            paddingBottom: "24px",
            color: "#71717a",
            fontSize: "20px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🎮</span>
          <span style={{ fontWeight: 600 }}>mcpchallenge.org</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
