(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.FartMine = function (options) {

    options.xvel = options.xvel * 0.5;
    options.yvel = 5;
  	options.radius = 10;
    options.color = 'red';
    this.gnome = options.gnome;
    SFB.AnimatedObject.call(this, options);
    // this.strength = 0;
    this.wrappable = false;
    this.game.farts.push(this);
    this.gnome_id = options.gnome_id;
    this.loadAnimation(options.game.sprites.cloud, "cloud", true, 0.05);
    this.playAnimation("cloud")
  };

    SFB.Utils.inherits(SFB.FartMine, SFB.Fart);

    // SFB.FartMine.prototype.move = function() {
    //   if (this.gnome.velx > 0) {
    //     if (this.gnome.facing === 'Left') {
    //       this.xpos = this.gnome.xpos + 100;
    //       this.ypos = this.gnome.ypos;
    //     } else {
    //       this.xpos = this.gnome.xpos - 100;
    //       this.ypos = this.gnome.ypos;
    //     }
    //   } else {
    //     if (this.gnome.facing === 'Right') {
    //       this.xpos = this.gnome.xpos - 100;
    //       this.ypos = this.gnome.ypos;
    //     } else {
    //       this.xpos = this.gnome.xpos + 100;
    //       this.ypos = this.gnome.ypos;
    //     }
    //   }
    // };

  // SFB.FartMine.prototype.collideWith = function (gnome) {
  //   if (this.gnome_id !== gnome.id) {
  //     gnome.handleHit(this.xpos, this.ypos, this.strength);
  //     this.game.remove(this);
  //     return true
  //   }
  //   return false
  // };
  //
  // SFB.FartMine.prototype.draw = function (ctx) {
  //   this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos - 30)
  //   SFB.AnimatedObject.prototype.update.call(this, this.game.delta/1000);
  // };
  //
  // SFB.FlameFart.prototype.hitBox = function () {
  //   return new SFB.Rectangle(this.boundingBox.x, this.boundingBox.y,
  //     this.sprite.width, this.sprite.height)
  // };

})();
