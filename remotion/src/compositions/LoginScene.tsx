import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

export const LoginScene: React.FC = () => {
  const frame = useCurrentFrame();
  const slideIn = interpolate(frame, [0, 25], [50, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 20, 140, 160], [0, 1, 1, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          width: 840,
          padding: 48,
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          display: "flex",
          gap: 48,
          transform: `translateY(${slideIn}px)`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              marginBottom: 24,
            }}
          >
            🐢
          </div>
          <h2
            style={{
              color: colors.text,
              fontFamily: "Inter, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              color: colors.textMuted,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              margin: "0 0 32px",
            }}
          >
            Sign in to your Mailturtle account
          </p>
          {["Email", "Password"].map((label) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <label
                style={{
                  color: colors.textMuted,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {label}
              </label>
              <div
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 8,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              />
            </div>
          ))}
          <div
            style={{
              height: 42,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            Sign In
          </div>
          <div
            style={{
              marginTop: 16,
              height: 42,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: colors.text,
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 18 }}>G</span> Continue with Google
          </div>
        </div>
        <div
          style={{
            width: 1,
            background: colors.border,
            alignSelf: "stretch",
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              color: colors.textMuted,
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              lineHeight: 1.7,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            "Mailturtle transformed how I handle email. The AI summaries save me hours every week."
          </p>
          <p
            style={{
              color: colors.primaryLight,
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              marginTop: 16,
            }}
          >
            — Sarah K., Product Manager
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
