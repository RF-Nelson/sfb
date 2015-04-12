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

  var checkBeanStaticCollide = Utils.checkBeanStaticCollide = function(bean, staticObject){
    beanBox = {
          left: bean.hitBox().left,
          right: bean.hitBox().right,
          top: bean.hitBox().top,
          bottom: bean.hitBox().bottom
    }

   staticObject = {
         left: staticObject.xpos,
         right: staticObject.xpos + staticObject.length,
         top: staticObject.ypos,
         bottom: staticObject.ypos + staticObject.width
   }

   if ((beanBox.bottom >= staticObject.top && beanBox.bottom <= staticObject.bottom) && (beanBox.right <= staticObject.right && beanBox.left >= staticObject.left)){
       bean.ypos = staticObject.top - (50);
     }
 };


	var checkGnomeStaticCollide = Utils.checkGnomeStaticCollide = function(movingObject, staticObject){
    // THIS USES GNOME's RECTANGULAR HITBOX
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


    var onGround = this.checkGnomeTopStaticCollide(movingObject, staticObject, mo, so);
    if (!movingObject.onGround) {
      if (onGround) {
        movingObject.onGround = true;
      } else {
        this.checkGnomeSideStaticCollide(movingObject, staticObject, mo, so);
        this.checkGnomeBottomStaticCollide(movingObject, staticObject, mo, so);
      }
    }
  };

  var checkGnomeTopStaticCollide = Utils.checkGnomeTopStaticCollide = function(movingObject, staticObject, mo, so) {
    if ((mo.bottom >= so.top && mo.bottom <= so.bottom) && (mo.right <= so.right + 50 && mo.left >= so.left - 50)){
      if (movingObject.yvel >= 0) {
        movingObject.yvel = 0;
        movingObject.ypos = so.top - (movingObject.hitBox().height - 120);
        return true;

      }
    } else {
      return false;
    }

  };

  var checkGnomeBottomStaticCollide = Utils.checkGnomeBottomStaticCollide = function(movingObject, staticObject, mo, so) {
    if ((mo.top <= so.bottom - 1 && mo.top >= so.top + 1) && (mo.left <= so.right && mo.right >= so.left)){
      movingObject.yvel = 5;
    }
  };

  var checkGnomeSideStaticCollide = Utils.checkGnomeSideStaticCollide = function(movingObject, staticObject, mo, so) {
    if (mo.right < so.right && mo.right > so.left - 10) {
      if ((mo.top > so.top && mo.top < so.bottom) || (mo.bottom - 6 > so.top && mo.bottom < so.bottom)) {
        if (movingObject.facing === "Right" && movingObject.xvel > 1) {
          (movingObject.xvel = - 1);
        } else {
          movingObject.xvel = -2;
        }
        return
      }
    } else if (mo.left < so.right + 10&& mo.left > so.left) {
      if ((mo.top >= so.top && mo.bottom <= so.bottom) || (mo.bottom - 6 > so.top && mo.bottom < so.bottom)){
        if (movingObject.facing === "Left" && movingObject.xvel < - 1) {
          (movingObject.xvel = 1);
        } else {
          movingObject.xvel = 2;
        }
      }
      return
    }
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
