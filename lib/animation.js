function Animation(sprite, looping, frameTime) {
  this.sprite = sprite;
  this.frameTime = typeof frameTime !== 'undefined' ? frameTime : 0.1;
  this.looping = looping;
}
