(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Bean = function (options) {
    SFB.AnimatedObject.call(this, options);
    this.game = options.game;

  	this.radius = 20;
    this.color = 'red';
    this.loadAnimation(options.game.sprites.beans, "beans", true, 0.08);
    this.playAnimation("beans");

  };

  SFB.Utils.inherits(SFB.Bean, SFB.AnimatedObject)

  SFB.Bean.prototype.collideWith = function (gnome) {
      gnome.handleBean();
      this.game.remove(this);
  };

  SFB.Bean.prototype.draw = function (ctx) {
    // SHOW BEAN HITBOX
    // var canvasScale = SFB.GameView.prototype.scale;
    // ctx.save();
    // ctx.scale(scale * canvasScale.x, scale * canvasScale.y);
    // var gnomeHitBox = this.hitBox()
    // ctx.strokeRect(gnomeHitBox.x, gnomeHitBox.y, gnomeHitBox.width, gnomeHitBox.height)
    // ctx.restore();



    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos)
    SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);

  };

  SFB.Bean.prototype.hitBox = function () {
    return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
      this.sprite.width, this.sprite.height)
  };

})();
