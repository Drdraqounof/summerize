import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

const sampleEmails = [
  { from: "alex@company.com", subject: "Q3 Budget Review", preview: "Hi team, I've attached the draft budget for Q3...", read: false, starred: true, category: "Work" },
  { from: "stripe@notify.com", subject: "Your invoice is ready", preview: "Your Stripe invoice for May 2026 is now...", read: false, starred: false, category: "Finance" },
  { from: "github@noreply.com", subject: "[org/repo] PR #423: Fix auth", preview: "Hey, can you review this PR when you get a...", read: true, starred: false, category: "Dev" },
  { from: "calendly@notify.com", subject: "Meeting confirmed: Design Review", preview: "Your meeting with the design team has been...", read: true, starred: true, category: "Calendar" },
  { from: "noreply@medium.com", subject: "Stories recommended for you", preview: "Based on your reading history, we think you'll...", read: true, starred: false, category: "Updates" },
];

export const InboxScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 240, 260], [0, 1, 1, 0]);
  const headerSlide = interpolate(frame, [0, 20], [-20, 0], { extrapolateRight: "clamp" });

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
          overflow: "hidden",
          transform: `translateY(${headerSlide}px)`,
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              color: colors.text,
              fontFamily: "Inter, sans-serif",
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Inbox
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Unread", "Important", "Work", "Finance"].map((f) => (
              <span
                key={f}
                style={{
                  padding: "4px 12px",
                  borderRadius: 12,
                  background: f === "Important" ? colors.primary : "transparent",
                  color: f === "Important" ? "#fff" : colors.textMuted,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  border: f === "Important" ? "none" : `1px solid ${colors.border}`,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {sampleEmails.map((email, i) => {
            const rowSlide = interpolate(
              frame,
              [15 + i * 6, 35 + i * 6],
              [30, 0],
              { extrapolateRight: "clamp" }
            );
            const rowOpacity = interpolate(
              frame,
              [15 + i * 6, 35 + i * 6],
              [0, 1],
              { extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  padding: "14px 24px",
                  borderBottom: `1px solid ${colors.border}`,
                  background: email.read ? "transparent" : `${colors.surfaceAlt}66`,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: rowOpacity,
                  transform: `translateX(${rowSlide}px)`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {email.from[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        color: email.read ? colors.textMuted : colors.text,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: email.read ? 400 : 600,
                      }}
                    >
                      {email.from}
                    </span>
                    {email.starred && (
                      <span style={{ color: colors.warning, fontSize: 14 }}>★</span>
                    )}
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: 8,
                        background: `${colors.accent}22`,
                        color: colors.accent,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 10,
                      }}
                    >
                      {email.category}
                    </span>
                  </div>
                  <div
                    style={{
                      color: colors.text,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      fontWeight: email.read ? 400 : 600,
                      marginTop: 2,
                    }}
                  >
                    {email.subject}
                  </div>
                  <div
                    style={{
                      color: colors.textMuted,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      marginTop: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {email.preview}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            padding: "10px 24px",
            borderTop: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: colors.textMuted,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
          >
            5 conversations
          </span>
          <span
            style={{
              color: colors.primaryLight,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>●</span> AI analyzing importance...
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
