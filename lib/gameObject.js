(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameObject = SFB.GameObject = function(options){
    this.xpos = options.xpos;
    this.ypos = options.ypos;
    this.onGround = options.onGround;
    this.game = options.game;
    this.color = options.color;
  }

  var draw = GameObject.draw = function(ctx){
    ctx.fillStyle = this.color;

    ctx.fillRect( this.xpos, this.ypos, 80, 80 );
  }

})();
