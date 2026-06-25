import { Composition } from "remotion";
import { Walkthrough } from "./Walkthrough";

const fps = 30;

export const Root: React.FC = () => {
  return (
    <Composition
      id="Walkthrough"
      component={Walkthrough}
      durationInFrames={fps * 45}
      fps={fps}
      width={1280}
      height={720}
    />
  );
};
