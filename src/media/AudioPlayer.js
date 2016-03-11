/**
 * AudioPlayer
 *
 * @class
 * @author Jean-Vincent Roger - 84.Paris
 */


'use strict';

var EventDispatcher = require('../event/EventDispatcher'),
    Event = require('../event/Event'),
    CanvasVideoEvent = require('../event/CanvasVideoEvent'),
    Utils = require('../core/Utils');


function AudioPlayer() {
    EventDispatcher.call(this);
    var that = this;

    var ctx, masterGain, xhr;

    var sound = {
        _startTimestamp: 0,
        _playbackTime: 0,
        isPlaying: false
    };

    this.options = {
        loop: false
    };

    var _needTouch = false,
        _iOSEnabled = false,
        _playRequest = false;

    var useWebAudio = true;

    function _constructor() {
        if (useWebAudio) webAudioConstructor();
        if (Utils.isIOSdevice) {
            _needTouch = true;
            activeiOSAudio();
        }
    }

    this.set = function(src, options) {
        // copy options
        for (var i in options) {
            that.options[i] = options[i];
        }
        preload(src);
    }

    this.play = function() {
        if (useWebAudio) {
            if (_needTouch) {
                if (!_iOSEnabled) {
                    _playRequest = true;
                } else {
                    if (sound.buffer) playSound();
                }
            } else {
                if (sound.buffer) playSound();
            }

        }

    }

    this.pause = function() {
        pauseSound();
    }

    this.destroy = function() {
        stopSound();
        sound.source.disconnect(0);
        masterGain.disconnect(0);
        masterGain = null;
        sound = null;

    }

    /********************************************************************************
    // GETTER / SETTER
    /********************************************************************************/

    Object.defineProperty(that, 'loop', {
        get: function() {
            return that.options.loop;
        },
        set: function(value) {
            that.options.loop = value;
        }
    });


    Object.defineProperty(that, 'currentTime', {
        get: function() {
            if (sound.isPlaying) {
                return sound.source ? that.options.rate * (Date.now() - sound._startTimestamp) / 1000 + sound._playbackTime : 0;
            } else {
                return sound._playbackTime;
            }

        },
        set: function(value) {
            seek(value);
        }
    });


    Object.defineProperty(that, 'volume', {
        get: function() {
            return sound ? sound.volume : 1;
        },
        set: function(value) {
            that.options.volume = value;
            masterGain.gain.value = value;
        }
    });


    Object.defineProperty(that, 'playbackRate', {
        get: function() {
            return that.options.rate;
        },
        set: function(value) {
            pauseSound();
            that.options.rate = value;
            playSound();
        }
    });


    /********************************************************************************
    // PRIVATES
    /********************************************************************************/


    function webAudioConstructor() {
        // Create audio context
        if (typeof AudioContext !== 'undefined') {
            ctx = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
            ctx = new webkitAudioContext();
        }
        // Create the master gain node
        masterGain = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
        masterGain.connect(ctx.destination);
    }


    function preload(src) {
        masterGain.gain.value = that.options.volume;
        // check if src is an arraybuffer
        if (that.options.arraybuffer != null) {
            decodeAudio(that.options.arraybuffer);
        } else {
            // need to load.
            xhr = new XMLHttpRequest();
            xhr.open('get', src, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                decodeAudio(xhr.response);
            }
            xhr.send();
        }
    }


    function decodeAudio(arraybuffer) {
        ctx.decodeAudioData(arraybuffer, function(buffer) {
            sound.buffer = buffer;
            canPlay();
        });
    }

    function initSource() {
        sound.source = ctx.createBufferSource();
        sound.source.playbackRate.value = that.options.rate;
        sound.source.buffer = sound.buffer;
        sound.source.connect(masterGain);
        sound.source.onended = onEnded;
    }

    function playSound() {
        if (!sound.isPlaying) {
            initSource();
            sound.source.start(0, sound._playbackTime);
            sound._startTimestamp = Date.now();
            sound.isPlaying = true;
        }

    }

    function stopSound(isPause) {
        if (sound.isPlaying) {
            sound.source.onended = null;
            sound.source.stop(0);
            sound._playbackTime = isPause ? that.options.rate * (Date.now() - sound._startTimestamp) / 1000 + sound._playbackTime : 0;
            sound.isPlaying = false;
        }
    }

    function pauseSound() {
        stopSound(true);
    }

    function seek(time) {
        if (sound.isPlaying) {
            stopSound();
            sound._playbackTime = time;
            playSound();
        } else {
            sound._playbackTime = time;
        }

    }

    function activeiOSAudio() {
        var unlock = function() {
            var buffer = ctx.createBuffer(1, 1, 22050);
            var source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);

            if (typeof source.start === 'undefined') {
                source.noteOn(0);
            } else {
                source.start(0);
            }

            setTimeout(function() {
                window.removeEventListener('touchend', unlock, false);
                _iOSEnabled = true;
                if (_playRequest) that.play();
            }, 0);
        }
        window.addEventListener('touchend', unlock, false);
    }

    /********************************************************************************
    // HANDLERS
    /********************************************************************************/

    function canPlay(e) {
        that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY, {}));
    }

    function onEnded(e) {
        that.dispatchEvent(new Event(CanvasVideoEvent.ENDED, {}));
        if (that.options.loop) {
            stopSound();
            playSound();
        }
    }

    _constructor();
}

AudioPlayer.prototype = Object.create(EventDispatcher.prototype);
AudioPlayer.prototype.constructor = AudioPlayer;
module.exports = AudioPlayer;
