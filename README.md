# CanvasVideo.js
canvasvideo.js is a lightweight library to play video file in a canvas element with audio support. This is the best way to play inline video with sound on iPhone.

## Presentation ##

We thought canvasvideo.js to help people to create immersive video experiences on mobile devices.
This library draw video element on a canvas and sync it with the audio (from the video file or an audio file fallback).

### Features ###

* plays inline video file (mp4) with audio on iPhone (directly in the browser)
* autoplays video without sound on iOS device (without touch event)
* supports xhr
* similar methods/events to video DOM element
* Manages Audio by the webaudio API (with HTML5 Audio fallback)

### Featured project ###

* [because-recollection.com](http://www.because-recollection.com)

## Getting started ##

### Installation ###

```js
npm install canvasvideo.js --save
```

### Import  ###

You can import canvasvideo.js as a Browserify module.
```js
var CanvasVideo = require('canvasvideo.js');
```
or with a classic script tag.
```js
<script type='text/javascript' src='js/canvasvideo.js'></script>
```

### Basic usage example  ###

```js
var video = new CanvasVideo('./videos/file.mp4', {audio:true, xhr:true});
video.addEventListener('canplaythrough', onLoaded);
video.load();

function onLoaded(e)
{
    document.body.appendChild(video.element);
    if (!video.needTouch) video.play();
    else document.body.addEventListener('touchend', playVideo);
}

function playVideo()
{
    video.play();
}
```

### Autoplay video without sound on iOS  ###

```js
var options = {
    audio: false,
    preload: true,
    autoplay: true
}
var video = new CanvasVideo('./videos/file.mp4', options);
document.body.appendChild(video.element);
```

### Video with mp3 file  ###

```js
var options = {
    audio: './sound/file.mp3',
    loop: true,
    audioBuffer: true
}
var video = new CanvasVideo('./videos/file.mp4', options);
video.addEventListener('canplaythrough', onLoaded);
video.load ();

function onLoaded(e)
{
    document.body.appendChild(video.element);
    if (!video.needTouch) video.play();
    else document.body.addEventListener('touchend', playVideo);
}

function playVideo()
{
    video.play();
}
```

### Use canvasvideo.js as a video fallback on iPhone  ###

```js
<video id='myvideo' loop>
    <source src='./videos/file.mp4' type='video/mp4'>
</video>

<script>
    var video = document.getElementByID('myvideo');
    if (navigator.userAgent.toLowerCase().indexOf('iphone') >= 0)
    {
        document.body.removeChild(video);
        video = new CanvasVideo(video, {xhr:true});
        document.body.appendChild(video.element);
    }
    video.addEventListener('canplaythrough', onLoaded);
    video.load();

    function onLoaded(e)
    {
        console.log(video.loop); // true
        video.play();
    }
</script>
```

## Documentation ##

### Constructor ###
```js
var video = new CanvasVideo(src, options);
```
* **src:** This parameter could be:
    * `String` url of a video file.
    * `Object` object containing informations about the video file.
        * `{src:'file.mp4', type:'video/mp4'}`
    * `Array` Array of strings or objects.
        * `['file.mp4', 'file.ogg']`
        * `[{src:'file.mp4', type:'video/mp4'}, {src:'file.ogg', type:'video/ogg'}]`
    * `<video>` a video element.
* **options:** `Object` Object that could contain:
    * **audio:** This parameter could be:
        * `Boolean` *(default: `false`)* Set to `true` to play audio channel of the video file.
        * `String` url of an audio file.
	* **audioBuffer:** `Boolean` *(default: `false`)* Set to true to force HTML5 Audio (the audio file could be play without to be fully preload).
	* **audioContext:** `AudioContext` *(optional)* the AudioContext to use.
    * **autoplay:** `Boolean` *(default: `false`)* Set to true to start playing when it is loaded.
    * **bufferTime:** `Number` *(default: `2.0`)* The number of seconds assigned to the buffer (only use if you don't use xhr).
	* **canvas:** `<canvas>` *(optional)* the canvas to use as canvasvideo.
    * **fps:** `Number` *(default: `24.0`)* Frame per seconds.
    * **loop:** `Boolean` *(default: `false`)* Set to `true` to automatically start over again when finished.
	* **playbackRate:** `Number` *(default: `1.0`)* Set the default speed of the audio/video playback.
    * **preload:** `Boolean` *(default: `false`)* Set to true to automatically load when canvasvideo is create.
    * **volume:** `Number` *(default: `1.0`)* Set the default volume of the audio.
    * **xhr:** `Boolean` *(default: `false`)* Set to true to fully preload video/audio file(s).
        * Recommanded if `audio:true` to not preload the video file twice (as video element and as audio element).


### Methods ###

* **canPlayType:** Checks if the browser can play the specified audio/video type.
* **destroy:** Destroy properly the CanvasVideo element.
* **load:** Begins preload of video & audio.
* **pause:** Pauses playback of video & audio.
* **play:** Begins playback of video & audio.


### Properties ###

* **bufferLength:** `Number` Get the number of seconds of data currently in the buffer.
* **bufferTime:** `Number` Get/set the number of seconds assigned to the buffer.
* **currentTime:** `Number` Get/set the current time of the canvasvideo.
* **element:** `<canvas>` Returns the canvas element use as canvasvideo.
* **duration:** `Number` Returns the length of the current audio/video (in seconds).
* **fps:** `Number` Get the FPS.
* **height:** `Number` Get/set the canvasvideo height.
* **loop:** `Boolean` Get/set the loop parameter.
* **muted:** `Boolean` Sets or returns whether the video/audio is muted or not.
* **playbackRate:** `Number` Sets or returns the speed of the audio/video playback.
* **readyState:** `Number` Returns the current ready state of the audio/video (only 0 or 4).
* **seeking:** `Boolean` Returns whether the user is currently seeking in the audio/video.
* **videoHeight:** `Number` Get the original video height.
* **videoWidth:** `Number` Get the original video width.
* **volume:** `Number` Get/set the video audio volume.
* **width:** `Number` Get/set the canvasvideo width.
* **xhr:** `Boolean` Get the xhr parameter.


### Events ###

* **canplaythrough/canplay:** Fires when the browser can play through the video/audio without stopping for buffering.
* **ended:** Fires when the current playlist is ended.
* **play:** Fires when the audio/video has been started or is no longer paused.
* **playing:** Fires when the audio/video is playing after having been paused or stopped for buffering.
* **progress:** Fires when the browser is downloading the audio/video.
* **timeupdate:** Fires when the current playback position has changed.
* **waiting:** Fires when the video stops because it needs to buffer the next frame.


### Browser Compatibility ###

Tested in the following browsers/OS:

* Mobile iOS 8.0+


### License ###

This content is released under the (http://opensource.org/licenses/MIT) MIT License.


[![Analytics](https://ga-beacon.appspot.com/UA-64424781-2/canvasvideo.js)](https://github.com/igrigorik/ga-beacon)
