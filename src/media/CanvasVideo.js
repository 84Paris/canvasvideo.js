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
        if ( built && readyToPlay && !isPlaying )
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
