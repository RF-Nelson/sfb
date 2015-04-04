(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Bean = function (options) {
    SFB.AnimatedObject.call(this, options);
    this.game = options.game;

  	this.radius = 20;
    this.color = 'red';
    this.game.beans.push(this);

  };

    SFB.Utils.inherits(SFB.Bean, SFB.AnimatedObject)

  SFB.Bean.prototype.collideWith = function (gnome) {
    if (this.gnome_id !== gnome.id) {
      gnome.handleBean();
      this.game.remove(this);
      return true
    }
    return false
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
