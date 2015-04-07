(function () {
  if (typeof SFB === "undefined") {
    window.SFB = {};
  }

  var Game = SFB.Game = function () {
    this.gnomes = [];
    this.scene = new SFB.Scene(this);
    this.farts = [];
    this.beans = [];
    this.beanCounter = 0;

    // Instead of hardcoding the setTimeout of the update function in the
    // GameView class, I created a variable "delta". Delta is important to animation
    // so it's better to create a variable in case we change this value
    this.delta = 20;

    this.spritesStillLoading = 0;
    this.sprites = {};
    this.loadSprites();

    //players?
    this.addGnomes(2);
    this.particles;
  };

  Game.DIM_X = 1920;
  Game.DIM_Y = 1080;
  Game.FPS = 32;

  // Game.prototype.addObject = function (object) {
  //   if (object instanceof SFB.Fart) {
  //     this.farts.push(object);
  //   } else {
  //     throw "shitballs what are you doing?!?";
  //   }
  // };

  Game.prototype.addGnomes = function (numPlayers) {
    var gnome1 = new SFB.Gnome({game: this, xpos: 100, ypos: (SFB.Game.DIM_Y - 131), id: 1, color: "purple", facing: "Right", onGround: true  })
    var gnome2 = new SFB.Gnome({game: this, xpos: 1640, ypos: (SFB.Game.DIM_Y - 131), id: 2, color: "orange", facing: "Left", onGround: true  })
    this.gnomes = [].concat(gnome1).concat(gnome2)
  };

  Game.prototype.addBeans = function () {
    this.beanCounter += 1;
    if (this.beanCounter > 200 && this.beans.length < 5) {
      var beanPos = this.randomPosition();
      var bean = new SFB.Bean({ game: this, xpos: beanPos[0], ypos: beanPos[1] });
      this.beans.push(bean);
      this.beanCounter = 0;

    }
  };

  Game.prototype.allObjects = function () {
    return []
			.concat(this.scene)
      .concat(this.scene.scenery)
      .concat(this.gnomes)
      .concat(this.farts)
      .concat(this.beans);
  };

  Game.prototype.movingObjects = function () {
    return []
      .concat(this.gnomes)
      .concat(this.farts);
  };

  Game.prototype.checkCollisions = function () {
    var game = this;
    game.movingObjects().forEach(function (object1) {
      game.movingObjects().forEach(function (object2) {
        if (object1 !== object2) {
					if (object1.hasCollidedWithMovingObject(object2)) {
	          if (object1 instanceof SFB.Fart && object2 instanceof SFB.Gnome) {
	            object1.collideWith(object2);
	          }
	        }
				}
      });
    });
  };

  Game.prototype.checkStaticCollisions = function(){
    var that = this;
    this.gnomes.forEach(function (object1) {
      object1.onGround = false;

      that.scene.scenery.forEach(function (object2) {
          if (SFB.Utils.checkStaticCollide(object1, object2)) {
            object1.onGround = true;
          }

      });
    });
  };

  Game.prototype.checkPowerCollisions = function () {
    var that = this;
    this.gnomes.forEach(function (object1) {
      that.beans.forEach(function (object2) {
        if (object1.hasCollidedWithMovingObject(object2)) {
          if (object2.collideWith) {
            object2.collideWith(object1);
          }
        }
      });
    });
  }

  Game.prototype.draw = function (ctx) {
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;
    ctx.save();

    ctx.scale(scale * canvasScale.x, scale * canvasScale.y)
    ctx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);
    ctx.fillText("Collect 1 bean for fart pack.", 400, 50);

    ctx.fillText("Player1 Beans: " + this.gnomes[0].beanCount, 15, 50);
    ctx.fillText("Player2 Beans: " + this.gnomes[1].beanCount, 830, 50);
    if (this.gnomes[0].beanCount >= 1) {
      ctx.fillText("Press 'f' for fart pack.", 15, 100);
    }

    if (this.gnomes[1].beanCount >= 1) {
      ctx.fillText("Press 'down' for fart pack", 800, 100);
    }

    if (this.gnomes[0].fartPacking) {
      ctx.fillText("Fart Pack Time: " + this.gnomes[0].fartPackingTimer, 15, 130);
      ctx.fillText("You can jump while fart packing.", 15, 160);


    } else if (this.gnomes[1].fartPacking) {
      ctx.fillText("Fart Pack Time: " + this.gnomes[1].fartPackingTimer, 830, 130);
      ctx.fillText("You can jump while.", 830, 160);
      ctx.fillText("fart packing.", 850, 190);
    }

    ctx.restore()
    var objectDrawOrder = [];
    // var objectsWithoutLayerAttr = [];
    var objectsWithLayerAttr = [[],[],[]];

    this.allObjects().forEach(function (object) {

      if (object.layer === undefined) {
        object.draw(ctx);
      } else {
        objectsWithLayerAttr[object.layer].push(object)
      }
    });

    objectsWithLayerAttr.forEach(function (layer) {
      layer.forEach(function (object) {
        object.draw(ctx);
      });
    });

    var canvas = document.getElementById('fireworks');
    if (canvas && window.emitter) {
      var fireworksCtx= canvas.getContext( '2d' );
      fireworksCtx.save()
      fireworksCtx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);
      window.emitter.update(window.game.delta/1000).render()
      fireworksCtx.scale(scale * canvasScale.x, scale * canvasScale.y)
      fireworksCtx.restore()
      window.game.fireworksCountdown -= 1
      if (window.game.fireworksCountdown === 0) {
        document.getElementById('gameArea').removeChild(canvas)
      }
    }

  };

  Game.prototype.isOutOfBounds = function (pos) {
    return (pos[0] < 0) || (pos[1] < 0)
      || (pos[0] > Game.DIM_X) || (pos[1] > Game.DIM_Y);
  };

  Game.prototype.moveObjects = function () {
    this.movingObjects().forEach(function (object) {
      object.move();
    });
  };

  Game.prototype.randomPosition = function () {
    return [
      Math.ceil(Game.DIM_X * Math.random()),
      Math.ceil(Game.DIM_Y * Math.random())
    ];
  };

  Game.prototype.remove = function (object) {
    if (object instanceof SFB.Fart) {
      this.farts.splice(this.farts.indexOf(object), 1);
    } else if (object instanceof SFB.Bean) {
      this.beans.splice(this.beans.indexOf(object), 1);
    }
  };

  Game.prototype.isOver = function () {
    this.gnomes.forEach( function(gnome){
      if (gnome.health <= 0 && gnome.lives <= 0){
        return true;
      }
    }, this);
    return false;
  }

  Game.prototype.winner = function () {
    this.gnomes.forEach( function(gnome){
      if (this.isOver() && gnome.health > 0 && gnome.lives > 0){
        return gnome;
      }
    }, this);
    return null;
  }

  Game.prototype.step = function () {
    this.moveObjects();
    this.checkCollisions();

		this.checkStaticCollisions();
    this.checkPowerCollisions();
    this.gnomes.forEach( function (gnome) {
      gnome.fartPackTimer();
    });
    this.addBeans();

    // if( this.isOver() ){
    //   //do something
    // }
    // // this.draw();

  };

  Game.prototype.wrap = function (pos, yvel) {
    return [
      wrap(pos[0], SFB.Game.DIM_X), wrap(pos[1], Game.DIM_Y)
    ]

    function wrap (coord, max) {
      if (coord < 0) {
        return max - (-coord);
      } else if (coord > max) {
        return coord - max;
      } else {
        return coord;
      }
    }
  }


// animation-dependent additions by Rich are below this comment

  //loads & creates queue of images/animations to load (used by index.html)
  Game.prototype.loadSprite = function (imageName) {
    return new SFB.SpriteSheet(imageName);
  };

  Game.prototype.drawImage = function (sprite, ctx, xpos, ypos) {
    var canvasScale = SFB.GameView.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;
    ctx.save();
    ctx.scale(scale * canvasScale.x, scale * canvasScale.y);
    ctx.translate(xpos, ypos);
    ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
    ctx.restore();
  };

  Game.prototype.drawImageTwo = function (sprite, ctx, xpos, ypos, sourceRect) {
        var origin = SFB.Vector2.zero
        var canvasScale = SFB.GameView.prototype.scale;
        scale = typeof scale !== 'undefined' ? scale : 1;
        ctx.save();

        ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

        ctx.translate(xpos, ypos);
        ctx.drawImage(sprite, sourceRect.x, sourceRect.y,
            sourceRect.width, sourceRect.height,
            -origin.x, -origin.y,
            sourceRect.width, sourceRect.height);


        // THIS IS AN IF STATEMENT TO MIRROR THE IMAGE, NOT IMPLEMENTED CURRENTLY (OBVIOUSLY, BECAUSE IT'S COMMENTED OUT)
        // if (mirror) {
        //     ctx.scale(scale * canvasScale.x * -1, scale * canvasScale.y);
        //     ctx.translate(-position.x - sourceRect.width, position.y);
        //     ctx.rotate(rotation);
        //     ctx.drawImageTwo(sprite, sourceRect.x, sourceRect.y,
        //         sourceRect.width, sourceRect.height,
        //         sourceRect.width - origin.x, -origin.y,
        //         sourceRect.width, sourceRect.height);
        // }
        // else {
        //     ctx.scale(scale * canvasScale.x, scale * canvasScale.y);
        //     ctx.translate(position.x, position.y);
        //     ctx.rotate(rotation);
        //     ctx.drawImageTwo(sprite, sourceRect.x, sourceRect.y,
        //         sourceRect.width, sourceRect.height,
        //         -origin.x, -origin.y,
        //         sourceRect.width, sourceRect.height);
        // }



        ctx.restore();
    };

    Game.prototype.loadSprites = function () {
      this.sprites.beans = this.loadSprite('./sprites/beans@16.png')
      this.sprites.cloud = this.loadSprite('./sprites/cloud@11.png')

      this.sprites.greenrunLeft = this.loadSprite('./sprites/greenrunleft@18.png');
      this.sprites.greenrunRight = this.loadSprite('./sprites/greenrunright@18.png');
      this.sprites.greenidleLeft = this.loadSprite('./sprites/greenstandLeft.png');
      this.sprites.greenidleRight = this.loadSprite('./sprites/greenstandRight.png')
      this.sprites.greengnomeFartRight = this.loadSprite('./sprites/greenFartRight@5.png')
      this.sprites.greengnomeFartLeft = this.loadSprite('./sprites/greenFartLeft@5.png')
      this.sprites.greenjumpUpLeft = this.loadSprite('./sprites/greenjumpUpLeft@12.png')
      this.sprites.greenjumpUpRight = this.loadSprite('./sprites/greenjumpUpRight@12.png')
      this.sprites.greenjumpDownLeft = this.loadSprite('./sprites/greenjumpDownLeft@5.png')
      this.sprites.greenjumpDownRight = this.loadSprite('./sprites/greenjumpDownRight@5.png')
      this.sprites.greenfartpackLeft = this.loadSprite('./sprites/greenfartpackLeft.png');
      this.sprites.greenfartpackRight = this.loadSprite('./sprites/greenfartpackRight.png');

      this.sprites.bluerunLeft = this.loadSprite('./sprites/bluerunleft@18.png');
      this.sprites.bluerunRight = this.loadSprite('./sprites/bluerunright@18.png');
      this.sprites.blueidleLeft = this.loadSprite('./sprites/bluestandLeft.png');
      this.sprites.blueidleRight = this.loadSprite('./sprites/bluestandRight.png')
      this.sprites.bluegnomeFartRight = this.loadSprite('./sprites/blueFartRight@6.png')
      this.sprites.bluegnomeFartLeft = this.loadSprite('./sprites/blueFartLeft@6.png')
      this.sprites.bluejumpUpLeft = this.loadSprite('./sprites/bluejumpUpLeft@12.png')
      this.sprites.bluejumpUpRight = this.loadSprite('./sprites/bluejumpUpRight@12.png')
      this.sprites.bluejumpDownLeft = this.loadSprite('./sprites/bluejumpDownLeft@5.png')
      this.sprites.bluejumpDownRight = this.loadSprite('./sprites/bluejumpDownRight@5.png')
      this.sprites.bluefartpackLeft = this.loadSprite('./sprites/bluefartpackLeft.png');
      this.sprites.bluefartpackRight = this.loadSprite('./sprites/bluefartpackRight.png');

      this.sprites.purplerunLeft = this.loadSprite('./sprites/purplerunleft@18.png');
      this.sprites.purplerunRight = this.loadSprite('./sprites/purplerunright@18.png');
      this.sprites.purpleidleLeft = this.loadSprite('./sprites/purplestandLeft.png');
      this.sprites.purpleidleRight = this.loadSprite('./sprites/purplestandRight.png')
      this.sprites.purplegnomeFartRight = this.loadSprite('./sprites/purpleFartRight@5.png')
      this.sprites.purplegnomeFartLeft = this.loadSprite('./sprites/purpleFartLeft@5.png')
      this.sprites.purplejumpUpLeft = this.loadSprite('./sprites/purplejumpUpLeft@12.png')
      this.sprites.purplejumpUpRight = this.loadSprite('./sprites/purplejumpUpRight@12.png')
      this.sprites.purplejumpDownLeft = this.loadSprite('./sprites/purplejumpDownLeft@5.png')
      this.sprites.purplejumpDownRight = this.loadSprite('./sprites/purplejumpDownRight@5.png')
      this.sprites.purplefartpackLeft = this.loadSprite('./sprites/purplefartpackLeft.png');
      this.sprites.purplefartpackRight = this.loadSprite('./sprites/purplefartpackRight.png');

      this.sprites.orangerunLeft = this.loadSprite('./sprites/orangerunleft@18.png');
      this.sprites.orangerunRight = this.loadSprite('./sprites/orangerunright@18.png');
      this.sprites.orangeidleLeft = this.loadSprite('./sprites/orangestandLeft.png');
      this.sprites.orangeidleRight = this.loadSprite('./sprites/orangestandRight.png')
      this.sprites.orangegnomeFartRight = this.loadSprite('./sprites/orangeFartRight@5.png')
      this.sprites.orangegnomeFartLeft = this.loadSprite('./sprites/orangeFartLeft@5.png')
      this.sprites.orangejumpUpLeft = this.loadSprite('./sprites/orangejumpUpLeft@12.png')
      this.sprites.orangejumpUpRight = this.loadSprite('./sprites/orangejumpUpRight@12.png')
      this.sprites.orangejumpDownLeft = this.loadSprite('./sprites/orangejumpDownLeft@5.png')
      this.sprites.orangejumpDownRight = this.loadSprite('./sprites/orangejumpDownRight@5.png')
      this.sprites.orangefartpackLeft = this.loadSprite('./sprites/orangefartpackLeft.png');
      this.sprites.orangefartpackRight = this.loadSprite('./sprites/orangefartpackRight.png');
    };

})();
