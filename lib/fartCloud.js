// To start, I copied and pasted the fart.js file to give me something
// to work with so a lot of the variables are recreated unnecessarily

if (typeof SFB === "undefined") {
  window.SFB = {};
}


// the way we wrote it, all farts are going to be given an
// xpos and a ypos upon creation; for the fart cloud, that will be
// center fart circle. The "cloud" will be an array of circles,
// and the draw and collision methods from super will have to be
// overwritten. isCollidedWith will have to check all the circles in the
// array of circles for collisions, and draw will have to draw all of
// those circles. The gnome class was changed to fire the Fartcloud object
//
// Originally the array of fartCircles was just going to be an array of xpos&ypos
// which would represent the location of the center of each circle in the
// cloud. After thinking about it, I think the array of fartCircles should
// contain actual SFB. Fart objects, which would individually know how to move
// and draw themselves.
SFB.FartCloud = function (attrs) {

  attrs.xvel = attrs.xvel > 0 ? 2*attrs.xvel : 10;
  attrs.yvel = 0;
	attrs.radius = 10;
  attrs.color = 'grey';
  SFB.MovingObject.call(this, attrs);
  // this.strength = attrs.strength;
  this.wrappable = false;
  this.game.farts.push(this);
  this.gnome_id = attrs.gnome_id;
  this.fartCircles = SFB.FartCloud.prototype.makeFartCircles(attrs)
};

  SFB.Utils.inherits(SFB.FartCloud, SFB.Fart)

SFB.FartCloud.prototype.makeFartCircles = function (attrs) {
  // set the x,y of the middle fart circle (center of fart cloud)
  var arrayOfFartCircles = []
  // arrayOfFartCircles.push([xpos, ypos])
  // make new circles based off of xpos&ypos and add those to array of circles
  var deltas = [[10,10], [-10,-10], [-10, 10], [10, -10], [14, 0], [-14, 0]]
  deltas.forEach(function (delta) {
    arrayOfFartCircles.push(new SFB.FartCloud({
      xpos: attrs.xpos + delta[0], ypos: attrs.ypos + delta[1],
      xvel: attrs.xvel, yvel: attrs.yvel,
      game: attrs.game, gnome_id: attrs.id
    }))
  })
  return arrayOfFartCircles
}


// first i tried overwriting the collision and draw/move methods.
// couldn't get that to work. then i commented them out (below) to see if
// each newly created fart could just keep track of itself.
// it does not work as intended--the farts do not travel as a cohesive unit
// and they also injure the person firing the fart cloud.


// SFB.FartCloud.prototype.collideWith = function (gnome) {
//   if (this.gnome_id !== gnome.id) {
//     gnome.handleHit();
//     this.game.remove(this);
//     return true
//   }
//   return false
// };
//
// SFB.FartCloud.prototype.isCollidedWith = function (otherObject) {
//   // ignore other Farts
//   debugger
//   if (otherObject instanceof SFB.Fart) {
//     return false
//   }
//
//   // check each fart in this.fartCircles for a collision
//   this.fartCircles.forEach(function (fartCircle) {
//       if (fartCircle.isCollidedWith(otherObject)) {
//         return true;
//       }
//     })
//   return false;
// };
//
// SFB.FartCloud.prototype.draw = function (ctx) {
//   // draw each fart circle in this.fartCircles
//   this.fartCircles.forEach(function (fartCircle) {
//     fartCircle.draw(ctx)
//   })
// };
