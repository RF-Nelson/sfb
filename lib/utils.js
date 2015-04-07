(function () {
  if (window.SFB === undefined) {
    window.SFB = {};
  }

  var Utils = SFB.Utils = {}

  var inherits = Utils.inherits = function(childClass, parentClass){
    var Surrogate = function(){};
    Surrogate.prototype = parentClass.prototype;
    childClass.prototype = new Surrogate();
  };

	var distance = Utils.distance = function(object1, object2){
		deltaxsq = Math.pow(object1.xpos - object2.xpos, 2)
		deltaysq = Math.pow(object1.ypos - object2.ypos, 2)

		var result = Math.sqrt( deltaxsq + deltaysq );

		return result;
	}

	var checkGnomeStaticCollide = Utils.checkGnomeStaticCollide = function(movingObject, staticObject){
    // THIS USES GNOME's RECTANGULAR HITBOX
     mo = {
           left: movingObject.hitBox().left,
           right: movingObject.hitBox().right,
           top: movingObject.hitBox().top,
           bottom: movingObject.hitBox().bottom
     }
     // THIS USES GNOME's RADIUS
		// mo = {
		// 			left: movingObject.xpos - movingObject.radius,
    //       right: movingObject.xpos + movingObject.radius,
		// 			top: movingObject.ypos - movingObject.radius,
		// 			bottom: movingObject.ypos + movingObject.radius
		// }

		so = {
					left: staticObject.xpos,
          right: staticObject.xpos + staticObject.length,
					top: staticObject.ypos,
					bottom: staticObject.ypos + staticObject.width
		}

    if ((mo.bottom >= so.top && mo.bottom <= so.bottom) && (mo.right <= so.right + 50 && mo.left >= so.left - 50)){
      if (movingObject.yvel >= 0) {
        var onGround = true;
        movingObject.yvel = 0;
        // movingObject.ypos = so.top - 1 - movingObject.radius;
        movingObject.ypos = so.top - (movingObject.hitBox().height - 120);
      }


    } else {
      var onGround = false;
    }

    if ((mo.top <= so.bottom - 1 && mo.top >= so.top + 1) && (mo.right <= so.right + 50 && mo.left >= so.left - 50)){
      movingObject.yvel = 5;
    }

    // if ((mo.top >= so.top && mo.top >= so.top + 1) && (mo.right <= so.right + 50 && mo.left >= so.left - 50)){
    //   movingObject.yvel = 5;
    // }

    if ((mo.right >= so.left - 15 && mo.right <= so.right) && (mo.top >= so.top && mo.bottom <= so.bottom)) {
      movingObject.xvel = movingObject.facing === "Right" ? (movingObject.xvel * - 2) : 0;

    } else if ((mo.left <= so.right && mo.left >= so.left) && (mo.top >= so.top && mo.bottom <= so.bottom)) {
      movingObject.xvel = movingObject.facing === "Left" ? (movingObject.xvel * - 2) : 0;
    }

    return onGround;
	};

  var checkFartStaticCollide = Utils.checkFartStaticCollide = function(movingObject, staticObject){
    // THIS USES FART's RECTANGULAR HITBOX
     mo = {
           left: movingObject.hitBox().left,
           right: movingObject.hitBox().right,
           top: movingObject.hitBox().top,
           bottom: movingObject.hitBox().bottom
     }

    so = {
          left: staticObject.xpos,
          right: staticObject.xpos + staticObject.length,
          top: staticObject.ypos,
          bottom: staticObject.ypos + staticObject.width
    }

    if ((mo.bottom >= so.top && mo.bottom <= so.bottom) && (mo.right <= so.right + 34 && mo.left >= so.left - 34)){
      if (movingObject.yvel >= 0) {
        if (movingObject instanceof SFB.FartMine) {
          movingObject.yvel = 0;
          movingObject.xvel = 0;
          movingObject.ypos = so.top - 1 - movingObject.radius;
        } else {
          var onGround = true;
          var hitSide = false;
          movingObject.ypos = so.top - 20 - movingObject.radius;
        }
      }
    } else if ((mo.top <= so.bottom - 1 && mo.top >= so.top + 1) && (mo.right <= so.right + 50 && mo.left >= so.left - 50)) {
      var onGround = true;
      var hitSide = false;

    } else if (((mo.right >= so.left && mo.right <= so.right) || (mo.left <= so.right && mo.left >= so.left)) && ((mo.top >= so.top) && (mo.bottom <= so.bottom))) {
      var onGround = false;
      var hitSide = true;
    } else {
      var onGround = false;
      var hitSide = false;
    }

    return [onGround, hitSide];
  };

  var checkMovingCollide = Utils.checkMovingCollide = function(movingObject, otherMovingObject){
     mo = {
           left: movingObject.hitBox().left,
           right: movingObject.hitBox().right,
           top: movingObject.hitBox().top,
           bottom: movingObject.hitBox().bottom
     }

    so = {
          left: movingObject.hitBox().left,
          right: movingObject.hitBox().right,
          top: movingObject.hitBox().top,
          bottom: movingObject.hitBox().bottom
    }

    if ((mo.bottom >= so.top && mo.bottom <= so.bottom) && (mo.right <= so.right && mo.left >= so.left)){
      return true
    } else {
      return false;
    }
  };

})();
