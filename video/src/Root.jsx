import { Composition } from 'remotion';
import { HeliconVideo } from './Video';

export const Root = () => (
  <>
    <Composition
      id="HeliconVideo"
      component={HeliconVideo}
      durationInFrames={780}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
    <Composition
      id="HeliconVideoMobile"
      component={HeliconVideo}
      durationInFrames={780}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  </>
);
