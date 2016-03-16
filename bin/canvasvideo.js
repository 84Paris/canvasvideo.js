!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.CanvasVideo=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Utils methods.
 *
 * @class
 * @author Jean-Vincent Roger - 84.Paris
 */

'use strict';

var Utils = {

    uid: function (){
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    },

    removeVideoElement: function (element)
    {
        var sources;

        if (element === null) {
            return false;
        }

        // Remove <source> tags if any
        sources = element.querySelectorAll('source');
        for (var i = sources.length - 1; i >= 0; i--) {
            element.removeChild(sources[i]);
        }

        // Remove attributes if any
        element.src = '';
        element.removeAttribute('src');

        // Properly unload video/audio
        if (element.load instanceof Function) {
            element.load();
        }

        // Remove element from DOM
        if (element.parentNode instanceof HTMLElement) {
            element.parentNode.removeChild(element);
        }

        return element;
    },

    getExtension: function ( filename )
    {
        var ext = (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
        if ( ext ) ext = ext.substring(0,3);
        return ext;
    },

    getAudioSupport : function ( type )
    {
        var audioTest = new Audio();
        if ( !type )
        {
            var codecs = {
              mp3: !!audioTest.canPlayType('audio/mpeg;').replace(/^no$/, ''),
              opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
              ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
              wav: !!audioTest.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
              aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
              m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
              mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
              weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')
            };
            return codecs;
        }
        else
        {
            return !!audioTest.canPlayType( type ).replace(/^no$/, '');
        }

    },

    isIOSdevice : /iPhone|iPad|iPod/i.test(navigator.userAgent) ? true : false,

    getCurrentTimeRange: function(media)
    {
        var i = media.buffered.length-1;
        var result = i;
        while(i>=0)
        {
            if (media.currentTime>media.buffered.start(i) && media.currentTime<media.buffered.end(i))
            {
                i = -1;
            } else {
                result = i;
            }
            i--;
        }
        return result;
    },

    capBufferTime : function (media, bufferTime)
    {
        if(media.currentTime+bufferTime>media.duration) return media.duration-media.currentTime;
        else return bufferTime;
    }


}

module.exports = Utils;

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
/**
 * Event base class
 *
 * @class
 * @author Jean-Vincent Roger - 84.Paris
 */

'use strict';



function Event(type, datas) {
    this.type = type;
    if (datas === undefined) datas = {};
    this.datas = datas;
    this.timeStamp = Number(new Date());
}

Event.prototype.constructor = Event;
module.exports = Event;

},{}],4:[function(require,module,exports){
/**
 * EventDispatcher for custom class
 *
 * @class
 * @author mrdoob / http://mrdoob.com/
 */

 'use strict';



var EventDispatcher = function () {}

EventDispatcher.prototype = {

    constructor: EventDispatcher,

    apply: function ( object ) {
        object.addEventListener = EventDispatcher.prototype.addEventListener;
        object.hasEventListener = EventDispatcher.prototype.hasEventListener;
        object.removeEventListener = EventDispatcher.prototype.removeEventListener;
        object.dispatchEvent = EventDispatcher.prototype.dispatchEvent;
    },

    addEventListener: function ( type, listener ) {
        if ( this._listeners === undefined ) this._listeners = {};

        var listeners = this._listeners;

        if ( listeners[ type ] === undefined ) {
            listeners[ type ] = [];
        }

        if ( listeners[ type ].indexOf( listener ) === - 1 ) {
            listeners[ type ].push( listener );
        }

    },

    hasEventListener: function ( type, listener ) {
        if ( this._listeners === undefined ) return false;

        var listeners = this._listeners;

        if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {
            return true;
        }

        return false;
    },

    removeEventListener: function ( type, listener ) {
        if ( this._listeners === undefined ) return;

        var listeners = this._listeners;
        var listenerArray = listeners[ type ];

        if ( listenerArray !== undefined ) {
            var index = listenerArray.indexOf( listener );
            if ( index !== - 1 ) {
                listenerArray.splice( index, 1 );
            }
        }

    },

    dispatchEvent: function ( event ) {
        if ( this._listeners === undefined ) return;

        var listeners = this._listeners;
        var listenerArray = listeners[ event.type ];

        if ( listenerArray !== undefined ) {
            event.target = this;

            var array = [];
            var length = listenerArray.length;

            for ( var i = 0; i < length; i ++ ) {
                array[ i ] = listenerArray[ i ];
            }

            for ( var i = 0; i < length; i ++ ) {
                array[ i ].call( this, event );
            }

        }

    },

    bubble : function (event) {
        this.dispatchEvent ( event );
    }

};

module.exports = EventDispatcher;

},{}],5:[function(require,module,exports){
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

    that._useWebAudio = !audioBuffer;
    that._waitFullyBuffer = false;
    that.bufferLengthPerc = 0;

    function _constructor(audiocontext) {
        if (that._useWebAudio) webAudioConstructor(audiocontext);
        else html5AudioConstructor();
        if (Utils.isIOSdevice) {
            _needTouch = true;
            if (that._useWebAudio) activeiOSAudio();
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
            if(that._useWebAudio) {
                pauseSound();
                playSound();
            } else {
                sound.source.playbackRate = value;
            }

        }
    });


    Object.defineProperty(that, 'bufferLength', {
        get: function() {
            if(!_useWebAudio)
            {
                if(sound.source.buffered.length>0) {
                    var currentTimeRange = Utils.getCurrentTimeRange(sound.source);
                    return sound.source.buffered.end(currentTimeRange)-sound.source.currentTime;
                } else {
                    return 0;
                }
            }
        }
    });


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
            html5AudioConstructor ();
            return;
        }
        // Create the master gain node
        masterGain = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
        masterGain.connect(ctx.destination);
        //console.log('WebAudio API');
    }

    function html5AudioConstructor () {
        that._useWebAudio = false;
        sound.source = new Audio();
        //console.log('HTML5 Audio');
    }


    function preload(src) {
        if (that._useWebAudio) {
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
        } else {
            sound.source.src = src;
            sound.source.volume = that.options.volume;
            sound.source.addEventListener('canplaythrough', canPlay)
            sound.source.addEventListener('ended', onEnded);
            //sound.source.addEventListener('waiting', onWaiting);
            sound.source.addEventListener('timeupdate', onTimeUpdate);
            sound.source.addEventListener('progress', onProgress);
            sound.source.load ();
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
            if(!isPause) sound.source.currentTime = 0;
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
        if(sound.source.buffered.length>0) {
            var currentTimeRange = Utils.getCurrentTimeRange(sound.source);
            var perc = ((sound.source.buffered.end(currentTimeRange) - sound.source.currentTime)/Utils.capBufferTime(sound.source, that.options.bufferTime));
            if(perc>1) perc = 1;
            else if(perc<0) perc = 0;
            if(perc>=1 && that._waitFullyBuffer) {
                that._waitFullyBuffer = false;
                that.dispatchEvent(new Event(CanvasVideoEvent.READY, {}));
                //console.log('sound playing');
            } else {
                if(that._waitFullyBuffer) that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS, {perc:perc}))
                //if(that._waitFullyBuffer) console.log((perc*100).toFixed(0)+"%");
            }
            that.bufferLengthPerc = perc;
        }
    }

/*
    function onWaiting(e) {
        console.log('Audio Buffer Waiting');
        that.dispatchEvent(new Event(CanvasVideoEvent.WAITING, {}));
    }
*/

    function onTimeUpdate(e) {
        if (!that._useWebAudio) {
            var currentTimeRange = Utils.getCurrentTimeRange(sound.source);
            if((sound.source.buffered.end(currentTimeRange) - sound.source.currentTime) < Utils.capBufferTime(sound.source, 2) && !that._waitFullyBuffer ) {
                that._waitFullyBuffer = true;
                that.dispatchEvent(new Event(CanvasVideoEvent.WAITING, {}));
            }
        }
    }


    _constructor(audiocontext);
}

AudioPlayer.prototype = Object.create(EventDispatcher.prototype);
AudioPlayer.prototype.constructor = AudioPlayer;
module.exports = AudioPlayer;

},{"../core/Utils":1,"../event/CanvasVideoEvent":2,"../event/Event":3,"../event/EventDispatcher":4}],6:[function(require,module,exports){
/**
 * CanvasVideo
 *
 * @class
 * @author Jean-Vincent Roger - 84.Paris
 */


'use strict';



var EventDispatcher = require('../event/EventDispatcher'),
    Event = require('../event/Event'),
    Utils = require('../core/Utils'),
    AudioPlayer = require('./AudioPlayer'),
    CanvasVideoEvent = require('../event/CanvasVideoEvent');



function CanvasVideo(src, options) {
    EventDispatcher.call(this);

    var that = this;

    var canvas, video, sound;
    var _videoReady = false,
        _audioReady = false,
        _readyToPlay = false,
        _isPlaying = false,
        _isWaitingFrame = false,
        _alreadyDispatchWaiting = false,
        _videoWaitFullyBuffer = false;

    var lastTime, time, elapsed;
    var currentTime = 0,
        needTouchDevice;

    var built = false;
    var seeking = false;

    this.options = {
        fps: 24,
        loop: true,
        xhr: false,
        autoplay: false,
        volume: 1,
        playbackRate: 1,
        audioBuffer: false,
        bufferTime: 4
    };

    this.src = src;

    function _constructor(src, options) {
        needTouchDevice = Utils.isIOSdevice;

        // copy options
        for (var i in options) {
            that.options[i] = options[i];
        }

        if (that.options.audio) {
            sound = new AudioPlayer(that.options.audioContext, that.options.audioBuffer);
            // if audio driving, increase FPS for smouth
            if (!options.fps) {
                that.options.fps = 33;
            }
        }

        if (options.canvas) that.element = options.canvas;
        else that.element = document.createElement('canvas');
        that.ctx = that.element.getContext('2d');

        if (that.options.width) that.element.width = that.options.width;
        if (that.options.height) that.element.height = that.options.height;

        if (that.options.preload === true || that.options.autoplay === true) that.load();
    }


    this.load = function() {
        if (!built) {
            if (that.options.xhr) {
                xhrPreload(src);
            } else {
                build(src);
            }
        }
    }

    this.play = function(bufferInstruction) {
        if (built && _readyToPlay) {
            if(!bufferInstruction) _isPlaying = true;
            lastTime = Date.now();
            if (sound) {
                lastTime = sound.currentTime;
                sound.play();
            }
            draw();
            calculate();
            that.dispatchEvent(new Event('play'));
        } else {
            that.options.autoplay = true;
            if (!built) this.load();
        }
    }

    this.pause = function(bufferInstruction) {
        if(!bufferInstruction) _isPlaying = false;
        that.dispatchEvent(new Event('pause'));
        if (sound) {
            sound.pause();
        }
    }

    this.destroy = function() {
        _isPlaying = false;
        if (sound) {
            sound.removeEventListener(CanvasVideoEvent.CAN_PLAY, audioCanPlay);
            sound.removeEventListener(CanvasVideoEvent.ENDED, audioEnded);
            sound.removeEventListener(CanvasVideoEvent.WAITING, audioWaiting);
            sound.removeEventListener(CanvasVideoEvent.READY, audioReadyAfterWaiting);
            sound.removeEventListener(CanvasVideoEvent.PROGRESS, audioProgress);
            sound.destroy();
            sound = null;
        }
        Utils.removeVideoElement(video);
        unbind();
        that.ctx.clearRect(0, 0, video.width, video.height);
        video = null;
    }

    this.canPlayType = function(type) {
        var v;
        if (video) v = video;
        else v = document.createElement('video');
        return v.canPlayType(type);
    }

    /********************************************************************************
    // GETTER / SETTER
    /********************************************************************************/


    Object.defineProperty(that, 'width', {
        get: function() {
            return that.element.width;
        },
        set: function(value) {
            that.options.width = value;
            that.element.width = value;
            video.width = value;
        }
    });

    Object.defineProperty(that, 'height', {
        get: function() {
            return that.element.height;
        },
        set: function(value) {
            that.options.height = value;
            that.element.height = value;
            video.height = value;
        }
    });

    Object.defineProperty(that, 'videoWidth', {
        get: function() {
            return video.videoWidth;
        }
    });

    Object.defineProperty(that, 'videoHeight', {
        get: function() {
            return video.videoHeight;
        }
    });

    Object.defineProperty(that, 'fps', {
        get: function() {
            return that.options.fps;
        },
        set: function(value) {
            if (that.options.audio) that.options.fps = value;
        }
    });

    Object.defineProperty(that, 'loop', {
        get: function() {
            return that.options.loop;
        },
        set: function(value) {
            that.options.loop = value;
        }
    });

    Object.defineProperty(that, 'volume', {
        get: function() {
            return that.options.volume;
        },
        set: function(value) {
            that.options.volume = value;
            if (sound) sound.volume = value;
        }
    });

    Object.defineProperty(that, 'muted', {
        get: function() {
            if (!sound || sound.volume != 0) return false;
            else return true;
        },
        set: function(value) {
            if (value) {
                if (sound) sound.volume = 0;
            } else {
                if (sound) sound.volume = that.options.volume;
            }
        }
    });

    Object.defineProperty(that, 'needTouchDevice', {
        get: function() {
            return needTouchDevice;
        }
    });

    // A affiner.
    Object.defineProperty(that, 'currentTime', {
        get: function() {
            return currentTime;
        },
        set: function(value) {
            seeking = true;
            if (sound) {
                _isPlaying = true;
                sound.currentTime = value;
                video.currentTime = value;
                lastTime = sound.currentTime;
            } else {
                video.currentTime = value;
            }
        }
    });

    Object.defineProperty(that, 'duration', {
        get: function() {
            if (video) return video.duration;
            else return NaN;
        }
    });

    Object.defineProperty(that, 'seeking', {
        get: function() {
            return seeking;
        }
    });

    Object.defineProperty(that, 'playbackRate', {
        get: function() {
            return that.options.playbackRate;
        },
        set: function(value) {
            //if ( video ) video.playbackRate = value;
            that.options.playbackRate = value;
            if (that.options.audio) {
                if (sound) sound.playbackRate = value;
            }
        }
    });

    Object.defineProperty(that, 'readyState', {
        get: function() {
            return _readyToPlay ? 4 : 0;
        }
    });

    Object.defineProperty(that, 'controls', {
        get: function() {
            console.warn('controls attribute is not currently supported by CanvasVideo.');
        },
        set: function(value) {
            console.warn('controls attribute is not currently supported by CanvasVideo.');
        }
    });


    Object.defineProperty(that, 'autoplay', {
        get: function() {
            return that.options.autoplay;
        },
        set: function(value) {
            that.options.autoplay = true;
        }
    });


    Object.defineProperty(that, 'currentSrc', {
        get: function() {
            return video.currentSrc;
        }
    });


    Object.defineProperty(that, 'bufferTime', {
        get: function() {
            return that.options.bufferTime;
        },
        set: function(value) {
            that.options.bufferTime = value;
            if(sound) sound.options.bufferTime = value;
        }
    });


    Object.defineProperty(that, 'bufferLength', {
        get: function() {
            if(video.buffered.length>0) {
                var currentTimeRange = Utils.getCurrentTimeRange(video);
                return video.buffered.end(currentTimeRange)-video.currentTime;
            } else {
                return 0;
            }

        }
    });


    /********************************************************************************
    // PRIVATES
    /********************************************************************************/



    function calculate() {
        // ------------------------------------------------------------------------------------

        if (_alreadyDispatchWaiting && !that.options.audio)
        {
            var bt = Utils.capBufferTime(video, that.options.bufferTime);
            var currentTimeRange = Utils.getCurrentTimeRange(video);
            if(video.buffered.end(currentTimeRange) - video.currentTime>=bt)
            {
                _alreadyDispatchWaiting = false;
                that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
                that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
                that.dispatchEvent(new Event(CanvasVideoEvent.PLAYING));
                lastTime = Date.now();
                if(_isPlaying) that.play(true);
            } else {
                var perc = (video.buffered.end(currentTimeRange) - video.currentTime)/bt;
                if(perc<0) perc = 0;
                that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS, { perc: (perc/2)+(sound.bufferLengthPerc/2) }));
            }
        }
        // ------------------------------------------------------------------------------------
        if (_alreadyDispatchWaiting && that.options.audio)
        {
            var bt = Utils.capBufferTime(video, that.options.bufferTime);
            var currentTimeRange = Utils.getCurrentTimeRange(video);
            if(video.buffered.end(currentTimeRange) - video.currentTime>=bt)
            {
                _videoWaitFullyBuffer = false;
                if(!sound._waitFullyBuffer) {
                    _alreadyDispatchWaiting = false;
                    that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
                    that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
                    that.dispatchEvent(new Event(CanvasVideoEvent.PLAYING));
                    lastTime = sound.currentTime;
                    if(_isPlaying) that.play(true);
                }

            } else {
                _videoWaitFullyBuffer = true;
                var perc = (video.buffered.end(currentTimeRange) - video.currentTime)/bt;
                if(perc<0) perc = 0;
                that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS, { perc: (perc/2)+(sound.bufferLengthPerc/2) }));
            }
        }
        // ------------------------------------------------------------------------------------

        if (_isPlaying && !_alreadyDispatchWaiting) {
            if (that.options.audio) {
                var time = sound.currentTime;
                var elapsed = (time - lastTime);
            } else {
                var time = Date.now();
                var elapsed = (time - lastTime) / 1000;
            }

            if (elapsed >= ((1000 / that.options.fps) / 1000)) {
                if (!that.options.audio) {
                    if (!_isWaitingFrame) {
                        video.currentTime = (video.currentTime + (elapsed * that.options.playbackRate));
                        lastTime = time;
                        _isWaitingFrame = true;
                    } else if (!_alreadyDispatchWaiting) {
                        that.dispatchEvent(new Event(CanvasVideoEvent.WAITING));
                        that.pause(true);
                        _alreadyDispatchWaiting = true;
                    }

                } else {
                    if(sound._useWebAudio) {
                        video.currentTime = (video.currentTime + elapsed);
                        lastTime = video.currentTime;
                    } else {
                        if (!_isWaitingFrame) {
                            video.currentTime = (Number(sound.currentTime.toFixed(2)) + elapsed);
                            lastTime = Number(sound.currentTime.toFixed(2));
                            _isWaitingFrame = true;
                        } else if (!_alreadyDispatchWaiting) {
                            var bt = Utils.capBufferTime(video, that.options.bufferTime);
                            var currentTimeRange = Utils.getCurrentTimeRange(video);
                            lastTime = Number(Number(sound.currentTime.toFixed(2)));
                            if((video.buffered.end(currentTimeRange) - video.currentTime)/bt>Utils.capBufferTime(video, .3)) { // dirty hack
                                that.dispatchEvent(new Event(CanvasVideoEvent.WAITING));
                                that.pause(true);
                                _alreadyDispatchWaiting = true;
                            }
                        }
                    }
                }
            }
            // if we are at the end of the video stop
            currentTime = (Math.round(parseFloat(video.currentTime) * 10000) / 10000);
            var duration = (Math.round(parseFloat(video.duration) * 10000) / 10000);
            if (currentTime >= duration) {
                //console.log('currentTime: ' + currentTime + ' duration: ' + video.duration);
                if (!that.options.audio) that.dispatchEvent(new Event(CanvasVideoEvent.ENDED));
                if (that.options.loop) {
                    if (!that.options.audio) {
                        video.currentTime = 0;
                    }
                } else {
                    _isPlaying = false;
                    that.currentTime = 0;
                    return;
                }

            }
            //requestAnimationFrame(calculate);
        }
        requestAnimationFrame(calculate);
    }

    function draw() {

        //if (!that.options.audio) {
            if(!_alreadyDispatchWaiting) {
                _isWaitingFrame = false;
                _alreadyDispatchWaiting = false;
            }

        //}
        that.ctx.drawImage(video, 0, 0, video.width, video.height);
        that.dispatchEvent(new Event('timeupdate'));
        if (seeking) {
            that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
            that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
            seeking = false;
        }
    }

    function bothReady() {
        _readyToPlay = true;

        if (!that.options.width) that.element.width = video.videoWidth;
        if (!that.options.height) that.element.height = video.videoHeight;

        video.width = that.element.width;
        video.height = that.element.height;

        that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
        that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
        that.dispatchEvent(new Event(CanvasVideoEvent.PLAYING));
        if (that.options.autoplay) that.play();
    }

    function build(src) {
        built = true;
        // create video element
        video = createVideoElement(src);
        bind();
        if (!that.options.id) that.id = video.id ? video.id : Utils.uid();
        else that.id = that.options.id;
        video.id = that.id;

        setTimeout(function() {
            video.load();
        }, 50);
        // gestion de l'audio.
        if (that.options.audio) {
            var buffer = null;
            if (src.arraybuffer && typeof that.options.audio != 'string') buffer = src.arraybuffer;
            sound.set(getAudioSrc(), {
                loop: that.options.loop,
                volume: that.options.volume,
                rate: that.options.playbackRate,
                arraybuffer: buffer,
                bufferTime: that.options.bufferTime
            });
            sound.addEventListener(CanvasVideoEvent.CAN_PLAY, audioCanPlay);
            sound.addEventListener(CanvasVideoEvent.ENDED, audioEnded);
            sound.addEventListener(CanvasVideoEvent.WAITING, audioWaiting);
            sound.addEventListener(CanvasVideoEvent.READY, audioReadyAfterWaiting);
            sound.addEventListener(CanvasVideoEvent.PROGRESS, audioProgress);
        } else {
            that.dispatchEvent( new Event(CanvasVideoEvent.CAN_PLAY_THROUGH), {});
            that.dispatchEvent( new Event(CanvasVideoEvent.CAN_PLAY), {});
        }
    }


    // traitement url
    function xhrPreload(src) {
        var videoInfos = getVideoInfos(src);
        var url = videoInfos.src;
        var mime = videoInfos.mime;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        xhr.responseType = "arraybuffer";

        xhr.onload = function(oEvent) {
            var blob = URL.createObjectURL(new Blob([oEvent.target.response], {
                type: mime
            }));
            build({
                src: blob,
                mime: mime,
                arraybuffer: xhr.response
            });
        };

        xhr.onprogress = function(oEvent) {
            if (oEvent.lengthComputable) {
                var perc = oEvent.loaded / oEvent.total;
                that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS, {
                    perc: perc
                }));
                // do something with this
            }
        }

        xhr.send();
    }

    function bind() {
        video.addEventListener('timeupdate', draw);
        video.addEventListener('canplay', videoCanPlay);
        video.addEventListener('canplaythrough', videoCanPlay);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('progress', onProgress);

        //video.addEventListener ( 'volumechange', function(e){} );
        //video.addEventListener ( 'loadstart', function(e){} );
    }

    function unbind() {
        video.removeEventListener('timeupdate', draw);
        video.removeEventListener('canplay', videoCanPlay);
        video.removeEventListener('canplaythrough', videoCanPlay);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('progress', onProgress);
    }


    function createVideoElement(src) {
        var v;
        if (Array.isArray(src)) {
            v = document.createElement('video');
            for (var i = 0; i < src.length; ++i) {
                if (typeof src[i] === 'string') {
                    v.appendChild(createSourceElement(src[i]));
                } else {
                    var mime = src[i].mime ? src[i].mime : src[i].type;
                    v.appendChild(createSourceElement(src[i].src, mime));
                }
            }
        } else if (typeof src === 'string') {
            v = document.createElement('video');
            v.appendChild(createSourceElement(src));
        } else if (typeof src === 'object') {
            v = document.createElement('video');
            var mime = src.mime ? src.mime : src.type;
            v.appendChild(createSourceElement(src.src, mime));
        } else {
            v = src;
        }
        return v;
    }

    // a fixer le setting du type mime (notamment pour les blobs qui n'ont pas d'extension)
    function createSourceElement(src, mime) {
        var s = document.createElement('source');
        s.src = src;
        var ext = Utils.getExtension(src);
        if (ext || mime) s.type = mime ? mime : 'video/' + ext;
        return s;
    }



    function getAudioSrc() {
        var src;
        if (typeof options.audio === "boolean") {
            var sources = video.querySelectorAll('source');
            for (var i = 0; i <= sources.length - 1; i++) {
                if (Utils.getAudioSupport(sources[i].type) || Utils.getAudioSupport('video/' + Utils.getExtension(sources[i].src)) || !sources[i].type) {
                    src = sources[i].src;
                    break;
                }
            }
        } else if (typeof options.audio === "string") {
            src = options.audio;
        }
        return src;
    }


    function getVideoInfos(src) {
        var o = {};
        if (Array.isArray(src)) {
            if (typeof src[0] === 'string') {
                o.src = src[0];
            } else {
                var mime = src[0].mime ? src[0].mime : src[0].type;
                o.src = src[0].src;
                o.mime = mime;
            }
        } else if (typeof src === 'string') {
            o.src = src;
        } else if (typeof src === 'object') {
            var mime = src.mime ? src.mime : src.type;
            o.src = src.src;
            o.mime = mime;
        } else {
            o = src;
        }

        o.mime = o.mime ? o.mime : "video/" + Utils.getExtension(o.src);
        return o;
    }


    /********************************************************************************
    // HANDLERS
    /********************************************************************************/

    function videoCanPlay(e) {
        if (!_videoReady) {
            _videoReady = true;
            if (!that.options.audio) {
                bothReady();
            }
            /*else if ( that.options.audio && that.needTouchDevice  )
            {
                _audioReady = true;
                bothReady ();
            }*/
            else if (_audioReady) {
                bothReady();
            }
        }
    }

    function audioCanPlay(e) {
        if (!_audioReady) {
            _audioReady = true;
            if (_videoReady) bothReady();
        }
    }


    function onWaiting(e) {
        //console.log('Video Waiting');
    }

    function onProgress(e) {
        //console.log("progress");
    }

    function audioEnded(e) {
        that.dispatchEvent(new Event(CanvasVideoEvent.ENDED));
        if (that.options.loop) {
            _isPlaying = true;
            sound.currentTime = 0;
            video.currentTime = 0;
            lastTime = sound.currentTime;
        } else {
            _isPlaying = false;
            sound.currentTime = 0;
            video.currentTime = 0;
            lastTime = sound.currentTime;
            sound.pause();
        }
    }


    function audioProgress(e) {
        var bt = Utils.capBufferTime(video, that.options.bufferTime);
        var currentTimeRange = Utils.getCurrentTimeRange(video);
        var percVideo = (video.buffered.end(currentTimeRange) - video.currentTime)/bt;
        if(percVideo<0) percVideo = 0;
        that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS, { perc: (e.datas.perc/2)+(percVideo/2) }));
    }


    function audioWaiting(e) {
        if(!_alreadyDispatchWaiting) {
            that.dispatchEvent(new Event(CanvasVideoEvent.WAITING));
            that.pause(true);
            _alreadyDispatchWaiting = true;
        }
    }

    function audioReadyAfterWaiting(e) {
        //console.log('audio ready');
        if(!_videoWaitFullyBuffer) {
            _alreadyDispatchWaiting = false;
            that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
            that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
            that.dispatchEvent(new Event(CanvasVideoEvent.PLAYING));
            lastTime = Number(sound.currentTime.toFixed(2));
            if(_isPlaying) that.play(true);
        }
    }



    _constructor(src, options);
}

CanvasVideo.prototype = Object.create(EventDispatcher.prototype);
CanvasVideo.prototype.constructor = CanvasVideo;
module.exports = CanvasVideo;

},{"../core/Utils":1,"../event/CanvasVideoEvent":2,"../event/Event":3,"../event/EventDispatcher":4,"./AudioPlayer":5}]},{},[6])(6)
});