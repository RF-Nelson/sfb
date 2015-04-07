(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.BounceFart = function (options) {

    this.xvel = options.xvel;
    options.yvel = options.yvel * 0.2;
  	options.radius = 10;
    options.color = 'red';
    options.strength
    SFB.AnimatedObject.call(this, options);
    this.wrappable = true;
    this.timeLeft = 15;
    this.game.farts.push(this);
    this.gnome_id = options.gnome_id;
    this.loadAnimation(options.game.sprites.cloud, "cloud", true, 0.05);
    this.playAnimation("cloud")
  };

    SFB.Utils.inherits(SFB.BounceFart, SFB.Fart)

    SFB.BounceFart.prototype.handleBounce = function () {
      this.yvel = (this.yvel * - 1);
    };

  // SFB.BounceFart.prototype.collideWith = function (gnome) {
  //   if (this.gnome_id !== gnome.id) {
  //     gnome.handleHit(this.xpos, this.ypos);
  //     this.game.remove(this);
  //     return true
  //   }
  //   return false
  // };
  //
  // SFB.BounceFart.prototype.draw = function (ctx) {
  //   this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 30)
  //   SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);
  // };
  //
  // SFB.BounceFart.prototype.hitBox = function () {
  //   return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
  //     this.sprite.width, this.sprite.height)
  // };

})();
