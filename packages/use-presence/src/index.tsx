import {useEffect, useState} from 'react';

type SharedTransitionConfig = {
  /** Duration in milliseconds used both for enter and exit transitions. */
  transitionDuration: number;
};

type SeparateTransitionConfig = {
  /** Duration in milliseconds used for enter transitions (overrides `transitionDuration` if provided). */
  enterTransitionDuration: number;
  /** Duration in milliseconds used for exit transitions (overrides `transitionDuration` if provided). */
  exitTransitionDuration: number;
};

function isSharedConfig(
  opts: SharedTransitionConfig | SeparateTransitionConfig
): opts is SharedTransitionConfig {
  return 'transitionDuration' in opts;
}

/**
 * Animates the appearance of its children.
 */
export default function usePresence(
  /** Indicates whether the component that the resulting values will be used upon should be visible to the user. */
  isVisible: boolean,
  opts: (SharedTransitionConfig | SeparateTransitionConfig) & {
    /** Opt-in to animating the entering of an element if `isVisible` is `true` during the initial mount. */
    initialEnter?: boolean;
  }
) {
  const exitTransitionDuration = !isSharedConfig(opts)
    ? opts.exitTransitionDuration
    : opts.transitionDuration;
  const enterTransitionDuration = !isSharedConfig(opts)
    ? opts.enterTransitionDuration
    : opts.transitionDuration;

  const initialEnter = opts.initialEnter ?? false;
  const [animateIsVisible, setAnimateIsVisible] = useState(
    initialEnter ? false : isVisible
  );
  const [isMounted, setIsMounted] = useState(isVisible);
  const [hasEntered, setHasEntered] = useState(
    initialEnter ? false : isVisible
  );

  const isExiting = isMounted && !isVisible;
  const isEntering = isVisible && !hasEntered;
  const isAnimating = isEntering || isExiting;

  useEffect(() => {
    if (isVisible) {
      // `animateVisible` needs to be set to `true` in a second step, as
      // when both flags would be flipped at the same time, there would
      // be no transition. See the second effect below.
      setIsMounted(true);
    } else {
      setHasEntered(false);
      setAnimateIsVisible(false);

      const timeoutId = setTimeout(() => {
        setIsMounted(false);
      }, exitTransitionDuration);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isVisible, exitTransitionDuration]);

  useEffect(() => {
    if (isVisible && isMounted && !animateIsVisible) {
      if (typeof document !== undefined) {
        // Force a reflow so the initial styles are flushed to the DOM
        // eslint-disable-next-line no-unused-expressions
        document.body.offsetHeight;
      }

      const animationFrameId = requestAnimationFrame(() => {
        setAnimateIsVisible(true);
      });

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [animateIsVisible, enterTransitionDuration, isMounted, isVisible]);

  useEffect(() => {
    if (animateIsVisible && !hasEntered) {
      const timeoutId = setTimeout(() => {
        setHasEntered(true);
      }, enterTransitionDuration);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [animateIsVisible, enterTransitionDuration, hasEntered]);

  return {
    isMounted,
    isVisible: animateIsVisible,
    isAnimating,
    isEntering,
    isExiting
  };
}
