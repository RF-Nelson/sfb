(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Bean = function (options) {
    SFB.AnimatedObject.call(this, options);
    this.game = options.game;

  	this.radius = 20;
    this.color = 'red';

  };

    SFB.Utils.inherits(SFB.Bean, SFB.AnimatedObject)

  SFB.Bean.prototype.collideWith = function (gnome) {
      gnome.handleBean();
      this.game.remove(this);
  };

  SFB.Bean.prototype.draw = function (ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();

    ctx.arc(
      this.xpos,
      this.ypos,
      this.radius,
      0,
      2 * Math.PI
    );
  };

})();
