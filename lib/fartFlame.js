(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.FartFlame = function (options) {


  	options.radius = 10;
    options.color = 'red';
    // this.xpos = options.xpos - 100;
    // this.xpos = options.xpos;
    this.gnome = options.gnome;
    this.gnome.isFireFarting = true;
    SFB.AnimatedObject.call(this, options);
    this.xvel = 0;
    this.yvel = 0;
    // this.strength = 0;
    this.wrappable = false;
    this.timeLeft = 500;
    this.gnome.game.farts.push(this)
    // this.game.farts.push(this);
    this.gnomeId = options.gnome.id;
    this.team = options.team;

    // this.loadAnimation(options.game.sprites.cloud, "cloud", true, 0.05);
    // this.playAnimation("cloud")
    this.strength = 10
    this.game = window.game

  };

    SFB.Utils.inherits(SFB.FartFlame, SFB.Fart);

    // SFB.FartFlame.prototype.move = function() {
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

  SFB.FartFlame.prototype.collideWith = function (gnome) {
    if (this.team !== gnome.team) {
      gnome.handleHit(this.xpos, this.ypos, this.strength);
      return true
    }
    return false
  };

  SFB.FartFlame.prototype.draw = function (ctx) {
    //DRAW FARTFLAME HITBOX
    this.hitBox().draw()
  };



  SFB.FartFlame.prototype.move = function () {
    // MOVES FLAMETHROWER EFFECT IF ACTIVE
    var that = this
    if (window.FireBalls && window.FireBalls[that.gnome.id - 1] && window.FireBalls[that.gnome.id - 1].Right.effect) {
      // if (this.facing === "Left") {
        window.FireBalls[that.gnome.id - 1].Left.effect.effectsStackBuilder().position(Fireworks.createShapeSphere(
          that.gnome.xpos + 14,
          that.gnome.ypos -54,
          0,
          10))
      // } else {
        window.FireBalls[that.gnome.id - 1].Right.effect.effectsStackBuilder().position(Fireworks.createShapeSphere(
          that.gnome.xpos -75,
          that.gnome.ypos -54,
          0,
          10))
        }
  }

  SFB.FartFlame.prototype.hitBox = function () {
    if (window.game.gnomes[this.gnomeId - 1].facing == "Left") {
      return new SFB.Rectangle(window.game.gnomes[this.gnomeId - 1].xpos + 90, window.game.gnomes[this.gnomeId - 1].ypos - 40,
        450, 120)
    } else {
      return new SFB.Rectangle(window.game.gnomes[this.gnomeId - 1].xpos - 10, window.game.gnomes[this.gnomeId - 1].ypos - 40,
        -450, 120)
    }

  };

})();
