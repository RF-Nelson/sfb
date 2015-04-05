(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  };

  var GameView = SFB.GameView = function (game, ctx) {
    this.ctx = ctx;
    this.game = game;
    this.gnomes = this.game.gnomes
    this.delta = this.game.delta
  };

  GameView.prototype.bindKeyHandlers = function () {
  var gnome1 = this.gnomes[0];
  var gnome2 = this.gnomes[1];

  if(key.isPressed("a")) gnome1.runLeft();
  if(key.isPressed("d")) gnome1.runRight();
  if(key.isPressed("s")) gnome1.fireFart();
  if(key.isPressed("w")) gnome1.jump();
  if(key.isPressed("f")) gnome1.fartPack();


  if(key.isPressed("left")) gnome2.runLeft();
  if(key.isPressed("right")) gnome2.runRight();
  if(key.isPressed("space")) gnome2.fireFart();
  if(key.isPressed("up")) gnome2.jump();
  if(key.isPressed("down")) gnome2.fartPack();



  };

  GameView.prototype.start = function () {
    var gameView = this;
    setInterval( function () {
        gameView.bindKeyHandlers();
        gameView.game.step();
        gameView.game.draw(gameView.ctx);

      }, this.delta );

  };

  // GameView.prototype.stop = function () {
  //   clearInterval(this.timerId);
  // };
})();
