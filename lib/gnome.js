(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Gnome = function (options) {

    options.color = options.color === undefined ? "green" : options.color;
    options.radius = 50;
    options.xvel = 0;
    options.yvel = 0;
    this.health = 100;
    this.lives = 3;
    this.id = options.id;
    this.facing = options.facing;
    this.jumpPower = -20;
    this.gravity = 0.5;
    this.FRICTION = .92;
    this.DRAG = .92;
    this.beanCount = 0;
    this.fartPacking = false;
    this.fartPackingTimer = 0;
    this.fartPackCounter = 0;
    this.fartPackDrag = .98;



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

  SFB.Utils.inherits(SFB.Gnome, SFB.AnimatedObject);

  SFB.Gnome.prototype.runRight = function () {
    this.facing = "Right";

    if (this.onGround) {
      var newXvel = (this.xvel + 1);
      this.xvel = newXvel > 20 ? 10 : newXvel;
    } else if (this.fartPacking){
      this.xvel = 3;
    } else {
      this.xvel = 10;

    }

  };

  SFB.Gnome.prototype.runLeft = function () {
    this.facing = "Left";

    if (this.onGround) {
      var newXvel = (this.xvel - 1);
      this.xvel = newXvel < -20 ? -10 : newXvel;
    } else if (this.fartPacking){
      this.xvel = -3;
    } else {
      this.xvel = -10;

    }

  };

  SFB.Gnome.prototype.move = function() {
    /* Rewriting the friction conditional so that friction is only applied when the gnome is on a surface and not in the air. This will allow for gliding behavior.*/

    if(this.onGround){
      if(this.xvel !== 0){
        // Without the "if" below this comment, the velocity would never actually
        // hit zero. Even though the on-screen gnome wouldn't be moving, its xvel
        // would be some tiny fraction like 0.00000000001 which would still count
        // as "moving" and trigger a walking animation though the gnome is still
        if (Math.abs(this.xvel) < 0.15 ) {
          this.xvel = 0
        }
        this.xvel *= this.FRICTION;
      }
    }

    /* Add positive gravity at each step while gnome is not on the ground. */
    if (this.fartPacking && !this.onGround) {
        this.yvel += 0.1;
        this.xvel *=this.fartPackDrag
    } else if (!this.onGround){
      this.yvel += 1;
      /* Adding a air resitance component to horizontal velocity while in the air. */
      this.xvel *= this.DRAG;
    }


    this.xpos += this.xvel;
    this.ypos += this.yvel;

    var newPos = this.game.wrap([this.xpos, this.ypos]);

    this.xpos = newPos[0];
    this.ypos = newPos[1];
  };

  SFB.Gnome.prototype.jump = function () {
    /* Do not perform jump unless player is on the ground. */

    if (this.onGround) {
      /* Set negative y velocity */
      this.yvel = this.jumpPower;
    } else if (this.fartPacking) {
      this.yvel = -5;

    }
  };

  SFB.Gnome.prototype.fartPack = function () {
    if (this.beanCount >= 1) {
      this.fartPacking = true;
      this.fartPackingTimer = 30;
      this.beanCount -= 1;
    }
  }

  SFB.Gnome.prototype.fartPackTimer = function () {
    this.fartPackCounter += 1;
    if (this.fartPackCounter >  50) {
      this.fartPackingTimer -= 1;
      if (this.fartPackingTimer < 0) {
        this.fartPacking = false;
      }

      this.fartPackCounter = 0;

    }
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

  // SFB.Gnome.prototype.fireFart = function() {
  //   /* Set xvel according to gnomes horizontal direction. This will ensure farts fly in the direction the gnome is moving/facing */
  //   if (this.isFarting > 0) {
  //     return
  //   }
  //   this.isFarting = 18;
  //   var xvel;
  //   if (this.facing === "Left") {
  //     this.xvel -= 2.5;
  //     xvel = 8;
  //   } else {
  //     xvel = -8;
  //     this.xvel += 2.5;
  //   }
  //   var fart = new SFB.Fart({ xpos: this.xpos, ypos: this.ypos, xvel: xvel, yvel: this.yvel, game: this.game, gnome_id: this.id });
  // };


  SFB.Gnome.prototype.handleHit = function (){  //damage) {
    this.health -= 25;
    if (this.health <= 0) {
      this.respawn();
    }
  };

  SFB.Gnome.prototype.handleBean = function () {
    this.beanCount += 1
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
    this.drawHB(ctx);
    // DRAW GNOME IMAGE/ANIMATION
    if (this.isFarting >= 0) {
      this.isFarting -= 1;
      this.playAnimation("gnomeFart" + this.facing);
      /* Need to update using onGround instead of 669. */
    } else if ((this.yvel !== 0) || (this.yvel === 0 && ((this.ypos !== 669) && (this.ypos !== 499) && (this.ypos !== 299)))) {
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
  }

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
