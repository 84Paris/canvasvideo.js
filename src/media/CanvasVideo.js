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
        bufferTime: 3
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
