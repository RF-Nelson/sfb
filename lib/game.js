(function () {
  if (typeof SFB === "undefined") {
    window.SFB = {};
  }

  var Game = SFB.Game = function () {
    this.gnomes = [];
    this.scene = new SFB.Scene(this);
    this.farts = [];
    this.beans = [];
    this.beanCount = 0;

    // Instead of hardcoding the setTimeout of the update function in the
    // GameView class, I created a variable "delta". Delta is important to animation
    // so it's better to create a variable in case we change this value
    this.delta = 20;
    // this._size = new SFB.Vector2(SFB.Game.DIM_X, SFB.Game.DIM_Y)
    this.spritesStillLoading = 0;
    this.sprites = {};
    this.sprites.runLeft = this.loadSprite('./sprites/runleft@18.png');
    this.sprites.runRight = this.loadSprite('./sprites/runright@18.png');
    this.sprites.idleLeft = this.loadSprite('./sprites/standLeft.png');
    this.sprites.idleRight = this.loadSprite('./sprites/standRight.png')
    this.sprites.gnomeFartRight = this.loadSprite('./sprites/gnomeFartRight@6.png')
    this.sprites.gnomeFartLeft = this.loadSprite('./sprites/gnomeFartLeft@6.png')
    this.sprites.cloud = this.loadSprite('./sprites/cloud@11.png')
    this.sprites.jumpUpLeft = this.loadSprite('./sprites/jumpUpLeft@12.png')
    this.sprites.jumpUpRight = this.loadSprite('./sprites/jumpUpRight@12.png')
    this.sprites.jumpDownLeft = this.loadSprite('./sprites/jumpDownLeft@5.png')
    this.sprites.jumpDownRight = this.loadSprite('./sprites/jumpDownRight@5.png')
    this.sprites.beans = this.loadSprite('./sprites/beans.png')

    //players?
    this.addGnomes(2);
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
    var gnome1 = new SFB.Gnome({game: this, xpos: 100, ypos: (SFB.Game.DIM_Y - 131), id: 1, color: "darkgreen", facing: "Right", onGround: true  })
    var gnome2 = new SFB.Gnome({game: this, xpos: 1640, ypos: (SFB.Game.DIM_Y - 131), id: 2, color: "blue", facing: "Left", onGround: true  })
    this.gnomes = [].concat(gnome1).concat(gnome2)
  };

  Game.prototype.addBeans = function () {
    this.beanCount += 1;
    if (this.beanCount > 100) {
      var beanPos = this.randomPosition();
      new SFB.Bean({ game: this, xpos: beanPos[0], ypos: beanPos[1] });
      this.beanCount = 0;
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
					if (object1.isCollidedWith(object2)) {
	          if (object1 instanceof SFB.Fart && object2 instanceof SFB.Gnome) {
	            object1.collideWith(object2);
	          }
	        }
				}
      });
    });
  };
  Game.prototype.checkStaticCollides = function(){
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

  Game.prototype.draw = function (ctx) {
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;
    ctx.save();

    ctx.scale(scale * canvasScale.x, scale * canvasScale.y)
    ctx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);
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
    } else {
      throw "can't remove that";
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
		this.checkStaticCollides();
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

})();
