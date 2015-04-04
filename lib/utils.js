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
		mo = {
					left: movingObject.xpos - movingObject.radius,
          right: movingObject.xpos + movingObject.radius,
					top: movingObject.ypos - movingObject.radius,
					bottom: movingObject.ypos + movingObject.radius
		}

		so = {
					left: staticObject.xpos,
          right: staticObject.xpos + staticObject.length,
					top: staticObject.ypos,
					bottom: staticObject.ypos + staticObject.width
		}

    if ((mo.bottom >= so.top && mo.bottom <= so.bottom) && (mo.right <= so.right && mo.left >= so.left - 100)){
      var onGround = true;
      movingObject.yvel = 0;
      movingObject.ypos = so.top - 1 - movingObject.radius;

    } else {
      var onGround = false;
    }

    if ((mo.top <= so.bottom - 1 && mo.top >= so.top + 1) && (mo.right <= so.right && mo.left >= so.left - 100)){
      movingObject.yvel = 5;
    }

    return onGround;
	};


})();
