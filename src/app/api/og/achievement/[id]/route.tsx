import { ImageResponse } from "next/og";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { achievements } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: "#f4f4f5", border: "#a1a1aa", text: "#3f3f46" },
  rare: { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8" },
  epic: { bg: "#f3e8ff", border: "#a855f7", text: "#7c3aed" },
  legendary: { bg: "#fef3c7", border: "#f59e0b", text: "#b45309" },
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
          background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 64px",
            borderRadius: "24px",
            background: colors.bg,
            border: `4px solid ${colors.border}`,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: "96px",
              marginBottom: "16px",
            }}
          >
            {achievement.icon}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: colors.text,
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            {achievement.name}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "24px",
              color: "#71717a",
              marginBottom: "24px",
              textAlign: "center",
              maxWidth: "500px",
            }}
          >
            {achievement.description}
          </div>

          {/* Rarity & Points */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "8px 24px",
                borderRadius: "9999px",
                background: colors.border,
                color: "white",
                fontSize: "20px",
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {achievement.rarity}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#f59e0b",
              }}
            >
              +{achievement.points} pts
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              color: "#a1a1aa",
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
