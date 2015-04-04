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
    ctx.fillStyle = this.color;
    ctx.fillRect( this.xpos, this.ypos, this.length, this.width );
		ctx.fill();
  }

})();
