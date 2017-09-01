let exports = {};

import {
  NATIVE,
  bind,
  logger,
  GLOBAL
} from 'jsio_base';

/**
 * @license
 * This file is part of the Game Closure SDK.
 *
 * The Game Closure SDK is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License v. 2.0 as published by Mozilla.

 * The Game Closure SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Mozilla Public License v. 2.0 for more details.

 * You should have received a copy of the Mozilla Public License v. 2.0
 * along with the Game Closure SDK.  If not, see <http://mozilla.org/MPL/2.0/>.
 */
var lastbg;

exports = class {
  constructor (url) {
    this._startedLoad = false;
    this._src = '';
    this.autoplay = false;
    this.preload = 'auto';
    this._volume = 1;
    this.loop = false;
    this._startTime = 0;
    this._et = 0;
    this.readyState = 4;
    if (url) {
      this.src = url;
    }
  }
  _updateElapsed () {
    if (this._startTime > 0) {
      var now = Date.now();
      this._et += now - this._startTime;
      var dur = this.durationMilliseconds;
      if (this.loop && !isNaN(dur) && this._et > dur) {
        this._et %= dur;
      }
      this._startTime = now;
    }
  }
  canPlayType (type) {
    return true;
  }
  load (thenPlay) {
    if (this.isBackgroundMusic) {
      // Background music should not be preloaded like normal sounds
      return;
    }
    var s = NATIVE.sound.preloadSound(this._src);
    if (thenPlay) {
      s.onload = bind(this, '_play');
    }
    this._startedLoad = true;
  }
  _play () {
    NATIVE.sound.playSound(this._src, this._volume, this.loop === 'loop' ||
      this.loop === true);
    this._startTime = Date.now();
  }
  play () {
    this.paused = false;
    if (this.isBackgroundMusic) {
      lastbg = this;
      this._startedLoad = true;
      this._startTime = Date.now();
      NATIVE.sound.playBackgroundMusic(this._src, this._volume, this.loop);
    } else if (!this._startedLoad) {
      this.load(true);
    } else {
      this._play();
    }
  }
  pause () {
    if (this.paused) {
      return;
    }
    this.paused = true;

    if (this._startedLoad) {
      if (!this.isBackgroundMusic || this == lastbg) {
        NATIVE.sound.pauseSound(this._src);
      }
      this._updateElapsed();
      this._startTime = 0;
    }
  }
  stop () {
    if (this._startedLoad) {
      if (!this.isBackgroundMusic || this == lastbg) {
        NATIVE.sound.stopSound(this._src);
      }
    }

    this.reset();
  }
  reset () {
    this._et = 0;
    this._startTime = 0;
  }
  destroy () {
    if (this == lastbg) {
      lastbg = undefined;
    }

    NATIVE.sound.destroySound(this._src);
  }
};
var Audio = exports;

Audio.prototype.__defineSetter__('src', function (url) {
  logger.log('audio source is ', url);
  this._src = url;

  // wait one frame in case preload gets set
  setTimeout(bind(this, function () {
    if ((this.autoplay || this.preload == 'auto') && !this.isBackgroundMusic) {
      this.load();
    }

    if (this.autoplay) {
      this.play();
    }
  }), 0);
});
Audio.prototype;
this.__defineGetter__('src', function () {
  return this._src;
});

Audio.prototype.__defineSetter__('volume', function (volume) {
  this._volume = volume;
  if (!this.isBackgroundMusic || this == lastbg) {
    NATIVE.sound.setVolume(this._src, volume);
  }
});

Audio.prototype.__defineGetter__('currentTime', function () {
  this._updateElapsed();
  return this._et / 1000;
});

Audio.prototype.__defineSetter__('currentTime', function (t) {
  this._et = t * 1000;
  this._startTime = Date.now();
  if (this == lastbg) {
    NATIVE.sound.seekTo(this._src, t);
  }
});

exports.install = function () {
  GLOBAL.Audio = Audio;
};

export default exports;
