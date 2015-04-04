(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Gnome = function (options) {

    this.gravity = 0.5;
    options.color = options.color === undefined ? "green" : options.color;
    options.radius = 50;
    options.xvel = 0;
    options.yvel = 0;
    this.health = 100;
    this.lives = 3;
    this.id = options.id;
    this.facing = options.facing;
    this.airFacing = false;
    this.layer = 1;
    // this.moved = false;

    //
    // if (this.id % 2 !== 0) {
    //   this.facing = "Right"
    // } else {
    //   this.facing = "Left";
    // }

    SFB.AnimatedObject.call(this, options);
    this.loadAnimation(options.game.sprites.idleLeft, "idleLeft", true);
    this.loadAnimation(options.game.sprites.idleRight, "idleRight", true);
    this.loadAnimation(options.game.sprites.runRight, "runRight", true, 0.035);
    this.loadAnimation(options.game.sprites.runLeft, "runLeft", true, 0.035);
    this.loadAnimation(options.game.sprites.gnomeFartRight, "gnomeFartRight", false, 0.025);
    this.loadAnimation(options.game.sprites.gnomeFartLeft, "gnomeFartLeft", false, 0.025);
    this.loadAnimation(options.game.sprites.jumpUpLeft, "jumpUpLeft", false, 0.025);
    this.loadAnimation(options.game.sprites.jumpUpRight, "jumpUpRight", false, 0.025);
    this.loadAnimation(options.game.sprites.jumpDownLeft, "jumpDownLeft", false, 0.06);
    this.loadAnimation(options.game.sprites.jumpDownRight, "jumpDownRight", false, 0.06);
    // this.loadAnimation(options.game.sprites.runRight, "walkRight", true, 0.065);
    // this.loadAnimation(options.game.sprites.runLeft, "walkLeft", true, 0.065);
    this.playAnimation("idle" + this.facing);
    this.walkOrRunModifier = 3;
    this.isFarting = -1;
  };

  SFB.Gnome.FRICTION = .92;

  SFB.Utils.inherits(SFB.Gnome, SFB.AnimatedObject);

  SFB.Gnome.prototype.runRight = function () {
  this.facing = "Right";

  if (this.ypos === (SFB.Game.DIM_Y - 131)) {
    var newXvel = (this.xvel + 1);
    this.xvel = newXvel > 20 ? 10 : newXvel;
  }
  // } else {
  //   if (this.movingDirection === "Left") {
  //     var newXvel = (this.xvel + 5.5);
  //     this.xvel = newXvel > 20 ? 10 : newXvel;
  //     this.movingDirection = "Right";
  //
  //   } else {
  //     var newXvel = (this.xvel + 0.2);
  //     this.xvel = newXvel > 20 ? 10 : newXvel;
  //     this.movingDirection = "Right";
  //
  //     }
  //   }

};

SFB.Gnome.prototype.runLeft = function () {
  this.facing = "Left";

  if (this.ypos === (SFB.Game.DIM_Y - 131)) {
    var newXvel = (this.xvel - 1);
    this.xvel = newXvel < -20 ? -10 : newXvel;
  } else {
      if (this.movingDirection === "Right") {
        var newXvel = (this.xvel - 5.5);
        this.xvel = newXvel < -20 ? -10 : newXvel;
        this.movingDirection = "Left";
      } else {
        var newXvel = (this.xvel - 0.2);
        this.xvel = newXvel < -20 ? -10 : newXvel;
        this.movingDirection = "Left";
      }
  }

};

  SFB.Gnome.prototype.move = function() {
    /* Rewriting the friction conditional so that friction is only applied when the gnome is on a surface and not in the air. This will allow for gliding behavior. This will need to be updated to accomodate static objects. This can be accomplished by changing the conditional to check whether the gnome has collided with any static object.*/

    if(this.ypos === (SFB.Game.DIM_Y - 131) ){
      if(this.xvel !== 0){
        // Without the "if" below this comment, the velocity would never actually
        // hit zero. Even though the on-screen gnome wouldn't be moving, its xvel
        // would be some tiny fraction like 0.00000000001 which would still count
        // as "moving" and trigger a walking animation though the gnome is still
        if (Math.abs(this.xvel) < 0.15 ) {
          this.xvel = 0
        }
        this.xvel *= SFB.Gnome.FRICTION;
      }
    }

    /* Add positive gravity at each step to bring gnome back to bottom of playing screen. Set gravity eauqal to zero if gome is already at the bottom. This will need to be updated to accomodate static objects. This can be accomplished by changing the conditional to check whether the gnome has collided with any static object. */
    if (this.ypos != (SFB.Game.DIM_Y - 131)) {
      this.yvel += this.gravity;
    }

    this.xpos += this.xvel;
    this.ypos += this.yvel;

    var newPos = this.game.wrap([this.xpos, this.ypos]);

    this.xpos = newPos[0];
    this.ypos = newPos[1];
  };

  SFB.Gnome.prototype.jump = function () {
    // this.yvel += -5

    /* Do not perform jump unless player is on the ground. This will also need to be updated to allow for jumps when the gnome is resting on a static object. This can be accomplished by changing the con */

    if (this.ypos == (SFB.Game.DIM_Y - 131)) {
      /* Set negative y velocity */
      this.yvel = -15
    }
  }


  SFB.Gnome.prototype.handleHit = function (){  //damage) {
    this.health -= 25;
    if (this.health <= 0) {
      this.respawn();
    }
  };

  SFB.Gnome.prototype.respawn = function () {
    this.lives -= 1;
    if (this.lives === 0) {
      this.die();
    } else {
      var xCoordinateRandom = ( SFB.Game.DIM_X * Math.random() );
      var yCoordinateRandom = ( SFB.Game.DIM_Y * Math.random() );
      this.xpos = xCoordinateRandom;
      this.ypos = yCoordinateRandom;
      this.xvel = 0;
      this.yvel = 0;
      this.health = 100;
    }
  };

  SFB.Gnome.prototype.die = function () {
    alert("A Gnome has been farted on to death");
  };

  SFB.Gnome.prototype.draw = function(ctx) {
    // DRAW GNOME IMAGE/ANIMATION
    if (this.isFarting >= 0) {
      this.isFarting -= 1;
      this.playAnimation("gnomeFart" + this.facing);
    } else if ((this.yvel !== 0) || (this.yvel === 0 && this.ypos !== (SFB.Game.DIM_Y - 131))) {
      // initiate jumpUp or jumpDown animation
      if (this.yvel < 0) {
        // jump up animation
        this.playAnimation("jumpUp" + this.facing)
      } else {
        // falling down animation
        this.playAnimation("jumpDown" + this.facing)
      }
    } else {
      if (Math.abs(this.xvel) < 0.8) {
        this.playAnimation("idle" + this.facing);
      } else {
        if (this.xvel > 0) {
          this.facing = "Right"
          this.playAnimation("runRight")

          // These if statements would initiate a new animation for when the
          // Gnome is slowing down
          // if (this.xvel < this.walkOrRunModifier) {
          //   var sheet = this._sheetIndex;
          //   this.playAnimation("walkRight")
          //   this._sheetIndex = sheet;
          // } else {
          //   this.playAnimation("runRight")
          // }
        } else {
          this.facing = "Left"
          this.playAnimation("runLeft")

          // if (this.xvel > this.walkOrRunModifier) {
          //   var sheet = this._sheetIndex;
          //   this.playAnimation("walkLeft")
          //   this._sheetIndex = sheet;
          // } else {
          //   this.playAnimation("runLeft")
          // }
        }
      }
    }
    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 130)
    SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);

    // Draw health bar
    this.drawHB(ctx);
  };

  // returns a frame of animation
  SFB.Gnome.prototype.findFrame = SFB.SpriteSheet.prototype.findFrame

  SFB.Gnome.prototype.drawHB = function(ctx){
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;

    ctx.save();
    ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect( this.xpos - 25, this.ypos - 160, 130, 30 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "lightcoral";
    ctx.fillRect( this.xpos - 20, this.ypos - 155, 120, 20 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.fillRect( this.xpos - 20, this.ypos - 155, 120 * (this.health / 100), 20 );
    ctx.fill();
    ctx.closePath();


    ctx.font="18px Verdana";
    ctx.fillStyle = "black"
    ctx.fillText("Health: " + this.health, this.xpos - 15, this.ypos - 138);
    ctx.restore();


  }


  SFB.Gnome.prototype.fireFart = function() {
    /* Set xvel according to gnomes horizontal direction. This will ensure farts fly in the direction the gnome is moving/facing */
    if (this.isFarting > 0) {
      return
    }
    this.isFarting = 18;
    var xvel;
    if (this.facing === "Left") {
      this.xvel -= 2.5;
      xvel = 8;
    } else {
      xvel = -8;
      this.xvel += 2.5;
    }
    var fart = new SFB.Fart({ xpos: this.xpos, ypos: this.ypos, xvel: xvel, yvel: this.yvel, game: this.game, gnome_id: this.id });
  };

  // SFB.Gnome.prototype.isCollidedWith = SFB.MovingObject.prototype.isCollidedWith

  // SFB.Gnome.prototype.isCollidedWith = function(object, game) {
  //   var distance = SFB.Util.distance(this.pos, object.pos);
  //   var radiiDist = this.radius + obj.radius;
  //
  //   if (radiiDist > distance) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // };


})();
