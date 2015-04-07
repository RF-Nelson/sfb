(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.FartFlame = function (options) {


  	options.radius = 10;
    options.color = 'red';
    this.xpos = options.xpos - 100;
    this.xpos = options.xpos;
    this.gnome = options.gnome;
    this.gnome.flaming = true;
    SFB.AnimatedObject.call(this, options);
    this.xvel = 0;
    this.yvel = 0;
    // this.strength = 0;
    this.wrappable = false;
    this.timeLeft = 500;
    this.game.farts.push(this);
    this.gnome_id = options.gnome_id;
    this.loadAnimation(options.game.sprites.cloud, "cloud", true, 0.05);
    this.playAnimation("cloud")
  };

    SFB.Utils.inherits(SFB.FartFlame, SFB.Fart);

    SFB.FartFlame.prototype.move = function() {
      if (this.gnome.velx > 0) {
        if (this.gnome.facing === 'Left') {
          this.xpos = this.gnome.xpos + 100;
          this.ypos = this.gnome.ypos;
        } else {
          this.xpos = this.gnome.xpos - 100;
          this.ypos = this.gnome.ypos;
        }
      } else {
        if (this.gnome.facing === 'Right') {
          this.xpos = this.gnome.xpos - 100;
          this.ypos = this.gnome.ypos;
        } else {
          this.xpos = this.gnome.xpos + 100;
          this.ypos = this.gnome.ypos;
        }
      }
    };

  // SFB.FartFlame.prototype.collideWith = function (gnome) {
  //   if (this.gnome_id !== gnome.id) {
  //     gnome.handleHit(this.xpos, this.ypos, this.strength);
  //     this.game.remove(this);
  //     return true
  //   }
  //   return false
  // };
  //
  // SFB.FartFlame.prototype.draw = function (ctx) {
  //   this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 30)
  //   SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);
  // };
  //
  // SFB.FartFlame.prototype.hitBox = function () {
  //   return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
  //     this.sprite.width, this.sprite.height)
  // };

})();
