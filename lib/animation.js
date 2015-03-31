(function() {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var Animation = SFB.Animation = function (sprite, looping, frameTime) {
        this.sprite = sprite;
        this.frameTime = typeof frameTime != 'undefined' ? frameTime : 0.1;
        this.looping = looping;
    }

  SFB.Animation = Animation;

})();
