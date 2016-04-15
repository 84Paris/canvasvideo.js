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


function AudioPlayer(audiocontext, audioBuffer) {
    EventDispatcher.call(this);
    var that = this;

    var ctx, masterGain, xhr;

    var _xhrLoaded = 0;

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


    this._useWebAudio = !audioBuffer;

    function _constructor(audiocontext) {
        if (that._useWebAudio) webAudioConstructor(audiocontext);
        else html5AudioConstructor();
        if (Utils.isIOSdevice) {
            _needTouch = true;
            if (that._useWebAudio) activeiOSAudio();
        }
    }

    this.set = function(src, options) {
        for (var i in options) {
            that.options[i] = options[i];
        }
        preload(src);
    }

    this.play = function() {
        if (that._useWebAudio) {
            if (_needTouch) {
                if (!_iOSEnabled) {
                    _playRequest = true;
                } else {
                    if (sound.buffer) playSound();
                }
            } else {
                if (sound.buffer) playSound();
            }

        } else {
            if (sound.source) playSound();
        }

    }

    this.pause = function() {
        pauseSound();
    }

    this.needBuffering = function(nextCurrentTime, minBufferAllow) {
        if (!that._useWebAudio) {
            var currentTimeRange = Utils.getCurrentTimeRange(sound.source);
            return ((sound.source.buffered.end(currentTimeRange) - sound.source.currentTime) < Utils.capBufferTime(sound.source, minBufferAllow) || Utils.getCurrentTimeRange(sound.source, nextCurrentTime) === false);
        } else {
            //return false; // temp
            return _xhrLoaded>=1 ? false : true;
        }

    }

    this.destroy = function() {
        stopSound();
        sound.source.disconnect(0);
        masterGain.disconnect(0);
        masterGain = null;
        sound = null;
    }


    /********************************************************************************
    // PRIVATES
    /********************************************************************************/


    function webAudioConstructor(audiocontext) {
        // Create audio context
        if (audiocontext != null) {
            ctx = audiocontext;
        } else if (typeof AudioContext !== 'undefined') {
            ctx = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
            ctx = new webkitAudioContext();
        } else {
            html5AudioConstructor();
            return;
        }
        // Create the master gain node
        masterGain = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
        masterGain.connect(ctx.destination);
        //console.log('WebAudio API');
    }

    function html5AudioConstructor() {
        that._useWebAudio = false;
        sound.source = new Audio();
        //console.log('HTML5 Audio');
    }


    function preload(src) {
        if (that._useWebAudio) {
            masterGain.gain.value = that.options.volume;
            // check if src is an arraybuffer
            if (that.options.arraybuffer != null) {
                _xhrLoaded = 1;
                decodeAudio(that.options.arraybuffer);
            } else {
                // need to load.
                xhr = new XMLHttpRequest();
                xhr.open('get', src, true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    decodeAudio(xhr.response);
                };
                xhr.onprogress = function(oEvent) {
                    if (oEvent.lengthComputable) {
                        _xhrLoaded = oEvent.loaded / oEvent.total;
                        that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS));
                    }
                };
                xhr.send();
            }
        } else {
            sound.source.src = src;
            sound.source.volume = that.options.volume;
            sound.source.addEventListener('canplaythrough', canPlay)
            sound.source.addEventListener('ended', onEnded);
            sound.source.addEventListener('progress', onProgress);
            sound.source.load();
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
        if (that._useWebAudio) {
            if (!sound.isPlaying) {
                initSource();
                sound.source.start(0, sound._playbackTime);
                sound._startTimestamp = Date.now();
                sound.isPlaying = true;
            }
        } else {
            sound.source.play();
        }
    }

    function stopSound(isPause) {
        if (that._useWebAudio) {
            if (sound.isPlaying) {
                sound.source.onended = null;
                sound.source.stop(0);
                sound._playbackTime = isPause ? that.options.rate * (Date.now() - sound._startTimestamp) / 1000 + sound._playbackTime : 0;
                sound.isPlaying = false;
            }
        } else {
            sound.source.pause();
            if (!isPause) sound.source.currentTime = 0;
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

    function onProgress(e) {
        that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS));
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
            if (that._useWebAudio) {
                if (sound.isPlaying) {
                    return sound.source ? that.options.rate * (Date.now() - sound._startTimestamp) / 1000 + sound._playbackTime : 0;
                } else {
                    return sound._playbackTime;
                }
            } else {
                return sound.source.currentTime;
            }
        },
        set: function(value) {
            if (that._useWebAudio) seek(value);
            else sound.source.currentTime = value;
        }
    });


    Object.defineProperty(that, 'volume', {
        get: function() {
            if (that._useWebAudio) return sound.source ? masterGain.gain.value : 1;
            else return sound.source ? sound.source.volume : 1;
        },
        set: function(value) {
            that.options.volume = value;
            if (that._useWebAudio) masterGain.gain.value = value;
            else sound.source.volume = value;
        }
    });


    Object.defineProperty(that, 'playbackRate', {
        get: function() {
            return that.options.rate;
        },
        set: function(value) {
            that.options.rate = value;
            if (that._useWebAudio) {
                pauseSound();
                playSound();
            } else {
                sound.source.playbackRate = value;
            }

        }
    });


    Object.defineProperty(that, 'bufferLength', {
        get: function() {
            if (!that._useWebAudio) {
                var currentTimeRange = Utils.getCurrentTimeRange(sound.source);
                var result = sound.source.buffered.length === 0 ? 0 : (sound.source.buffered.end(currentTimeRange) - sound.source.currentTime);
                return result >= 0 ? result : 0;
            } else {
                //return sound.buffer ? (sound.buffer.duration - that.currentTime) : 0;
                return _xhrLoaded*that.options.bufferTime;
            }
        }
    });

    _constructor(audiocontext);
}

AudioPlayer.prototype = Object.create(EventDispatcher.prototype);
AudioPlayer.prototype.constructor = AudioPlayer;
module.exports = AudioPlayer;
