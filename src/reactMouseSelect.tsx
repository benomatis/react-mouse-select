import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';

import { handleSelection } from './helpers/handleSelection';
import { mouseMoveCheckToStart } from './helpers/mouseMoveCheckToStart';
import { MouseMovePosition, ReactMouseSelectProps } from './types';

let elements: HTMLCollection;
const defaultPositionState: MouseMovePosition = {
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

let edgeSize = 200;
let timer: any = null;

export const ReactMouseSelect = ({
  containerRef,
  sensitivity = 10,
  tolerance = 0,
  portalContainer,
  onClickPreventDefault = false,
  notStartWithSelectableElements = false,
  saveSelectAfterFinish = false,
  itemClassName = 'mouse-select__selectable',
  selectedItemClassName = 'selected',
  frameClassName = 'mouse-select__frame',
  openFrameClassName = 'open',
  startSelectionCallback,
  finishSelectionCallback,
}: ReactMouseSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [positions, setPositions] = useState(defaultPositionState);

  const borderRef = useRef<HTMLDivElement | null>(null);
  const myPositionRef = useRef<MouseMovePosition>(positions);
  const isOpenRef = useRef<boolean>(isOpen);

  const handleClick = (e: MouseEvent) => e.stopPropagation();

  const handleMoueMove = (e: MouseEvent) => {
    const { pageX, pageY } = e;
    const newState: Partial<MouseMovePosition> = {};





    // NOTE: Much of the information here, with regard to document dimensions,
    // viewport dimensions, and window scrolling is derived from JavaScript.info.
    // I am consuming it here primarily as NOTE TO SELF.
    // --
    // Read More: https://javascript.info/size-and-scroll-window
    // --
    // CAUTION: The viewport and document dimensions can all be CACHED and then
    // recalculated on window-resize events (for the most part). I am keeping it
    // all here in the mousemove event handler to remove as many of the moving
    // parts as possible and keep the demo as simple as possible.

    // Get the viewport-relative coordinates of the mousemove event.
    var viewportX = e.clientX;
    var viewportY = e.clientY;

    // Get the viewport dimensions.
    var viewportWidth = document.documentElement.clientWidth;
    var viewportHeight = document.documentElement.clientHeight;

    // Next, we need to determine if the mouse is within the "edge" of the
    // viewport, which may require scrolling the window. To do this, we need to
    // calculate the boundaries of the edge in the viewport (these coordinates
    // are relative to the viewport grid system).
    var edgeTop = edgeSize;
    var edgeLeft = edgeSize;
    var edgeBottom = ( viewportHeight - edgeSize );
    var edgeRight = ( viewportWidth - edgeSize );

    var isInLeftEdge = ( viewportX < edgeLeft );
    var isInRightEdge = ( viewportX > edgeRight );
    var isInTopEdge = ( viewportY < edgeTop );
    var isInBottomEdge = ( viewportY > edgeBottom );

    console.log('test test test')
    // If the mouse is not in the viewport edge, there's no need to calculate
    // anything else.
    if ( ! ( isInLeftEdge || isInRightEdge || isInTopEdge || isInBottomEdge ) ) {

      clearTimeout( timer );
      return;

    }

    // If we made it this far, the user's mouse is located within the edge of the
    // viewport. As such, we need to check to see if scrolling needs to be done.

    // Get the document dimensions.
    // --
    // NOTE: The various property reads here are for cross-browser compatibility
    // as outlined in the JavaScript.info site (link provided above).
    var documentWidth = Math.max(
      document.body.scrollWidth,
      document.body.offsetWidth,
      document.body.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    );
    var documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.body.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );

    // Calculate the maximum scroll offset in each direction. Since you can only
    // scroll the overflow portion of the document, the maximum represents the
    // length of the document that is NOT in the viewport.
    var maxScrollX = ( documentWidth - viewportWidth );
    var maxScrollY = ( documentHeight - viewportHeight );

    // As we examine the mousemove event, we want to adjust the window scroll in
    // immediate response to the event; but, we also want to continue adjusting
    // the window scroll if the user rests their mouse in the edge boundary. To
    // do this, we'll invoke the adjustment logic immediately. Then, we'll setup
    // a timer that continues to invoke the adjustment logic while the window can
    // still be scrolled in a particular direction.
    // --
    // NOTE: There are probably better ways to handle the ongoing animation
    // check. But, the point of this demo is really about the math logic, not so
    // much about the interval logic.
    (function checkForWindowScroll() {

      clearTimeout( timer );

      if ( adjustWindowScroll() ) {

        timer = setTimeout( checkForWindowScroll, 30 );

      }

    })();

    // Adjust the window scroll based on the user's mouse position. Returns True
    // or False depending on whether or not the window scroll was changed.
    function adjustWindowScroll() {

      // Get the current scroll position of the document.
      var currentScrollX = window.pageXOffset;
      var currentScrollY = window.pageYOffset;

      // Determine if the window can be scrolled in any particular direction.
      var canScrollUp = ( currentScrollY > 0 );
      var canScrollDown = ( currentScrollY < maxScrollY );
      var canScrollLeft = ( currentScrollX > 0 );
      var canScrollRight = ( currentScrollX < maxScrollX );

      // Since we can potentially scroll in two directions at the same time,
      // let's keep track of the next scroll, starting with the current scroll.
      // Each of these values can then be adjusted independently in the logic
      // below.
      var nextScrollX = currentScrollX;
      var nextScrollY = currentScrollY;

      // As we examine the mouse position within the edge, we want to make the
      // incremental scroll changes more "intense" the closer that the user
      // gets the viewport edge. As such, we'll calculate the percentage that
      // the user has made it "through the edge" when calculating the delta.
      // Then, that use that percentage to back-off from the "max" step value.
      var maxStep = 50;

      // Should we scroll left?
      if ( isInLeftEdge && canScrollLeft ) {

        var intensity = ( ( edgeLeft - viewportX ) / edgeSize );

        nextScrollX = ( nextScrollX - ( maxStep * intensity ) );

        // Should we scroll right?
      } else if ( isInRightEdge && canScrollRight ) {

        var intensity = ( ( viewportX - edgeRight ) / edgeSize );

        nextScrollX = ( nextScrollX + ( maxStep * intensity ) );

      }

      // Should we scroll up?
      if ( isInTopEdge && canScrollUp ) {

        var intensity = ( ( edgeTop - viewportY ) / edgeSize );

        nextScrollY = ( nextScrollY - ( maxStep * intensity ) );

        // Should we scroll down?
      } else if ( isInBottomEdge && canScrollDown ) {

        var intensity = ( ( viewportY - edgeBottom ) / edgeSize );

        nextScrollY = ( nextScrollY + ( maxStep * intensity ) );

      }

      // Sanitize invalid maximums. An invalid scroll offset won't break the
      // subsequent .scrollTo() call; however, it will make it harder to
      // determine if the .scrollTo() method should have been called in the
      // first place.
      nextScrollX = Math.max( 0, Math.min( maxScrollX, nextScrollX ) );
      nextScrollY = Math.max( 0, Math.min( maxScrollY, nextScrollY ) );

      if (
        ( nextScrollX !== currentScrollX ) ||
        ( nextScrollY !== currentScrollY )
      ) {

        window.scrollTo( nextScrollX, nextScrollY );
        return( true );

      } else {

        return( false );

      }

    }







    if (!isOpenRef.current && mouseMoveCheckToStart(myPositionRef.current, pageX, pageY, sensitivity)) {

      if (onClickPreventDefault) {
        window.addEventListener('click', handleClick, { capture: true, once: true });
      }
      if (startSelectionCallback) startSelectionCallback(e);
      setIsOpen(true);
    }

    if (pageX >= myPositionRef.current.startX) {
      newState.width = pageX - myPositionRef.current.startX;
    } else if (pageX < myPositionRef.current.startX) {
      newState.width = myPositionRef.current.startX - pageX;
      newState.x = pageX;
    }

    if (pageY >= myPositionRef.current.startY) {
      newState.height = pageY - myPositionRef.current.startY;
    } else if (pageY < myPositionRef.current.startY) {
      newState.height = myPositionRef.current.startY - pageY;
      newState.y = pageY;
    }

    handleSelection(
      elements,
      { ...myPositionRef.current, ...newState },
      { tolerance, selectedItemClassName, isOpenRef, saveSelectAfterFinish }
    )
    setPositions((state) => ({ ...state, ...newState }));
  };

  const handleMouseUp = (e: MouseEvent) => {
    setPositions(defaultPositionState);
    if (containerRef && containerRef?.current) containerRef.current.removeEventListener('mousemove', handleMoueMove);
    else document.removeEventListener('mousemove', handleMoueMove);

    window.removeEventListener('mouseup', handleMouseUp);

    if (borderRef.current) borderRef.current.removeEventListener('mousemove', handleMoueMove);

    let selectedElement: Element[] = [];
    for (let i = 0; i < elements.length; i++) {
      const item = elements[i];

      if (item.classList.contains(selectedItemClassName)) {
        selectedElement.push(item);
        if (!saveSelectAfterFinish) item.classList.remove(selectedItemClassName)
      }
    }

    if (finishSelectionCallback) finishSelectionCallback(selectedElement, e);
    setIsOpen(false);

  };

  const handleMouseDown = (e: MouseEvent) => {
    //  check that only the left mouse button is pressed
    if (e.button !== 0) return null;

    let startSelection: boolean = true;
    if (notStartWithSelectableElements) {
      // @ts-ignore
      const elementInitiator = e.composedPath().find((element) => element?.classList?.contains(itemClassName));
      if (elementInitiator) startSelection = false;
    }

    if (startSelection) {
      elements = document.getElementsByClassName(itemClassName);

      setPositions((state) => ({
        ...state,
        startX: e.pageX,
        startY: e.pageY,
        x: e.pageX,
        y: e.pageY,
      }));

      if (containerRef && containerRef.current) containerRef.current.addEventListener('mousemove', handleMoueMove);
      else document.addEventListener('mousemove', handleMoueMove);

      if (borderRef.current) borderRef.current.addEventListener('mousemove', handleMoueMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleSelectStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const element = containerRef?.current;
    const elementBorder = borderRef.current;
    if (element) element.addEventListener('mousedown', handleMouseDown);

    if (element) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('selectstart', handleSelectStart);
    } else {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('selectstart', handleSelectStart);
    }

    return () => {
      if (element) {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mousemove', handleMoueMove);
        element.removeEventListener('selectstart', handleSelectStart);
      } else  {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMoueMove);
        document.removeEventListener('selectstart', handleSelectStart);
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClick, { capture: true });

      if (elementBorder) elementBorder.removeEventListener('mousemove', handleMoueMove);
    };
  }, []);

  useEffect(() => {
    myPositionRef.current = positions;
    isOpenRef.current = isOpen;
  }, [positions, isOpen]);

  const renderEl = () => {
    return (
      <div
        className={`${frameClassName} ${isOpen ? ` ${openFrameClassName}` : ''}`}
        style={{
          position: 'absolute',
          display: `${isOpen ? 'block': 'none'}`,
          top: `${positions.y}px`,
          left: `${positions.x}px`,
          width: `${positions.width}px`,
          height: `${positions.height}px`,
        }}
        ref={borderRef}
      />
    );
  };

  return ReactDOM.createPortal(renderEl(), portalContainer)
};
