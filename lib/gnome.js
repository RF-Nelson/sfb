(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Gnome = function (attrs) {

    // var GRAVITY = some value
    attrs.color = "#FF0000";
    attrs.radius = 25;
    attrs.xvel = 0;
    attrs.yvel = 0;
    this.health = 100;
    this.lives = 3;
    this.facing = "left";
    this.id = attrs.id;


    SFB.movingObject.call(this, attrs);

  };

  SFB.Utils.inherits(SFB.Gnome, SFB.movingObject);

  SFB.Gnome.prototype.run = function (direction) {
    var newXvel = (this.xvel + direction);
    this.xvel = newXvel > 10 ? 10 : newXvel;

    if (direction === 1) {
      this.facing = "right";
    } else if (direction === -1) {
      this.facing = "left";
    }

  };

  SFB.Gnome.prototype.jump = function () {
    // brainfart
  }


  SFB.Gnome.prototype.handleHit = function () {
    this.health -= 25;
    if (health <= 0) {
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

    }
  };

  SFB.Gnome.prototype.die = function () {
    alert("A Gnome has been farted on to death");
  };

  SFB.Gnome.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(
      this.xpos,
      this.ypos,
      100,
      0,
      2 * Math.PI,
      false
    );
    ctx.strokeStyle = 'rgb(0,128,0)';
    ctx.lineWidth = 5;
    ctx.stroke();
  };


  SFB.Gnome.prototype.fireFart = function() {
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

  SFB.Gnome.prototype.move = function() {
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


})();
