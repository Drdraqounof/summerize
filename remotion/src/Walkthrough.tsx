import { AbsoluteFill, Sequence } from "remotion";
import { Intro } from "./compositions/Intro";
import { LoginScene } from "./compositions/LoginScene";
import { InboxScene } from "./compositions/InboxScene";
import { EmailDetailScene } from "./compositions/EmailDetailScene";
import { AnalyticsScene } from "./compositions/AnalyticsScene";
import { ContactsScene } from "./compositions/ContactsScene";
import { Outro } from "./compositions/Outro";
import { colors } from "./theme";

const fps = 30;

export const Walkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <Sequence from={0} durationInFrames={5 * fps}>
        <Intro />
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={6 * fps}>
        <LoginScene />
      </Sequence>
      <Sequence from={11 * fps} durationInFrames={9 * fps}>
        <InboxScene />
      </Sequence>
      <Sequence from={20 * fps} durationInFrames={8 * fps}>
        <EmailDetailScene />
      </Sequence>
      <Sequence from={28 * fps} durationInFrames={7 * fps}>
        <AnalyticsScene />
      </Sequence>
      <Sequence from={35 * fps} durationInFrames={5 * fps}>
        <ContactsScene />
      </Sequence>
      <Sequence from={40 * fps} durationInFrames={5 * fps}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
