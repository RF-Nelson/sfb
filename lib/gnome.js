(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Gnome = function (attrs) {
    SFB.AnimatedObject.call(this, attrs);

    this.gravity = 0.5;
    attrs.color = attrs.color === undefined ? "green" : attrs.color;
    attrs.radius = 50;
    attrs.xvel = 0;
    attrs.yvel = 0;
    this.health = 100;
    this.lives = 3;
    this.facing = "left";
    this.id = attrs.id;
    this.moved = false;

    this.loadAnimation(attrs.game.sprites.idleSprite, "idle", true);
    this.loadAnimation(attrs.game.sprites.runSprite, "run", true, 0.025);
    this.playAnimation("idle");

  };

  SFB.Gnome.FRICTION = .92;

  SFB.Utils.inherits(SFB.Gnome, SFB.AnimatedObject);

  SFB.Gnome.prototype.move = function() {
    /* Rewriting the friction conditional so that friction is only applied when the gnome is on a surface and not in the air. This will allow for gliding behavior. This will need to be updated to accomodate static objects. This can be accomplished by changing the conditional to check whether the gnome has collided with any static object.*/

    if(this.moved && this.ypos === 669 ){
      if(this.xvel !== 0){
        this.xvel *= SFB.Gnome.FRICTION;
      }

    // if(this.moved){
    //  if(this.xvel !== 0){
    //    this.xvel *= SFB.Gnome.FRICTION;
    //  }

      // if( this.yvel === 0 && this.ypos < SFB.Game.DIM_X - 80 ){
      //  this.yvel = 0;
      //  this.gravity = 0;
      // } else {
      //  this.gravity = .1
      // }

      this.moved = false;
    }

    // this.yvel += SFB.Gnome.GRAVITY;


    /* Add positive gravity at each step to bring gnome back to bottom of playing screen. Set gravity eauqal to zero if gome is already at the bottom. This will need to be updated to accomodate static objects. This can be accomplished by changing the conditional to check whether the gnome has collided with any static object. */

    if (this.ypos != 669) {
      this.yvel += this.gravity;
    }

    this.xpos += this.xvel;
    this.ypos += this.yvel;

    var newPos = this.game.wrap([this.xpos, this.ypos]);

    this.xpos = newPos[0];
    this.ypos = newPos[1];

    this.moved = true;

    // this.vel = SFB.Util.makeVec(this.speed);
    // var oldPos = this.pos;
    // var newPos = this.pos;
    // newPos[0] = this.pos[0] + this.vel[0];
    // newPos[1] = this.pos[1] + this.vel[1];
    // this.pos = this.game.wrap(newPos);
    //
    // //THIS REDUCTION OF SPEED SIMULATES FRICTION
    // this.speed *= .98;
    //
    // //COMPENSATE FOR GRAVITY?

  };

  SFB.Gnome.prototype.run = function (direction) {
    // var newXvel = (this.xvel + direction);
    // this.xvel = newXvel > 20 ? 10 : newXvel;


    /* Rewriting the horizontal velocity increase so that an increase can ony occur when the gnome is on a surface and not in the air. This will prevent an increase in horizontal velocity while the gnome is in the air. This will need to be updated to accomodate static objects. This can be accomplished by changing the conditional to check whether the gnome has collided with any static object.*/

    var newXvel = (this.xvel + direction);
    // if (this.ypos === 669) {
      this.xvel = newXvel > 20 ? 10 : newXvel;
    // } else {
    //   this.xvel = newXvel > 1 ? 1 : newXvel;
    //
    // }

    /* Rewriting direction/facing assignment due to backwards logic */
    if (direction === -3) {
      this.facing = "right";
    } else if (direction === 3) {
      this.facing = "left";
    }

    // if (direction === 1) {
    //   this.facing = "right";
    // } else if (direction === -1) {
    //   this.facing = "left";
    // }

  };

  SFB.Gnome.prototype.jump = function () {
    // this.yvel += -5

    /* Do not perform jump unless player is on the ground. This will also need to be updated to allow for jumps when the gnome is resting on a static object. This can be accomplished by changing the con */

    if (this.ypos == 669) {
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
    // DRAW CIRCLE
    // ctx.beginPath();
    // ctx.arc( this.xpos, this.ypos, this.radius, 0, 2 * Math.PI, false );
    // ctx.fillStyle = this.color;
    // ctx.fill();
    // ctx.closePath();

    // DRAW GNOME IMAGE/ANIMATION

    window.game.drawImage(this.sprite, ctx, this.xpos, this.ypos - 130)
    SFB.AnimatedGameObject.prototype.update.call(this, delta);
    // window.game.drawImage(this.findFrame(), ctx, this.xpos, this.ypos - 130)

    // Draw health bar
    this.drawHB(ctx);
  };

  SFB.Gnome.prototype.drawHB = function(ctx){
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect( this.xpos - 25, this.ypos - 140, 130, 30 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "lightcoral";
    ctx.fillRect( this.xpos - 20, this.ypos - 135, 120, 20 );
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.fillRect( this.xpos - 20, this.ypos - 135, 120 * (this.health / 100), 20 );
    ctx.fill();
    ctx.closePath();


    ctx.font="18px Verdana";
    ctx.fillStyle = "black"
    ctx.fillText("Health: " + this.health, this.xpos - 15, this.ypos - 118);
  }


  SFB.Gnome.prototype.fireFart = function() {
    /* Set xvel according to gnomes horizontal direction. This will ensure farts fly in the direction the gnome is moving/facing */

    var fart = new SFB.Fart({ xpos: this.xpos, ypos: this.ypos, xvel: this.xvel, yvel: this.yvel, game: this.game, gnome_id: this.id });
  };

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
