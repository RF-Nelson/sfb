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
    this.strength = options.strength;
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

})();
