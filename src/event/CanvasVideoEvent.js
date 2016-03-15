/**
 * CanvasVideoEvent types
 *
 * @class
 * @author Jean-Vincent Roger - 84.Paris
 */

'use strict';

var CanvasVideoEvent = {
    ENDED: "ended",
    LOAD_START: "loadstart",
    CAN_PLAY: "canplay",
    CAN_PLAY_THROUGH: "canplaythrough",
    PLAYING: "playing",
    PROGRESS: "progress",
    READY: "ready",
    TIME_UPDATE: "timeupdate",
    WAITING: "waiting"
}

module.exports = CanvasVideoEvent;
