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
            sound.volume(value);
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
