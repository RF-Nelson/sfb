(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Fart = function (options) {

    this.xvel = options.xvel;
    options.yvel = options.yvel * 0.2;
  	options.radius = 10;
    options.color = 'red';
    SFB.AnimatedObject.call(this, options);
    // this.strength = options.strength;
    this.wrappable = false;
    this.game.farts.push(this);
    this.gnome_id = options.gnome_id;
    this.loadAnimation(options.game.sprites.cloud, "cloud", true, 0.05);
    this.playAnimation("cloud")
  };

    SFB.Utils.inherits(SFB.Fart, SFB.AnimatedObject)

  SFB.Fart.prototype.collideWith = function (gnome) {
    if (this.gnome_id !== gnome.id) {
      gnome.handleHit(this.xpos, this.ypos);
      this.game.remove(this);
      return true
    }
    return false
  };

  SFB.Fart.prototype.draw = function (ctx) {
    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 30)
    SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);
  };

  SFB.Fart.prototype.hitBox = function () {
    return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
      this.sprite.width, this.sprite.height)
  };

})();
