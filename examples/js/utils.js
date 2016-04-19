var Utils = {
    cover: function(width, height) {
        if (width === undefined) width = 1920;
        if (height === undefined) height = 1080;
        var over = width / height;
        var under = height / width;

        var retour;

        if (window.innerWidth / window.innerHeight >= over) {
            retour = {
                width: window.innerWidth,
                height: Math.ceil(window.innerWidth * under)
            }
        } else {
            retour = {
                width: Math.ceil(window.innerHeight * over),
                height: window.innerHeight
            }
        }
        return retour;
    },

    timeCode: function(seconds) {
        var date = new Date(seconds * 1000);
        var hh = date.getUTCHours(),
            mm = date.getUTCMinutes(),
            ss = date.getSeconds(),
            ms = date.getMilliseconds();

        if (hh < 10) hh = "0" + hh;
        if (mm < 10) mm = "0" + mm;
        if (ss < 10) ss = "0" + ss;
        if (ms < 10) ms = "0" + ms;

        var t = hh + ":" + mm + ":" + ss + ":" + String(ms).substring(0, 2);
        return t;
    },

    isMobile: navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i) ? true : false,

    isAndroid: navigator.userAgent.match(/(android)/i) ? true : false,

    displayInfoBar: function() {
        document.getElementById('infobar').style.display = 'block';
        document.getElementById('infobar').addEventListener('touchend', function(e){
            document.getElementById('infobar').style.display = 'none';
        });
    }

}
