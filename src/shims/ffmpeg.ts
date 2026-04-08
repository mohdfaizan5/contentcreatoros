type FfmpegMock = {
  isLoaded: () => boolean;
  load: () => Promise<void>;
  FS: (..._args: unknown[]) => never;
  run: (..._args: unknown[]) => never;
  exit: () => void;
};

export function createFFmpeg(): FfmpegMock {
  const fail = () => {
    throw new Error(
      "@ffmpeg/ffmpeg is shimmed in this app build. Remove-silence mode is disabled for Turbopack compatibility."
    );
  };

  return {
    isLoaded: () => false,
    load: async () => {
      fail();
    },
    FS: fail,
    run: fail,
    exit: () => {
      // no-op
    },
  };
}
