import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 100, 130], [0, 1, 1, 0]);
  const scale = interpolate(frame, [0, 25], [0.9, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(circle at 50% 50%, ${colors.surface} 0%, ${colors.bg} 100%)`,
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: "center",
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
            margin: "0 auto 24px",
            boxShadow: `0 0 60px ${colors.primary}44`,
          }}
        >
          🐢
        </div>
        <h1
          style={{
            color: colors.text,
            fontFamily: "Inter, sans-serif",
            fontSize: 48,
            fontWeight: 800,
            margin: 0,
          }}
        >
          Get Started Today
        </h1>
        <p
          style={{
            color: colors.textMuted,
            fontFamily: "Inter, sans-serif",
            fontSize: 18,
            marginTop: 12,
            maxWidth: 500,
            lineHeight: 1.6,
          }}
        >
          Connect your inbox and let AI handle the noise while you focus on what matters.
        </p>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: "12px 32px",
              borderRadius: 12,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Start Free Trial
          </div>
          <div
            style={{
              padding: "12px 32px",
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
            }}
          >
            Learn More
          </div>
        </div>
        <p
          style={{
            color: colors.textMuted,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            marginTop: 32,
          }}
        >
          mailturtle.app · Walkthrough generated with Remotion
        </p>
      </div>
    </AbsoluteFill>
  );
};
