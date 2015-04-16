  (function() {
    if (window.SFB === undefined) {
      window.SFB = {};
    }

    SFB.Death = function (gnome) {

      SFB.Animation.prototype.explosion(gnome.xpos + 60, gnome.ypos + 60)
      SFB.Animation.prototype.mineExplosion(gnome.xpos + 40, gnome.ypos + 40)

      window.bodyParts = [
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: -24,
          yvel: -9,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: -16,
          yvel: 9,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: -15,
          yvel: 15,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: -20,
          yvel: 15,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: 8,
          yvel: -16,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: 13,
          yvel: 2,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: 10,
          yvel: -2,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: 20,
          yvel: -10,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        })
      ]

      if (window.game) {
        if (gnome.color === "blue") {
          bodyParts[7].loadAnimation(window.game.sprites.blue, "anim", true, 0.025)
        } else if (gnome.color === "green") {
          bodyParts[7].loadAnimation(window.game.sprites.green, "anim", true, 0.025)
        } else if (gnome.color === "purple") {
          bodyParts[7].loadAnimation(window.game.sprites.purple, "anim", true, 0.025)
        } else {
          bodyParts[7].loadAnimation(window.game.sprites.orange, "anim", true, 0.025)
        }
        bodyParts[7].game = window.game
        bodyParts[7].hitBox = function () { return new SFB.Rectangle(0,0,0,0) }
        bodyParts[7].playAnimation("anim")
        bodyParts[7].wrappable = false
        debugger
        window.game.farts.push(bodyParts[7])
      }

      if (window.game) {
        for (var i = 0; i < window.game.parts.length; i++) {
          bodyParts[i].game = window.game
          bodyParts[i].loadAnimation(window.game.parts[i], "anim", true, 0.025)
          bodyParts[i].hitBox = function () { return new SFB.Rectangle(0,0,0,0) }
          bodyParts[i].playAnimation("anim")
          bodyParts[i].wrappable = false
          window.game.farts.push(bodyParts[i])
        };
      }

    }

})();
