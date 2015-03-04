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
    this.scenery.push(new StaticObject({ game: this.game, length: 400, width: 80 }));
  };

  var draw = Scene.prototype.draw = function(ctx){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.game.DIM_X, this.game.DIM_Y);
    this.scenery.forEach = function(piece){
      piece.draw(ctx);
    }
  };

})();
