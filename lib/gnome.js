(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Gnome = function (options) {
    this.color = options.color === undefined ? "green" : options.color;
    options.radius = 50;
    options.xvel = 0;
    options.yvel = 0;
    this.height = 191;
    this.width = 104;
    this.lives = 3;
    this.id = options.id;
    this.facing = options.facing;
    this.flaming = false;
    this.flamers = [];

    /* Player Options */
    this.speed = options.speed;
    this.toughness = options.toughness;
    this.specialFart = options.specialFart;
    this.team = options.team;
    this.key = options.key;


    // this.airFacing = false;
    // this.layer = 1;

    /* Physics */
    this.jumpPower = -25;
    this.gravity = 0.5;
    this.FRICTION = .92;
    this.DRAG = .92;

    /* Meters */
    this.beanMeter = 100;
    // this.fartPackMeter = 0;
    this.healthMeter = 100;


    /* Fartpacking */
    this.fartPacking = false;
    this.fartPackingTimer = 0;
    this.fartPackDrag = .98;

    SFB.AnimatedObject.call(this, options);
    this.loadAnimations();
    this.isFireFarting = false;
    this.hasTurned = false;
  };

  SFB.Utils.inherits(SFB.Gnome, SFB.AnimatedObject);

  SFB.Gnome.prototype.runRight = function () {
    if (this.facing === "Left") {
      this.hasTurned = true
    }
    if (this.flaming) {
      this.facing = "Left";
      this.facing = "Right";
    } else {
      this.facing = "Right";
      this.oldFacing = "Left"
    }

    if (this.onGround) {
      var newXvel = (this.xvel + this.speed);
      this.xvel = newXvel > 20 ? 10 : newXvel;
    } else if (this.fartPacking){
      this.xvel = 3;

    } else {
      this.xvel = 10;
    }

    // if (this.isFireFarting) {
    //   if (this.FireBalls.Left.effect._started) {
    //     this.FireBalls.Left.effect.effect('spawner').opts.stop()
    //   }
    //   this.FireBalls.Right.effect.effect('spawner').opts.start()
    // }
  };

  SFB.Gnome.prototype.runLeft = function () {
    if (this.facing === "Right") {
      this.hasTurned = true
    }
    if (this.flaming) {
      this.facing = "Right";
      this.oldFacing = "Left"
    } else {
      this.facing = "Left";
      this.oldFacing = "Right"
    }

    if (this.onGround) {
      var newXvel = (this.xvel - this.speed);
      this.xvel = newXvel < -20 ? -10 : newXvel;
    } else if (this.fartPacking){
      this.xvel = -3;
    } else {
      this.xvel = -10;
    }

    // if (this.isFireFarting) {
    //   if (this.FireBalls.Right.effect._started) {
    //     this.FireBalls.Right.effect.effect('spawner').opts.stop()
    //   }
    //   this.FireBalls.Left.effect.effect('spawner').opts.start()
    // }

  };

  SFB.Gnome.prototype.move = function() {
    /* Friction applied at every step while the gnome is on the ground. */
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

    // // PREVENTS GOING OFF THE TOP OF THE SCREEN
    if (newPos[1] < 50) {
      newPos[1] = 50
    }

    this.xpos = newPos[0];
    this.ypos = newPos[1];

    // KILLS GNOME IF THEY FALL BELOW THE BOTTOM OF THE SCREEN
    if (this.ypos > 1010) {
      this.respawn()
    }

  };

  SFB.Gnome.prototype.jump = function () {
    /* Do not perform jump unless player is on the ground. */
    if (this.onGround) {
      /* Set negative y velocity */
      this.yvel = this.jumpPower;
    }
  };

  SFB.Gnome.prototype.fartPack = function () {
    if (this.beanMeter >= 5 && !this.fartPacking) {
      this.fartPacking = true;
      this.yvel =  -5;
      this.fartPackingTimer = 1000;
      this.beanMeter -= 5;
    }
  }

  SFB.Gnome.prototype.fartPackTimer = function () {
    this.fartPackingTimer -= 20
      if (this.fartPackingTimer < 1 ) {
        this.fartPacking = false;
      }
  };

  SFB.Gnome.prototype.fireFart = function() {
    /* Set xvel according to gnomes horizontal direction. This will ensure farts fly in the direction the gnome is moving/facing */
    if (this.isFarting > 0) {
      return;
    } else if (this.beanMeter < 0.5) {
      return;
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

    this.beanMeter -= 0.5;
    var fart = new SFB.Fart({ gnome: this, xpos: this.xpos, ypos: this.ypos, xvel: xvel, yvel: this.yvel, game: this.game, gnome_id: this.id, team: this.team, strength: 2 });
  };

  SFB.Gnome.prototype.fireSpecialFart = function() {
    /* Set xvel according to gnomes horizontal direction. This will ensure farts fly in the direction the gnome is moving/facing */
    if (this.isFarting > 0) {
      return;
    } else if (this.beanMeter < 1){
      return;
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

    this.beanMeter -= 1;
    if (this.specialFart === "Bounce") {
      var fart = new SFB.FartBounce({ xpos: this.xpos, ypos: this.ypos, xvel: xvel, yvel: this.yvel, game: this.game, gnome_id: this.id, team: this.team, strength: 5 });
    } else if (this.specialFart === "Flame") {
      var fart = new SFB.FartFlame({ game: this.game, gnome_id: this.id, team: this.team, gnome: this, strength: 1, key: this.key, xvel: (this.xvel / this.xvel) });
    } else if (this.specialFart === "Mine") {
      var fart = new SFB.FartMine({ xpos: this.xpos, ypos: this.ypos, xvel: xvel, game: this.game, gnome_id: this.id, team: this.team, gnome: this, strength: 15 });
    }

  };


  SFB.Gnome.prototype.handleHit = function (strength, fart) {
    this.healthMeter -= (strength / this.toughness);

    if (fart instanceof SFB.FartFlame) {
      SFB.Animation.prototype.explosion(this.hitBox().center.x, this.hitBox().center.y);
    }

    if (this.healthMeter <= 0) {
      this.respawn();
    }
  };

  SFB.Gnome.prototype.handleBean = function () {
    this.beanMeter =  this.beanMeter > 99 ? this.beanMeter = 100 : this.beanMeter += 25
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
      this.healthMeter = 100;
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
    var that = this;
    if (this.isFarting >= 0) {
      this.isFarting -= 1;
      this.playAnimation("gnomeFart" + this.facing);
      this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 130)

    } else if (!this.onGround) {
      // initiate jumpUp or jumpDown animation
      if (this.yvel < 0) {
        if (this.fartPacking) {
          this.playAnimation("fartpack" + this.facing)
          this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 130)

          this.processExhaust()

        } else {
          // jump up animation
          this.playAnimation("jumpUp" + this.facing)
          this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 130)
        }
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
          // this.facing = "Right"
          this.playAnimation("run" + this.facing);

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
          // this.facing = "Left"
          this.playAnimation("run" + this.facing);

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


    this.drawHealthMeter(ctx);
    this.drawBeanMeter(ctx);

    if (gameMode === "Team") {
      this.drawTeamNumber(ctx);
    }

    if (this.isFireFarting) {
      if (this.beanCount === 0) {
        this.isFireFarting = false
        this.game.remove(window.flames[this.id])
      } else {
        this.beanCount -= 0.25
      }
    }
  };

  // returns a frame of animation
  SFB.Gnome.prototype.findFrame = SFB.SpriteSheet.prototype.findFrame

  SFB.Gnome.prototype.drawHealthMeter = function(ctx){
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;

    ctx.save();
    ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect( this.xpos - 25, this.ypos - 160, 130, 50 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "lightcoral";
    ctx.fillRect( this.xpos - 20, this.ypos - 155, 120, 40 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.fillRect( this.xpos - 20, this.ypos - 155, 120 * (this.healthMeter / 100), 40 );
    ctx.fill();
    ctx.closePath();


    ctx.font="24px Verdana";
    ctx.fillStyle = "white"
    ctx.fillText("HEALTH", this.xpos - 5, this.ypos - 128);

    // DRAW GNOME HITBOX
    // var gnomeHitBox = this.hitBox()
    // ctx.strokeRect(gnomeHitBox.x, gnomeHitBox.y, gnomeHitBox.width, gnomeHitBox.height)

    ctx.restore();
  }

  SFB.Gnome.prototype.drawBeanMeter = function(ctx){
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;

    ctx.save();
    ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect( this.xpos - 25, this.ypos - 215, 130, 50 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillRect( this.xpos - 20, this.ypos - 210, 120, 40 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "brown";
    ctx.fillRect( this.xpos - 20, this.ypos - 210, 120 * (this.beanMeter / 100), 40 );
    ctx.fill();
    ctx.closePath();


    ctx.font="24px Verdana";
    ctx.fillStyle = "white"
    ctx.fillText("BEANS", this.xpos, this.ypos - 183);

    ctx.restore();
  }

  SFB.Gnome.prototype.drawTeamNumber = function(ctx){
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;

    ctx.save();
    ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

    ctx.font="28px Verdana";
    ctx.fillStyle = "black"
    ctx.fillText("TEAM" + this.team, this.xpos - 5, this.ypos - 238);

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
      this.loadAnimation(this.game.sprites.bluefartpackLeft, "fartpackLeft", false);
      this.loadAnimation(this.game.sprites.bluefartpackRight, "fartpackRight", false);
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
      this.loadAnimation(this.game.sprites.greenfartpackLeft, "fartpackLeft", false);
      this.loadAnimation(this.game.sprites.greenfartpackRight, "fartpackRight", false);
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
      this.loadAnimation(this.game.sprites.purplefartpackLeft, "fartpackLeft", false);
      this.loadAnimation(this.game.sprites.purplefartpackRight, "fartpackRight", false);
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
      this.loadAnimation(this.game.sprites.orangefartpackLeft, "fartpackLeft", false);
      this.loadAnimation(this.game.sprites.orangefartpackRight, "fartpackRight", false);
      // this.loadAnimation(options.game.sprites.runRight, "walkRight", true, 0.065);
      // this.loadAnimation(options.game.sprites.runLeft, "walkLeft", true, 0.065);
    }
    this.walkOrRunModifier = 3;
    this.isFarting = -1;
    this.playAnimation("idle" + this.facing);
  }

  SFB.Gnome.prototype.processExhaust = function () {
    if (this.smokeCounter === undefined || this.smokeCounter === 0) {
      this.smokeCounter = 10;
      this.game.beans.push(new SFB.exhaustAnimation({ xpos: this.xpos, ypos: this.ypos }))
    }
    this.smokeCounter -= 1
  }

  // SFB.Gnome.prototype.fireFartThrower = function (key) {
  //   var id = this.id - 1
  //   // var fireball = new SFB.FireBall(this.id)
  //   var that = this;
  //   if (!this.isFireFarting) {
  //     this.isFireFarting = true
  //     var oldxpos = that.xpos
  //     var oldypos = that.ypos
  //     var checkIfMoved = setInterval(function () {
  //       // CHECK IF GNOME STOPPED FIREFARTING
  //       if (!that.isFireFarting) {
  //         setTimeout(function () {
  //           window.FireBalls.forEach(function (fireball) {
  //             if (fireball.id === that.id) {
  //               window.FireBalls.splice(that.id - 1, 1)
  //               return
  //             }
  //           })
  //         }, 2000)
  //       // CHECK IF GNOME MOVED
  //       } else if (that.xpos !== oldxpos || that.ypos !== oldypos) {
  //         setTimeout(function () {
  //           window.FireBalls.forEach(function (fireball) {
  //             if (fireball.id === that.id) {
  //               window.FireBalls.splice(that.id - 1, 1)
  //               return
  //             }
  //           })
  //         }, 2000)
  //         // FireBalls[that.id - 1].effect.effect('spawner').opts.stop()
  //         // that.fireFartThrower()
  //         clearInterval(checkIfMoved)
  //       // ELSE KEEP FIRING
  //       } else {
  //         // if (!fireball.effect._started) {
  //         //   fireball.effect.effect.start()
  //         // }
  //         // fireball.effect.effect('spawner').opts.start()
  //       }
  //     }, that.game.delta)
  //   }
  // }


})();
