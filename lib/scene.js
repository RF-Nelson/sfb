(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var StaticObject = SFB.StaticObject;

  var Scene = SFB.Scene = function(game){
    this.game = game;
    this.scenery = [];

    this.buildScenery();
  };

  var buildScenery = Scene.prototype.buildScenery = function(){
    this.scenery.push(new StaticObject({ color: "saddlebrown  ", game: this.game,
            xpos: 1450, ypos: SFB.Game.DIM_Y - 320, length: 400, width: 500 }));
    this.scenery.push(new StaticObject({ color: "saddlebrown", game: this.game,
            xpos: 200, ypos: SFB.Game.DIM_Y - 320, length: 400, width: 50 }));
    this.scenery.push(new StaticObject({ color: "saddlebrown", game: this.game,
						xpos: 0, ypos: SFB.Game.DIM_Y - 80, length: SFB.Game.DIM_X/2 - 100, width: 80}));
    this.scenery.push(new StaticObject({ color: "saddlebrown", game: this.game,
						xpos: SFB.Game.DIM_X/2 + 100, ypos: SFB.Game.DIM_Y - 80, length: SFB.Game.DIM_X - (SFB.Game.DIM_X/2 + 00), width: 80}));
    this.scenery.push(new StaticObject({ color: "saddlebrown", game: this.game,
                    xpos: 950, ypos: SFB.Game.DIM_Y - 600, length: 400, width: 50 }));

  };

  var draw = Scene.prototype.draw = function(ctx){
    // ctx.fillStyle = "lightslategrey";
    // ctx.fillRect(0, 0, SFB.Game.DIM_X, SFB.Game.DIM_Y);
		// ctx.fill();


    // this.scenery.forEach( function(piece){
    //   piece.draw(ctx);
    // });
  };

})();
