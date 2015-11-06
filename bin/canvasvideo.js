!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.CanvasVideo=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Utils methods.
 *
 * @class
 * @author Jean-Vincent Roger
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

    }


}

module.exports = Utils;



},{}],2:[function(require,module,exports){
/**
 * CanvasVideoEvent types
 *
 * @class
 * @author Jean-Vincent Roger
 */

'use strict';

var CanvasVideoEvent = {
    ENDED : "ended",
    LOAD_START: "loadstart",
    CAN_PLAY : "canplay",
    CAN_PLAY_THROUGH: "canplaythrough",
    PLAYING : "playing",
    PROGRESS: "progress",
    TIME_UPDATE: "timeupdate",
    WAITING: "waiting"
}

module.exports = CanvasVideoEvent;



},{}],3:[function(require,module,exports){
/**
 * Event base class
 *
 * @class
 * @author Jean-Vincent Roger
 */

'use strict';



function Event ( type, datas )
{
    this.type = type;
    if ( datas === undefined ) datas = {};
    this.datas = datas;
    this.timeStamp = Number ( new Date () );
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
 * @author Jean-Vincent Roger
 */


'use strict';

require ('howler');

var EventDispatcher     = require( '../event/EventDispatcher' );
var Event               = require( '../event/Event' );
var CanvasVideoEvent    = require( '../event/CanvasVideoEvent' );


function AudioPlayer ( src, options )
{
    EventDispatcher.call ( this );
    var that = this;


    var sound;
    this.options = {
        loop: false
    };

    function _constructor ( src, options )
    {
        // copy options
        for (var i in options) {
            that.options[i] = options[i];
        }

        sound = new Howl({
            urls:[src],
            format:'mp4',
            onload:canPlay,
            loop: that.options.loop,
            volume: that.options.volume,
            onend: function(e){
                that.dispatchEvent ( new Event( CanvasVideoEvent.ENDED ));
            }
        }).load();
    }

    this.play = function ()
    {
        sound.play ();
    }

    this.pause = function ()
    {
        sound.pause ();
    }

    this.destroy = function ()
    {
        sound.unload ();
    }

    /********************************************************************************
    // GETTER / SETTER
    /********************************************************************************/

    Object.defineProperty( that, 'loop', {
        get: function() {
            return that.options.loop;
        },
        set: function(value) {
            that.options.loop = value;
            sound.loop = value;
        }
    });


    Object.defineProperty( that, 'currentTime', {
        get: function() {
            return sound?sound.pos():0;
        },
        set: function(value) {
            sound.pos(value);
        }
    });


    Object.defineProperty( that, 'volume', {
        get: function() {
            return sound?sound.volume:1;
        },
        set: function(value) {
            that.options.volume = value;
            sound.volume = value;
        }
    });


    /********************************************************************************
    // PRIVATES
    /********************************************************************************/




    /********************************************************************************
    // HANDLERS
    /********************************************************************************/

    function canPlay (e)
    {
        that.dispatchEvent ( new Event( CanvasVideoEvent.CAN_PLAY, {} ) );
    }

    _constructor( src, options );
}

AudioPlayer.prototype = Object.create ( EventDispatcher.prototype );
AudioPlayer.prototype.constructor = AudioPlayer;
module.exports = AudioPlayer;

},{"../event/CanvasVideoEvent":2,"../event/Event":3,"../event/EventDispatcher":4,"howler":7}],6:[function(require,module,exports){
/**
 * CanvasVideo
 *
 * @class
 * @author Jean-Vincent Roger
 */


'use strict';



var EventDispatcher     = require( '../event/EventDispatcher' ),
    Event               = require( '../event/Event' ),
    Utils               = require( '../core/Utils' ),
    AudioPlayer         = require( './AudioPlayer' ),
    CanvasVideoEvent    = require( '../event/CanvasVideoEvent' );



function CanvasVideo ( src, options )
{
    EventDispatcher.call ( this );

    var that = this;

    var canvas, video, sound;
    var videoReady  = false,
        audioReady  = false,
        readyToPlay = false,
        isPlaying   = false;

    var lastTime, time, elapsed;
    var currentTime = 0,
        needTouchDevice;

    var built = false;
    var seeking = false;

    this.options = {
        fps: 24,
        loop: true,
        hideVideoElement: true,
        xhr: false,
        autoplay: false,
        volume: 1
    };


    function _constructor ( src, options )
    {
        needTouchDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? true : false;

        // copy options
        for (var i in options) {
            that.options[i] = options[i];
        }

        // if audio driving, increase FPS for smouth
        if( that.options.audio ) that.options.fps = 60;

        that.element = document.createElement ('canvas');
        that.ctx     = that.element.getContext('2d');

        if ( that.options.width ) that.element.width = that.options.width;
        if ( that.options.height ) that.element.height = that.options.height;

        if ( that.options.preload == true ) that.load ();
    }


    this.load = function ()
    {
        if ( !built )
        {
            if ( that.options.xhr )
            {
                xhrPreload (src);
            }
            else
            {
                build (src);
            }
        }
    }

    // gerer le cas de n'est pas encore loadé.
    this.play = function ()
    {
        if ( built && readyToPlay )
        {
            isPlaying = true;
            lastTime = Date.now();
            if ( sound ) {
                lastTime = sound.currentTime;
                sound.play ();
            }
            draw();
            calculate ();
            that.dispatchEvent (new Event('play'));
        }
        else {
            that.options.autoplay = true;
            if (!built) this.load ();
        }
    }

    this.pause = function ()
    {
        isPlaying = false;
        that.dispatchEvent (new Event('pause'));
        if ( sound )
        {
            sound.pause ();
        }
    }

    this.destroy = function ()
    {
        if ( sound )
        {
            sound.destroy ();
            sound = null;
        }
        Utils.removeVideoElement (video);
        unbind ();
        video = null;
    }

    this.canPlayType = function ( type )
    {
        var v;
        if (video) v = video;
        else v = document.createElement('video');
        return v.canPlayType ( type );
    }

    /********************************************************************************
    // GETTER / SETTER
    /********************************************************************************/

    Object.defineProperty( that, 'width', {
        get: function() {
            return that.element.width;
        },
        set: function(value) {
            that.options.width = value;
            that.element.width = value;
            video.width = value;
        }
    });

    Object.defineProperty( that, 'height', {
        get: function() {
            return that.element.height;
        },
        set: function(value) {
            that.options.height = value;
            that.element.height = value;
            video.height = value;
        }
    });


    Object.defineProperty( that, 'videoWidth', {
        get: function() {
            return video.videoWidth;
        }
    });

    Object.defineProperty( that, 'videoHeight', {
        get: function() {
            return video.videoHeight;
        }
    });


    Object.defineProperty( that, 'fps', {
        get: function() {
            return that.options.fps;
        },
        set: function(value) {
            if (that.options.audio ) that.options.fps = value;
        }
    });

    Object.defineProperty( that, 'loop', {
        get: function() {
            return that.options.loop;
        },
        set: function(value) {
            that.options.loop = value;
        }
    });

    Object.defineProperty( that, 'volume', {
        get: function() {
            return that.options.volume;
        },
        set: function(value) {
            that.options.volume = value;
            if (sound) sound.volume = value;
        }
    });

    Object.defineProperty( that, 'muted', {
        get: function() {
            if ( !sound || sound.volume != 0 ) return false;
            else return true;
        },
        set: function(value) {
            if (value)
            {
                if (sound) sound.volume = 0;
            }
            else
            {
                if (sound) sound.volume = that.options.volume;
            }
        }
    });

    Object.defineProperty( that, 'needTouchDevice', {
        get: function() {
            return needTouchDevice;
        }
    });


    // A affiner.
    Object.defineProperty( that, 'currentTime', {
        get: function() {
            return currentTime;
        },
        set: function(value) {
            seeking = true;
            if (sound)
            {
                isPlaying = true;
                sound.currentTime = value;
                video.currentTime = value;
                lastTime = sound.currentTime;
            } else
            {
                video.currentTime = value;
            }
        }
    });

    Object.defineProperty( that, 'duration', {
        get: function() {
            if (video) return video.duration;
            else return NaN;
        }
    });

    Object.defineProperty( that, 'seeking', {
        get: function() {
            return seeking;
        }
    });


    Object.defineProperty( that, 'readyState', {
        get: function() {
            return readyToPlay?4:0;
        }
    });


    Object.defineProperty( that, 'controls', {
        get: function() {
            console.warn ('controls attribute is not currently supported by CanvasVideo.');
        },
        set: function(value) {
            console.warn ('controls attribute is not currently supported by CanvasVideo.');
        }
    });


    Object.defineProperty( that, 'autoplay', {
        get: function() {
            return that.options.autoplay;
        },
        set: function(value) {
            that.options.autoplay = true;
        }
    });


    /********************************************************************************
    // PRIVATES
    /********************************************************************************/



    function calculate ()
    {
        if (isPlaying)
        {
            if ( that.options.audio )
            {
                var time = sound.currentTime;
                var elapsed = (time - lastTime);
            }
            else
            {
                var time = Date.now();
                var elapsed = (time - lastTime) / 1000;
            }

            if(elapsed >= ((1000/that.options.fps)/1000)) {
                video.currentTime = video.currentTime + elapsed;
                if ( that.options.audio ) lastTime = video.currentTime;
                else lastTime = time;
            }
            // if we are at the end of the video stop
            currentTime = (Math.round(parseFloat(video.currentTime)*10000)/10000);
            var duration = (Math.round(parseFloat(video.duration)*10000)/10000);
            if(currentTime >= duration) {
                //console.log('currentTime: ' + currentTime + ' duration: ' + video.duration);
                if ( !that.options.audio ) that.dispatchEvent ( new Event ( CanvasVideoEvent.ENDED ));
                if ( that.options.loop )
                {
                    if ( !that.options.audio ) {
                        video.currentTime = 0;
                    }
                }
                else
                {
                    isPlaying = false;
                    that.currentTime = 0;
                    return;
                }

            }
            requestAnimationFrame ( calculate );
        }
    }

    function draw ()
    {
        that.ctx.drawImage( video, 0, 0, video.width, video.height );
        //that.ctx.drawImage( video, 0, 0, that.element.width, that.element.height );

        that.dispatchEvent ( new Event( 'timeupdate' ) );

        if (seeking)
        {
            that.dispatchEvent ( new Event ( CanvasVideoEvent.CAN_PLAY_THROUGH ) );
            that.dispatchEvent ( new Event ( CanvasVideoEvent.CAN_PLAY ) );
            seeking = false;
        }


    }

    function bothReady ()
    {
        readyToPlay = true;

        if ( !that.options.width ) that.element.width = video.videoWidth;
        if ( !that.options.height ) that.element.height = video.videoHeight;

        video.width = that.element.width;
        video.height = that.element.height;

        that.dispatchEvent ( new Event ( CanvasVideoEvent.CAN_PLAY_THROUGH ) );
        that.dispatchEvent ( new Event ( CanvasVideoEvent.CAN_PLAY ) );
        if ( that.options.autoplay ) that.play ();
    }

    function build (src)
    {

        built = true;

        // create video element
        video = createVideoElement ( src );
        bind ();
        if ( !that.options.id ) that.id = video.id ? video.id : Utils.uid();
        else that.id = that.options.id;
        video.id = that.id;
        //document.body.appendChild ( video );
        //if(that.options.hideVideoElement) video.style.display = "none";
        setTimeout ( function(){
            video.load();
        }, 50);

        // gestion de l'audio.
        if (that.options.audio) {
            sound = new AudioPlayer ( getAudioSrc (), { loop:that.options.loop, volume:that.options.volume } );
            sound.addEventListener ( CanvasVideoEvent.CAN_PLAY, audioCanPlay );
            sound.addEventListener ( CanvasVideoEvent.ENDED, audioEnded );
        }
    }



    // traitement url
    function xhrPreload (src)
    {
        var url = src;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        xhr.responseType = "arraybuffer";

        xhr.onload = function(oEvent) {
            var mime = "video/"+Utils.getExtension(url);
            var blob = URL.createObjectURL( new Blob([oEvent.target.response], {type: mime}) );
            build ( {src:blob, mime:mime} );
        };

        xhr.onprogress = function(oEvent) {
            if(oEvent.lengthComputable) {
                var perc = oEvent.loaded/oEvent.total;
                that.dispatchEvent (new Event(CanvasVideoEvent.PROGRESS, {perc:perc}));
                // do something with this
            }
        }

        xhr.send();
    }

    function bind ()
    {
        video.addEventListener ( 'timeupdate', draw );
        video.addEventListener ( 'canplay', videoCanPlay );
        video.addEventListener ( 'canplaythrough', videoCanPlay );
        //video.addEventListener ( 'volumechange', function(e){} );
        //video.addEventListener ( 'loadstart', function(e){} );
    }

    function unbind ()
    {
        video.removeEventListener ( 'timeupdate', draw );
        video.removeEventListener ( 'canplay', videoCanPlay );
        video.removeEventListener ( 'canplaythrough', videoCanPlay );
    }


    function createVideoElement ( src )
    {
        var v;
        if (Array.isArray(src))
        {
            v = document.createElement('video');
            for (var i = 0; i < src.length; ++i)
            {
                if ( typeof src === 'string' )
                {
                    v.appendChild( createSourceElement( src[i] ) );
                }
                else
                {
                    var mime = src[i].mime?src[i].mime:src[i].type;
                    v.appendChild( createSourceElement(src[i].src, mime) );
                }
            }
        }
        else if (typeof src === 'string')
        {
            v = document.createElement('video');
            v.appendChild( createSourceElement( src ) );
        }
        else if (typeof src === 'object')
        {
            v = document.createElement('video');
            var mime = src.mime?src.mime:src.type;
            v.appendChild( createSourceElement( src.src, mime ) );
        }
        else {
            v = src;
        }
        return v;
    }

    // a fixer le setting du type mime (notamment pour les blobs qui n'ont pas d'extension)
    function createSourceElement ( src, mime )
    {
        var s = document.createElement('source');
        s.src = src;
        var ext = Utils.getExtension ( src );
        if (ext||mime) s.type = mime?mime:'video/' + ext;
        return s;
    }



    function getAudioSrc ()
    {
        var src;
        if ( typeof options.audio === "boolean" )
        {
            var sources = video.querySelectorAll('source');
            for (var i = 0; i <= sources.length-1; i++) {
                if ( Utils.getAudioSupport (sources[i].type) || Utils.getAudioSupport ('video/'+Utils.getExtension (sources[i].src)) || !sources[i].type ) {
                    src = sources[i].src;
                    break;
                }
            }
        }
        else if ( typeof options.audio === "string" )
        {
            src = options.audio;
        }
        return src;
    }



    /********************************************************************************
    // HANDLERS
    /********************************************************************************/

    function videoCanPlay (e)
    {
        if ( !videoReady )
        {
            videoReady = true;
            if ( !that.options.audio ) {
                bothReady ();
            }
            else if ( that.options.audio && that.needTouchDevice  )
            {
                audioReady = true;
                bothReady ();
            }
            else if ( audioReady )
            {
                bothReady ();
            }
        }
    }

    function audioCanPlay (e)
    {
        if ( !audioReady )
        {
            audioReady = true;
            if ( videoReady ) bothReady ();
        }
    }


    // TO FIX : NO LOOP END.
    function audioEnded (e)
    {
        that.dispatchEvent ( new Event( CanvasVideoEvent.ENDED ));
        if (that.options.loop)
        {
            isPlaying = true;
            sound.currentTime = 0;
            video.currentTime = 0;
            lastTime = sound.currentTime;
        } else {
            isPlaying = false;
            sound.currentTime = 0;
            video.currentTime = 0;
            lastTime = sound.currentTime;
            sound.pause();
        }
    }



    _constructor( src, options );
}

CanvasVideo.prototype = Object.create ( EventDispatcher.prototype );
CanvasVideo.prototype.constructor = CanvasVideo;
module.exports = CanvasVideo;

},{"../core/Utils":1,"../event/CanvasVideoEvent":2,"../event/Event":3,"../event/EventDispatcher":4,"./AudioPlayer":5}],7:[function(require,module,exports){

},{}]},{},[6])(6)
});