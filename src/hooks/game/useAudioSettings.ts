import { useCallback, useEffect, useRef, useState } from "react";
import {
  hydrateMenuAudio,
  isMenuAudioReady,
  playRandomWriteSfx,
  playSfx,
  prefetchMenuAudio,
  preloadAudioIdle,
  unlockAudioFromUserGesture,
  unlockAudioSync,
} from "../../platform/audio-service";
import { isIOS } from "../../platform/device";
import { loadSoundEnabled, saveSoundEnabled } from "../../platform/storage";

const MENU_AUDIO_PREPARE_TIMEOUT_MS = 12_000;

export interface AudioSettings {
  soundEnabled: boolean;
  soundEnabledRef: React.MutableRefObject<boolean>;
  menuAudioReady: boolean;
  menuAudioPrefetchComplete: boolean;
  /** iOS/iPadOS: exige gesto explícito antes de decodificar buffers. */
  needsGestureUnlock: boolean;
  /** Chamar de pointerdown/touchstart — unlock síncrono + hydrate. */
  activateAudioFromGesture: () => void;
  toggleSound: (enabled: boolean) => void;
  playClick: () => void;
  playGameStart: () => void;
  playWriteKey: () => void;
  playEraseKey: () => void;
  playGoToMenu: () => void;
}

export function useAudioSettings(): AudioSettings {
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled());
  const [menuAudioReady, setMenuAudioReady] = useState(() => !loadSoundEnabled());
  const [menuAudioPrefetchComplete, setMenuAudioPrefetchComplete] = useState(
    () => !loadSoundEnabled(),
  );
  const soundEnabledRef = useRef(soundEnabled);
  const hydrateStartedRef = useRef(false);

  const finishMenuPrepare = useCallback((ready: boolean) => {
    if (ready || isMenuAudioReady()) {
      setMenuAudioReady(true);
      preloadAudioIdle();
    }
  }, []);

  const runHydrate = useCallback(() => {
    if (hydrateStartedRef.current && menuAudioReady) return;
    hydrateStartedRef.current = true;

    void hydrateMenuAudio()
      .then((ready) => finishMenuPrepare(ready))
      .catch(() => {
        hydrateStartedRef.current = false;
      });
  }, [finishMenuPrepare, menuAudioReady]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setMenuAudioPrefetchComplete(true);
        if (isMenuAudioReady()) finishMenuPrepare(true);
      }
    }, MENU_AUDIO_PREPARE_TIMEOUT_MS);

    void prefetchMenuAudio()
      .then(() => {
        if (cancelled) return;
        setMenuAudioPrefetchComplete(true);
        if (!isIOS()) {
          runHydrate();
        }
      })
      .catch(() => {
        if (!cancelled) setMenuAudioPrefetchComplete(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [soundEnabled, finishMenuPrepare, runHydrate]);

  const activateAudioFromGesture = useCallback(() => {
    if (!soundEnabledRef.current || menuAudioReady) return;

    unlockAudioFromUserGesture();
    playSfx("click", true);
    runHydrate();
  }, [menuAudioReady, runHydrate]);

  const toggleSound = useCallback(
    (enabled: boolean) => {
      setSoundEnabled(enabled);
      saveSoundEnabled(enabled);
      hydrateStartedRef.current = false;

      if (!enabled) {
        setMenuAudioReady(true);
        setMenuAudioPrefetchComplete(true);
        return;
      }

      setMenuAudioReady(false);
      setMenuAudioPrefetchComplete(false);
      void prefetchMenuAudio()
        .then(() => {
          setMenuAudioPrefetchComplete(true);
          if (!isIOS()) {
            runHydrate();
          }
        })
        .catch(() => {
          setMenuAudioPrefetchComplete(true);
        });
    },
    [runHydrate],
  );

  const playClick = useCallback(() => {
    unlockAudioSync();
    playSfx("click", soundEnabledRef.current);
  }, []);
  const playGameStart = useCallback(() => {
    unlockAudioSync();
    playSfx("gameStart", soundEnabledRef.current);
  }, []);
  const playWriteKey = useCallback(() => {
    unlockAudioSync();
    playRandomWriteSfx(soundEnabledRef.current);
  }, []);
  const playEraseKey = useCallback(() => {
    unlockAudioSync();
    playSfx("erase", soundEnabledRef.current);
  }, []);
  const playGoToMenu = useCallback(() => {
    unlockAudioSync();
    playSfx("goToMenu", soundEnabledRef.current);
  }, []);

  const needsGestureUnlock =
    soundEnabled && !menuAudioReady && menuAudioPrefetchComplete && isIOS();

  return {
    soundEnabled,
    soundEnabledRef,
    menuAudioReady,
    menuAudioPrefetchComplete,
    needsGestureUnlock,
    activateAudioFromGesture,
    toggleSound,
    playClick,
    playGameStart,
    playWriteKey,
    playEraseKey,
    playGoToMenu,
  };
}
