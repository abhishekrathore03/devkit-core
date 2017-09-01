let exports = {};

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
import {
  logger,
  NATIVE,
  GLOBAL
} from 'jsio_base';

import PubSub from 'lib/PubSub';
import setProperty from 'util/setProperty';

exports = class extends PubSub {
  constructor (src, width, height, glname) {
    super();

    this._src = src || '';
    this.width = width || undefined;
    this.height = height || undefined;
    this.__gl_name = glname || undefined;
    this.complete = false;
    this._firedLoad = false;
    this._fireReload = false;
  }
  _onload (width, height, gl_name) {
    logger.log('onload called with', width, height, gl_name);
    this.complete = true;
    this.width = this.originalWidth = width;
    this.height = this.originalHeight = height;
    this.__gl_name = gl_name;
    if (!this._firedLoad) {
      this._firedLoad = true;
      this.onload && this.onload();
      this.publish('load', { type: 'load' });
    }

    if (this._fireReload) {
      this.onreload && this.onreload();
      this.publish('reload', { type: 'reload' });
    } else {
      this._fireReload = true;
    }
  }
  _onerror () {
    this.onerror();
    this.publish('error', { type: 'error' });
  }
  reload () {
    this._fireReload = true;
    NATIVE.gl.loadImage(this);
  }
  destroy () {
    if (this._src) {
      NATIVE.gl.deleteTexture(this._src);
    }
  }
  addEventListener (type, callback, useCapture) {
    this.subscribe(type, this, callback);
  }
  removeEventListener (type, callback, useCapture) {
    this.unsubscribe(type, this, callback);
  }
  onload () {}
  onerror () {}
  onreload () {}
};
var Image = exports;

setProperty(Image.prototype, 'src', {
  set: function (value) {
    if (!value) {
      logger.error('empty src set on an image!');
      this._onerror();
      return;
    }

    this._src = value;
    NATIVE.gl.loadImage(this);
  }
});

exports.install = function () {
  GLOBAL.Image = Image;
};

export default exports;
