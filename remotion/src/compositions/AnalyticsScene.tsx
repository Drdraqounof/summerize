import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

const bars = [
  { label: "Mon", value: 0.7, color: colors.primary },
  { label: "Tue", value: 0.9, color: colors.primary },
  { label: "Wed", value: 0.5, color: colors.primary },
  { label: "Thu", value: 0.8, color: colors.primary },
  { label: "Fri", value: 0.4, color: colors.primary },
  { label: "Sat", value: 0.2, color: colors.primary },
  { label: "Sun", value: 0.3, color: colors.primary },
];

export const AnalyticsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 170, 190], [0, 1, 1, 0]);
  const slideIn = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        padding: 32,
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          padding: 24,
          transform: `translateY(${slideIn}px)`,
        }}
      >
        <h2
          style={{
            color: colors.text,
            fontFamily: "Inter, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 4px",
          }}
        >
          Analytics Dashboard
        </h2>
        <p
          style={{
            color: colors.textMuted,
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            margin: "0 0 24px",
          }}
        >
          Your email activity this week
        </p>

        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Emails Received", value: "47", change: "+12%", color: colors.success },
            { label: "Flagged", value: "8", change: "+3", color: colors.warning },
            { label: "Response Rate", value: "89%", change: "+5%", color: colors.accent },
            { label: "AI Analyzed", value: "100%", change: "All", color: colors.primary },
          ].map((stat, i) => {
            const statOpacity = interpolate(frame, [20 + i * 8, 40 + i * 8], [0, 1]);
            return (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  background: colors.surfaceAlt,
                  opacity: statOpacity,
                }}
              >
                <div
                  style={{
                    color: colors.textMuted,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    marginBottom: 8,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    color: colors.text,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    color: stat.color,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              color: colors.textMuted,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Daily Volume
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              gap: 12,
            }}
          >
            {bars.map((bar, i) => {
              const barHeight = interpolate(
                frame,
                [30 + i * 5, 60 + i * 5],
                [0, bar.value],
                { extrapolateRight: "clamp" }
              );
              return (
                <div
                  key={bar.label}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 48,
                      borderRadius: "6px 6px 0 0",
                      background: bar.color,
                      height: `${barHeight * 100}%`,
                      transition: "height 0.1s",
                      opacity: interpolate(frame, [25 + i * 5, 40 + i * 5], [0, 1]),
                    }}
                  />
                  <div
                    style={{
                      color: colors.textMuted,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      marginTop: 8,
                    }}
                  >
                    {bar.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
