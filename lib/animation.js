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
          .bindTriggerDomEvents()
          .effectsStackBuilder()
            .spawnerOneShot(8)
            .position(Fireworks.createShapeSphere(newXpos, newYpos, 50, 1))
            .velocity(Fireworks.createShapeSphere(0, 0, 50, 30))
            .lifeTime(0.7, 1)
            .renderToCanvas({
               ctx	: ctx,
              type	: 'drawImage',
               image	: images,
               scale : 0.66
            })
            .back()
          .start()

        window.game.fireworksCountdown = 100;

        // setInterval(function(){
        //   // clear the screen
        //   ctx.save();
        //   // ctx.fillStyle	= 'rgba(0,0,0,1)';
        //   ctx.clearRect(0, 0, canvas.width, canvas.height);
        //   ctx.restore();
        //
        //   // update emitter and render it
        //   var deltaTime	= 1/60;
        //   emitter.update(deltaTime).render();
        // }, window.game.delta/1000);

        // bind 'click' to control the flamethrower velocity
        // document.body.addEventListener('click', function(event){
        //   var mouseX	= event.clientX - window.innerWidth /2;
        //   var mouseY	= event.clientY - window.innerHeight/2;
        //
        //   emitter.spawner().reset();
        //
        //   var effect	= emitter.effect('position');
        //   var center	= effect.opts.shape.center;
        //   center.set(mouseX, mouseY, 0);
        // });
        };
        spritesheet.src	= './sprites/explosion.png';
    };

    SFB.Animation.prototype.flameThrower = function (xpos, ypos) {
      // build canvas element
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
    // clear canvas and center it
    // ctx.fillStyle	= 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha			= 0.5;
    ctx.globalCompositeOperation	= 'lighter';
    var files	= [
      "http://localhost:280/Books%20and%20E-Learning/sfb/sprites/flame/flame00.png",
      "http://localhost:280/Books%20and%20E-Learning/sfb/sprites/flame/flame01.png",
      "http://localhost:280/Books%20and%20E-Learning/sfb/sprites/flame/flame02.png",
      "http://localhost:280/Books%20and%20E-Learning/sfb/sprites/flame/flame03.png",
      "http://localhost:280/Books%20and%20E-Learning/sfb/sprites/flame/flame04.png",
      "http://localhost:280/Books%20and%20E-Learning/sfb/sprites/flame/flame05.png",
      "./sprites/flame/flame06.png",
      "./sprites/flame/flame07.png",
      "./sprites/flame/flame08.png",
      "./sprites/flame/flame09.png",
      "./sprites/flame/flame10.png",
      "./sprites/flame/flame11.png",
      "./sprites/flame/flame12.png",
      "./sprites/flame/flame13.png",
      "./sprites/flame/flame14.png",
      "./sprites/flame/flame15.png",
      "./sprites/flame/flame16.png",
      "./sprites/flame/flame17.png",
      "./sprites/flame/flame18.png",
      "./sprites/flame/flame19.png",
      "./sprites/flame/flame20.png",
      "./sprites/flame/flame21.png",
      "./sprites/flame/flame22.png",
      "./sprites/flame/flame23.png",
      "./sprites/flame/flame24.png"
    ];
    loadTremulousParticles(files, function(images){
      //console.log("images", images)
      console.log("all images loaded")
      window.flameEmitter	= Fireworks.createEmitter({nParticles : 400})
        .bindTriggerDomEvents()
        .effectsStackBuilder()
          .spawnerSteadyRate(60)
          .position(Fireworks.createShapeSphere(0, 0, 0, 10))
          .velocity(Fireworks.createShapeSphere(800, 0, 0, 150))
          .acceleration({
            effectId	: 'gravity',
            shape		: Fireworks.createShapePoint(0, -180, 0)
          })
          .lifeTime(1.5)
          .randomVelocityDrift(Fireworks.createVector(0, 500, 0))
          .createEffect("renderer")
            .onRender(function(particle){
              var position	= particle.get('position').vector;
              var canonAge	= particle.get('lifeTime').normalizedAge();
              var imageIdx	= Math.floor(canonAge * (images.length-4));
              var image	= images[imageIdx+4];
              var width	= image.width	* 2;
              var height	= image.height	* 2;
              var positionX	= position.x - width /2 - 450;
              var positionY	= position.y - height/2;
              positionX	+= canvas.width /2;
              positionY	+= canvas.height/2;
              ctx.drawImage(image, positionX, positionY, width, height);
            }).back()
          .back()
        .start();

    });
    //////////////////////////////////////////////////////////////////////////
    //		misc helpers						//
    //////////////////////////////////////////////////////////////////////////
    /**
     * load all the images, generate an alpha based on luminance.
     * It would be much better implemented with tQuery.textureutils.js
    */
    function loadTremulousParticles(files, callback){
      var images	= new Array(files.length);
      // load all the images and convert them
      var flow	= Flow();
      files.forEach(function(file, idx){
        flow.par(function(next){
          var image	= new Image;
          image.onload	= function(){
            convertTremulousImage(image, function(resultImage, originalImage){
              //console.log("image converted", resultImage);
              images[idx]	= resultImage;
              next();
            });
          };
          image.src	= file;
        });
      });
      // build the function which is run once all is loaded
      flow.seq(function(){
        //console.log("all flow completed")
        // notify the caller
        callback(images, files);
      })
      /**
       * Convert images from tremulous.
       * They are originally in .tga without alpha channel.
       * The alpha channel is created based on the luminance of each pixel.
       * alpha === luminance*16
      */
      function convertTremulousImage(image, callback){
        // create a canvas
        var canvas	= document.createElement('canvas');
        canvas.width	= image.width;
        canvas.height	= image.height;
        var ctx		= canvas.getContext('2d');
        // draw the image in it
        ctx.drawImage(image, 0, 0);

        // create an alpha channel based on color luminance
        var imgData	= ctx.getImageData(0, 0, canvas.width, canvas.height);
        var p		= imgData.data;
        for(var i = 0, y = 0; y < canvas.height; y++){
          for(var x = 0; x < canvas.width; x++, i += 4){
            var luminance	= (0.2126*p[i+0]) + (0.7152*p[i+1]) + (0.0722*p[i+2]);

            luminance	= luminance/255;
            //luminance	= luminance * luminance * luminance* luminance;
            //luminance	= luminance * luminance;
            p[i+3]		= Math.floor(luminance * 16 * 255);
            //p[i+3]	= luminance * 4;
          }
        }
        // put the generated image in the canvas
        ctx.putImageData(imgData, 0, 0);
        // produce a Image object based on canvas.toDataURL
        var newImage	= new Image
        newImage.onload	= function(){
          // notify the caller
          callback(newImage, image);
        };

        newImage.src	= ctx.canvas.toDataURL();
      }
      return;
      // from gowiththeflow.js - https://github.com/jeromeetienne/gowiththeflow.js
      function Flow(){
        var self, stack = [], timerId = setTimeout(function(){ timerId = null; self._next(); }, 0);
        return self = {
          destroy : function(){ timerId && clearTimeout(timerId); },
          par	: function(callback, isSeq){
            if(isSeq || !(stack[stack.length-1] instanceof Array)) stack.push([]);
            stack[stack.length-1].push(callback);
            return self;
          },seq	: function(callback){ return self.par(callback, true);	},
          _next	: function(err, result){
            var errors = [], results = [], callbacks = stack.shift() || [], nbReturn = callbacks.length, isSeq = nbReturn == 1;
            for(var i = 0; i < callbacks.length; i++){
              (function(fct, index){
                fct(function(error, result){
                  errors[index]	= error;
                  results[index]	= result;
                  if(--nbReturn == 0)	self._next(isSeq?errors[0]:errors, isSeq?results[0]:results)
                }, err, result)
              })(callbacks[i], i);
            }
          }
        }
      };
    }
	}


    // SFB.Animation.prototype.fartpackExhaust = function (xpos, ypos) {
    //       var canvasDiv = document.getElementById('gameArea')
    //       var canvas = document.getElementById('fireworks');
    //       var canvasScale = SFB.GameView.prototype.scale;
    //
    //       if (!canvas) {
    //         var canvas = document.createElement( 'canvas' );
    //         canvasDiv.appendChild(canvas);
    //         canvas.id = "fireworks";
    //         var gameArea = document.getElementById('sfb-game');
    //       }
    //
    //       var ctx	= canvas.getContext( '2d' );
    //       canvas.width = SFB.Game.DIM_X
    //       canvas.height = SFB.Game.DIM_Y
    //
    //     window.newXpos, window.newYpos;
    //
    //     if (xpos >= 960) {
    //       newXpos = (xpos % 960)
    //     } else {
    //       newXpos = -(960 - xpos)
    //     }
    //
    //     if (ypos >= 540) {
    //       newYpos = (ypos % 540)
    //     } else {
    //       newYpos = (-ypos)
    //     }
    //
    //     var spritesheet		= new Image();
    //     spritesheet.onload	= function(){
    //     var images	= [];
    //     for(var i = 0; i <= 2; i++){
    //       images.push({
    //          image	: spritesheet,
    //          offsetX	: i*128,
    //          offsetY	: 0*128,
    //          width	: 128,
    //          height	: 128
    //       });
    //     }
    //
    //     if (!window.emitters) {
    //       window.emitters = []
    //     }
    //
    //     window.emitters.push(Fireworks.createEmitter({nParticles : 20})
    //       .effectsStackBuilder()
    //         .spawnerOneShot(8)
    //         .position(Fireworks.createShapeSphere(newXpos, newYpos, 50, 1))
    //         .velocity(Fireworks.createShapeSphere(0, 0, 50, 30))
    //         .lifeTime(0.7, 1)
    //         .renderToCanvas({
    //            ctx	: ctx,
    //           type	: 'drawImage',
    //            image	: images,
    //            scale : 0.66
    //         })
    //         .back()
    //       .start())
    //
    //     };
    //     spritesheet.src	= './sprites/smokeSprites.png';
    // };

})();
