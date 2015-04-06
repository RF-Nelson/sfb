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

	var checkStaticCollide = Utils.checkStaticCollide = function(movingObject, staticObject){

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

    if ((mo.bottom >= so.top && mo.bottom <= so.bottom) && (mo.right <= so.right + 34 && mo.left >= so.left - 34)){
      if (movingObject.yvel >= 0) {
        var onGround = true;
        movingObject.yvel = 0;
        movingObject.ypos = so.top - 1 - movingObject.radius;
      }


    } else {
      var onGround = false;
    }

    if ((mo.top <= so.bottom - 1 && mo.top >= so.top + 1) && (mo.right <= so.right + 50 && mo.left >= so.left - 50)){
      movingObject.yvel = 5;
    }

    return onGround;
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
