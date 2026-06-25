import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1]);
  const titleY = spring({ frame, fps, config: { damping: 12 } });
  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1]);
  const pulse = Math.sin(frame / 10) * 0.05 + 0.95;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(circle at 50% 50%, ${colors.surface} 0%, ${colors.bg} 100%)`,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          marginBottom: 24,
          transform: `scale(${pulse})`,
          boxShadow: `0 0 60px ${colors.primary}44`,
        }}
      >
        🐢
      </div>
      <h1
        style={{
          color: colors.text,
          fontFamily: "Inter, sans-serif",
          fontSize: 64,
          fontWeight: 800,
          margin: 0,
          opacity: titleOpacity,
          transform: `translateY(${(1 - titleY) * 30}px)`,
        }}
      >
        Mailturtle
      </h1>
      <p
        style={{
          color: colors.textMuted,
          fontFamily: "Inter, sans-serif",
          fontSize: 22,
          marginTop: 12,
          opacity: subtitleOpacity,
        }}
      >
        AI-Powered Email Triage
      </p>
      <div
        style={{
          marginTop: 48,
          display: "flex",
          gap: 12,
          opacity: subtitleOpacity,
        }}
      >
        {["Smart Inbox", "AI Analysis", "Analytics", "Contacts"].map((tag) => (
          <span
            key={tag}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              background: colors.surface,
              color: colors.textMuted,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              border: `1px solid ${colors.border}`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
