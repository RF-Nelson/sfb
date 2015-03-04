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
})();
