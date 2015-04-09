  (function() {
    if (window.SFB === undefined) {
      window.SFB = {};
    }

    SFB.Death = function (gnome) {

      SFB.Animation.prototype.mineExplosion(gnome.xpos, gnome.ypos)

      if (gnome.color = "green") {
        var body = new SFB.AnimatedObject({
          wrappable: false,
          xvel: -20,
          yvel: 20,
          xpos: gnome.xpos,
          ypos: gnome.ypos

        })
      } else if (gnome.color = "blue") {
        var body = new SFB.AnimatedObject({
          wrappable: false,
          xvel: -20,
          yvel: -20,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        })
      } else if (gnome.color = "orange") {
        var body = new SFB.AnimatedObject({
          wrappable: false,
          xvel: -20,
          yvel: 20,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        })
      } else {
        var body = new SFB.AnimatedObject({
          wrappable: false,
          xvel: 20,
          yvel: -20,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        })
      }


      window.bodyParts = [
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: 13,
          yvel: -18,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: -20,
          yvel: -10,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: -15,
          yvel: 5,
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
          xvel: 18,
          yvel: -11,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: 13,
          yvel: -20,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        new SFB.AnimatedObject({
          wrappable: false,
          xvel: 10,
          yvel: -20,
          xpos: gnome.xpos,
          ypos: gnome.ypos
        }),
        body
      ]

      // if (window.game){if (gnome.color === "blue") {
      //   bodyParts[7].game = window.game
      //   bodyParts[7].loadAnimation(window.game.sprites.blue, "anim")
      //   bodyParts[7].hitBox = function () { return new SFB.Rectangle(0,0,0,0) }
      //   bodyParts[7].playAnimation("anim")
      //   bodyParts[7].wrappable = false
      //   window.game.farts.push(bodyParts[i])
      // }}

      if (window.game)

      {for (var i = 0; i < window.game.parts.length; i++) {
          bodyParts[i].game = window.game
          bodyParts[i].loadAnimation(window.game.parts[i], "anim", false)
          bodyParts[i].hitBox = function () { return new SFB.Rectangle(0,0,0,0) }
          bodyParts[i].playAnimation("anim")
          bodyParts[i].wrappable = false
          window.game.farts.push(bodyParts[i])
      };}
    }

})();
