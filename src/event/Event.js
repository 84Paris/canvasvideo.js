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
