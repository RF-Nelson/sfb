(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.exhaustAnimation = function (options) {
    options.xvel = 0;
    options.yvel = 2;
    this.xpos = options.xpos + 12
    this.ypos = options.ypos - 15

    SFB.AnimatedObject.call(this, options);
    this.loadAnimation(window.game.sprites.smoke, "fartpackExhaust", false, 0.3);
    this.playAnimation("fartpackExhaust")
    this.timeToLive = 75;
  };

  SFB.Utils.inherits(SFB.exhaustAnimation, SFB.AnimatedObject);

  SFB.exhaustAnimation.prototype.draw = function (ctx) {
    var rand = Math.random()
    if (rand > 0.5) {
      this.ypos += Math.random() * -4;
      this.xpos += Math.random() * 4;
    } else {
      this.ypos += Math.random() * 4;
      this.xpos += Math.random() * -4;
    }

    this.sprite.drawFrame(this.sheetIndex, ctx, this.xpos, this.ypos)
    SFB.AnimatedObject.prototype.update.call(this, window.game.delta/1000);
    this.timeToLive -= 1;
    if (this.timeToLive === 0) {
      for (var i = 0; i < window.game.beans.length; i++) {
        if (window.game.beans[i] instanceof SFB.exhaustAnimation) {
          window.game.beans.splice(i, 1)
          return
        }
      }
    }
  }

  SFB.exhaustAnimation.prototype.hitBox = function () {
    return new SFB.Rectangle(0,0,0,0)
  }


})();
