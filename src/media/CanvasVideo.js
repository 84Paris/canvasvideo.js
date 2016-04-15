/**
 * CanvasVideo
 *
 * @class CanvasVideo
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
    // main variables.
    var canvas, ctx, video, sound;
    // calcul variables.
    var _lastTime,
        _currentTime = 0;
    // status variables.
    var _built = false,
        _needTouchDevice,
        _videoReady = false,
        _audioReady = false,
        _readyToPlay = false,
        _seeking = false,
        _isPlaying = false,
        _isBuffering = false,
        _waitVideoUpdate = false;
    // constants
    var MIN_BUFFER_ALLOW = 1;

    that.options = {
        fps: 24,
        loop: true,
        xhr: false,
        autoplay: false,
        volume: 1,
        playbackRate: 1,
        audioBuffer: false,
        bufferTime: 4
    };

    function _constructor(src, options) {
        _needTouchDevice = Utils.isIOSdevice;
        // copy options
        for (var i in options) {
            that.options[i] = options[i];
        }

        if (that.options.audio) {
            sound = new AudioPlayer(that.options.audioContext, that.options.audioBuffer);
            // if audio driving, increase FPS for smouth
            if (!options.fps) that.options.fps = 33;
        }

        if (that.options.bufferTime < MIN_BUFFER_ALLOW) that.options.bufferTime = MIN_BUFFER_ALLOW;

        if (options.canvas) canvas = options.canvas;
        else canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');

        if (that.options.width) canvas.width = that.options.width;
        if (that.options.height) canvas.height = that.options.height;

        // if autopreload
        if (that.options.preload === true || that.options.autoplay === true) that.load();
    }


    /********************************************************************************
    // PUBLIC METHODS
    /********************************************************************************/


    this.load = function() {
        if (!_built) {
            if (that.options.xhr) {
                xhrPreload(src);
            } else {
                build(src);
            }
            that.dispatchEvent(new Event(CanvasVideoEvent.LOAD_START));
        }
    }

    this.play = function(forBuffering) {
        if (_built && _readyToPlay) {
            _lastTime = Date.now();
            if (sound) {
                _lastTime = sound.currentTime;
                sound.play();
            }
            if (!forBuffering) {
                /*
                if(checkBufferStatus()) {
                    _isPlaying = true;
                    that.dispatchEvent(new Event(CanvasVideoEvent.PLAY));
                } else {
                    _isPlaying = true;
                    _isBuffering = true;
                    that.dispatchEvent(new Event(CanvasVideoEvent.WAITING));
                }
                */
                _isPlaying = true;
                that.dispatchEvent(new Event(CanvasVideoEvent.PLAY));



                draw();
                update();
            }
        } else {
            that.options.autoplay = true;
            if (!_built) this.load();
        }
    }

    this.pause = function(forBuffering) {
        if (!forBuffering) {
            _isPlaying = false;
            _isBuffering = false;
        }
        that.dispatchEvent(new Event(CanvasVideoEvent.PAUSE));
        if (sound) {
            sound.pause();
        }
    }

    this.destroy = function() {
        _isPlaying = false;
        Utils.removeVideoElement(video);
        setEvents(false);
        ctx.clearRect(0, 0, video.width, video.height);
        video = null;
    }

    this.canPlayType = function(type) {
        var v;
        if (video) v = video;
        else v = document.createElement('video');
        return v.canPlayType(type);
    }


    /********************************************************************************
    // PRIVATE METHODS
    /********************************************************************************/

    function update() {
        if (_isBuffering) checkBufferStatus();
        if (_isPlaying && !_isBuffering) {

            if (that.options.audio) {
                var time = sound.currentTime;
                var delta = (time - _lastTime);
            } else {
                var time = Date.now();
                var delta = (time - _lastTime) / 1000;
            }

            if (delta >= ((1000 / that.options.fps) / 1000)) {
                if (!that.options.audio) {
                    var currentTimeRange = Utils.getCurrentTimeRange(video);
                    var nextCurrentTime = (video.currentTime + (delta * that.options.playbackRate));
                    if (((video.buffered.end(currentTimeRange) - video.currentTime) < Utils.capBufferTime(video, MIN_BUFFER_ALLOW) || Utils.getCurrentTimeRange(video, nextCurrentTime) === false) && nextCurrentTime <= video.duration) {
                        _isBuffering = true;
                        that.pause(true);
                        that.dispatchEvent(new Event(CanvasVideoEvent.WAITING));
                    } else {
                        video.currentTime = nextCurrentTime;
                        _lastTime = time;
                    }

                } else {

                    var currentTimeRange = Utils.getCurrentTimeRange(video);
                    var nextCurrentTime = (video.currentTime + delta);
                    var videoNeedBuffer = ((video.buffered.end(currentTimeRange) - video.currentTime) < Utils.capBufferTime(video, MIN_BUFFER_ALLOW) || Utils.getCurrentTimeRange(video, nextCurrentTime) === false);
                    var audioNeedBuffer = sound.needBuffering(nextCurrentTime, MIN_BUFFER_ALLOW);

                    if((videoNeedBuffer || audioNeedBuffer) && nextCurrentTime <= video.duration) {
                        _isBuffering = true;
                        that.pause(true);
                        that.dispatchEvent(new Event(CanvasVideoEvent.WAITING));
                    } else {
                        video.currentTime = nextCurrentTime;
                        _lastTime = video.currentTime;
                    }

                }
            }
            // if we are at the end of the video stop
            _currentTime = (Math.round(parseFloat(video.currentTime) * 10000) / 10000);
            var duration = (Math.round(parseFloat(video.duration) * 10000) / 10000);
            if (_currentTime >= duration) {
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

        }
        requestAnimationFrame(update);
    }

    function draw() {
        _waitVideoUpdate = false;
        ctx.drawImage(video, 0, 0, video.width, video.height);
        that.dispatchEvent(new Event(CanvasVideoEvent.TIME_UPDATE));
        if (_seeking) {
            that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
            that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
            that.dispatchEvent(new Event(CanvasVideoEvent.SEEKED));
            _seeking = false;
        }
    }

    function build(src) {
        _built = true;
        video = createVideoElement(src);
        setEvents(true);

        if (!that.options.id) canvas.id = Utils.uid();
        else canvas.id = that.options.id;

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
            sound.addEventListener(CanvasVideoEvent.CAN_PLAY, onAudioCanPlay);
            sound.addEventListener(CanvasVideoEvent.ENDED, audioEnded);
            sound.addEventListener(CanvasVideoEvent.WAITING, audioWaiting);
            sound.addEventListener(CanvasVideoEvent.READY, audioReadyAfterWaiting);
            sound.addEventListener(CanvasVideoEvent.PROGRESS, audioProgress);
        }
        // else {
        //     that.dispatchEvent( new Event(CanvasVideoEvent.CAN_PLAY_THROUGH), {});
        //     that.dispatchEvent( new Event(CanvasVideoEvent.CAN_PLAY), {});
        // }
    }

    function xhrPreload(src) {
        var videoInfos = getVideoInfos(src);
        var url = videoInfos.src;
        var mime = videoInfos.mime;
        var xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);
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
            that.dispatchEvent(new Event(CanvasVideoEvent.COMPLETE));
        };
        xhr.onprogress = function(oEvent) {
            if (oEvent.lengthComputable) {
                var perc = oEvent.loaded / oEvent.total;
                that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS, {
                    perc: perc
                }));
            }
        }
        xhr.send();
    }


    function ready() {
        _readyToPlay = true;

        if (!that.options.width) canvas.width = video.videoWidth;
        if (!that.options.height) canvas.height = video.videoHeight;
        video.width = canvas.width;
        video.height = canvas.height;

        that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
        that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
        that.dispatchEvent(new Event(CanvasVideoEvent.PLAYING));

        if (that.options.autoplay) that.play();
    }

    function checkBufferStatus() {

        var bt = Utils.capBufferTime(video, that.options.bufferTime);
        var currentTimeRange = Utils.getCurrentTimeRange(video);

        var audioBufferFull = that.options.audio ? (sound.bufferLength >= bt) : true;

        if (video.buffered.end(currentTimeRange) - video.currentTime >= bt && audioBufferFull) {
            if (_isBuffering) {
                that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY_THROUGH));
                that.dispatchEvent(new Event(CanvasVideoEvent.CAN_PLAY));
                if (_isPlaying) that.dispatchEvent(new Event(CanvasVideoEvent.PLAYING));
                _isBuffering = false;
                that.play(true);
            }
            return true;
        } else {
            return false;
        }


    }


    function setEvents(listen) {
        var method = listen === false ? 'removeEventListener' : 'addEventListener';
        video[method]('timeupdate', draw);
        video[method]('canplay', onVideoCanPlay);
        video[method]('canplaythrough', onVideoCanPlay);
        video[method]('waiting', onWaiting);
        video[method]('progress', onProgress);
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

    function getAudioSrc() {
        var src;
        if (typeof that.options.audio === "boolean") {
            var sources = video.querySelectorAll('source');
            for (var i = 0; i <= sources.length - 1; i++) {
                if (Utils.getAudioSupport(sources[i].type) || Utils.getAudioSupport('video/' + Utils.getExtension(sources[i].src)) || !sources[i].type) {
                    src = sources[i].src;
                    break;
                }
            }
        } else if (typeof that.options.audio === "string") {
            src = that.options.audio;
        }
        return src;
    }

    /********************************************************************************
    // HANDLERS
    /********************************************************************************/

    function onAudioCanPlay(e) {
        if (!_audioReady) {
            _audioReady = true;
            if (_videoReady) ready();
        }
    }

    function onVideoCanPlay(e) {
        if (!_videoReady) {
            _videoReady = true;
            if (!that.options.audio) {
                ready();
            } else if (_audioReady) {
                ready();
            }
        }
    }

    function onWaiting(e) {
        console.log('Video Waiting');
    }

    function onProgress(e) {
        that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS));
    }

    function audioEnded(e) {
        that.dispatchEvent(new Event(CanvasVideoEvent.ENDED));
        if (that.options.loop) {
            _isPlaying = true;
            sound.currentTime = 0;
            video.currentTime = 0;
            _lastTime = sound.currentTime;
            that.currentTime = 0;
        } else {
            _isPlaying = false;
            sound.currentTime = 0;
            video.currentTime = 0;
            _lastTime = sound.currentTime;
            sound.pause();
        }
    }

    function audioProgress(e) {
        that.dispatchEvent(new Event(CanvasVideoEvent.PROGRESS));
    }

    function audioWaiting(e) {

    }

    function audioReadyAfterWaiting(e) {

    }


    /********************************************************************************
    // GETTER / SETTER
    /********************************************************************************/


    Object.defineProperty(that, 'autoplay', {
        get: function() {
            return that.options.autoplay;
        },
        set: function(value) {
            that.options.autoplay = true;
        }
    });

    Object.defineProperty(that, 'bufferLength', {
        get: function() {
            var currentTimeRange = Utils.getCurrentTimeRange(video);
            var result = video.buffered.length === 0 ? 0 : (video.buffered.end(currentTimeRange) - video.currentTime);
            result = result >= 0 ? result : 0;
            if (that.options.audio && sound) {
                result = Math.min (result, sound.bufferLength);
            }
            return result;
        }
    });

    Object.defineProperty(that, 'bufferTime', {
        get: function() {
            return Utils.capBufferTime(video, that.options.bufferTime);
        },
        set: function(value) {
            that.options.bufferTime = value >= MIN_BUFFER_ALLOW ? value : MIN_BUFFER_ALLOW;
            if (sound) sound.options.bufferTime = that.options.bufferTime;
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

    Object.defineProperty(that, 'currentSrc', {
        get: function() {
            return video.currentSrc;
        }
    });

    Object.defineProperty(that, 'currentTime', {
        get: function() {
            return _currentTime;
        },
        set: function(value) {
            _seeking = true;
            that.dispatchEvent(new Event(CanvasVideoEvent.SEEKING));
            if (sound) {
                _isPlaying = true;
                sound.currentTime = value;
                video.currentTime = value;
                _lastTime = sound.currentTime;
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

    Object.defineProperty(that, 'element', {
        get: function() {
            return canvas;
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

    Object.defineProperty(that, 'height', {
        get: function() {
            return canvas.height;
        },
        set: function(value) {
            that.options.height = value;
            canvas.height = value;
            video.height = value;
        }
    });

    Object.defineProperty(that, 'id', {
        get: function() {
            return canvas.id;
        },
        set: function(value) {
            canvas.id = value;
        }
    });

    Object.defineProperty(that, 'loop', {
        get: function() {
            return that.options.loop;
        },
        set: function(value) {
            if (sound) sound.loop = value;
            that.options.loop = value;
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
            return _needTouchDevice;
        }
    });

    Object.defineProperty(that, 'paused', {
        get: function() {
            return !_isPlaying;
        }
    });

    Object.defineProperty(that, 'playbackRate', {
        get: function() {
            return that.options.playbackRate;
        },
        set: function(value) {
            that.options.playbackRate = value;
            if (that.options.audio && sound) sound.playbackRate = value;
        }
    });

    Object.defineProperty(that, 'readyState', {
        get: function() {
            return _readyToPlay ? 4 : 0;
        }
    });

    Object.defineProperty(that, 'seeking', {
        get: function() {
            return _seeking;
        }
    });

    // TODO
    Object.defineProperty(that, 'src', {
        get: function() {
            return src;
        }
    });

    Object.defineProperty(that, 'videoHeight', {
        get: function() {
            return video.videoHeight;
        }
    });

    Object.defineProperty(that, 'videoWidth', {
        get: function() {
            return video.videoWidth;
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

    Object.defineProperty(that, 'width', {
        get: function() {
            return canvas.width;
        },
        set: function(value) {
            that.options.width = value;
            canvas.width = value;
            video.width = value;
        }
    });

    Object.defineProperty(that, 'xhr', {
        get: function() {
            return that.options.xhr;
        }
    });

    _constructor(src, options);
}

CanvasVideo.prototype = Object.create(EventDispatcher.prototype);
CanvasVideo.prototype.constructor = CanvasVideo;
module.exports = CanvasVideo;
