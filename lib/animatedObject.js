(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var AnimatedObject = SFB.AnimatedObject = function (attrs) {
    SFB.MovingObject.call(this, attrs)

    this._animations = {};
    this._current = null;
    this._time = 0;
    // this._sheetColumns = 1;
    // this._sheetRows = 1;
    // this._image = new Image();
    // this._image.src = imageName;
    //
    // // determine the number of sheet rows and columns
    //     var pathSplit = imageName.split('/');
    //     var fileName = pathSplit[pathSplit.length - 1];
    //     var fileSplit = fileName.split("/")[0].split(".")[0].split("@");
    //     if (fileSplit.length <= 1)
    //         return;
    //     var colRow = fileSplit[fileSplit.length - 1].split("x");
    //     this._sheetColumns = colRow[0];
    //     if (colRow.length === 2)
    //         this._sheetRows = colRow[1];
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
    SFB.SpriteGameObject.prototype.update.call(this, delta);
  };

  AnimatedObject.prototype.draw = function () {
      this.sprite.draw(this.worldPosition, this.origin, this._sheetIndex, this.mirror);
  };

  AnimatedObject.prototype.findFrame = function () {
    var columnIndex = this._sheetIndex % this._sheetColumns;
    // original line 68: var rowIndex = Math.floor(sheetIndex / this._sheetColumns) % this._sheetRows;
    var rowIndex = Math.floor(this._sheetIndex / this._sheetColumns) % this._sheetRows;
    var imagePart = new SFB.Rectangle(columnIndex * this.width, rowIndex * this.height, this.width, this.height);
    return imagePart
  };



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



})();
