(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var FireBall = SFB.FireBall = function (gnomeId) {
    this.id = gnomeId;
    this.canvas = this.setCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.loadImages();
  }

  SFB.FireBall.prototype.setCanvas = function () {
    var canvas = document.getElementById('flamethrower');
    if (!canvas) {
      canvas = document.createElement( 'canvas' )
      var canvasDiv = document.getElementById('gameArea')
      canvasDiv.appendChild(canvas);
      canvas.id = "flamethrower";
      var ctx	= canvas.getContext( '2d' );
      canvas.width = SFB.Game.DIM_X
      canvas.height = SFB.Game.DIM_Y
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation	= 'lighter';
      ctx.globalAlpha			= 0.5;
    }
    return canvas
  }

  SFB.FireBall.prototype.xpos = function () {
    return window.game.gnomes[this.id - 1].xpos
  }

  SFB.FireBall.prototype.ypos = function () {
    return window.game.gnomes[this.id - 1].ypos
  }

  // SFB.FireBall.prototype.setupFireBall =


  //   CHECK TO SEE IF GNOME MOVED
  //   window.FireBalls[that.id].opts = window.FireBalls[that.id].effect('spawner').opts
    // var oldxpos = that.xpos
    // var oldypos = that.ypos
    // var checkIfMoved = setInterval(function () {
    //   if (that.xpos !== oldxpos || that.ypos !== oldypos) {
    //     window.FireBalls.splice(that.id, 1)
    //     clearInterval(checkIfMoved)
    //   }
    // }, 5)

  // }

  SFB.FireBall.prototype.shootFireBall = function () {
    if (!this.effect._started) {
      this.effect.start()
    }
    this.effect.effect('spawner').opts.start()

  }

  SFB.FireBall.prototype.stopFireBall = function () {
    this.effect.effect('spawner').opts.stop()
  }

  // LOAD FIREBALL IMAGE SEQUENCE
  SFB.FireBall.prototype.loadImages = function () {
    new SFB.FireBall2(this.id)
    var that = this
        var urls	= [
          "https://dl.dropboxusercontent.com/s/zs4zenxdnffbwzx/1flame00.png",
          "https://dl.dropboxusercontent.com/s/7o8lu0ve4bd8a5a/1flame01.png",
          "https://dl.dropboxusercontent.com/s/kmmeo6r9a29dzkk/1flame02.png",
          "https://dl.dropboxusercontent.com/s/aypjuxnad3bglg9/1flame03.png",
          "https://dl.dropboxusercontent.com/s/xc0dyxub1wq1frw/1flame04.png",
          "https://dl.dropboxusercontent.com/s/ocfv5jaxk6818r5/1flame05.png",
          "https://dl.dropboxusercontent.com/s/invph0lvggbccmk/1flame06.png",
          "https://dl.dropboxusercontent.com/s/y60l0tncuaa8lfy/1flame07.png",
          "https://dl.dropboxusercontent.com/s/qo71wy3i6f879ov/1flame08.png",
          "https://dl.dropboxusercontent.com/s/c8nl4gs2v4kmgur/1flame09.png",
          "https://dl.dropboxusercontent.com/s/d678mhm5kbgf9a6/1flame10.png",
          "https://dl.dropboxusercontent.com/s/la8mdvo1qumt584/1flame11.png",
          "https://dl.dropboxusercontent.com/s/kmxrk3xlzg2lar7/1flame12.png",
          "https://dl.dropboxusercontent.com/s/244nix3gl092atn/1flame13.png",
          "https://dl.dropboxusercontent.com/s/no0ndmdaf239fyu/1flame14.png",
          "https://dl.dropboxusercontent.com/s/8yqh579n7mwyi1z/1flame15.png",
          "https://dl.dropboxusercontent.com/s/xeb02qyg27iykvo/1flame16.png",
          "https://dl.dropboxusercontent.com/s/cd62xzwphqqesvf/1flame17.png",
          "https://dl.dropboxusercontent.com/s/myxindc5ih2jndd/1flame18.png",
          "https://dl.dropboxusercontent.com/s/2ypas873y4gc300/1flame19.png",
          "https://dl.dropboxusercontent.com/s/nmy2m42l9zq0cda/1flame20.png",
          "https://dl.dropboxusercontent.com/s/lu6skp5xmba0t1f/1flame21.png",
          "https://dl.dropboxusercontent.com/s/su4nsfyqzk00vfy/1flame22.png",
          "https://dl.dropboxusercontent.com/s/63abqeaxjufbtmd/1flame23.png",
          "https://dl.dropboxusercontent.com/s/b6g89fkzmeh9fvo/1flame24.png"
        ];


        loadTremulousParticles(urls, function(images){
          if (!window.flames) {
            window.flames = images
          }
          //console.log("images", images)
          that.effect	= Fireworks.createEmitter({nParticles : 250})
            // .bindTriggerDomEvents()
            .effectsStackBuilder()
              .spawnerSteadyRate(60)
              .position(Fireworks.createShapeSphere(
                that.xpos() -25,
                that.ypos() + 25,
                0,
                50))
              .velocity(Fireworks.createShapeSphere(500, 0, 0, 150))
              .acceleration({
                effectId	: 'gravity',
                shape		: Fireworks.createShapePoint(0, -180, 0)
              })
              .lifeTime(.66)
              .randomVelocityDrift(Fireworks.createVector(0, 500, 0))
              .createEffect("renderer")
                .onRender(function(particle){
                  var canvasScale = SFB.GameView.prototype.scale;
                  scale = typeof scale !== 'undefined' ? scale : 1;
                  var ctx = that.ctx

                  var position	= particle.get('position').vector;
                  var canonAge	= particle.get('lifeTime').normalizedAge();
                  var imageIdx	= Math.floor(canonAge * (images.length-4));
                  var image	= images[imageIdx+4];

                  var width	= image.width * 1.3;
                  var height	= image.height * 1.3;
                  var positionX	= position.x //- width /2 - 450;
                  var positionY	= position.y //- height/2;
                  // positionX	+= canvas.width /2;
                  // positionY	+= canvas.height/2;
                  // ctx.save();
                  // ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

                  ctx.drawImage(image, positionX, positionY, width, height);
                  // ctx.restore();
                }).back()
              .back()

              // window.flamethrowerEffect.opts = window.flamethrowerEffect.effect('spawner').opts
        });


        //////////////////////////////////////////////////////////////////////////
        //		misc helpers						//
        //////////////////////////////////////////////////////////////////////////
        /**
         * load all the images, generate an alpha based on luminance.
         * It would be much better implemented with tQuery.textureutils.js
        */
        function loadTremulousParticles(urls, callback){
          // if (!window.flames) {
            var images	= new Array(urls.length);

          // load all the images and convert them
          var flow	= Flow();
          urls.forEach(function(url, idx){
            flow.par(function(next){
              var image	= new Image;
              image.onload	= function(){
                convertTremulousImage(image, function(resultImage, originalImage){
                  //console.log("image converted", resultImage);
                  images[idx]	= resultImage;
                  next();
                });
              };
              image.crossOrigin = "Anonymous"
              image.src	= url;
            });
          });

          // build the function which is run once all is loaded
          flow.seq(function(){
            //console.log("all flow completed")
            // notify the caller
            callback(images, urls);
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
            var newImage	= new Image;
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
            // }
          };}
        }
      };

      SFB.FireBall.prototype.newCopy = function () {
        return jQuery.extend(true, {}, this)
      }

})();

(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var FireBall2 = SFB.FireBall2 = function (gnomeId) {
    this.id = gnomeId;
    this.canvas = this.setCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.loadImages();
  }

  SFB.FireBall2.prototype.setCanvas = function () {
    var canvas = document.getElementById('flamethrower');
    if (!canvas) {
      canvas = document.createElement( 'canvas' )
      var canvasDiv = document.getElementById('gameArea')
      canvasDiv.appendChild(canvas);
      canvas.id = "flamethrower";
      var ctx	= canvas.getContext( '2d' );
      canvas.width = SFB.Game.DIM_X
      canvas.height = SFB.Game.DIM_Y
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation	= 'lighter';
      ctx.globalAlpha			= 0.5;
    }
    return canvas
  }

  SFB.FireBall2.prototype.xpos = function () {
    return window.game.gnomes[this.id - 1].xpos
  }

  SFB.FireBall2.prototype.ypos = function () {
    return window.game.gnomes[this.id - 1].ypos
  }

  // SFB.FireBall.prototype.setupFireBall =


  //   CHECK TO SEE IF GNOME MOVED
  //   window.FireBalls[that.id].opts = window.FireBalls[that.id].effect('spawner').opts
    // var oldxpos = that.xpos
    // var oldypos = that.ypos
    // var checkIfMoved = setInterval(function () {
    //   if (that.xpos !== oldxpos || that.ypos !== oldypos) {
    //     window.FireBalls.splice(that.id, 1)
    //     clearInterval(checkIfMoved)
    //   }
    // }, 5)

  // }

  SFB.FireBall2.prototype.shootFireBall = function () {
    if (!this.effect._started) {
      this.effect.start()
    }
    this.effect.effect('spawner').opts.start()

  }

  SFB.FireBall2.prototype.stopFireBall = function () {
    this.effect.effect('spawner').opts.stop()
  }

  // LOAD FIREBALL IMAGE SEQUENCE
  SFB.FireBall2.prototype.loadImages = function () {
    var that = this
    var urls	= [
      "https://dl.dropboxusercontent.com/s/zs4zenxdnffbwzx/1flame00.png",
      "https://dl.dropboxusercontent.com/s/7o8lu0ve4bd8a5a/1flame01.png",
      "https://dl.dropboxusercontent.com/s/kmmeo6r9a29dzkk/1flame02.png",
      "https://dl.dropboxusercontent.com/s/aypjuxnad3bglg9/1flame03.png",
      "https://dl.dropboxusercontent.com/s/xc0dyxub1wq1frw/1flame04.png",
      "https://dl.dropboxusercontent.com/s/ocfv5jaxk6818r5/1flame05.png",
      "https://dl.dropboxusercontent.com/s/invph0lvggbccmk/1flame06.png",
      "https://dl.dropboxusercontent.com/s/y60l0tncuaa8lfy/1flame07.png",
      "https://dl.dropboxusercontent.com/s/qo71wy3i6f879ov/1flame08.png",
      "https://dl.dropboxusercontent.com/s/c8nl4gs2v4kmgur/1flame09.png",
      "https://dl.dropboxusercontent.com/s/d678mhm5kbgf9a6/1flame10.png",
      "https://dl.dropboxusercontent.com/s/la8mdvo1qumt584/1flame11.png",
      "https://dl.dropboxusercontent.com/s/kmxrk3xlzg2lar7/1flame12.png",
      "https://dl.dropboxusercontent.com/s/244nix3gl092atn/1flame13.png",
      "https://dl.dropboxusercontent.com/s/no0ndmdaf239fyu/1flame14.png",
      "https://dl.dropboxusercontent.com/s/8yqh579n7mwyi1z/1flame15.png",
      "https://dl.dropboxusercontent.com/s/xeb02qyg27iykvo/1flame16.png",
      "https://dl.dropboxusercontent.com/s/cd62xzwphqqesvf/1flame17.png",
      "https://dl.dropboxusercontent.com/s/myxindc5ih2jndd/1flame18.png",
      "https://dl.dropboxusercontent.com/s/2ypas873y4gc300/1flame19.png",
      "https://dl.dropboxusercontent.com/s/nmy2m42l9zq0cda/1flame20.png",
      "https://dl.dropboxusercontent.com/s/lu6skp5xmba0t1f/1flame21.png",
      "https://dl.dropboxusercontent.com/s/su4nsfyqzk00vfy/1flame22.png",
      "https://dl.dropboxusercontent.com/s/63abqeaxjufbtmd/1flame23.png",
      "https://dl.dropboxusercontent.com/s/b6g89fkzmeh9fvo/1flame24.png"
    ];

        loadTremulousParticles(urls, function(images){
          if (!window.flames) {
            window.flames = images
          }
          //console.log("images", images)
          var effect	= Fireworks.createEmitter({nParticles : 250})
            // .bindTriggerDomEvents()
            .effectsStackBuilder()
              .spawnerSteadyRate(60)
              .position(Fireworks.createShapeSphere(
                that.xpos(),
                that.ypos(),
                0,
                10))
              .velocity(Fireworks.createShapeSphere(-500, 0, 0, 150))
              .acceleration({
                effectId	: 'gravity',
                shape		: Fireworks.createShapePoint(0, -180, 0)
              })
              .lifeTime(.66)
              .randomVelocityDrift(Fireworks.createVector(0, 500, 0))
              .createEffect("renderer")
                .onRender(function(particle){
                  var canvasScale = SFB.GameView.prototype.scale;
                  scale = typeof scale !== 'undefined' ? scale : 1;
                  var ctx = that.ctx

                  var position	= particle.get('position').vector;
                  var canonAge	= particle.get('lifeTime').normalizedAge();
                  var imageIdx	= Math.floor(canonAge * (images.length-4));
                  var image	= images[imageIdx+4];

                  var width	= image.width * 1.3;
                  var height	= image.height * 1.3;
                  var positionX	= position.x //- width /2 - 450;
                  var positionY	= position.y //- height/2;
                  // positionX	+= canvas.width /2;
                  // positionY	+= canvas.height/2;
                  // ctx.save();
                  // ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

                  ctx.drawImage(image, positionX, positionY, width, height);
                  // ctx.restore();
                }).back()
              .back()
              that.effect = effect;
              // window.flamethrowerEffect.opts = window.flamethrowerEffect.effect('spawner').opts
        });


        //////////////////////////////////////////////////////////////////////////
        //		misc helpers						//
        //////////////////////////////////////////////////////////////////////////
        /**
         * load all the images, generate an alpha based on luminance.
         * It would be much better implemented with tQuery.textureutils.js
        */
        function loadTremulousParticles(urls, callback){
          // if (!window.flames) {
            var images	= new Array(urls.length);

          // load all the images and convert them
          var flow	= Flow();
          urls.forEach(function(url, idx){
            flow.par(function(next){
              var image	= new Image;
              image.onload	= function(){
                convertTremulousImage(image, function(resultImage, originalImage){
                  //console.log("image converted", resultImage);
                  images[idx]	= resultImage;
                  next();
                });
              };
              image.crossOrigin = "Anonymous"
              image.src	= url;
            });
          });

          // build the function which is run once all is loaded
          flow.seq(function(){
            //console.log("all flow completed")
            // notify the caller
            callback(images, urls);
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
            var newImage	= new Image;
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
            // }
          };}
        }
      };

      SFB.FireBall2.prototype.newCopy = function () {
        return jQuery.extend(true, {}, this)
      }

})();
