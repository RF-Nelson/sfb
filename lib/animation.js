(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var Animation = SFB.Animation = function (sprite, looping, frameTime) {
        this.sprite = sprite;
        this.frameTime = typeof frameTime != 'undefined' ? frameTime : 0.1;
        this.looping = looping;
    }

  var Rectangle = SFB.Rectangle = function (x, y, w, h) {
        this.x = typeof x !== 'undefined' ? x : 0;
        this.y = typeof y !== 'undefined' ? y : 0;
        this.width = typeof w !== 'undefined' ? w : 1;
        this.height = typeof h !== 'undefined' ? h : 1;
    }

    Object.defineProperty(Rectangle.prototype, "left",
        {
            get: function () {
                return this.x;
            }
        });

    Object.defineProperty(Rectangle.prototype, "right",
        {
            get: function () {
                return this.x + this.width;
            }
        });

    Object.defineProperty(Rectangle.prototype, "top",
        {
            get: function () {
                return this.y;
            }
        });

    Object.defineProperty(Rectangle.prototype, "bottom",
        {
            get: function () {
                return this.y + this.height;
            }
        });

    Object.defineProperty(Rectangle.prototype, "center",
        {
            get: function () {
                return this.position.addTo(this.size.divideBy(2));
            }
        });

    Object.defineProperty(Rectangle.prototype, "position",
        {
            get: function () {
                return new SFB.Vector2(this.x, this.y);
            }
        });

    Object.defineProperty(Rectangle.prototype, "size",
        {
            get: function () {
                return new SFB.Vector2(this.width, this.height);
            }
        });

    Rectangle.prototype.contains = function (v) {
        v = typeof v !== 'undefined' ? v : new SFB.Vector2();
        return (v.x >= this.left && v.x <= this.right &&
            v.y >= this.top && v.y <= this.bottom);
    };

    Rectangle.prototype.intersects = function (rect) {
        return (this.left <= rect.right && this.right >= rect.left &&
            this.top <= rect.bottom && this.bottom >= rect.top);
    };

    Rectangle.prototype.calculateIntersectionDepth = function (rect) {
        var minDistance = this.size.addTo(rect.size).divideBy(2);
        var distance = this.center.subtractFrom(rect.center);
        var depth = SFB.Vector2.zero;
        if (distance.x > 0)
            depth.x = minDistance.x - distance.x;
        else
            depth.x = -minDistance.x - distance.x;
        if (distance.y > 0)
            depth.y = minDistance.y - distance.y;
        else
            depth.y = -minDistance.y - distance.y;
        return depth;
    };

    Rectangle.prototype.intersection = function (rect) {
        var xmin = Math.max(this.left, rect.left);
        var xmax = Math.min(this.right, rect.right);
        var ymin = Math.max(this.top, rect.top);
        var ymax = Math.min(this.bottom, rect.bottom);
        return new SFB.Rectangle(xmin, ymin, xmax - xmin, ymax - ymin);
    };

    Rectangle.prototype.draw = function () {
        SFB.Rectangle.drawRectangle(this.x, this.y, this.width, this.height);
    };

    Rectangle.prototype.drawRectangle = function (x, y, width, height) {
        var canvasScale = document.getElementById('sfb-game').scale;
        var _canvasContext = document.getElementById('sfb-game').getContext('2d')
        _canvasContext.save();
        _canvasContext.scale(canvasScale.x, canvasScale.y);
        _canvasContext.strokeRect(x, y, width, height);
        _canvasContext.restore();
    };


})();
