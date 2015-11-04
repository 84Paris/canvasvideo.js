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
            loop: true,
            onend: function(e){
                that.dispatchEvent ( new Event( CanvasVideoEvent.ENDED ));
            }
        }).load();
    }

    this.load = function ()
    {
        sound.load ();
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
        unbind ();
    }

    /********************************************************************************
    // GETTER / SETTER
    /********************************************************************************/

    Object.defineProperty( that, 'loop', {
        get: function() {

        },
        set: function(value) {
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

    /********************************************************************************
    // PRIVATES
    /********************************************************************************/

    function bind () {
        //sound.addEventListener ( 'canplay', function(){} );
        // sound.addEventListener ( 'canplaythrough', canPlay );
        // sound.addEventListener ( 'ended', function(e){
        //     that.dispatchEvent ( new Event( CanvasVideoEvent.ENDED ));
        // })
    }

    function unbind () {

    }


    /********************************************************************************
    // HANDLERS
    /********************************************************************************/

    function canPlay (e)
    {
        console.log('loaded');
        that.dispatchEvent ( new Event( CanvasVideoEvent.CAN_PLAY, {} ) );
    }

    _constructor( src, options );
}

AudioPlayer.prototype = Object.create ( EventDispatcher.prototype );
AudioPlayer.prototype.constructor = AudioPlayer;
module.exports = AudioPlayer;
