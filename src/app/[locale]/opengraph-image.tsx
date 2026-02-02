import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "MCP Challenge - Master your MCP skills";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
          backgroundColor: "#18181b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
          }}
        >
          {/* Shield with MCP text overlay */}
          <div
            style={{
              position: "relative",
              width: 140,
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="140"
              height="140"
              viewBox="0 0 210 210"
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <path
                d="M105 10 L195 40 L195 100 C195 155 105 195 105 195 C105 195 15 155 15 100 L15 40 Z"
                fill="none"
                stroke="#fafafa"
                stroke-width="8"
              />
            </svg>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "#fafafa",
                marginTop: -10,
              }}
            >
              MCP
            </span>
          </div>
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#fafafa",
            }}
          >
            Challenge
          </span>
        </div>
        <p
          style={{
            fontSize: 32,
            color: "#a1a1aa",
            marginTop: 40,
          }}
        >
          Master your MCP skills
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
