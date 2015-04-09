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

  window.wasKeyPressed;

  GameView.prototype.bindKeyHandlers = function () {
  var gnome1 = this.gnomes[0];
  var gnome2 = this.gnomes[1];

  if(key.isPressed("a")) gnome1.runLeft();
  if(key.isPressed("d")) gnome1.runRight();
  if(key.isPressed("s")) gnome1.fireSpecialFart();
  if(key.isPressed("w")) gnome1.jump();
  if(key.isPressed("space")) gnome1.fartPack();
  if(key.isPressed("f")) gnome1.fartPack();
  if(key.isPressed("x")) GameView.prototype.bindFlameThrower("x", gnome1.id)

  if(key.isPressed("left")) gnome2.runLeft();
  if(key.isPressed("right")) gnome2.runRight();
  if(key.isPressed("down")) gnome2.fireFart();
  if(key.isPressed("up")) gnome2.jump();
  if(key.isPressed("option")) gnome2.fireSpecialFart();
  if(key.isPressed("v")) GameView.prototype.bindFlameThrower("v", gnome2.id)

  // SPECIAL FUNCTION TO BIND FLAMETHROWER:
  // if(key.isPressed("x")) GameView.prototype.bindFlameThrower("x")

  };

  GameView.prototype.start = function () {
    this._canvas = document.getElementById('sfb-game');
    this._div = document.getElementById('gameArea');
    window.onresize = this.resize;
    this.resize();
    this.gameLoop()

  };

//  FPS MONITOR FOR PERFORMANCE TESTING
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
        // gameView.game.addFartPacks();
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


  SFB.GameView.prototype.bindFlameThrower = function (key, gnomeId) {
    var id = gnomeId - 1
    var facing = window.game.gnomes[gnomeId - 1].facing

    window.game.gnomes[gnomeId - 1].wasKeyPressxed;
    if(window.key.isPressed(key)) {
      if (window.FireBalls[gnomeId -1] !== undefined && !window.game.gnomes[gnomeId - 1].wasKeyPressed) {
        if (facing === "Left") {
          if (window.FireBalls[gnomeId -1 ].Right.effect._started) {
            window.FireBalls[gnomeId -1 ].Right.effect.effect('spawner').opts.stop()
          }

          if (!window.FireBalls[id].Left.effect._started) {
            // var fireball = new SFB.FireBall(id)
            FireBalls[id].Left.effect.start()
          }
          if (window.FireBalls[gnomeId -1 ].Right.effect._started) {
            window.FireBalls[gnomeId -1 ].Right.effect.effect('spawner').opts.stop()
          }
          window.FireBalls[id].Left.effect.effect('spawner').opts.start()
          if (window.game.gnomes[gnomeId - 1].hasTurned) {
            window.FireBalls[gnomeId -1 ].Right.effect.effect('spawner').opts.stop()
            window.game.gnomes[gnomeId - 1].hasTurned = false;
          }
        } else {
          if (window.FireBalls[gnomeId -1 ].Left.effect._started) {
            window.FireBalls[gnomeId -1 ].Left.effect.effect('spawner').opts.stop()
          }
          if (!window.FireBalls[id].Right.effect._started) {
            // var fireball = new SFB.FireBall(id)
            FireBalls[id].Right.effect.start()
          }
          if (window.FireBalls[gnomeId -1 ].Left.effect._started) {
            window.FireBalls[gnomeId -1 ].Left.effect.effect('spawner').opts.stop()
          }
          window.FireBalls[id].Right.effect.effect('spawner').opts.start()
          if (window.game.gnomes[gnomeId - 1].hasTurned) {
            window.FireBalls[gnomeId -1 ].Left.effect.effect('spawner').opts.stop()
            window.game.gnomes[gnomeId - 1].hasTurned = false;
          }
        }
      }
      // window.game.gnomes[id].fireFartThrower()
      window.game.gnomes[gnomeId - 1].wasKeyPressed = true
      window.game.gnomes[gnomeId - 1].isFireFarting = true
      window.game.gnomes[gnomeId - 1].isFarting = 11;
    }

    setTimeout(function () {
      if(!window.key.isPressed(key) && window.FireBalls[gnomeId -1] !== undefined && (window.FireBalls[gnomeId -1 ].Right.effect._started || window.FireBalls[gnomeId -1 ].Left.effect._started)) {
        if (facing === "Left") {
          window.FireBalls[gnomeId -1 ].Left.effect.effect('spawner').opts.stop()
        } else {
          window.FireBalls[gnomeId -1 ].Right.effect.effect('spawner').opts.stop()
        }
        window.game.gnomes[gnomeId - 1].wasKeyPressed = false
        window.game.gnomes[gnomeId - 1].isFireFarting = false
      }
    }, window.game.delta)
  }

})();
