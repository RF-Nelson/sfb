(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Gnome = function (properties) {

    var GRAVITY = //some value
    var COLOR = "#FF0000";
    var RADIUS = 25;
    this.speed = 0;
    this.health = 100;
    this.lives = 3;
    this.facing = "left"

    SFB.MovingObject.call(this, {pos: properties["pos"],
                            vel: SFB.Util.makeVec(this.speed),
                            radius: RADIUS,
                            color: COLOR,
                            game: properties["game"]});

  }

  SFB.Util.inherits(SFB.Gnome, SFB.MovingObject);

  SFB.Gnome.prototype.run = function (direction) {
    var newSpeed = (this.speed += 3);
    this.speed = newSpeed > 10 ? 10 : newSpeed;
    if (direction === "left") {
      this.facing = "left"
    } else if (direction === "right") {
      this.facing = "left"
    }
  }

  SFB.Gnome.prototype.jump = function () {
    // brainfart
  }


  SFB.Gnome.prototype.handleHit = function () {
    this.health -= 25;
    if (health <= 0) {
      this.respawn();
    }
  }

  SFB.Gnome.prototype.respawn = function () {
    this.lives -= 1;
    if (this.lives === 0) {
      this.die();
    } else {
      var xCoordinateRandom = ( SFB.Game.DIM_X * Math.random() );
      var yCoordinateRandom = ( SFB.Game.DIM_Y * Math.random() );
      this.pos[0] = xCoordinateRandom;
      this.pos[1] = yCoordinateRandom;
      this.speed = 0;
    }
  }

  SFB.Gnome.prototype.die = function () {
    alert("A Gnome has been farted on to death");
  }

  SFB.Gnome.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(
      this.pos[0],
      this.pos[1],
      this.radius,
      0,
      2 * Math.PI,
      false
    );
    ctx.strokeStyle = 'rgb(0,128,0)';
    ctx.lineWidth = 5;
    ctx.stroke();
  }


  SFB.Gnome.prototype.fireFart = function() {
    var fart = new SFB.Fart({ direction: this.facing,
                                        pos: this.tipPos(),
                                        game: this.game });
    this.game.add(fart);
  }

  SFB.Gnome.prototype.isCollidedWith = function(object, game) {
    var distance = SFB.Util.distance(this.pos, object.pos);
    var radiiDist = this.radius + obj.radius;

    if (radiiDist > distance) {
      return true;
    } else {
      return false;
    }
  }

  SFB.Gnome.prototype.move = function() {
    this.vel = SFB.Util.makeVec(this.speed);
    var oldPos = this.pos;
    var newPos = this.pos;
    newPos[0] = this.pos[0] + this.vel[0];
    newPos[1] = this.pos[1] + this.vel[1];
    this.pos = this.game.wrap(newPos);

    //THIS REDUCTION OF SPEED SIMULATES FRICTION
    this.speed *= .98

    //COMPENSATE FOR GRAVITY?

  }


})();
