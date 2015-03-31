(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  SFB.AnimatedObject = function (attrs) {
    this._animations = {};
    this._current = null;
    this._time = 0;

    SFB.Utils.inherits(SFB.AnimatedObject, SFB.MovingObject)
  };


  AnimatedObject.prototype.loadAnimation = function (animname, id, looping, frametime) {
    this._animations[id] = new SFB.Animation(animname, looping, frametime);
  };

  AnimatedGameObject.prototype.playAnimation = function (id) {
    if (this._current === this._animations[id])
      return;
    this._sheetIndex = 0;
    this._time = 0;
    this._current = this._animations[id];
    this.sprite = this._current.sprite;
  };

  AnimatedGameObject.prototype.animationEnded = function () {
    return !this._current.looping && this.sheetIndex >= this.sprite.nrSheetElements - 1;
  };

  AnimatedGameObject.prototype.update = function (delta) {
    this._time += delta;
    while (this._time > this._current.frameTime) {
      this._time -= this._current.frameTime;
      this._sheetIndex++;
      if (this._sheetIndex > this.sprite.nrSheetElements - 1)
        if (this._current.looping)
          this._sheetIndex = 0;
        else
          this._sheetIndex = this.sprite.nrSheetElements - 1;
        }
    powerupjs.SpriteGameObject.prototype.update.call(this, delta);
  };

  SFB.AnimatedObject = AnimatedObject;
  return SFB;

})();
