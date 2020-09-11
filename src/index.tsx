import { useState, useRef, useEffect } from 'react';

function isNode() {
  // http://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js
  return (
    typeof process !== 'undefined' &&
    process.release &&
    process.release.name === 'node'
  );
}
/**
 * Offscreen hook works just like react-way point, which will inject a state into the component
 * to help detecting if the component is entering / leaving the viewport.
 *
 * @remarks
 *
 * Sample of usage
 *
 * ```
 * const [ref, isOffscreen] = useOffscreen()
 *
 * return <div ref={ref}>
 *    {isOffscreen ? 'not visible' : 'visible'}
 * </div>
 * ```
 *
 * @param once - The default value is `false`, by setting this prop to `true` the hook will not perform
 * further action after the component entering viewport.
 * @returns An array with a `ReactRef` in first argument and a boolean state that changes when component
 * enters or leaves viewport.
 */
const useOffscreen = (
  once?: boolean,
  debounce: number = 0
): [React.MutableRefObject<any>, boolean] => {
  // tslint:disable-next-line: no-parameter-reassignment
  once = once || false;
  const container = useRef<any>(null);
  const timer = useRef<NodeJS.Timer | null>(null);
  const [isOffscreen, setIsOffscreen] = useState(true);

  function update(val: boolean) {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    // tslint:disable-next-line: ter-prefer-arrow-callback
    timer.current = setTimeout(function() {
      setIsOffscreen(val);
    }, debounce);
  }

  useEffect(() => {
    let observer;
    let observerFunc;
    let unobserveFunc;

    if (
      container.current &&
      !isNode &&
      typeof IntersectionObserver !== 'undefined'
    ) {
      observerFunc = () => {
        observer = new IntersectionObserver(
          ([entry]) => {
            // console.log('entry.intersectionRatio',entry.intersectionRatio, document? document.hidden:'no document');
            if (entry.isIntersecting) {
              if (once) {
                observer.unobserve(container.current);
              }
              update(false);
            } else {
              update(true);
            }
          },
          {
            rootMargin: '10px',
          }
        );

        observer.observe(container.current);
      };

      observerFunc();

      unobserveFunc = () => {
        if (observer) {
          observer.unobserve(container.current);
        }
      };
    }
    // implementation without InteractionObserver
    // tslint:disable-next-line: brace-style
    else {
      let lastTick = -1;
      let offscreen = false;

      const checkIfVisible = () => {
        if (document.hidden) {
          update(true);
        } else {
          if (container && container.current) {
            // @ts-ignore
            const top = container.current.getBoundingClientRect().top;
            if (top >= 0 && top < window.innerHeight + 75 && isOffscreen) {
              offscreen = false;
              if (once) {
                window.removeEventListener('scroll', handleWithThrottle);
              }
              update(offscreen);
            } else {
              if (!offscreen) {
                offscreen = true;
                update(offscreen);
              }
            }
          }
        }
      };

      const handleWithThrottle = () => {
        if (Date.now() - lastTick > 500) {
          lastTick = Date.now();
          checkIfVisible();
        }
      };

      observerFunc = () => {
        checkIfVisible();
        window.addEventListener('scroll', handleWithThrottle);
      };

      observerFunc();

      unobserveFunc = () => {
        window.removeEventListener('scroll', handleWithThrottle);
      };
    }

    const checkPageChange = () => {
      unobserveFunc();

      if (document.hidden) {
        update(true);
      } else {
        observerFunc();
      }
    };

    window.addEventListener('visibilitychange', checkPageChange);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      unobserveFunc();
      window.removeEventListener('visibilitychange', checkPageChange);
    };
  }, []);

  return [container, isOffscreen];
};

export default useOffscreen;
