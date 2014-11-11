(function() {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'mu-selector-set'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(
            require('jquery'),
            require('mu-selector-set')
        );
    } else {
        throw Error("no module loader found");
    }

    function factory($, SelectorSet) {

        // use Sizzle's matchesSelector
        SelectorSet.prototype.matchesSelector = $.find.matchesSelector;

        // this plugin modifies some of the jQuery.event prototype methods
        // to make use of mu-selector-set.

        // the following jQuery internal methods are relevant for us:
        // 1. jQuery.event.add - Add a delegated event handler (+selector+data)
        //    to an event of certain type(s).
        // 2. jQuery.event.remove - the opposite of .add

        var $expando = $.expando,
            $add = $.event.add,
            $remove = $.event.remove,
            queues = {}; // a queue per DOM element, per event type

        // We will try to use most of jQuery's already existing implementation.
        // Most of the time-consuming work is in filtering the handlers we need
        // to call when an event occurs. We will try to speed up jQuery by
        // prefiltering the handlers ourselves.
        //
        // Inside jQuery:
        // - handlers are filtered by the jQuery.event.handlers method
        // - which is called from jQuery.event.dispatch method
        // - which is initialized as the event type's global hander for the
        //   element

        // we will wrap jQuery's .add ($add) with our own:
        // 1. if no selector is specified, there is no reason to use a selector
        //    set, so just use $add
        // 2. init a selector set for the element and event type
        $.event.add = function(elem, type, handler, data, selector) {
            if (!selector)
                return $add.apply(this, arguments);

            var eid = elem[$expando],
                types = type.trim().split(/\s+/),
                t = types.length;

            while (t--) {
                type = types[t];

                if (!queues[eid] || !queues[eid][type]) {
                    queues[eid] = queues[eid] || {};
                    queues[eid][type] = queues[eid][type] || new SelectorSet();
                    $add.call(this, elem, type, makeGlobalHandler(elem, type));
                }

                queues[eid][type].add(selector, handler, data);
            }
        };

        function makeGlobalHandler(elem, type) {

            var eid = elem[$expando],
                queue = queues[eid][type];

            // whenever this event is triggered for this element:
            // 1. get the list of handlers the target element matches
            // 2. check if the event is not stopped (immediate propagation)
            // 3. run the next handler
            // 4. go to (2) until nothing more to do
            // 5. check if the event is not stopped (propagation)
            // 6. move to the parent element and go to (1) until reaching the
            //    delegated element (the root).
            return function(e) {
                var i, handler, matches, match,
                    cur = e.target;
                while (
                    cur !== elem.parentElement &&
                    !e.isPropagationStopped()
                ) {
                    event.currentTarget = cur;
                    matches = queue.matches(cur);
                    i = 0;
                    while (
                        (match = matches[i]) &&
                        !e.isImmediatePropagationStopped()
                    ) {
                        // match[0] is the selector
                        handler = match[1];
                        e.data = match[2];
                        if (handler === false ||
                            handler.apply(cur, arguments) === false) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                        i++;
                    }
                    cur = cur.parentElement;
                }
            };

        }

    }

})();
