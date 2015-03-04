(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameObject = SFB.GameObject;

  var StaticObject = SFB.StaticObject = function(attrs){
    attrs.color = "brown";
    attrs.pos = attrs.pos ||
                [Math.floor(attrs.game.DIM_X / 2), Math.floor(attrs.game.DIM_Y / 2)];
    SFB.GameObject.call(this, {pos: attrs.pos, game: attrs.game, color: attrs.color});
    this.length = attrs.length;
    this.width = attrs.width;
  }

  SFB.Utils.inherits(StaticObject, SFB.GameObject);

  var draw = StaticObject.draw = function(ctx){
    ctx.fillStyle = this.color;

    ctx.fillRect( this.pos[0], this.pos[1], this.width, this.height );
  }

  // StaticObject.prototype.collideWith

})();
