import React from 'react';
import {
  classNames,
  handleExtractSize,
  updateScrollElementStyle,
  updateScrollPosition,
} from './utils';
import { useEventListener, useSyncRef, useThrottleCallback } from './hooks';
import type { ActionPosition, MacScrollbarProps, ScrollSize } from './types';
import ThumbBar from './ThumbBar';
import './Scrollbar.less';

export interface ScrollbarProps extends MacScrollbarProps {
  innerRef?: React.Ref<HTMLDivElement>;
}

const initialSize: ScrollSize = {
  offsetWidth: 0,
  scrollWidth: 0,
  offsetHeight: 0,
  scrollHeight: 0,
};

const initialAction: ActionPosition = {
  isPressX: false,
  isPressY: false,
  lastScrollTop: 0,
  lastScrollLeft: 0,
  pressStartX: 0,
  pressStartY: 0,
};

export default function ScrollBar({
  direction,
  className,
  onScroll,
  innerRef,
  children,
  ...props
}: ScrollbarProps) {
  const scrollBoxRef = React.useRef<HTMLDivElement>(null);
  const horizontalRef = React.useRef<HTMLDivElement>(null);
  const verticalRef = React.useRef<HTMLDivElement>(null);

  const [boxSize, updateBoxSizeThrottle] = React.useState<ScrollSize>(initialSize);
  const [action, updateAction] = React.useState<ActionPosition>(initialAction);

  useSyncRef(innerRef, scrollBoxRef);

  const updateLayerThrottle = useThrottleCallback(
    (resize?: boolean) => {
      if (resize) {
        updateBoxSizeThrottle(handleExtractSize(scrollBoxRef.current!));
      }
      updateScrollElementStyle(scrollBoxRef.current, horizontalRef.current, verticalRef.current);
    },
    8,
    true,
  );

  const { offsetWidth, scrollWidth, offsetHeight, scrollHeight } = scrollBoxRef.current || boxSize;

  useEventListener('mousemove', (evt) => {
    if (action.isPressX) {
      const horizontalRatio = scrollWidth / offsetWidth;
      updateScrollPosition(
        scrollBoxRef.current,
        Math.floor((evt.clientX - action.pressStartX) * horizontalRatio + action.lastScrollLeft),
        true,
      );
    }
    if (action.isPressY) {
      const verticalRatio = scrollHeight / offsetHeight;
      updateScrollPosition(
        scrollBoxRef.current,
        Math.floor((evt.clientY - action.pressStartY) * verticalRatio + action.lastScrollTop),
      );
    }
  });

  useEventListener('mouseup', () => updateAction(initialAction));

  useEventListener('resize', () => updateLayerThrottle(true));

  React.useEffect(() => {
    updateLayerThrottle(true);
  }, []);

  function handleScroll(evt: React.UIEvent<HTMLDivElement, UIEvent>) {
    if (onScroll) {
      onScroll(evt);
    }
    updateLayerThrottle();
  }

  return (
    <div
      className={classNames('ms-container', 'ms-prevent', className)}
      ref={scrollBoxRef}
      onScroll={handleScroll}
      {...props}
    >
      {children}
      {scrollWidth - offsetWidth > 0 && (
        <ThumbBar
          horizontal
          isPress={action.isPressX}
          grooveRef={horizontalRef}
          scrollSize={scrollWidth}
          offsetWidth={offsetWidth}
          offsetHeight={offsetHeight}
          updateAction={updateAction}
        />
      )}
      {scrollHeight - offsetHeight > 0 && (
        <ThumbBar
          isPress={action.isPressY}
          grooveRef={verticalRef}
          scrollSize={scrollHeight}
          offsetWidth={offsetWidth}
          offsetHeight={offsetHeight}
          updateAction={updateAction}
        />
      )}
    </div>
  );
}