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

SFB.Animation.prototype.roundRect = function (ctx, x, y, width, height, fillStyle, radius) {
    if (typeof radius === "undefined") {
      radius = 15;
    }
    ctx.beginPath();
    ctx.fillStyle = fillStyle
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
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
        SFB.Rectangle.prototype.drawRectangle(this.x, this.y, this.width, this.height);
    };

    Rectangle.prototype.drawRectangle = function (x, y, width, height) {
        var canvasScale = SFB.GameView.prototype.scale
        var _canvasContext = document.getElementById('sfb-game').getContext('2d')
        _canvasContext.save();
        _canvasContext.scale(canvasScale.x, canvasScale.y);
        _canvasContext.strokeRect(x, y, width, height);
        _canvasContext.restore();
    };

    SFB.Animation.prototype.explosion = function (xpos, ypos) {
          var canvasDiv = document.getElementById('gameArea')
          var canvas = document.getElementById('fireworks');
          var canvasScale = SFB.GameView.prototype.scale;

          if (!canvas) {
            var canvas = document.createElement( 'canvas' );
            canvasDiv.appendChild(canvas);
            canvas.id = "fireworks";
            var gameArea = document.getElementById('sfb-game');
          }

          var ctx	= canvas.getContext( '2d' );
          canvas.width = SFB.Game.DIM_X
          canvas.height = SFB.Game.DIM_Y

        window.newXpos, window.newYpos;

        if (xpos >= 960) {
          newXpos = (xpos % 960)
        } else {
          newXpos = -(960 - xpos)
        }

        if (ypos >= 540) {
          newYpos = (ypos % 540)
        } else {
          newYpos = (-ypos)
        }

        var spritesheet		= new Image();
        spritesheet.onload	= function(){
        var images	= [];
        for(var i = 0; i <= 17; i++){
          images.push({
             image	: spritesheet,
             offsetX	: i*128,
             offsetY	: 0*128,
             width	: 128,
             height	: 128
          });
        }

        window.emitter = Fireworks.createEmitter({nParticles : 20})
          .effectsStackBuilder()
            .spawnerOneShot(8)
            .position(Fireworks.createShapeSphere(newXpos, newYpos, 50, 1))
            .velocity(Fireworks.createShapeSphere(0, 0, 50, 100))
            .lifeTime(0.5, 0.7)
            .renderToCanvas({
               ctx	: ctx,
              type	: 'drawImage',
               image	: images,
               scale : 0.66
            })
            .back()
          .start()

        window.game.fireworksCountdown = 100;

        };
        spritesheet.src	= './sprites/explosion.png';
    };

    SFB.Animation.prototype.mineExplosion = function (xpos, ypos) {
          var canvasDiv = document.getElementById('gameArea')
          var canvas = document.getElementById('mine');
          var canvasScale = SFB.GameView.prototype.scale;

          if (!canvas) {
            var canvas = document.createElement( 'canvas' );
            canvasDiv.appendChild(canvas);
            canvas.id = "mine";
            var gameArea = document.getElementById('sfb-game');
          }

          var ctx	= canvas.getContext( '2d' );
          canvas.width = SFB.Game.DIM_X
          canvas.height = SFB.Game.DIM_Y

        var newXposm, newYposm;

        if (xpos >= 960) {
          newXposm = (xpos % 960)
        } else {
          newXposm = -(960 - xpos)
        }

        if (ypos >= 540) {
          newYposm = (ypos % 540)
        } else {
          newYposm = (-ypos)
        }

        var spritesheet		= new Image();
        spritesheet.onload	= function(){
        var images	= [];
        for(var i = 0; i <= 17; i++){
          images.push({
             image	: spritesheet,
             offsetX	: i*128,
             offsetY	: 0*128,
             width	: 128,
             height	: 128
          });
        }

        window.emitter2 = Fireworks.createEmitter({nParticles : 30})
          .effectsStackBuilder()
            .spawnerOneShot(8)
            .position(Fireworks.createShapeSphere(newXposm, newYposm, 500, 1))
            .velocity(Fireworks.createShapeSphere(0, 0, 500, 300))
            .lifeTime(0.55, .8)
            .renderToCanvas({
               ctx	: ctx,
              type	: 'drawImage',
               image	: images,
               scale : 1.1
            })
            .back()
          .start()

        window.game.fireworksCountdown = 100;

        };
        spritesheet.src	= './sprites/explosion.png';
    };
})();
