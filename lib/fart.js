if (typeof SFB === "undefined") {
  window.SFB = {};
}

SFB.Fart = function (attrs) {

  attrs.xvel = attrs.xvel > 0 ? 2*attrs.xvel : 10;
  attrs.yvel = 0;
	attrs.radius = 10;
  attrs.color = 'red';
  SFB.MovingObject.call(this, attrs);
  // this.strength = attrs.strength;
  this.wrappable = false;
  this.game.farts.push(this);
  this.gnome_id = attrs.gnome_id;
};

  SFB.Utils.inherits(SFB.Fart, SFB.MovingObject)

SFB.Fart.prototype.collideWith = function (gnome) {
  if (this.gnome_id !== gnome.id) {
    gnome.handleHit();
    this.game.remove(this);
    return true
  }
  return false
};
