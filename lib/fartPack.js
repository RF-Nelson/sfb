(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.FartPack = function (options) {
    SFB.AnimatedObject.call(this, options);
    this.game = options.game;

  	this.radius = 20;
    this.color = 'red';
    this.loadAnimation(options.game.sprites.beans, "beans", true, 0.08);
    this.playAnimation("beans");
    this.draw
  };

  SFB.Utils.inherits(SFB.FartPack, SFB.AnimatedObject)

  SFB.FartPack.prototype.collideWith = function (gnome) {
      gnome.handleFartPack();
      this.game.remove(this);
  };

  SFB.FartPack.prototype.draw = function (ctx) {

    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos)
    SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);

  };

  SFB.FartPack.prototype.hitBox = function () {
    return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
      this.sprite.width, this.sprite.height)
  };

})();
