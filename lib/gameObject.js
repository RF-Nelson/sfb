(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameObject = SFB.GameObject = function(attrs){
    this.xpos = attrs.xpos;
    this.ypos = attrs.ypos;
    this.game = attrs.game;
    this.color = attrs.color;
  }

  var draw = GameObject.draw = function(ctx){
    ctx.fillStyle = this.color;

    ctx.fillRect( this.xpos, this.ypos, 80, 80 );
  }

})();
