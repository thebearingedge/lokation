
'use strict';

var window = require('global/window');


module.exports = LocationEmitter;


function LocationEmitter(options) {

  options || (options = {});

  var history = window.history;

  this.html5 = history && history.pushState && (options.html5 !== false)
    ? true
    : false;

  this._subscribers = [];

}


LocationEmitter.prototype.listen = function listen() {

  var eventType, listener;

  if (this.html5) {
    eventType = 'popstate';
    listener = this._onPopState;
  }
  else {
    eventType = 'hashchange';
    listener = this._onHashChange;
  }

  window.addEventListener(eventType, listener.bind(this));

  return this;
};


LocationEmitter.prototype.url = function url(fullPath) {

  if (fullPath === undefined) {
    return this.html5
      ? this._getFullPath()
      : this.hash();
  }
  else if (this.html5){
    return this._setFullPath(fullPath);
  }

  return this.hash(fullPath);
};


LocationEmitter.prototype.hash = function hash(urlHash) {

  var location = window.location;

  if (urlHash === undefined) {
    return location.hash
      ? location.hash.substr(1)
      : '';
  }

  location.hash = urlHash;

  return this;
};


LocationEmitter.prototype.replace = function replace(fullPath) {

  fullPath || (fullPath = this._getFullPath());

  if (this.html5) {

    window.history.replaceState({}, null, fullPath);

    return this._onPopState();
  }

  var location = window.location;
  var href = location.href;
  var hashIndex = href.indexOf('#');
  var hashMark = location.pathname === '/'
    ? (location.href.indexOf('/') === -1 || '/#')
    : '#';

  if (hashIndex > -1) {
    href = href.slice(0, hashIndex) + hashMark + fullPath;
  }
  else {
    href = href + hashMark + fullPath;
  }

  location.replace(href);

  return this._onHashChange({ newURL : href });
};


LocationEmitter.prototype.onChange = function onChange(subscriber) {

  this._subscribers.push(subscriber);

  return function unsubscribe() {

    var remaining = [];
    var l = this._subscribers.length;

    while (l--) {
      if (this._subscribers[l] !== subscriber) {
        remaining.push(this._subscribers[l]);
      }
    }

    this._subscribers = remaining;
  }.bind(this);
};


LocationEmitter.prototype._getFullPath = function _getFullPath() {

  var location = window.location;

  return location.pathname + location.search + location.hash;
};


LocationEmitter.prototype._setFullPath = function _setFullPath(fullPath) {

  window.history.pushState({}, null, fullPath);

  return this._onPopState();
};


LocationEmitter.prototype._onHashChange = function _onHashChange() {

  this._emit(this.hash());

  return this;
};


LocationEmitter.prototype._onPopState = function _onPopState() {

  this._emit(this._getFullPath());

  return this;
};


LocationEmitter.prototype._emit = function _emit(path) {

  var l = this._subscribers.length;

  while (l--) {
    this._subscribers[l](path);
  }
};
