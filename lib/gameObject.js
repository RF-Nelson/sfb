(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameObject = SFB.GameObject = function(attrs){
    this.pos = attrs.pos;
    this.game = attrs.game;
    this.color = attrs.color;
  }

  var draw = GameObject.draw = function(ctx){
    ctx.fillStyle = this.color;

    ctx.fillRect( this.pos[0], this.pos[1], this.width, this.height );
  }

})();
