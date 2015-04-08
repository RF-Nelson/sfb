(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.fartThrowerAnimation = function (xpos, ypos) {
    // // build canvas element
    // var canvas	= document.createElement('canvas');
    // canvas.width	= window.innerWidth;
    // canvas.height	= window.innerHeight;
    // document.body.appendChild(canvas);
    // // canvas.style
    // canvas.style.position	= "absolute";
    // canvas.style.left	= 0;
    // canvas.style.top	= 0;
    // // setup ctx
    // var ctx		= canvas.getContext('2d');
    //
    // // clear canvas and center it
    // // ctx.fillStyle	= 'rgba(0,0,0,0)';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    //
    // // ctx.globalAlpha			= 0.5;
    // ctx.globalCompositeOperation	= 'lighter';

    var canvasDiv = document.getElementById('gameArea')
    var canvas = document.getElementById('flamethrower');
    var canvasScale = SFB.GameView.prototype.scale;

    if (!canvas) {
      var canvas = document.createElement( 'canvas' );
      canvasDiv.appendChild(canvas);
      canvas.id = "flamethrower";
      var gameArea = document.getElementById('sfb-game');
    }

    var ctx	= canvas.getContext( '2d' );
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation	= 'lighter';
    ctx.globalAlpha			= 0.5;
    canvas.width = SFB.Game.DIM_X
    canvas.height = SFB.Game.DIM_Y

    var urls	= [
      "./sprites/1flame00.png",
      "./sprites/1flame01.png",
      "./sprites/1flame02.png",
      "./sprites/1flame03.png",
      "./sprites/1flame04.png",
      "./sprites/1flame05.png",
      "./sprites/1flame06.png",
      "./sprites/1flame07.png",
      "./sprites/1flame08.png",
      "./sprites/1flame09.png",
      "./sprites/1flame10.png",
      "./sprites/1flame11.png",
      "./sprites/1flame12.png",
      "./sprites/1flame13.png",
      "./sprites/1flame14.png",
      "./sprites/1flame15.png",
      "./sprites/1flame16.png",
      "./sprites/1flame17.png",
      "./sprites/1flame18.png",
      "./sprites/1flame19.png",
      "./sprites/1flame20.png",
      "./sprites/1flame21.png",
      "./sprites/1flame22.png",
      "./sprites/1flame23.png",
      "./sprites/1flame24.png"
    ];


    loadTremulousParticles(urls, function(images){
      //console.log("images", images)
      console.log("all images loaded")
      window.flamethrowerEffect	= Fireworks.createEmitter({nParticles : 400})
        // .bindTriggerDomEvents()
        .effectsStackBuilder()
          .spawnerSteadyRate(60)
          .position(Fireworks.createShapeSphere(200, 200, 0, 10))
          .velocity(Fireworks.createShapeSphere(200, 200, 0, 150))
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

          window.flamethrowerEffect.opts = window.flamethrowerEffect.effect('spawner').opts

      //
      // setInterval(function(){
      //   // clear the screen
      //   ctx.save();
      //   ctx.globalAlpha			= 1;
      //   ctx.globalCompositeOperation	= 'copy';
      //   ctx.fillStyle = "rgb(0,0,0)";
      //   ctx.fillRect(0, 0, canvas.width, canvas.height);
      //   ctx.restore();
      //   // set the fillStyle of the particles
      //   ctx.fillStyle	= 'rgba(127,0,255, 0.2)';
      //
      //   // update emitter and render it
      //   var deltaTime	= 1/60;
      //   emitter.update(deltaTime).render();
      // }, 1000/60);
    });


    //////////////////////////////////////////////////////////////////////////
    //		misc helpers						//
    //////////////////////////////////////////////////////////////////////////
    /**
     * load all the images, generate an alpha based on luminance.
     * It would be much better implemented with tQuery.textureutils.js
    */
    function loadTremulousParticles(urls, callback){
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
        }
      };
    }
  }();

})();
