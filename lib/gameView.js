(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var GameView = SFB.GameView = function (game, ctx) {
    this.ctx = ctx;
    this.game = game;
    this.gnomes = this.game.gnomes
  };

  GameView.PLAYERONEMOVES = {
    "w": [ 0, -1],
    "a": [-1,  0],
    "s": [ 0,  1],
    "d": [ 1,  0],
  };

  GameView.PLAYERTWOMOVES = {
    "i": [ 0, -1],
    "j": [-1,  0],
    "k": [ 0,  1],
    "l": [ 1,  0],
  };

  // GameView.prototype.bindKeyHandlers = function () {
  //   var gnome1 = this.gnomes[0];
  //   var gnome2 = this.gnomes[1];
  //
  //   key("a", function () { console.log("gnome1 run left"); gnome1.run(-3); });
  //   // key("w", function () { console.log("gnome1 jump"); gnome1.jump(); });
  //   if(key.isPressed("d")) gnome1.run(3);
  //   key("s", function () { console.log("gnome1 fart"); gnome1.fireFart(); });
  //
  //   /* Convert 'w' to a jump */
  //   key("w", function () { console.log("gnome1 jump"); gnome1.jump(); });
  //
  //
  //
  //   key("j", function () { console.log("gnome2 run left");});//gnome1.run([0,1]) });
  //   key("i", function () { console.log("gnome2 jump");});//gnome2.jump() });
  //   key("l", function () { console.log("gnome2 run right");});//gnome2.run([0,-1]) });
  //   key("k", function () { console.log("gnome2 fart");});//gnome2.fart!() });
  // };

  GameView.prototype.bindKeyHandlers = function () {
    var gnome1 = this.gnomes[0];
    var gnome2 = this.gnomes[1];

    if(key.isPressed("a")) gnome1.run(-3);
    if(key.isPressed("d")) gnome1.run(3);
    if(key.isPressed("s")) gnome1.fireFart();
    if(key.isPressed("w")) gnome1.jump();

  }

  GameView.prototype.start = function () {
    var gameView = this;
    setInterval( function () {
        gameView.bindKeyHandlers();

        gameView.game.step();
        gameView.game.draw(gameView.ctx);

      }, 20 );

  };

  // GameView.prototype.stop = function () {
  //   clearInterval(this.timerId);
  // };
})();
