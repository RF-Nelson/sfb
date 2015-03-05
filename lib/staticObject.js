(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameObject = SFB.GameObject;

  var StaticObject = SFB.StaticObject = function(attrs){
    attrs.color = "brown";
    attrs.xpos = attrs.xpos || Math.floor(attrs.game.DIM_X / 2);
    attrs.ypos = attrs.ypos || Math.floor(attrs.game.DIM_Y / 2);
    SFB.GameObject.call(this, attrs);
    this.length = attrs.length;
    this.width = attrs.width;
  }

  SFB.Utils.inherits(StaticObject, SFB.GameObject);

  var draw = StaticObject.draw = function(ctx){
    ctx.fillStyle = this.color;

    ctx.fillRect( this.xpos, this.ypos, this.width, this.height );
  }

  // StaticObject.prototype.collideWith

})();
