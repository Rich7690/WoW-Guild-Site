angular.module('angularPromiseButtons', []);

angular.module('angularPromiseButtons')
  .directive('promiseBtn', ['angularPromiseButtons', '$parse', '$timeout', '$compile', function (angularPromiseButtons, $parse, $timeout, $compile) {
    'use strict';

    return {
      restrict: 'EA',
      priority: angularPromiseButtons.config.priority,
      scope: {
        promiseBtn: '=',
        promiseBtnOptions: '=?',
        ngDisabled: '=?'
      },
      link: function (scope, el, attrs) {
        // provide configuration
        var cfg = angularPromiseButtons.config;
        // later initialized via initPromiseWatcher()
        var promiseWatcher;
        //  timeout used
        var minDurationTimeout;
        // boolean to determine minDurationTimeout state
        var minDurationTimeoutDone;
        // boolean to determine if promise was resolved
        var promiseDone;

        /**
         * Handles everything to be triggered when the button is set
         * to loading state.
         * @param {Object}btnEl
         */
        function initLoadingState(btnEl) {
          if (cfg.btnLoadingClass && !cfg.addClassToCurrentBtnOnly) {
            btnEl.addClass(cfg.btnLoadingClass);
          }
          if (cfg.disableBtn && !cfg.disableCurrentBtnOnly) {
            btnEl.attr('disabled', 'disabled');
          }
        }

        /**
         * Handles everything to be triggered when loading is finished
         * @param {Object}btnEl
         */
        function handleLoadingFinished(btnEl) {
          if ((!cfg.minDuration || minDurationTimeoutDone) && promiseDone) {
            if (cfg.btnLoadingClass) {
              btnEl.removeClass(cfg.btnLoadingClass);
            }
            if (cfg.disableBtn && !scope.ngDisabled) {
              btnEl.removeAttr('disabled');
            }
          }
        }

        /**
         * Initializes a watcher for the promise. Also takes
         * cfg.minDuration into account if given.
         * @param {Function}watchExpressionForPromise
         * @param {Object}btnEl
         */
        function initPromiseWatcher(watchExpressionForPromise, btnEl) {
          // watch promise to resolve or fail
          scope.$watch(watchExpressionForPromise, function (mVal) {
            minDurationTimeoutDone = false;
            promiseDone = false;

            // create timeout if option is set
            if (cfg.minDuration) {
              minDurationTimeout = $timeout(function () {
                minDurationTimeoutDone = true;
                handleLoadingFinished(btnEl);
              }, cfg.minDuration);
            }

            // for regular promises
            if (mVal && mVal.then) {
              initLoadingState(btnEl);

              // angular promise
              if (mVal.finally) {
                mVal.finally(function () {
                  promiseDone = true;
                  handleLoadingFinished(btnEl);
                });
              }
              // ES6 promises
              else {
                mVal.then(function () {
                    promiseDone = true;
                    handleLoadingFinished(btnEl);
                  })
                  .catch(function () {
                    promiseDone = true;
                    handleLoadingFinished(btnEl);
                  });
              }

            }
            // for $resource
            else if (mVal && mVal.$promise) {
              initLoadingState(btnEl);
              mVal.$promise.finally(function () {
                promiseDone = true;
                handleLoadingFinished(btnEl);
              });
            }
          });
        }

        /**
         * Get the callbacks from the (String) expression given.
         * @param {String}expression
         * @returns {Array}
         */
        function getCallbacks(expression) {
          return expression
            // split by ; to get different functions if any
            .split(';')
            .map(function (callback) {
              // return getter function
              return $parse(callback);
            });
        }

        /**
         * $compile and append the spinner template to the button.
         * @param {Object}btnEl
         */
        function appendSpinnerTpl(btnEl) {
          btnEl.append($compile(cfg.spinnerTpl)(scope));
        }

        /**
         * Used to limit loading state to show only for the currently
         * clicked button.
         * @param {Object}btnEl
         */
        function addHandlersForCurrentBtnOnly(btnEl) {
          // handle current button only options via click
          if (cfg.addClassToCurrentBtnOnly) {
            btnEl.on(cfg.CLICK_EVENT, function () {
              btnEl.addClass(cfg.btnLoadingClass);
            });
          }

          if (cfg.disableCurrentBtnOnly) {
            btnEl.on(cfg.CLICK_EVENT, function () {
              btnEl.attr('disabled', 'disabled');
            });
          }
        }

        /**
         * Used for the function syntax of the promise button directive by
         * parsing the expressions provided by the attribute via getCallbacks().
         * Unbinds the default event handlers, which is why it might sometimes
         * be required to use the promise syntax.
         * @param {Object}eventToHandle
         * @param {String}attrToParse
         * @param {Object}btnEl
         */
        function updateHandler(eventToHandle, attrToParse, btnEl) {
          // we need to use evalAsync here, as
          // otherwise the click or submit event
          // won't be ready to be replaced
          var callbacks = getCallbacks(attrs[attrToParse]);

          // unbind original click event
          el.off(eventToHandle);

          // rebind, but this time watching it's return value
          el.on(eventToHandle, function (event) {
            // Make sure we run the $digest cycle
            scope.$apply(function () {
              callbacks.forEach(function (cb) {
                // execute function on parent scope
                // as we're in an isolate scope here
                var promise = cb(scope.$parent, {
                  $event: event
                });

                // only init watcher if not done before
                if (!promiseWatcher) {
                  promiseWatcher = initPromiseWatcher(function () {
                    return promise;
                  }, btnEl);
                }
              });
            });
          });
        }

        /**
         * Used for the function syntax of the promise button directive by
         * parsing the expressions provided by the attribute via getCallbacks().
         * Unbinds the default event handlers, which is why it might sometimes
         * be required to use the promise syntax.
         *
         * @param {String}eventToHandle the event to handle
         * @param {String}attrToParse the attribute to parse the callback from (ngClick or ngSubmit)
         * @param {Object}btnEl the button element to disable and add spinner
         */
        function initHandlingOfViewFunctionsReturningAPromise(eventToHandle, attrToParse, btnEl) {
          // If the priority is higher then zero, we are sure that ngSubmit already attached the event handler,
          // if not, then we need to execute with $evalAsync
          if (cfg.priority > 0) {
            updateHandler(eventToHandle, attrToParse, btnEl);
          } else {
            scope.$evalAsync(function () {
              updateHandler(eventToHandle, attrToParse, btnEl);
            });
          }
        }

        /**
         * Get's all submit button children of the given element
         * @param {Object}formEl
         * @returns {Object}
         */
        function getSubmitBtnChildren(formEl) {
          var submitBtnEls = [];
          var allButtonEls = formEl.find(angularPromiseButtons.config.BTN_SELECTOR);

          for (var i = 0; i < allButtonEls.length; i++) {
            var btnEl = allButtonEls[i];
            if (angular.element(btnEl)
              .attr('type') === 'submit') {
              submitBtnEls.push(btnEl);
            }
          }
          return angular.element(submitBtnEls);
        }

        // INIT
        // ---------

        // check if there is any value given via attrs.promiseBtn
        if (!attrs.promiseBtn) {
          // handle ngClick function directly returning a promise
          if (attrs.hasOwnProperty(cfg.CLICK_ATTR)) {
            appendSpinnerTpl(el);
            addHandlersForCurrentBtnOnly(el);
            initHandlingOfViewFunctionsReturningAPromise(cfg.CLICK_EVENT, cfg.CLICK_ATTR, el);
          }
          // handle ngSubmit function directly returning a promise
          else if (attrs.hasOwnProperty(cfg.SUBMIT_ATTR)) {
            // get child submits for form elements
            var btnElements = getSubmitBtnChildren(el);

            appendSpinnerTpl(btnElements);
            addHandlersForCurrentBtnOnly(btnElements);
            initHandlingOfViewFunctionsReturningAPromise(cfg.SUBMIT_EVENT, cfg.SUBMIT_ATTR, btnElements);
          }
        }
        // handle promises passed via scope.promiseBtn
        else {
          appendSpinnerTpl(el);
          addHandlersForCurrentBtnOnly(el);
          // handle promise passed directly via attribute as variable
          initPromiseWatcher(function () {
            return scope.promiseBtn;
          }, el);
        }

        // watch and update options being changed
        scope.$watch('promiseBtnOptions', function (newVal) {
          if (angular.isObject(newVal)) {
            cfg = angular.extend({}, cfg, newVal);
          }
        }, true);

        // cleanup
        scope.$on('$destroy', function () {
          $timeout.cancel(minDurationTimeout);
        });
      }
    };
  }]);

angular.module('angularPromiseButtons')
  .provider('angularPromiseButtons', function angularPromiseButtonsProvider() {
    'use strict';

    // *****************
    // DEFAULTS & CONFIG
    // *****************

    var config = {
      spinnerTpl: '<span class="btn-spinner"></span>',
      priority: 10,
      disableBtn: true,
      btnLoadingClass: 'is-loading',
      addClassToCurrentBtnOnly: false,
      disableCurrentBtnOnly: false,
      minDuration: false,
      CLICK_EVENT: 'click',
      CLICK_ATTR: 'ngClick',
      SUBMIT_EVENT: 'submit',
      SUBMIT_ATTR: 'ngSubmit',
      BTN_SELECTOR: 'button'
    };

    // *****************
    // SERVICE-FUNCTIONS
    // *****************

    // *************************
    // PROVIDER-CONFIG-FUNCTIONS
    // *************************

    return {
      extendConfig: function (newConfig) {
        config = angular.extend(config, newConfig);
      },

      // ************************************************
      // ACTUAL FACTORY FUNCTION - used by the directive
      // ************************************************

      $get: function () {
        return {
          config: config
        };
      }
    };
  });

