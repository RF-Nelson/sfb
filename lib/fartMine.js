(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.FartMine = function (options) {

    options.xvel = options.xvel * 0.1;
    options.yvel = 5;
  	options.radius = 10;
    options.color = 'red';
    this.gnome = options.gnome;
    SFB.AnimatedObject.call(this, options);
    this.strength = 25;
    this.wrappable = false;
    this.timeLeft = 1000;
    this.explodable = false;
    this.game.farts.push(this);
    this.gnome_id = options.gnome_id;
    this.loadAnimation(options.game.sprites.mine, "mine", true, 0.05);
    this.playAnimation("mine")
  };

    SFB.Utils.inherits(SFB.FartMine, SFB.Fart);

  // SFB.FartMine.prototype.collideWith = function (gnome) {
  //   if (this.gnome_id !== gnome.id) {
  //     gnome.handleHit(this.xpos, this.ypos, this.strength);
  //     this.game.remove(this);
  //     return true
  //   }
  //   return false
  // };
  //
  SFB.FartMine.prototype.draw = function (ctx) {
    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 35)
    SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);
  };
  //
  // SFB.FlameFart.prototype.hitBox = function () {
  //   return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
  //     this.sprite.width, this.sprite.height)
  // };

})();
