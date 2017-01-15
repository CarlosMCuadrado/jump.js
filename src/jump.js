import easeInOutQuad from './easing.js'

const jumper = () => {
  // private variable cache
  // no variables are created during a jump, preventing memory leaks

  let container       // container element to be scrolled       (node)
  let element         // element to scroll to                   (node)

  let start           // where scroll starts                    (px)
  let stop            // where scroll stops                     (px)

  let axis            // axis on wich to scroll                 ('y', 'x')
  let exact           // go to exact position                   (boolean)
  let offset          // adjustment from the stop position      (px)
  let easing          // easing function                        (function)
  let a11y            // accessibility support flag             (boolean)

  let distance        // distance of scroll                     (px)
  let duration        // scroll duration                        (ms)

  let timeStart       // time scroll started                    (ms)
  let timeElapsed     // time spent scrolling thus far          (ms)

  let next            // next scroll position                   (px)

  let callback        // to call when done scrolling            (function)

  // scroll position helper

  function location(axis) {
    return (axis === 'y'
      ? container.scrollY || container.pageYOffset || container.scrollTop
      : container.scrollX || container.pageXOffset || container.scrollLeft)
  }

  // element offset helper

  function elementOffset(element, axis) {
    let val = 0

    if (axis === 'y') {
      const elementTop = element.getBoundingClientRect().top
      const containerTop = container.getBoundingClientRect
          ? container.getBoundingClientRect().top
          : 0
      val = elementTop - containerTop + start
    } else {
      const elementLeft = element.getBoundingClientRect().left
      const containerLeft = container.getBoundingClientRect
          ? container.getBoundingClientRect().left
          : 0
      val = elementLeft - containerLeft + start
    }

    return val
  }

  // scrollTo helper

  function scrollTo(distance) {
    if (axis === 'y') {
      container.scrollTo
          ? container.scrollTo(0, distance) // window
          : container.scrollTop = distance  // custom container
    } else {
      container.scrollTo
          ? container.scrollTo(distance, 0) // window
          : container.scrollLeft = distance  // custom container
    }
  }

  // rAF loop helper

  function loop(timeCurrent) {
    // store time scroll started, if not started already
    if(!timeStart) {
      timeStart = timeCurrent
    }

    // determine time spent scrolling so far
    timeElapsed = timeCurrent - timeStart

    // calculate next scroll position
    next = easing(timeElapsed, start, distance, duration)

    // scroll to it
    scrollTo(next)

    // check progress
    timeElapsed < duration
      ? requestAnimationFrame(loop)       // continue scroll loop
      : done()                            // scrolling is done
  }

  // scroll finished helper

  function done() {
    // account for rAF time rounding inaccuracies
    scrollTo(start + distance)

    // if scrolling to an element, and accessibility is enabled
    if(element && a11y) {
      // add tabindex indicating programmatic focus
      element.setAttribute('tabindex', '-1')

      // focus the element
      element.focus()
    }

    // if it exists, fire the callback
    if(typeof callback === 'function') {
      callback()
    }

    // reset time for next jump
    timeStart = false
  }

  // API

  function jump(target, options = {}) {
    // resolve options, or use defaults
    axis     = options.axis     || 'y'
    duration = options.duration || 1000
    offset   = options.offset   || 0
    callback = options.callback                       // "undefined" is a suitable default, and won't be called
    easing   = options.easing   || easeInOutQuad
    a11y     = options.a11y     || false
    exact    = options.exact    || false

    // resolve container
    switch(typeof options.container) {
      case 'object':
        // we assume container is an HTML element (Node)
        container = options.container
        break

      case 'string':
        container = document.querySelector(options.container)
        break

      default:
        container = window
    }

    // cache starting position
    start = location(axis)

    // resolve target
    switch(typeof target) {
      // scroll from current position
      case 'number':
        element = undefined           // no element to scroll to
        a11y    = false               // make sure accessibility is off
        stop    = exact ? target : start + target
      break

      // scroll to element (node)
      // bounding rect is relative to the viewport
      case 'object':
        element = target
        stop    = elementOffset(element, axis)
      break

      // scroll to element (selector)
      // bounding rect is relative to the viewport
      case 'string':
        element = document.querySelector(target)
        stop    = elementOffset(element, axis)
      break
    }

    // resolve scroll distance, accounting for offset
    distance = stop - start + offset

    // resolve duration
    switch(typeof options.duration) {
      // number in ms
      case 'number':
        duration = options.duration
      break

      // function passed the distance of the scroll
      case 'function':
        duration = options.duration(distance)
      break
    }

    // start the loop
    requestAnimationFrame(loop)
  }

  // expose only the jump method
  return jump
}

// export singleton

const singleton = jumper()

export default singleton
