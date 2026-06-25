import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

const contacts = [
  { name: "Alex Chen", email: "alex@company.com", company: "Acme Corp", count: 24, sentiment: "Positive" },
  { name: "Sarah Miller", email: "sarah@startup.io", company: "Startup.io", count: 18, sentiment: "Positive" },
  { name: "David Kim", email: "david@design.co", company: "Design Co", count: 12, sentiment: "Neutral" },
  { name: "Priya Patel", email: "priya@finance.com", company: "Finance Group", count: 9, sentiment: "Positive" },
];

export const ContactsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 120, 140], [0, 1, 1, 0]);
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
          overflow: "hidden",
          transform: `translateY(${slideIn}px)`,
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
            Contacts
          </h2>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              background: colors.surfaceAlt,
              color: colors.textMuted,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
          >
            Sort: Most Engaged
          </div>
        </div>
        <div style={{ flex: 1, padding: "8px 0" }}>
          {contacts.map((contact, i) => {
            const rowOpacity = interpolate(frame, [15 + i * 8, 35 + i * 8], [0, 1]);
            return (
              <div
                key={i}
                style={{
                  padding: "14px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: rowOpacity,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${[colors.primary, colors.accent, colors.warning, colors.error][i]}, ${[colors.accent, colors.success, colors.primary, colors.warning][i]})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {contact.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: colors.text,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    {contact.name}
                  </div>
                  <div
                    style={{
                      color: colors.textMuted,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {contact.email} · {contact.company}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: colors.text,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {contact.count}
                    </div>
                    <div
                      style={{
                        color: colors.textMuted,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 10,
                      }}
                    >
                      emails
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "3px 10px",
                      borderRadius: 8,
                      background: `${contact.sentiment === "Positive" ? colors.success : colors.textMuted}22`,
                      color: contact.sentiment === "Positive" ? colors.success : colors.textMuted,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {contact.sentiment}
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
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: colors.primaryLight,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
          >
            View All Contacts →
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
