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

  
})();
