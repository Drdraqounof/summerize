import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

export const EmailDetailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 200, 220], [0, 1, 1, 0]);
  const slideUp = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: "clamp" });

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
          overflow: "hidden",
          transform: `translateY(${slideUp}px)`,
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `linear-gradient(135deg, #f59e0b, #ef4444)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 18,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              A
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: colors.text,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Q3 Budget Review
              </div>
              <div
                style={{
                  color: colors.textMuted,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                From: alex@company.com &nbsp;·&nbsp; Jun 24, 2026
              </div>
            </div>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: 12,
                background: `${colors.warning}22`,
                color: colors.warning,
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ★ Important
            </div>
          </div>
          <div style={{ flex: 1, padding: 24, overflow: "hidden" }}>
            <div
              style={{
                color: colors.text,
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              Hi team,
              <br /><br />
              I've attached the draft budget for Q3. Key changes from Q2 include increased
              allocation for the AI research initiative and a 15% reduction in infrastructure
              costs due to the new server optimization.
              <br /><br />
              Please review before Friday's board meeting.
              <br /><br />
              Best,
              <br />
              Alex
            </div>
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderTop: `1px solid ${colors.border}`,
              display: "flex",
              gap: 8,
            }}
          >
            {["Reply", "Forward", "Archive", "Delete"].map((action) => (
              <div
                key={action}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  background: colors.surfaceAlt,
                  color: colors.text,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                }}
              >
                {action}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            width: 320,
            borderLeft: `1px solid ${colors.border}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <h3
            style={{
              color: colors.accent,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>✨</span> AI Analysis
          </h3>
          {[
            { label: "Sentiment", value: "Positive", color: colors.success },
            { label: "Priority", value: "High", color: colors.error },
            { label: "Category", value: "Work", color: colors.primary },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  color: colors.textMuted,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  marginBottom: 4,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: `${item.color}22`,
                  color: item.color,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: colors.surfaceAlt,
            }}
          >
            <div
              style={{
                color: colors.textMuted,
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                marginBottom: 6,
              }}
            >
              Summary
            </div>
            <div
              style={{
                color: colors.text,
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Alex is requesting team review of Q3 budget draft with increased AI funding and
              reduced infrastructure costs before Friday's board meeting.
            </div>
          </div>
          <div
            style={{
              color: colors.textMuted,
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: "auto",
            }}
          >
            <span>⏱</span> Analyzed 2 minutes ago
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
