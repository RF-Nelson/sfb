(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var AnimatedObject = SFB.AnimatedObject = function (attrs) {
    SFB.MovingObject.call(this, attrs)

    this._animations = {};
    this._current = null;
    this._time = 0;
    this._sheetColumns = 1;
    this._sheetRows = 1;
    this._image = new Image();
    this._image.src = imageName;

    // determine the number of sheet rows and columns
        var pathSplit = imageName.split('/');
        var fileName = pathSplit[pathSplit.length - 1];
        var fileSplit = fileName.split("/")[0].split(".")[0].split("@");
        if (fileSplit.length <= 1)
            return;
        var colRow = fileSplit[fileSplit.length - 1].split("x");
        this._sheetColumns = colRow[0];
        if (colRow.length === 2)
            this._sheetRows = colRow[1];
  };

  SFB.Utils.inherits(SFB.AnimatedObject, SFB.MovingObject)

  AnimatedObject.prototype.loadAnimation = function (animname, id, looping, frametime) {
    this._animations[id] = new SFB.Animation(animname, looping, frametime);
  };

  AnimatedObject.prototype.playAnimation = function (id) {
    if (this._current === this._animations[id])
      return;
    this._sheetIndex = 0;
    this._time = 0;
    this._current = this._animations[id];
    this.sprite = this._current.sprite;
  };

  AnimatedObject.prototype.animationEnded = function () {
    return !this._current.looping && this.sheetIndex >= this.sprite.nrSheetElements - 1;
  };

  AnimatedObject.prototype.update = function (delta) {
    this._time += delta;
    while (this._time > this._current.frameTime) {
      this._time -= this._current.frameTime;
      this._sheetIndex++;
      if (this._sheetIndex > this.sprite.nrSheetElements - 1)
        if (this._current.looping)
          this._sheetIndex = 0;
        else
          this._sheetIndex = this.sprite.nrSheetElements - 1;
        }
    SFB.AnimatedGameObject.update(this, delta);
  };

  AnimatedObject.prototype.draw = function () {
      this.sprite.draw(this.worldPosition, this.origin, this._sheetIndex, this.mirror);
  };

  AnimatedObject.prototype.findFrame = function () {
    var columnIndex = this._sheetIndex % this._sheetColumns;
    var rowIndex = Math.floor(sheetIndex / this._sheetColumns) % this._sheetRows;
    var imagePart = new SFB.Rectangle(columnIndex * this.width, rowIndex * this.height, this.width, this.height);
    return imagePart
  };

  Object.defineProperty(AnimatedObject.prototype, "image",
      {
          get: function () {
              return this._image;
          }
      });

  Object.defineProperty(AnimatedObject.prototype, "width",
      {
          get: function () {
              return this._image.width / this._sheetColumns;
          }
      });

  Object.defineProperty(AnimatedObject.prototype, "height",
      {
          get: function () {
              return this._image.height / this._sheetRows;
          }
      });

  Object.defineProperty(AnimatedObject.prototype, "size",
      {
          get: function () {
              return new SFB.Vector2(this.width, this.height);
          }
      });

  Object.defineProperty(AnimatedObject.prototype, "center",
      {
          get: function () {
              return this.size.divideBy(2);
          }
      });

  Object.defineProperty(AnimatedObject.prototype, "nrSheetElements",
      {
          get: function () {
              return this._sheetRows * this._sheetColumns;
          }
      });

      function Vector2(x, y) {
          this.x = typeof x !== 'undefined' ? x : 0;
          this.y = typeof y !== 'undefined' ? y : 0;
      }

      Object.defineProperty(Vector2, "zero",
          {
              get: function () {
                  return new SFB.Vector2();
              }
          });

      Object.defineProperty(Vector2.prototype, "isZero",
          {
              get: function () {
                  return this.x === 0 && this.y === 0;
              }
          });

      Object.defineProperty(Vector2.prototype, "length",
          {
              get: function () {
                  return Math.sqrt(this.x * this.x + this.y * this.y);
              }
          });

      Vector2.prototype.addTo = function (v) {
          if (v.constructor == Vector2) {
              this.x += v.x;
              this.y += v.y;
          }
          else if (v.constructor == Number) {
              this.x += v;
              this.y += v;
          }
          return this;
      };

      Vector2.prototype.add = function (v) {
          var result = this.copy();
          return result.addTo(v);
      };

      Vector2.prototype.subtractFrom = function (v) {
          if (v.constructor == Vector2) {
              this.x -= v.x;
              this.y -= v.y;
          }
          else if (v.constructor == Number) {
              this.x -= v;
              this.y -= v;
          }
          return this;
      };

      Vector2.prototype.subtract = function (v) {
          var result = this.copy();
          return result.subtractFrom(v);
      };

      Vector2.prototype.divideBy = function (v) {
          if (v.constructor == Vector2) {
              this.x /= v.x;
              this.y /= v.y;
          }
          else if (v.constructor == Number) {
              this.x /= v;
              this.y /= v;
          }
          return this;
      };

      Vector2.prototype.divide = function (v) {
          var result = this.copy();
          return result.divideBy(v);
      };

      Vector2.prototype.multiplyWith = function (v) {
          if (v.constructor == Vector2) {
              this.x *= v.x;
              this.y *= v.y;
          }
          else if (v.constructor == Number) {
              this.x *= v;
              this.y *= v;
          }
          return this;
      };

      Vector2.prototype.multiply = function (v) {
          var result = this.copy();
          return result.multiplyWith(v);
      };

      Vector2.prototype.toString = function () {
          return "(" + this.x + ", " + this.y + ")";
      };

      Vector2.prototype.normalize = function () {
          var length = this.length;
          if (length === 0)
              return;
          this.divideBy(length);
      };

      Vector2.prototype.copy = function () {
          return new SFB.Vector2(this.x, this.y);
      };

      Vector2.prototype.equals = function (obj) {
          return this.x === obj.x && this.y === obj.y;
      };

      SFB.Vector2 = Vector2;

// below this line is for pixel-by-pixel collision detection (not currently implemented)
  // AnimatedObject.prototype.createPixelCollisionMask = function () {
  //     this._collisionMask = [];
  //     var w = this._image.width;
  //     var h = this._image.height;
  //     powerupjs.Canvas2D._pixeldrawingCanvas.width = w;
  //     powerupjs.Canvas2D._pixeldrawingCanvas.height = h;
  //     var ctx = powerupjs.Canvas2D._pixeldrawingCanvas.getContext('2d');
  //
  //     ctx.clearRect(0, 0, w, h);
  //     ctx.save();
  //     ctx.drawImage(this._image, 0, 0, w, h, 0, 0, w, h);
  //     ctx.restore();
  //     var imageData = ctx.getImageData(0, 0, w, h);
  //     for (var x = 3, l = w * h * 4; x < l; x += 4) {
  //         this._collisionMask.push(imageData.data[x]);
  //     }
  // };
  //
  // AnimatedObject.prototype.getAlpha = function (x, y, sheetIndex, mirror) {
  //     if (this._collisionMask === null)
  //         return 255;
  //
  //     var columnIndex = sheetIndex % this._sheetColumns;
  //     var rowIndex = Math.floor(sheetIndex / this._sheetColumns) % this._sheetRows;
  //     var textureX = columnIndex * this.width + x;
  //     if (mirror)
  //         textureX = (columnIndex + 1) * this.width - x - 1;
  //     var textureY = rowIndex * this.height + y;
  //     var arrayIndex = Math.floor(textureY * this._image.width + textureX);
  //     if (arrayIndex < 0 || arrayIndex >= this._collisionMask.length)
  //         return 0;
  //     else
  //         return this._collisionMask[arrayIndex];
  // };


  // return SFB;

})();
