(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameObject = SFB.GameObject;

  var StaticObject = SFB.StaticObject = function(attrs){
    attrs.color = attrs.color === undefined ? "brown" : attrs.color;

    attrs.xpos = attrs.xpos === undefined ? 340 : attrs.xpos;
    attrs.ypos = attrs.ypos === undefined ? 400 : attrs.ypos;

    SFB.GameObject.call(this, attrs);
    this.length = attrs.length;
    this.width = attrs.width;
  }

  SFB.Utils.inherits(StaticObject, SFB.GameObject);

  var draw = StaticObject.prototype.draw = function(ctx){
    ctx.fillStyle = this.color;
    ctx.fillRect( this.xpos, this.ypos, this.length, this.width );
		ctx.fill();
  }

})();
