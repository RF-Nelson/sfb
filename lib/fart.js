if (typeof SFB === "undefined") {
  window.SFB = {};
}

var Fart = function (gnome_id, gnome_xpos, gnome_ypos, gnome_xvel, gnome_yvel, color,
  radius, game, strength) {

  this.gnome_id = gnome_id;
  this.xpos = gnome_xpos + gnome_xvel;
  this.ypos = gnome_ypos + gnome_yvel;
  this.xvel = gnome_xvel;
  this.yvel = gnome_yvel;
  this.color = color;
  this.radius = radius;
  this.game = game;
  this.strength = strength;
  this.wrappable = false;
  this.game.allObjects.push(this);
};
