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

    this.gnomes.push(newGnome)
  }


  Game.prototype.addBeans = function () {
    this.beanCounter += 1;
    if (this.beanCounter > 200 && this.beans.length < 11) {
      var beanPos = this.randomBeanPosition();
      var bean = new SFB.Bean({ game: this, xpos: beanPos[0], ypos: beanPos[1] });
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

  Game.prototype.checkBeanStaticCollisions = function(){
    var that = this;
    this.beans.forEach(function (bean) {

      that.scene.scenery.forEach(function (staticObject) {
          SFB.Utils.checkBeanStaticCollide(bean, staticObject);
      });
    });
  };

  Game.prototype.checkFartPackCollisions = function () {
    var that = this;
    this.gnomes.forEach(function (gnome) {
      that.fartPacks.forEach(function (fartPack) {
        if (gnome.hasCollidedWithMovingObject(fartPack)) {
          if (fartPack.collideWith) {
            fartPack.collideWith(gnome);
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
    ctx.fillText("Collect Beans To Power Your Fart Pack & Special Fart", 550, 50);

    var players = window.game.gnomes;
    for(var i = 1; i <= players.length; i ++) {
      player = players[i-1];
        ctx.font = "36px serif";
        ctx.fillStyle = "white";
        ctx.fillText("Player " + i + " Lives: " + player.lives, player.livesPos[0], player.livesPos[1]);
        // ctx.fillText("Player " + i + " Lives: " + player.lives, 550, 1060);

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
  var newpos = this.randomPosition()
  var newXpos = newpos[0]
  var newYpos = newpos[1]
  var beanHitBox = new SFB.Rectangle(newXpos, newYpos, 60, 87)
  if (SFB.Game.prototype.testRandomPositionCollision(beanHitBox)) {
    return SFB.Game.prototype.randomBeanPosition()
  } else {
    return newpos
  }
}

Game.prototype.testRandomPositionCollision = function (hitBox) {
  var collision = false;
  window.game.scene.scenery.forEach(function (staticObj) {
    var staticObjHitBox = new SFB.Rectangle(staticObj.xpos, staticObj.ypos, staticObj.length, staticObj.width)
    // debugger
    if (hitBox.intersects(staticObjHitBox)) {
      collision = true
    }
  })
  return collision
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


      if (GAMEMODE === "Free") {
            winner = "Player " + winner.id + " Wins!";
        $('.closing-screen')[0].classList.remove('hidden');

        $('.closing-screen-winner').append(winner);

        this.gnomes.forEach( function(gnome){
          var stats = "<ul class='player-" + gnome.id + "'>Player " + gnome.id + ":<li id='shots'>Farts Fired: " + gnome.shots + "</li><li id='hits'>Fart Hits: " + Math.floor(gnome.hits) + "</li><li id='accuracy'>Accuracy " + Math.round((gnome.hits / gnome.shots) * 100) / 100 + "</li></ul>"
          $('.individual-player-stats').append(stats);
        });
      } else {
        $('.closing-screen')[0].classList.remove('hidden');
        winningTeam = "Team " + winningTeam + " Wins!";

        $('.closing-screen-winner').append(winningTeam);


          this.gnomes.forEach( function(gnome){
            var stats = "<ul class='player-" + gnome.id + "'>Player " + gnome.id + ":<li id='shots'>Farts Fired: " + gnome.shots + "</li><li id='hits'>Fart Hits: " + Math.floor(gnome.hits) + "</li><li id='accuracy'>Accuracy " + Math.round((gnome.hits / gnome.shots) * 100) / 100 + "</li></ul>"
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
      /* Play alone and run around forever.*/
      if (this.numPlayers === 1) {
        return
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
    this.checkFartPackCollisions();
    this.checkBeanStaticCollisions();


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
      this.sprites.smoke = this.loadSprite('./sprites/smokeSprites@6.png')
      this.sprites.bounceyfart = this.loadSprite('./sprites/bounceyfart@42.png')
      this.sprites.mine = this.loadSprite('./sprites/mine@16.png')

      this.sprites.greenrunLeft = this.loadSprite('./sprites/greenrunleft@18.png');
      this.sprites.greenrunRight = this.loadSprite('./sprites/greenrunright@18.png');
      this.sprites.greenidleLeft = this.loadSprite('./sprites/greenstandLeft.png');
      this.sprites.greenidleRight = this.loadSprite('./sprites/greenstandRight.png')
      this.sprites.greengnomeFartRight = this.loadSprite('./sprites/greenFartRight@5.png')
      this.sprites.greengnomeFartLeft = this.loadSprite('./sprites/greenFartLeft@5.png')
      this.sprites.greenjumpUpLeft = this.loadSprite('./sprites/greenjumpUpLeft@12.png')
      this.sprites.greenjumpUpRight = this.loadSprite('./sprites/greenjumpUpRight@12.png')
      this.sprites.greenjumpDownLeft = this.loadSprite('./sprites/greenjumpDownLeft@5.png')
      this.sprites.greenjumpDownRight = this.loadSprite('./sprites/greenjumpDownRight@5.png')
      this.sprites.greenfartpackLeft = this.loadSprite('./sprites/greenfartpackLeft.png');
      this.sprites.greenfartpackRight = this.loadSprite('./sprites/greenfartpackRight.png');

      this.sprites.bluerunLeft = this.loadSprite('./sprites/bluerunleft@18.png');
      this.sprites.bluerunRight = this.loadSprite('./sprites/bluerunright@18.png');
      this.sprites.blueidleLeft = this.loadSprite('./sprites/bluestandLeft.png');
      this.sprites.blueidleRight = this.loadSprite('./sprites/bluestandRight.png')
      this.sprites.bluegnomeFartRight = this.loadSprite('./sprites/blueFartRight@6.png')
      this.sprites.bluegnomeFartLeft = this.loadSprite('./sprites/blueFartLeft@6.png')
      this.sprites.bluejumpUpLeft = this.loadSprite('./sprites/bluejumpUpLeft@12.png')
      this.sprites.bluejumpUpRight = this.loadSprite('./sprites/bluejumpUpRight@12.png')
      this.sprites.bluejumpDownLeft = this.loadSprite('./sprites/bluejumpDownLeft@5.png')
      this.sprites.bluejumpDownRight = this.loadSprite('./sprites/bluejumpDownRight@5.png')
      this.sprites.bluefartpackLeft = this.loadSprite('./sprites/bluefartpackLeft.png');
      this.sprites.bluefartpackRight = this.loadSprite('./sprites/bluefartpackRight.png');

      this.sprites.purplerunLeft = this.loadSprite('./sprites/purplerunleft@18.png');
      this.sprites.purplerunRight = this.loadSprite('./sprites/purplerunright@18.png');
      this.sprites.purpleidleLeft = this.loadSprite('./sprites/purplestandLeft.png');
      this.sprites.purpleidleRight = this.loadSprite('./sprites/purplestandRight.png')
      this.sprites.purplegnomeFartRight = this.loadSprite('./sprites/purpleFartRight@5.png')
      this.sprites.purplegnomeFartLeft = this.loadSprite('./sprites/purpleFartLeft@5.png')
      this.sprites.purplejumpUpLeft = this.loadSprite('./sprites/purplejumpUpLeft@12.png')
      this.sprites.purplejumpUpRight = this.loadSprite('./sprites/purplejumpUpRight@12.png')
      this.sprites.purplejumpDownLeft = this.loadSprite('./sprites/purplejumpDownLeft@5.png')
      this.sprites.purplejumpDownRight = this.loadSprite('./sprites/purplejumpDownRight@5.png')
      this.sprites.purplefartpackLeft = this.loadSprite('./sprites/purplefartpackLeft.png');
      this.sprites.purplefartpackRight = this.loadSprite('./sprites/purplefartpackRight.png');

      this.sprites.orangerunLeft = this.loadSprite('./sprites/orangerunleft@18.png');
      this.sprites.orangerunRight = this.loadSprite('./sprites/orangerunright@18.png');
      this.sprites.orangeidleLeft = this.loadSprite('./sprites/orangestandLeft.png');
      this.sprites.orangeidleRight = this.loadSprite('./sprites/orangestandRight.png')
      this.sprites.orangegnomeFartRight = this.loadSprite('./sprites/orangeFartRight@5.png')
      this.sprites.orangegnomeFartLeft = this.loadSprite('./sprites/orangeFartLeft@5.png')
      this.sprites.orangejumpUpLeft = this.loadSprite('./sprites/orangejumpUpLeft@12.png')
      this.sprites.orangejumpUpRight = this.loadSprite('./sprites/orangejumpUpRight@12.png')
      this.sprites.orangejumpDownLeft = this.loadSprite('./sprites/orangejumpDownLeft@5.png')
      this.sprites.orangejumpDownRight = this.loadSprite('./sprites/orangejumpDownRight@5.png')
      this.sprites.orangefartpackLeft = this.loadSprite('./sprites/orangefartpackLeft.png');
      this.sprites.orangefartpackRight = this.loadSprite('./sprites/orangefartpackRight.png');

      this.parts = [
      this.sprites.leg1 = this.loadSprite('./sprites/leg.png'),
      this.sprites.leg2 = this.loadSprite('./sprites/leg2.png'),
      this.sprites.boot1 = this.loadSprite('./sprites/boot.png'),
      this.sprites.boot2 = this.loadSprite('./sprites/boot2.png'),
      this.sprites.hat = this.loadSprite('./sprites/hat.png'),
      this.sprites.hand = this.loadSprite('./sprites/hand.png'),
      this.sprites.head = this.loadSprite('./sprites/head.png'),
      ]

      this.sprites.purple = this.loadSprite('./sprites/purple.png'),
      this.sprites.orange = this.loadSprite('./sprites/orange.png'),
      this.sprites.blue = this.loadSprite('./sprites/blue.png'),
      this.sprites.green = this.loadSprite('./sprites/green.png')



    };

})();
