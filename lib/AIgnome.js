(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.AIGnome = function (options) {
    this.stepLength = 0;
    this.oldPos = []
    SFB.Gnome.call(this, options);
    this.currently = this.jump
    this.stepTime = 30
  };

  SFB.Utils.inherits(SFB.AIGnome, SFB.Gnome);

  SFB.AIGnome.prototype.move = function () {
    this.stepLength += 1;
    if (this.stepLength === this.stepTime && this.facing === "Right") {
      this.currently = this.runLeft
      this.stepLength = 0;
      this.stepTime = Math.floor(Math.random() * 50)
    } else if (this.stepLength === this.stepTime && this.facing === "Left") {
      this.currently = this.runRight
      this.stepLength = 0;
      this.stepTime = Math.floor(Math.random() * 50)
    }
    if (this.stepTime === 0) {
      this.stepTime = 18
    }

    if (this.stepLength === 24) {
      this.fireFart()
    }

    this.currently()
    if (this.ypos === 949 && this.xpos > 1700) {
      this.jump()
    }
    if ((this.xpos > 751 && this.xpos < 870) || (this.xpos < 1068 && this.xpos > 1000)) {
      this.jump()
    }


    /* If gnome is dead he will respawn of screen and not be allowed to move. */
    if (this.dead) {
      return
    }
    /* Friction applied at every step while the gnome is on the ground. */
    if(this.onGround){
      if(this.xvel !== 0){
        // Without the "if" below this comment, the velocity would never actually
        // hit zero. Even though the on-screen gnome wouldn't be moving, its xvel
        // would be some tiny fraction like 0.00000000001 which would still count
        // as "moving" and trigger a walking animation though the gnome is still
        if (Math.abs(this.xvel) < 0.15 ) {
          this.xvel = 0
        }
        this.xvel *= this.FRICTION;
      }
    }
    /* Add positive gravity at each step while gnome is not on the ground. */
    if (this.fartPacking && !this.onGround) {
        this.yvel += 0.1;
        this.xvel *=this.fartPackDrag
    } else if (!this.onGround){
      this.yvel += 1;
      /* Adding a air resitance component to horizontal velocity while in the air. */
      this.xvel *= this.DRAG;
    }

    this.xpos += this.xvel;
    this.ypos += this.yvel;

    var newPos = this.game.wrap([this.xpos, this.ypos]);

    // // PREVENTS GOING OFF THE TOP OF THE SCREEN
    if (newPos[1] < 50) {
      newPos[1] = 50
    }

    this.xpos = newPos[0];
    this.ypos = newPos[1];

    // KILLS GNOME IF THEY FALL BELOW THE BOTTOM OF THE SCREEN
    if (this.ypos > 1020) {
      this.respawn();
    }
  }

})();
