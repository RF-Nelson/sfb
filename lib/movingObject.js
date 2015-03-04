if (typeof SFB === "undefined") {
  window.SFB = {};
}


var movingObject = function (xpos, ypos, xvel, yvel, color, radius, game) {
  this.xpos = xpos;
  this.ypos = ypos;
  this.xvel = xvel;
  this.yvel = yvel;
  this.color = color;
  this.radius = radius;
  this.game = game;
  this.game.push(this);
  this.wrappable = true;
};

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
    this.xpos += this.game.DIM_X:
  }

  if (this.ypos > this.game.DIM_Y) {
    this.ypos -= this.game.DIM_Y;
  }

  if (this.ypos < 0) {
    this.ypos += this.game.DIM_Y:
  }
};

movingObject.prototype.draw = function (ctx) {
  ctx.fillStyle = this.color;
  ctx.beginPath();

  ctx.arc(
    this.xpos,
    this.ypos,
    this.radius,
  )
};

movingObject.prototype.collidesWith = function (otherObject) {
  var distance = Math.sqrt(((this.xpos - otherObject.xpos) ** 2) + ((this.ypos - otherObject.ypos) ** 2));
  if (distance < this.radius - otherObject.radius) {
    return true;
  }
  return false;
};
