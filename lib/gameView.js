
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


    key("space", this.pause.bind(this));

    if (!this.game.paused) {

      if(key.isPressed("a")) gnome1.runLeft();
      if(key.isPressed("d")) gnome1.runRight();
      if(key.isPressed("e")) gnome1.fireSpecialFart();
      if(key.isPressed("w")) gnome1.jump();
      if(key.isPressed("s")) gnome1.fartPack();
      if(key.isPressed("q")) gnome1.fireFart();

      if(key.isPressed("left")) gnome2.runLeft();
      if(key.isPressed("right")) gnome2.runRight();
      if(key.isPressed("shift")) gnome2.fireSpecialFart();
      if(key.isPressed("up")) gnome2.jump();
      if(key.isPressed("down")) gnome2.fartPack();
      if(key.isPressed("option")) gnome2.fireFart();

      for (var i = 0; i < 4; i++) {
        if (gamepads[i]) {
            var thisPad = gamepads[i]
            if(thisPad.buttons[9].pressed) this.pause()
            if(thisPad.buttons[0].pressed) game.gnomes[i].fireFart()
            if(thisPad.buttons[1].pressed) game.gnomes[i].fireSpecialFart()
            if(thisPad.buttons[6].pressed) game.gnomes[i].fartPack()
            if(thisPad.buttons[7].pressed || thisPad.axes[1] > 0.80) game.gnomes[i].jump()
            if(thisPad.axes[0] > 0.5) game.gnomes[i].runRight()
            if(thisPad.axes[0] < -0.5) game.gnomes[i].runLeft()
        }
      }
    }
  };

  GameView.prototype.pause = function () {
    if (this.game.paused) {
      var pauseDisplay = document.getElementById('pause-screen'),
          gameArea = document.getElementById('gameArea');

      pauseDisplay.classList.add('hidden');
      gameArea.classList.remove('hidden');

      this.game.paused = false;
    } else {
      var pauseDisplay = document.getElementById('pause-screen'),
          gameArea = document.getElementById('gameArea');

      pauseDisplay.classList.remove('hidden');
      gameArea.classList.add('hidden');

      this.game.paused = true;
    }


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
      /* Skips all game looping if the game is over. */
      if (gameView.game.over || gameView.game.paused) {
        return;
      }
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




})();
