(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.FartFlame = function (options) {


  	options.radius = 10;
    options.color = 'red';
    this.gnome = options.gnome;
    this.gnome.isFireFarting = true;
    options.yvel = options.yvel * 0.1;
    options.xpos = (this.gnome.facing === "Left") ? options.xpos + 80 : options.xpos - 10;

    SFB.AnimatedObject.call(this, options);
    this.wrappable = false;
    this.timeLeft = 1500;
    this.game.farts.push(this);
    this.gnome.flamers.push(this);
    this.gnomeId = options.gnome.id;
    this.team = options.team;
    this.strength = .2;
    this.game = window.game;
    this.key = options.key;
    this.xvel = (this.gnome.facing === "Left") ? -4 : 4;
    this.FlameThrower();
  };

    SFB.Utils.inherits(SFB.FartFlame, SFB.Fart);

  SFB.FartFlame.prototype.collideWith = function (gnome) {
    if (this.team !== gnome.team) {
      gnome.handleHit((this.strength * this.timeLeft) / 1500, this);
      return true
    }
    return false
  };

  SFB.FartFlame.prototype.draw = function (ctx) {
    // this.hitBox().draw();
  };



  SFB.FartFlame.prototype.move = function () {
    // MOVES FLAMETHROWER EFFECT IF ACTIVE
    if (this.gnome.FireBalls.Right.effect) {
      this.gnome.FireBalls.Left.effect.effectsStackBuilder().position(Fireworks.createShapeSphere(
          this.gnome.xpos + 14,
          this.gnome.ypos -54,
          0,
          10))
        this.gnome.FireBalls.Right.effect.effectsStackBuilder().position(Fireworks.createShapeSphere(
          this.gnome.xpos -75,
          this.gnome.ypos -54,
          0,
          10))
        }

      this.xpos -= this.xvel;
  }

  SFB.FartFlame.prototype.hitBox = function () {
      return new SFB.Rectangle(this.xpos + (this.xvel), this.ypos - 40,
        50, 120)
  };

  SFB.FartFlame.prototype.FlameThrower = function () {
    var facing = this.gnome.facing,
        fireBalls = this.gnome.FireBalls,
        gnome = this.gnome,
        key = this.key;

      if (fireBalls !== undefined) {
        if (facing === "Left") {
          if (fireBalls.Right.effect._started) {
            fireBalls.Right.effect.effect('spawner').opts.stop()
          }

          if (!fireBalls.Left.effect._started) {
            fireBalls.Left.effect.start()
          }
          if (fireBalls.Right.effect._started) {
            fireBalls.Right.effect.effect('spawner').opts.stop()
          }
          fireBalls.Left.effect.effect('spawner').opts.start()
          if (gnome.hasTurned) {
            fireBalls.Right.effect.effect('spawner').opts.stop()
            gnome.hasTurned = false;
          }
        } else {
          if (fireBalls.Left.effect._started) {
            fireBalls.Left.effect.effect('spawner').opts.stop()
          }
          if (!fireBalls.Right.effect._started) {
            fireBalls.Right.effect.start()
          }

          fireBalls.Right.effect.effect('spawner').opts.start()
          if (gnome.hasTurned) {
            fireBalls.Left.effect.effect('spawner').opts.stop()
            gnome.hasTurned = false;
          }
        }
      gnome.isFarting = 11;
    }
    setTimeout(function () {
      if (fireBalls.Right.effect._started || fireBalls.Left.effect._started) {

        if (facing === "Left") {
          fireBalls.Left.effect.effect('spawner').opts.stop();
        } else {
          fireBalls.Right.effect.effect('spawner').opts.stop();
        }
      }
    }, 200)
  }
})();
