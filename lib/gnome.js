(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Gnome = function (options) {

    this.color = options.color === undefined ? "green" : options.color;
    options.radius = 50;
    options.xvel = 0;
    options.yvel = 0;
    this.health = 100;
    this.lives = 3;
    this.id = options.id;
    this.facing = options.facing;

    this.airFacing = false;
    // this.layer = 1;
    this.height = 191;
    this.width = 104;

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
    this.loadAnimations();
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

    var newPos = this.game.wrap([this.xpos, this.ypos], this.yvel);

    this.xpos = newPos[0];
    this.ypos = newPos[1];

    // // PREVENTS GOING OFF THE TOP OF THE SCREEN
    // if (this.ypos < -20) {
    //   this.ypos = 0
    // }
    //
    // // KILLS GNOME IF THEY FALL BELOW THE BOTTOM OF THE SCREEN
    // if (this.ypos = this.game.DIM_Y - 1) {
    //   this.respawn()
    // }

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


  SFB.Gnome.prototype.handleHit = function (xpos, ypos){  //damage) {
    this.health -= 25;
    SFB.Animation.prototype.explosion(this.game.ctx, xpos, ypos);

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

  SFB.Gnome.prototype.hitBox = function () {
  return new SFB.Rectangle(this.boundingBox.x + 15, this.boundingBox.y - 115,
    this.boundingBox.width - 27, this.boundingBox.height - 20)
  };

  SFB.Gnome.prototype.draw = function(ctx) {
    // DRAW GNOME IMAGE/ANIMATION
    if (this.isFarting >= 0) {
      this.isFarting -= 1;
      this.playAnimation("gnomeFart" + this.facing);
    } else if (!this.onGround) {
      // initiate jumpUp or jumpDown animation
      if (this.yvel < 0) {
        // jump up animation
        this.playAnimation("jumpUp" + this.facing)
        this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 130)

      } else {
        // falling down animation
        this.playAnimation("jumpDown" + this.facing)
        this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 136)

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
      this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 130)

    }
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

    // DRAW GNOME HITBOX
    // var gnomeHitBox = this.hitBox()
    // ctx.strokeRect(gnomeHitBox.x, gnomeHitBox.y, gnomeHitBox.width, gnomeHitBox.height)

    ctx.restore();
  }

  // COLLISION DETECTOR USING RADIUS
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

  SFB.Gnome.prototype.loadAnimations = function () {

    if (this.color === "blue") {
      this.loadAnimation(this.game.sprites.blueidleLeft, "idleLeft", false);
      this.loadAnimation(this.game.sprites.blueidleRight, "idleRight", false);
      this.loadAnimation(this.game.sprites.bluerunRight, "runRight", true, 0.035);
      this.loadAnimation(this.game.sprites.bluerunLeft, "runLeft", true, 0.035);
      this.loadAnimation(this.game.sprites.bluegnomeFartRight, "gnomeFartRight", false, 0.025);
      this.loadAnimation(this.game.sprites.bluegnomeFartLeft, "gnomeFartLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.bluejumpUpLeft, "jumpUpLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.bluejumpUpRight, "jumpUpRight", false, 0.025);
      this.loadAnimation(this.game.sprites.bluejumpDownLeft, "jumpDownLeft", false, 0.06);
      this.loadAnimation(this.game.sprites.bluejumpDownRight, "jumpDownRight", false, 0.06);
      // this.loadAnimation(options.game.sprites.runRight, "walkRight", true, 0.065);
      // this.loadAnimation(options.game.sprites.runLeft, "walkLeft", true, 0.065);
    }

    if (this.color === "green") {
      this.loadAnimation(this.game.sprites.greenidleLeft, "idleLeft", false);
      this.loadAnimation(this.game.sprites.greenidleRight, "idleRight", false);
      this.loadAnimation(this.game.sprites.greenrunRight, "runRight", true, 0.035);
      this.loadAnimation(this.game.sprites.greenrunLeft, "runLeft", true, 0.035);
      this.loadAnimation(this.game.sprites.greengnomeFartRight, "gnomeFartRight", false, 0.025);
      this.loadAnimation(this.game.sprites.greengnomeFartLeft, "gnomeFartLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.greenjumpUpLeft, "jumpUpLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.greenjumpUpRight, "jumpUpRight", false, 0.025);
      this.loadAnimation(this.game.sprites.greenjumpDownLeft, "jumpDownLeft", false, 0.06);
      this.loadAnimation(this.game.sprites.greenjumpDownRight, "jumpDownRight", false, 0.06);
      // this.loadAnimation(options.game.sprites.runRight, "walkRight", true, 0.065);
      // this.loadAnimation(options.game.sprites.runLeft, "walkLeft", true, 0.065);
    }

    if (this.color === "purple") {
      this.loadAnimation(this.game.sprites.purpleidleLeft, "idleLeft", false);
      this.loadAnimation(this.game.sprites.purpleidleRight, "idleRight", false);
      this.loadAnimation(this.game.sprites.purplerunRight, "runRight", true, 0.035);
      this.loadAnimation(this.game.sprites.purplerunLeft, "runLeft", true, 0.035);
      this.loadAnimation(this.game.sprites.purplegnomeFartRight, "gnomeFartRight", false, 0.025);
      this.loadAnimation(this.game.sprites.purplegnomeFartLeft, "gnomeFartLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.purplejumpUpLeft, "jumpUpLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.purplejumpUpRight, "jumpUpRight", false, 0.025);
      this.loadAnimation(this.game.sprites.purplejumpDownLeft, "jumpDownLeft", false, 0.06);
      this.loadAnimation(this.game.sprites.purplejumpDownRight, "jumpDownRight", false, 0.06);
      // this.loadAnimation(options.game.sprites.runRight, "walkRight", true, 0.065);
      // this.loadAnimation(options.game.sprites.runLeft, "walkLeft", true, 0.065);
    }

    if (this.color === "orange") {
      this.loadAnimation(this.game.sprites.orangeidleLeft, "idleLeft", false);
      this.loadAnimation(this.game.sprites.orangeidleRight, "idleRight", false);
      this.loadAnimation(this.game.sprites.orangerunRight, "runRight", true, 0.035);
      this.loadAnimation(this.game.sprites.orangerunLeft, "runLeft", true, 0.035);
      this.loadAnimation(this.game.sprites.orangegnomeFartRight, "gnomeFartRight", false, 0.025);
      this.loadAnimation(this.game.sprites.orangegnomeFartLeft, "gnomeFartLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.orangejumpUpLeft, "jumpUpLeft", false, 0.025);
      this.loadAnimation(this.game.sprites.orangejumpUpRight, "jumpUpRight", false, 0.025);
      this.loadAnimation(this.game.sprites.orangejumpDownLeft, "jumpDownLeft", false, 0.06);
      this.loadAnimation(this.game.sprites.orangejumpDownRight, "jumpDownRight", false, 0.06);
      // this.loadAnimation(options.game.sprites.runRight, "walkRight", true, 0.065);
      // this.loadAnimation(options.game.sprites.runLeft, "walkLeft", true, 0.065);
    }
    this.walkOrRunModifier = 3;
    this.isFarting = -1;
    this.playAnimation("idle" + this.facing);
  }


})();
