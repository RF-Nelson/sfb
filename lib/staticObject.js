(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameObject = SFB.GameObject;

  var StaticObject = SFB.StaticObject = function(options){
    options.color = options.color === undefined ? "brown" : options.color;

    options.xpos = options.xpos === undefined ? 340 : options.xpos;
    options.ypos = options.ypos === undefined ? 400 : options.ypos;

    SFB.GameObject.call(this, options);
    this.length = options.length;
    this.width = options.width;
  }

  SFB.Utils.inherits(StaticObject, SFB.GameObject);

  var draw = StaticObject.prototype.draw = function(ctx){
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;

    ctx.fillStyle = this.color;
    ctx.save();

    ctx.scale(scale * canvasScale.x, scale * canvasScale.y);
    ctx.fillRect( this.xpos, this.ypos, this.length, this.width );
		ctx.fill();
    ctx.restore();
  }

})();
