(function (define) {
    define(function () {
        function getTransitionEvent() {
            var type = null;
            var el = document.createElement("div");
            var transitions = {
                'WebkitTransition' : 'webkitTransitionEnd',
                'MozTransition' : 'transitionend',
                'OTransition' : 'otransitionend',
                'transition' : 'transitionend'
            };

            for (var t in transitions) {
                if (el.style[t] !== undefined) {
                    type = transitions[t];
                    break;
                }
            }

            return type;
        }

        function jQuery(selector, host) {
            if (selector instanceof jQuery) {
                return selector;
            }
            if (!(this instanceof jQuery)) {
                return new jQuery(selector, host);
            }

            if (typeof selector === 'string') {
                if (selector.startsWith('<')) {
                    var div = document.createElement('div');
                    div.innerHTML = selector;
                    this.nodes = Array.prototype.slice.call(div.childNodes);
                } else {
                    if (!!host) {
                        this.nodes = host.nodes.map(function (node) {
                            return Array.prototype.slice.call(node.querySelectorAll(selector));
                        }).reduce(function (a, b) {
                            return a.concat(b);
                        });
                    } else {
                        this.nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
                    }
                }
            } else if (selector instanceof HTMLElement) {
                this.nodes = [selector];
            }

            this.eventHandlers = {};
        }

        Object.defineProperty(jQuery.prototype, 'length', {
            get: function() {
                return this.nodes.length;
            }
        });

        // only for children().length or passing result to jQuery function
        jQuery.prototype.children = function() {
            var childs = [];
            this.each(function (node) {
                childs = childs.concat(Array.prototype.slice.call(node.childNodes));
            });
            return childs;
        };

        jQuery.prototype.each = function (callback) {
            for (var i = 0, l = this.nodes.length; i < l; i++) {
                if (callback.call(this, this.nodes[i]) === false) {
                    break;
                }
            }
            return this;
        };

        jQuery.prototype.attr = function (name, value) {
            return this.each(function (node) {
                node.setAttribute(name, value);
            });
        };

        jQuery.prototype.addClass = function (className) {
            return this.each(function (node) {
                var re = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', 'g');
                if (!re.test(node.className)) {
                    node.className += (!node.className ? '' : ' ') + className;
                }
            });
        };

        jQuery.prototype.removeClass = function (classNames) {
            var classes = classNames.trim().split(' ');
            return this.each(function (node) {
                classes.forEach(function (className) {
                    if (!className) return;
                    var re = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', 'g');
                    if (re.test(node.className)) {
                        node.className = node.className.replace(re, ' ').trim();
                    }
                });
            });
        };

        jQuery.prototype.appendTo = function (jquery) {
            jquery.append(this);
            return this;
        };

        jQuery.prototype.append = function (obj, first) {
            if (this.nodes.length > 0) {
                var firstNode = this.nodes[0];
                if (obj instanceof jQuery) {
                    obj.each(function (node) {
                        firstNode.insertBefore(node, !!first ? firstNode.firstChild : null);
                    });
                } else if (typeof obj === 'string') {
                    firstNode.innerHTML = obj;
                }
            }
            return this;
        };

        jQuery.prototype.prepend = function (obj) {
            return this.append(obj, true);
        };

        jQuery.prototype.toggle = function (value) {
            return this.each(function (node) {
                node.style.display = value;
            });
        };

        jQuery.prototype.hide = function () {
            return this.toggle('none');
        };

        jQuery.prototype.show = function () {
            return this.toggle('');
        };

        jQuery.prototype.width = function (value) {
            return this.each(function (node) {
                node.style.width = value;
            });
        };

        // only for ':visible' and non-fixed elements
        jQuery.prototype.is = function (selector) {
            var result = false;
            if (selector === ':visible') {
                this.each(function (node) {
                    if (node.offsetParent !== null) {
                        result = true;
                    }
                });
            }
            return result;
        };

        jQuery.prototype.bind = function (event, fn) {
            this.eventHandlers[event] = fn;
            return this.each(function (el) {
                if (typeof el.addEventListener === "function") {
                    el.addEventListener(event, fn, false);
                } else if (el.attachEvent) {
                    el.attachEvent("on" + event, fn);
                }
            });
        };

        jQuery.prototype.unbind = function (event) {
            var fn = this.eventHandlers[event];
            delete this.eventHandlers[event];
            return this.each(function (el) {
                if (typeof el.removeEventListener === "function") {
                    el.removeEventListener(event, fn, false);
                } else if (el.detachEvent) {
                    el.detachEvent("on" + event, fn);
                }
            });
        };

        jQuery.prototype.unbindAll = function () {
            Object.keys(this.eventHandlers).forEach(function (event) {
                this.unbind(event);
            }, this);
        };

        jQuery.prototype.remove = function () {
            this.unbindAll();
            return this.each(function (node) {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
        };

        jQuery.prototype.hover = function (handlerIn, handlerOut) {
            this.bind('mouseenter', handlerIn);
            this.bind('mouseleave', handlerOut);
            return this;
        };

        jQuery.prototype.click = function (handler) {
            return this.bind('click', handler);
        };

        jQuery.prototype.stop = function () {
            this.removeClass('alertify-log-hide');
            return this.unbind(jQuery.transition);
        };

        jQuery.prototype.fadeIn = function (options) {
            this.addClass('alertify-log');
            setTimeout((function () {
                if (jQuery.transition !== null) {
                    this.bind(jQuery.transition, (function () {
                        this.unbind(jQuery.transition);
                        if (options.complete) {
                            options.complete();
                        }
                    }).bind(this));
                    this.addClass('alertify-log-show');
                } else {
                    if (options.complete) {
                        options.complete();
                    }
                }
            }).bind(this), 50);
            return this.show();
        };

        jQuery.prototype.fadeOut = function (options) {
            setTimeout((function () {
                if (jQuery.transition !== null) {
                    this.bind(jQuery.transition, (function () {
                        this.unbind(jQuery.transition);
                        this.hide();
                        if (options.complete) {
                            options.complete();
                        }
                    }).bind(this));
                    this.addClass('alertify-log-hide');
                } else {
                    this.hide();
                    if (options.complete) {
                        options.complete();
                    }
                }
            }).bind(this), 50);
            return this;
        };

        jQuery.extend = function (target) {
            var args = Array.prototype.slice.call(arguments, 0);
            Object.assign.apply(null, args);
            return target;
        };

        jQuery.transition = getTransitionEvent();

        return jQuery;
    });
}(function (factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        window.jQuery = factory();
    }
}));
