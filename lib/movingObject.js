if (typeof SFB === "undefined") {
  window.SFB = {};
}

var movingObject = SFB.movingObject = function (attrs) {
  this.xvel = attrs.xvel;
  this.yvel = attrs.yvel;
  this.radius = 50;
  this.wrappable = true;
  SFB.GameObject.call(this, attrs);
};

SFB.Utils.inherits(SFB.movingObject, SFB.GameObject);

movingObject.prototype.move = function () {
  this.xpos += this.xvel;
  this.ypos += this.yvel;

  if (this.wrappable) {
    this.wrap();
  }

};

movingObject.prototype.wrap = function () {
  if (this.xpos > this.game.DIM_X) {
    this.xpos -= this.game.DIM_X;
  }

  if (this.xpos < 0) {
    this.xpos += this.game.DIM_X;
  }

  if (this.ypos > this.game.DIM_Y) {
    this.ypos -= this.game.DIM_Y;
  }

  if (this.ypos < 0) {
    this.ypos += this.game.DIM_Y;
  }
};

movingObject.prototype.draw = function (ctx) {
  ctx.fillStyle = this.color;
  ctx.beginPath();

  ctx.arc(
    this.xpos,
    this.ypos,
    this.radius,
    0,
    2 * Math.PI,
    false  );

  ctx.fill();
};

movingObject.prototype.isCollidedWith = function (otherObject) {
  var distance = Math.sqrt((Math.pow(this.xpos - otherObject.xpos), 2) + (Math.pow(this.ypos - otherObject.ypos), 2));
  if (distance < this.radius - otherObject.radius) {
    return true;
  }
  return false;
};
