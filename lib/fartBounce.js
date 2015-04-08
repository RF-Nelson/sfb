(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.FartBounce = function (options) {

    this.xvel = options.xvel;
    options.yvel = options.yvel * 0.2;

  	options.radius = 10;
    options.color = 'red';
    SFB.AnimatedObject.call(this, options);
    this.xpos = options.xpos;
    this.ypos = options.ypos;
    this.wrappable = true;
    this.timeLeft = 10000;
    this.game.farts.push(this);
    this.gnome_id = options.gnome_id;
    this.loadAnimation(options.game.sprites.cloud, "cloud", true, 0.05);
    this.playAnimation("cloud")

  };

    SFB.Utils.inherits(SFB.FartBounce, SFB.Fart)

    SFB.FartBounce.prototype.handleBounce = function (object) {
      if (object === 'side') {
        this.xvel = (this.xvel * - 1);
      } else {
        this.yvel = (this.yvel * - 1);
      }
    };

  SFB.FartBounce.prototype.collideWith = function (gnome) {
    if (this.gnome_id !== gnome.id) {
      gnome.handleHit(this.xpos, this.ypos);
      this.game.remove(this);
      return true
    }
    return false
  };

  SFB.FartBounce.prototype.draw = function (ctx) {
    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 30)
    SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);
  };

  SFB.FartBounce.prototype.hitBox = function () {
    return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
      this.sprite.width, this.sprite.height)
  };

})();
