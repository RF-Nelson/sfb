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
		if( !(movingObject instanceof SFB.MovingObject) || 
					!(staticObject instanceof SFB.StaticObject) ){
			throw "shit";
		}
		
		mo = {
					left: movingObject.xpos - movingObject.radius, 
					top: movingObject.ypos - movingObject.radius, 
					right: movingObject.xpos + movingObject.radius,
					bottom: movingObject.ypos + movingObject.radius
		}
			
		so = {
					left: staticObject.xpos, 
					top: staticObject.ypos, 
					right: staticObject.xpos + staticObject.width,
					bottom: staticObject.ypos + staticObject.length
		}


		if( mo.bottom >= so.top ){
			if ( movingObject.yvel > 0 ){
				movingObject.yvel = 0;
				movingObject.ypos = so.top - 1 - movingObject.radius
			}
		} //else if( mo.top >= )
	};

  
})();
