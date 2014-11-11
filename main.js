(function() {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['./src/jQuerySelectorSet'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(
            require('./src/jQuerySelectorSet')
        );
    } else {
        throw Error("no module loader found");
    }

    function factory(jQuerySelectorSet) {
        return jQuerySelectorSet;
    }

})();
