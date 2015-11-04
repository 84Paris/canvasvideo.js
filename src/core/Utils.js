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


