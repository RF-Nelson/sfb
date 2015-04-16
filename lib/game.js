
(function () {
  if (typeof SFB === "undefined") {
    window.SFB = {};
  }

  var Game = SFB.Game = function (numPlayers) {
    this.over = false;
    this.numPlayers = numPlayers;
    this.numDeaths = 0;
    this.gnomes = [];
    this.scene = new SFB.Scene(this);
    this.farts = [];
    this.beans = [];
    this.beanCounter = 0;
    this.fartPacks = [];
    this.fartPackCounter = 0;

    this.delta = 20;

    this.spritesStillLoading = 0;
    this.sprites = {};
    this.loadSprites();

    /* Set 4 player starting settings */
    this.playerStartingSettings = [
      { gnomeId: 1, xpos: 100, ypos: (SFB.Game.DIM_Y - 131), color: "blue", facing: "Right", specialKey: "q", livesPos: [40, 1060] },
      { gnomeId: 2, xpos: 1640, ypos: (SFB.Game.DIM_Y - 131), color: "orange", facing: "Left", specialKey: "space", livesPos: [550, 1060] },
      { gnomeId: 3, xpos: 300, ypos: (SFB.Game.DIM_Y - 131), color: "purple", facing: "Right", specialKey: "v", livesPos: [1115, 1060] },
      { gnomeId: 4, xpos: 1340, ypos: (SFB.Game.DIM_Y - 131), color: "green", facing: "Right", specialKey: "x", livesPos: [1625, 1060] }
    ];

    this.addGnomes();

  };

  Game.DIM_X = 1920;
  Game.DIM_Y = 1080;

  Game.prototype.addGnomes = function () {
    var that = this;

    for(var i = 1; i <= this.numPlayers; i ++) {
      that.addGnome(PLAYERS[i], i);
    }

    this.addComputers();

  };

  Game.prototype.addComputers = function () {
    var that = this;

    for(var i = 1; i <= COMPUTERS; i ++) {
      that.addComputer(i);
    }
  };

  Game.prototype.addGnome = function (gnome, gnomeIndex) {
    var gnomeBasic = this.playerStartingSettings[gnomeIndex - 1];

    if (gnome.attrs.playerType === 'Normal') {
      var gnomeSpeed = 1,
          gnomeToughness = 1;
    } else if (gnome.attrs.playerType === 'Fast') {
      var gnomeSpeed = 2,
          gnomeToughness = 0.5;
    } else {
      var gnomeSpeed = 0.5,
          gnomeToughness = 2;
    }

    var newGnome = new SFB.Gnome({game: this, xpos: gnomeBasic.xpos, ypos: gnomeBasic.ypos, id: gnomeBasic.gnomeId, key: gnomeBasic.specialKey, color: gnomeBasic.color, facing: gnomeBasic.facing, onGround: true, speed: gnomeSpeed, toughness: gnomeToughness, team: gnome.attrs.playerTeam, specialFart: gnome.attrs.fart, livesPos: gnomeBasic.livesPos });

    if (gnome.attrs.fart === 'Flame') {
      newGnome.FireBalls = { "Left": new SFB.FireBall(gnomeBasic.gnomeId), "Right": new SFB.FireBall2(gnomeBasic.gnomeId)}
    } else {
      newGnome.FireBalls = false;
    }

    this.gnomes.push(newGnome);
  };

  Game.prototype.addComputer = function (gnomeIndex) {
    var gnomeBasic = this.playerStartingSettings[gnomeIndex],
        types = ['Normal', 'Fast', 'Slow'],
        farts = ['Flame', 'Bounce', 'Mine'],
        computerRandNum = Math.floor(Math.random() * (3)),
        computerFart = farts[computerRandNum],
        computerType = types[computerRandNum],
        computerTeam = gnomeIndex + 1;


      if (computerType === 'Normal') {
        var gnomeSpeed = 1,
            gnomeToughness = 1;
      } else if (computerType === 'Fast') {
        var gnomeSpeed = 2,
            gnomeToughness = 0.5;
      } else {
        var gnomeSpeed = 0.5,
            gnomeToughness = 2;
      }



    var newGnome = new SFB.AIGnome({game: this, xpos: gnomeBasic.xpos, ypos: gnomeBasic.ypos, id: gnomeBasic.gnomeId, key: gnomeBasic.specialKey, color: gnomeBasic.color, facing: gnomeBasic.facing, onGround: true, speed: gnomeSpeed, toughness: gnomeToughness, team: computerTeam, specialFart: computerFart, livesPos: gnomeBasic.livesPos });

    if (computerFart === 'Flame') {
      newGnome.FireBalls = { "Left": new SFB.FireBall(gnomeBasic.gnomeId), "Right": new SFB.FireBall2(gnomeBasic.gnomeId)}
    } else {
      newGnome.FireBalls = false;
    }

    this.gnomes.push(newGnome);

  }


  Game.prototype.addBeans = function () {
    var numBeans, beanRate
    this.beanCounter += 20;

    if (this.numPlayers <= 2) {
      numBeans = 11;
      beanRate = 2500;
    } else if (this.numPlayers === 3) {
      numBeans = 14;
      beanRate = 2300;
    } else if (this.numPlayers === 4) {
      numBeans = 16;
      beanRate = 2000;
    }

    if (this.beanCounter > beanRate && this.beans.length < numBeans) {
      var beanPos = this.randomBeanPosition(),
          bean = new SFB.Bean({ game: this, xpos: beanPos[0], ypos: beanPos[1] });
      this.beans.push(bean);
      this.beanCounter = 0;
    }
  };

  Game.prototype.addFartPacks = function () {
    this.fartPackCounter += 1;
    if (this.fartPackCounter > 200 && this.fartPacks.length < 5) {
      var fartPackPos = this.randomPosition();
      var fartPack = new SFB.FartPack({ game: this, xpos: fartPackPos[0], ypos: fartPackPos[1] });
      this.fartPacks.push(fartPack);
      this.fartPackCounter = 0;

    }
  };

  Game.prototype.handleFartTimer = function () {
    var that = this;
    this.farts.forEach(function (fart) {
      if (fart instanceof SFB.FartBounce || fart instanceof SFB.FartFlame || fart instanceof SFB.FartMine) {
          fart.timeLeft -= 20;
          if (fart.timeLeft < 1) {
            if (fart instanceof SFB.FartFlame && !(key.isPressed("s"))) {
              fart.gnome.flaming = false;
            } else if (fart instanceof SFB.FartMine){
              fart.explodable = true;
              return
            }

            that.remove(fart);
          }
      }
    });
  };

  Game.prototype.allObjects = function () {
    return []
			.concat(this.scene)
      .concat(this.scene.scenery)
      .concat(this.gnomes)
      .concat(this.farts)
      .concat(this.beans)
      .concat(this.fartPacks);

  };

  Game.prototype.movingObjects = function () {
    return []
      .concat(this.gnomes)
      .concat(this.farts);
  };

  Game.prototype.checkGnomeStaticCollisions = function(){
    var that = this;
    this.gnomes.forEach(function (object1) {
      object1.onGround = false;

      that.scene.scenery.forEach(function (object2) {
          SFB.Utils.checkGnomeStaticCollide(object1, object2)
      });
    });
  };

  Game.prototype.checkFartStaticCollisions = function(){
    var that = this;
    this.farts.forEach(function (fart) {
      if (fart instanceof SFB.FartBounce) {
        that.scene.scenery.forEach(function (staticObject) {
          if (SFB.Utils.checkFartStaticCollide(fart, staticObject)[1]) {
            fart.handleBounce('side');
          } else if (SFB.Utils.checkFartStaticCollide(fart, staticObject)[0]) {
            fart.handleBounce('ground');
          }
        });
      } else if (fart instanceof SFB.FartMine) {
        that.scene.scenery.forEach(function (staticObject) {
          (SFB.Utils.checkFartStaticCollide(fart, staticObject));
        });
      }
    });
  };

  Game.prototype.checkBeanCollisions = function () {
    var that = this;
    this.gnomes.forEach(function (gnome) {
      that.beans.forEach(function (bean) {
        if (gnome.hasCollidedWithMovingObject(bean)) {
          if (bean.collideWith) {
            bean.collideWith(gnome);
          }
        }
      });
    });
  };

  Game.prototype.checkFartCollisions = function () {
    var that = this;
    this.gnomes.forEach(function (gnome) {
      that.farts.forEach(function (fart) {
        if (gnome.hasCollidedWithMovingObject(fart)) {
            fart.collideWith(gnome, fart);
        }
      });
    });
  };

  Game.prototype.draw = function (ctx) {
    // console.log(countFPS())

    var ctx = this.ctx
    if (!ctx) {
      ctx = window.game.ctx
    }
    // window.game.drawScreen(window.game.ctx)
    var canvasScale = SFB.GameView.prototype.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;
    ctx.save();

    ctx.scale(scale * canvasScale.x, scale * canvasScale.y)
    ctx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);

    ctx.font = "36px serif";
    ctx.fillStyle = "black";
    ctx.fillText("Collect Beans To Power Your Jet Pack & Special Attack", 550, 50);

    ctx.font = "36px serif";
    ctx.fillStyle = "black";
    ctx.fillText("Press Space/Start to pause.", 750, 90);

    var players = window.game.gnomes;
    for(var i = 1; i <= players.length; i ++) {
      player = players[i-1];
        ctx.font = "36px serif";
        ctx.fillStyle = "white";
        ctx.fillText("Player " + i + " Lives: " + player.lives, player.livesPos[0], player.livesPos[1]);

    }

    ctx.restore()
    var objectDrawOrder = [];
    // var objectsWithoutLayerAttr = [];
    var objectsWithLayerAttr = [[],[],[]];

    window.game.allObjects().forEach(function (object) {

      if (object.layer === undefined) {
        object.draw(ctx);
      } else {
        objectsWithLayerAttr[object.layer].push(object)
      }
    });

    objectsWithLayerAttr.forEach(function (layer) {
      layer.forEach(function (object) {
        object.draw(ctx);
      });
    });

    // UPDATE FART IMPACT EXPLOSION EFFECTS
    var canvas = document.getElementById('fireworks');
    if (canvas && window.emitter) {
      var fireworksCtx= canvas.getContext( '2d' );
      fireworksCtx.save()
      if (window.emitter) {
        fireworksCtx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);
        window.emitter.update(window.game.delta/1000).render()
      }
      fireworksCtx.scale(scale * canvasScale.x, scale * canvasScale.y)
      fireworksCtx.restore()
    }

    // UPDATE MINE EXPLOSION EFFECTS
    var canvas = document.getElementById('mine');
    if (canvas && window.emitter) {
      var fireworksCtx= canvas.getContext( '2d' );
      fireworksCtx.save()
      if (window.emitter2) {
        fireworksCtx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);
        window.emitter2.update(window.game.delta/1000).render()
      }
      fireworksCtx.scale(scale * canvasScale.x, scale * canvasScale.y)
      fireworksCtx.restore()
    }

    // UPDATE FLAMETHROWER EFFECTS
    var flamethrowerCanvas = document.getElementById('flamethrower');
       var fireBallPresence = false;
       for (var i = 0; i < window.game.gnomes.length; i++) {
         if (window.game.gnomes[i].FireBalls) {
           var fireBallPresence = true;
         }
       }

      if (flamethrowerCanvas && fireBallPresence) {

      var flamethrowerCtx = flamethrowerCanvas.getContext( '2d' )
      flamethrowerCtx.save()
      flamethrowerCtx.clearRect(0, 0, Game.DIM_X, Game.DIM_Y);

      for (var i = 0; i < window.game.gnomes.length; i++) {
        if (window.game.gnomes[i].FireBalls) {
          if (window.game.gnomes[i].FireBalls.Left.effect && (window.game.gnomes[i].FireBalls.Left.effect._started)) {
            window.game.gnomes[i].FireBalls.Left.effect.update(window.game.delta/1000).render()
          }
          if (window.game.gnomes[i].FireBalls.Right.effect && (window.game.gnomes[i].FireBalls.Right.effect._started)) {
            window.game.gnomes[i].FireBalls.Right.effect.update(window.game.delta/1000).render()
          }
        }
      }
      flamethrowerCtx.scale(scale * canvasScale.x, scale * canvasScale.y)
      flamethrowerCtx.restore()
    }

    setTimeout(function () {
      window.requestAnimationFrame(window.game.draw)}, window.game.delta)
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

  Game.prototype.randomPosition = function () {
    return [
      Math.ceil(Game.DIM_X * Math.random()),
      Math.ceil(900 * Math.random())
    ];
  };

  Game.prototype.randomBeanPosition = function () {
  var newpos = this.randomPosition(),
      newXpos = newpos[0],
      newYpos = newpos[1],
      beanHitBox = new SFB.Rectangle(newXpos, newYpos, 60, 87);

  if (this.testRandomPositionCollision(beanHitBox)) {
    return SFB.Game.prototype.randomBeanPosition();
  } else {
    return newpos;
  }
}

Game.prototype.testRandomPositionCollision = function (hitBox) {
  var collision = false;
  window.game.scene.scenery.forEach(function (staticObj) {
    var staticObjHitBox = new SFB.Rectangle(staticObj.xpos, staticObj.ypos, staticObj.length, staticObj.width)
    if (hitBox.intersects(staticObjHitBox)) {
      collision = true;
    }
  })
  return collision;
}

  Game.prototype.remove = function (object) {
    if (object instanceof SFB.Fart) {
      this.farts.splice(this.farts.indexOf(object), 1);
    } else if (object instanceof SFB.Bean) {
      this.beans.splice(this.beans.indexOf(object), 1);
    } else if (object instanceof SFB.FartPack) {
      this.fartPacks.splice(this.fartPacks.indexOf(object), 1);
    }
  };


  Game.prototype.gameOver = function () {
    this.over = true;
    var body = $("body");
    body[0].classList.remove('white-body');
    $('#gameArea')[0].classList.add('hidden');
    var winner, winningTeam

    this.gnomes.forEach( function(gnome){
      if (!gnome.dead) {
        winner = gnome;
        winningTeam = winner.team;
      }
    });

    if (GAMEMODE === "Single") {
      var gnome = this.gnomes[0];
      if (gnome.dead) {
        winner = "You Lose!";
      } else {
        winner = "You Win!";
      }

      $('.closing-screen')[0].classList.remove('hidden');

      $('.closing-screen-winner').html(winner);
      $('.individual-player-stats').empty();


      var stats = "<ul class='player-" + gnome.id + "'>Player Stats:<li id='shots'>Shots: " + gnome.shots + "</li><li id='hits'>Hits: " + Math.floor(gnome.hits) + "</li><li id='accuracy'>Accuracy " + Math.round((gnome.hits / gnome.shots) * 100) / 100 + "</li></ul>"
      $('.individual-player-stats').append(stats);

      return;
    }

    if (GAMEMODE === "Free") {
          winner = "Player " + winner.id + " Wins!";
      $('.closing-screen')[0].classList.remove('hidden');

      $('.closing-screen-winner').html(winner);
      $('.individual-player-stats').empty();

      this.gnomes.forEach( function(gnome){
        var stats = "<ul class='player-" + gnome.id + "'>Player " + gnome.id + ":<li id='shots'>Shots: " + gnome.shots + "</li><li id='hits'>Hits: " + Math.floor(gnome.hits) + "</li><li id='accuracy'>Accuracy " + Math.round((gnome.hits / gnome.shots) * 100) / 100 + "</li></ul>"
        $('.individual-player-stats').append(stats);
      });
    } else {
      $('.closing-screen')[0].classList.remove('hidden');
      winningTeam = "Team " + winningTeam + " Wins!";

      $('.closing-screen-winner').html(winningTeam);
      $('.individual-player-stats').empty();


        this.gnomes.forEach( function(gnome){
          var stats = "<ul class='player-" + gnome.id + "'>Player " + gnome.id + ":<li id='shots'>Shots: " + gnome.shots + "</li><li id='hits'>Hits: " + Math.floor(gnome.hits) + "</li><li id='accuracy'>Accuracy " + Math.round((gnome.hits / gnome.shots) * 100) / 100 + "</li></ul>"
          $('.individual-player-stats').append(stats);
        });
    }

  };

    Game.prototype.teamAlone = function () {
        var livingGnomes = [];
        this.gnomes.forEach( function(gnome){
          if (!gnome.dead) {
            livingGnomes.push(gnome);
          }
        });

        var aloneStatus = true;
        livingGnomes.forEach( function(gnome1) {
          livingGnomes.forEach( function(gnome2) {
            if (gnome1.team !== gnome2.team) {
              aloneStatus = false;
            }
          });
        });

        return aloneStatus;
    }


    Game.prototype.isOver = function () {
      if (GAMEMODE === "Single") {
        if ((this.numDeaths === COMPUTERS) || (this.gnomes[0].dead)) {
          return true;
        } else {
          return false;
        }
      }


      if (this.numDeaths === this.numPlayers - 1) {
        return true;
      } else if (GAMEMODE === "Team" && this.teamAlone()){
        return true;
      } else {
        return false;
      }
    };

    Game.prototype.winner = function () {
      this.gnomes.forEach( function(gnome){
        if (gnome.lives > 0) {
          return gnome;
        }
      });
    };

    Game.prototype.winningTeam = function () {
      return this.winner().team;
    };

  Game.prototype.step = function () {
    this.checkFartCollisions();
		this.checkGnomeStaticCollisions();
    this.checkFartStaticCollisions();
    this.checkBeanCollisions();

    this.moveObjects();

    this.gnomes.forEach( function (gnome) {
      gnome.fartPackTimer();
    });
    this.handleFartTimer();


    if (this.isOver()){
      this.gameOver();
    }

  };

  Game.prototype.wrap = function (pos, yvel) {
    return [
      wrap(pos[0], SFB.Game.DIM_X), wrap(pos[1], Game.DIM_Y)
    ]

    function wrap (coord, max) {
      if (coord < 0) {
        return max - (-coord);
      } else if (coord > max) {
        return coord - max;
      } else {
        return coord;
      }
    }
  }


// animation-dependent additions by Rich are below this comment

  //loads & creates queue of images/animations to load (used by index.html)
  Game.prototype.loadSprite = function (imageName) {
    return new SFB.SpriteSheet(imageName);
  };

  Game.prototype.drawImage = function (sprite, ctx, xpos, ypos) {
    var canvasScale = SFB.GameView.scale;
    scale = typeof scale !== 'undefined' ? scale : 1;
    ctx.save();
    ctx.scale(scale * canvasScale.x, scale * canvasScale.y);
    ctx.translate(xpos, ypos);
    ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
    ctx.restore();
  };

  Game.prototype.drawImageTwo = function (sprite, ctx, xpos, ypos, sourceRect) {
        var origin = SFB.Vector2.zero
        var canvasScale = SFB.GameView.prototype.scale;
        scale = typeof scale !== 'undefined' ? scale : 1;
        ctx.save();

        ctx.scale(scale * canvasScale.x, scale * canvasScale.y);

        ctx.translate(xpos, ypos);
        ctx.drawImage(sprite, sourceRect.x, sourceRect.y,
            sourceRect.width, sourceRect.height,
            -origin.x, -origin.y,
            sourceRect.width, sourceRect.height);


        // THIS IS AN IF STATEMENT TO MIRROR THE IMAGE, NOT IMPLEMENTED CURRENTLY (OBVIOUSLY, BECAUSE IT'S COMMENTED OUT)
        // if (mirror) {
        //     ctx.scale(scale * canvasScale.x * -1, scale * canvasScale.y);
        //     ctx.translate(-position.x - sourceRect.width, position.y);
        //     ctx.rotate(rotation);
        //     ctx.drawImageTwo(sprite, sourceRect.x, sourceRect.y,
        //         sourceRect.width, sourceRect.height,
        //         sourceRect.width - origin.x, -origin.y,
        //         sourceRect.width, sourceRect.height);
        // }
        // else {
        //     ctx.scale(scale * canvasScale.x, scale * canvasScale.y);
        //     ctx.translate(position.x, position.y);
        //     ctx.rotate(rotation);
        //     ctx.drawImageTwo(sprite, sourceRect.x, sourceRect.y,
        //         sourceRect.width, sourceRect.height,
        //         -origin.x, -origin.y,
        //         sourceRect.width, sourceRect.height);
        // }



        ctx.restore();
    };

    Game.prototype.loadSprites = function () {
      this.sprites.beans = this.loadSprite('./sprites/beans@16.png')
      this.sprites.cloud = this.loadSprite('./sprites/cloud@11.png')
      this.sprites.smoke = this.loadSprite('./sprites/smokesprites@6.png')
      this.sprites.bounceyfart = this.loadSprite('./sprites/bounceyfart@42.png')
      this.sprites.mine = this.loadSprite('./sprites/mine@16.png')

      this.sprites.greenrunLeft = this.loadSprite('./sprites/greenrunleft@18.png');
      this.sprites.greenrunRight = this.loadSprite('./sprites/greenrunright@18.png');
      this.sprites.greenidleLeft = this.loadSprite('./sprites/greenstandLeft.png');
      this.sprites.greenidleRight = this.loadSprite('./sprites/greenstandRight.png')
      this.sprites.greengnomeFartRight = this.loadSprite('./sprites/greenfartright@5.png')
      this.sprites.greengnomeFartLeft = this.loadSprite('./sprites/greenFartLeft@5.png')
      this.sprites.greenjumpUpLeft = this.loadSprite('./sprites/greenjumpUpLeft@12.png')
      this.sprites.greenjumpUpRight = this.loadSprite('./sprites/greenjumpupright@12.png')
      this.sprites.greenjumpDownLeft = this.loadSprite('./sprites/greenjumpdownleft@5.png')
      this.sprites.greenjumpDownRight = this.loadSprite('./sprites/greenjumpdownright@5.png')
      this.sprites.greenfartpackLeft = this.loadSprite('./sprites/greenfartpackleft.png');
      this.sprites.greenfartpackRight = this.loadSprite('./sprites/greenfartpackright.png');

      this.sprites.bluerunLeft = this.loadSprite('./sprites/bluerunleft@18.png');
      this.sprites.bluerunRight = this.loadSprite('./sprites/bluerunright@18.png');
      this.sprites.blueidleLeft = this.loadSprite('./sprites/bluestandleft.png');
      this.sprites.blueidleRight = this.loadSprite('./sprites/bluestandright.png')
      this.sprites.bluegnomeFartRight = this.loadSprite('./sprites/bluefartright@6.png')
      this.sprites.bluegnomeFartLeft = this.loadSprite('./sprites/bluefartleft@6.png')
      this.sprites.bluejumpUpLeft = this.loadSprite('./sprites/bluejumpupleft@12.png')
      this.sprites.bluejumpUpRight = this.loadSprite('./sprites/bluejumpupright@12.png')
      this.sprites.bluejumpDownLeft = this.loadSprite('./sprites/bluejumpdownleft@5.png')
      this.sprites.bluejumpDownRight = this.loadSprite('./sprites/bluejumpdownright@5.png')
      this.sprites.bluefartpackLeft = this.loadSprite('./sprites/bluefartpackleft.png');
      this.sprites.bluefartpackRight = this.loadSprite('./sprites/bluefartpackright.png');

      this.sprites.purplerunLeft = this.loadSprite('./sprites/purplerunleft@18.png');
      this.sprites.purplerunRight = this.loadSprite('./sprites/purplerunright@18.png');
      this.sprites.purpleidleLeft = this.loadSprite('./sprites/purplestandleft.png');
      this.sprites.purpleidleRight = this.loadSprite('./sprites/purplestandright.png')
      this.sprites.purplegnomeFartRight = this.loadSprite('./sprites/purplefartright@5.png')
      this.sprites.purplegnomeFartLeft = this.loadSprite('./sprites/purplefartleft@5.png')
      this.sprites.purplejumpUpLeft = this.loadSprite('./sprites/purplejumpupleft@12.png')
      this.sprites.purplejumpUpRight = this.loadSprite('./sprites/purplejumpupright@12.png')
      this.sprites.purplejumpDownLeft = this.loadSprite('./sprites/purplejumpdownleft@5.png')
      this.sprites.purplejumpDownRight = this.loadSprite('./sprites/purplejumpDownright@5.png')
      this.sprites.purplefartpackLeft = this.loadSprite('./sprites/purplefartpackleft.png');
      this.sprites.purplefartpackRight = this.loadSprite('./sprites/purplefartpackright.png');

      this.sprites.orangerunLeft = this.loadSprite('./sprites/orangerunleft@18.png');
      this.sprites.orangerunRight = this.loadSprite('./sprites/orangerunright@18.png');
      this.sprites.orangeidleLeft = this.loadSprite('./sprites/orangestandleft.png');
      this.sprites.orangeidleRight = this.loadSprite('./sprites/orangestandright.png')
      this.sprites.orangegnomeFartRight = this.loadSprite('./sprites/orangefartright@5.png')
      this.sprites.orangegnomeFartLeft = this.loadSprite('./sprites/orangefartleft@5.png')
      this.sprites.orangejumpUpLeft = this.loadSprite('./sprites/orangejumpupleft@12.png')
      this.sprites.orangejumpUpRight = this.loadSprite('./sprites/orangejumpupright@12.png')
      this.sprites.orangejumpDownLeft = this.loadSprite('./sprites/orangejumpdownleft@5.png')
      this.sprites.orangejumpDownRight = this.loadSprite('./sprites/orangejumpdownright@5.png')
      this.sprites.orangefartpackLeft = this.loadSprite('./sprites/orangefartpackleft.png');
      this.sprites.orangefartpackRight = this.loadSprite('./sprites/orangefartpackright.png');

      this.parts = [
      this.sprites.leg1 = this.loadSprite('./sprites/leg@3.png'),
      this.sprites.leg2 = this.loadSprite('./sprites/leg2@3.png'),
      this.sprites.boot1 = this.loadSprite('./sprites/boot@3.png'),
      this.sprites.boot2 = this.loadSprite('./sprites/boot2@3.png'),
      this.sprites.hat = this.loadSprite('./sprites/hat@3.png'),
      this.sprites.hand = this.loadSprite('./sprites/hand@3.png'),
      this.sprites.head = this.loadSprite('./sprites/head@3.png'),
      ]

      this.sprites.purple = this.loadSprite('./sprites/purple@3.png'),
      this.sprites.orange = this.loadSprite('./sprites/orange@3.png'),
      this.sprites.blue = this.loadSprite('./sprites/blue@3.png'),
      this.sprites.green = this.loadSprite('./sprites/green@3.png')



    };

})();
