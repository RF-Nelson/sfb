(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.Fart = function (attrs) {

    this.xvel = attrs.xvel;
    attrs.yvel = attrs.yvel * 0.2;
  	attrs.radius = 10;
    attrs.color = 'red';
    SFB.AnimatedObject.call(this, attrs);
    // this.strength = attrs.strength;
    this.wrappable = false;
    this.game.farts.push(this);
    this.gnome_id = attrs.gnome_id;
    this.loadAnimation(attrs.game.sprites.cloud, "cloud", true, 0.05);
    this.playAnimation("cloud")
  };

    SFB.Utils.inherits(SFB.Fart, SFB.AnimatedObject)

  SFB.Fart.prototype.collideWith = function (gnome) {
    if (this.gnome_id !== gnome.id) {
      gnome.handleHit();
      this.game.remove(this);
      return true
    }
    return false
  };

  SFB.Fart.prototype.draw = function (ctx) {
    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 30)
    SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);
  };

})();
