(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  };

  var GameView = SFB.GameView = function (game, ctx) {
    window.game.ctx = ctx;
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

  // if(key.isPressed("x")) window.flamethrowerEffect.opts.start()
  if(key.isPressed("x")) window.flamethrowerEffect.effect('spawner').opts.start()
  if(key.isPressed("x")) window.flamethrowerEffect.start()
  if(!key.isPressed("x")) {
    window.flamethrowerEffect.opts.stop()
  }

  // if(!key.isPressed("x") && window.flamethrowerEffect._started) {
  //   window.flamethrowerEffect.effect('spawner').opts.stop()
  //   window.flamethrowerEffect._started = false;
  // }

  if(key.isPressed("left")) gnome2.runLeft();
  if(key.isPressed("right")) gnome2.runRight();
  if(key.isPressed("space")) gnome2.fireFart();
  if(key.isPressed("up")) gnome2.jump();
  if(key.isPressed("down")) gnome2.fartPack();
  };

  GameView.prototype.start = function () {
    // var lastTime = 0;
    // var vendors = ['ms', 'moz', 'webkit', 'o'];
    // for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    //     window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    //     window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
    //                                || window[vendors[x]+'CancelRequestAnimationFrame'];
    // }
    //
    // if (!window.requestAnimationFrame)
    //     window.requestAnimationFrame = function(callback, element) {
    //         var currTime = new Date().getTime();
    //         var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    //         var id = window.setTimeout(function() { callback(currTime + timeToCall); },
    //           timeToCall);
    //         lastTime = currTime + timeToCall;
    //         return id;
    // };
    //
    // if (!window.cancelAnimationFrame)
    //     window.cancelAnimationFrame = function(id) {
    //         clearTimeout(id);
    // };


    this._canvas = document.getElementById('sfb-game');
    this._div = document.getElementById('gameArea');
    window.onresize = this.resize;
    this.resize();
    this.gameLoop()

  };

  window.countFPS = (function () {
  var lastLoop = (new Date()).getMilliseconds();
  var count = 1;
  var fps = 0;

  return function () {
    var currentLoop = (new Date()).getMilliseconds();
    if (lastLoop > currentLoop) {
      fps = count;
      count = 1;
    } else {
      count += 1;
    }
    lastLoop = currentLoop;
    return fps;
  };
}());

  GameView.prototype.gameLoop = function () {
    var gameView = this;
    // setTimeout(function () {
    //   requestAnimationFrame(window.game.draw);
    // }, this.delta)
    setInterval( function () {
        gameView.bindKeyHandlers();
        gameView.game.step();
        gameView.game.addBeans();
      }, this.delta );
    this.game.draw(this.game.ctx)

  };


  Object.defineProperty(SFB.GameView.prototype, "offset",
  {
    get: function () {
        return this._canvasOffset;
    }
  });

  Object.defineProperty(SFB.GameView.prototype, "scale",
  {
    get: function () {
      var gameCanvas = this._canvas;
      if (!gameCanvas) {
        gameCanvas = document.getElementById('sfb-game');
      }
        return new SFB.Vector2(gameCanvas.width / SFB.Game.DIM_X,
            gameCanvas.height / SFB.Game.DIM_Y);
    }
  });

  SFB.GameView.prototype.resize = function () {
    var gameCanvas = this._canvas;
    var gameArea = this._div;
    if (!gameCanvas) {
      gameCanvas = document.getElementById('sfb-game');
      gameArea = document.getElementById('gameArea');
    }
    var widthToHeight = SFB.Game.DIM_X / SFB.Game.DIM_Y;
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    var newWidthToHeight = newWidth / newHeight;

    if (newWidthToHeight > widthToHeight) {
        newWidth = newHeight * widthToHeight;
    } else {
        newHeight = newWidth / widthToHeight;
    }
    gameArea.style.width = newWidth + 'px';
    gameArea.style.height = newHeight + 'px';

    gameArea.style.marginTop = (window.innerHeight - newHeight) / 2 + 'px';
    gameArea.style.marginLeft = (window.innerWidth - newWidth) / 2 + 'px';
    gameArea.style.marginBottom = (window.innerHeight - newHeight) / 2 + 'px';
    gameArea.style.marginRight = (window.innerWidth - newWidth) / 2 + 'px';

    gameCanvas.width = newWidth;
    gameCanvas.height = newHeight;

    var offset = SFB.Vector2.zero;
    if (gameCanvas.offsetParent) {
      do {
          offset.x += gameCanvas.offsetLeft;
          offset.y += gameCanvas.offsetTop;
      } while ((gameCanvas = gameCanvas.offsetParent));
    }
    SFB.GameView._canvasOffset = offset;
  };

  // SFB.GameView.prototype.requestAnimationFrame = function () {
  //       return  window.requestAnimationFrame ||
  //           window.webkitRequestAnimationFrame ||
  //           window.mozRequestAnimationFrame ||
  //           window.oRequestAnimationFrame ||
  //           window.msRequestAnimationFrame ||
  //           function (callback) {
  //               window.setTimeout(callback, this.game.delta/1000);
  //           };
  // })();


  // GameView.prototype.stop = function () {
  //   clearInterval(this.timerId);
  // };
})();
