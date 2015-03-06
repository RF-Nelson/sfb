(function () {
  if (typeof SFB === "undefined") {
    window.SFB = {};
  }

  var Game = SFB.Game = function () {
    this.gnomes = [];
    this.scene = new SFB.Scene(this);
    this.farts = [];

    this.addGnomes(2);
    //players?
  };

  Game.DIM_X = 1040;
  Game.DIM_Y = 800;
  Game.FPS = 32;

  Game.prototype.addObject = function (object) {
    if (object instanceof SFB.Fart) {
      this.farts.push(object);
    } else {
      throw "shitballs what are you doing?!?";
    }
  };

  Game.prototype.addGnomes = function (numPlayers) {
    var gnome1 = new SFB.Gnome({game: this, xpos: 100, ypos: 670, id: 1})
    var gnome2 = new SFB.Gnome({game: this, xpos: 940, ypos: 670, id: 2, color: "blue"})
    this.gnomes = [].concat(gnome1).concat(gnome2)
  };

  Game.prototype.allObjects = function () {
    return []
      .concat(this.scene)
      .concat(this.gnomes)
      .concat(this.farts);
  };

  Game.prototype.movingObjects = function () {
    return []
      .concat(this.gnomes)
      .concat(this.farts);
  };

  Game.prototype.checkCollisions = function () {
    var game = this;

    game.movingObjects().forEach(function (object1) {
      game.movingObjects().forEach(function (object2) {
        if (object1 !== object2) {
					
					if(object1 instanceof SFB.Fart){						
						if(object2 instanceof SFB.Gnome  && object2.id !== object1.gnome_id){
							console.log(object1.isCollidedWith(object2));
						}
					}
					
	        if (object1.isCollidedWith(object2)) {
	          if (object1 instanceof SFB.Fart && object2 instanceof SFB.Gnome) {
	            object1.collideWith(object2);
	          }
	        }
				}
      });
    });
  };

  Game.prototype.draw = function (ctx) {
    ctx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);
    this.allObjects().forEach(function (object) {
      object.draw(ctx);
    });
  };

  Game.prototype.isOutOfBounds = function (pos) {
    return (pos[0] < 0) || (pos[1] < 0)
      || (pos[0] > Game.DIM_X) || (pos[1] > Game.DIM_Y);
  };

  Game.prototype.moveObjects = function () {
    this.movingObjects().forEach(function (object) {
      object.move();
    });
  };

  // Game.prototype.randomPosition = function () {
  //   return [
  //     Math.ceil(Game.DIM_X * Math.random()),
  //     Math.ceil(Game.DIM_Y * Math.random())
  //   ];
  // };

  Game.prototype.remove = function (object) {
    if (object instanceof SFB.Fart) {
      this.farts.splice(this.farts.indexOf(object), 1);
    } else {
      throw "can't remove that";
    }
  };

  Game.prototype.isOver = function () {
    this.gnomes.forEach( function(gnome){
      if (gnome.health <= 0 && gnome.lives <= 0){
        return true;
      }
    }, this);
    return false;
  }

  Game.prototype.winner = function () {
    this.gnomes.forEach( function(gnome){
      if (this.isOver() && gnome.health > 0 && gnome.lives > 0){
        return gnome;
      }
    }, this);
    return null;
  }

  Game.prototype.step = function () {
    this.moveObjects();
    this.checkCollisions();
    if( this.isOver() ){
      //do something
    }
    // this.draw();
  };

  // Game.prototype.wrap = function (xpos, ) {
  //   return [
  //     wrap(pos[0], Game.DIM_X), wrap(pos[1], Game.DIM_Y)
  //   ];
  //
  //   function wrap (coord, max) {
  //     if (coord < 0) {
  //       return max - (coord % max);
  //     } else if (coord > max) {
  //       return coord % max;
  //     } else {
  //       return coord;
  //     }
  //   }
  // };
})();
