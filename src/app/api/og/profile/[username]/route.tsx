import { ImageResponse } from "next/og";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { users, userStats, userAchievements } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, user.id),
  });

  const achievementCount = await db
    .select({ count: count() })
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id));

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
            background: "white",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              width={120}
              height={120}
              style={{
                borderRadius: "50%",
                marginBottom: "16px",
              }}
            />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "#e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: "bold",
                color: "#71717a",
                marginBottom: "16px",
              }}
            >
              {(user.name || username).charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name */}
          <div
            style={{
              fontSize: "42px",
              fontWeight: "bold",
              color: "#18181b",
              marginBottom: "4px",
            }}
          >
            {user.name || username}
          </div>

          {/* Username */}
          <div
            style={{
              fontSize: "24px",
              color: "#71717a",
              marginBottom: "24px",
            }}
          >
            @{username}
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                {stats?.totalPoints || 0}
              </div>
              <div style={{ fontSize: "16px", color: "#71717a" }}>Points</div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#8b5cf6",
                }}
              >
                {stats?.level || 1}
              </div>
              <div style={{ fontSize: "16px", color: "#71717a" }}>Level</div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#22c55e",
                }}
              >
                {achievementCount[0]?.count || 0}
              </div>
              <div style={{ fontSize: "16px", color: "#71717a" }}>Achievements</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "28px",
            color: "#a1a1aa",
          }}
        >
          mcpchallenge.org
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
