import { ImageResponse } from "next/og";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { achievements } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: "#27272a", border: "#71717a", text: "#e4e4e7", glow: "#71717a40" },
  rare: { bg: "#1e293b", border: "#3b82f6", text: "#93c5fd", glow: "#3b82f680" },
  epic: { bg: "#2e1065", border: "#a855f7", text: "#d8b4fe", glow: "#a855f780" },
  legendary: { bg: "#451a03", border: "#f59e0b", text: "#fbbf24", glow: "#f59e0b80" },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, id),
  });

  if (!achievement) {
    return new Response("Achievement not found", { status: 404 });
  }

  const colors = rarityColors[achievement.rarity] || rarityColors.common;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative background elements */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          }}
        />

        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "56px 72px",
            borderRadius: "32px",
            background: colors.bg,
            border: `4px solid ${colors.border}`,
            boxShadow: `0 0 60px ${colors.glow}, 0 25px 50px -12px rgba(0, 0, 0, 0.8)`,
            position: "relative",
            zIndex: 1,
            maxWidth: "900px",
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: "120px",
              marginBottom: "24px",
              filter: `drop-shadow(0 0 20px ${colors.glow})`,
            }}
          >
            {achievement.icon}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: "bold",
              color: colors.text,
              marginBottom: "16px",
              textAlign: "center",
              lineHeight: 1.1,
              textShadow: `0 2px 10px ${colors.glow}`,
            }}
          >
            {achievement.name}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "28px",
              color: "#a1a1aa",
              marginBottom: "32px",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: 1.3,
            }}
          >
            {achievement.description}
          </div>

          {/* Rarity & Points */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "12px 32px",
                borderRadius: "9999px",
                background: colors.border,
                color: "white",
                fontSize: "24px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                boxShadow: `0 0 20px ${colors.glow}`,
              }}
            >
              {achievement.rarity}
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#fbbf24",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "28px" }}>🏆</span>
              +{achievement.points} pts
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "32px",
              fontWeight: "600",
              color: "#71717a",
              letterSpacing: "0.5px",
            }}
          >
            MCP Challenge
          </div>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#71717a",
            }}
          />
          <div
            style={{
              fontSize: "28px",
              color: "#52525b",
            }}
          >
            mcpchallenge.org
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
