angular.module('E50Editor')
  .directive('e50Popover', function($timeout, E50Documents) {

    var template = [
      '<div class="link-manager" ng-repeat="popover in popovers" ng-show="popover.show">',
      '<input type="text" ng-model="popover.link" />',
      '<a href="" target="_blank" ng-attr-href="{{popover.link}}">Open</a>',
      '<a href="" target="_blank" ng-click="unlink(popover)" ng-show="isLink(popover)"><i class="fa fa-unlink"></i></a>',
      '</div>'
    ];

    return {
      template: template.join(''),
      link: function(scope, elm) {
        var linkElement;
        var iframe = E50Documents.get(scope.iframeId);
        scope.unlink = function(popover) {
          $timeout(function() {
            var range = rangy.createRange();
            range.selectNodeContents(linkElement[0]);
            var sel = rangy.getIframeSelection(iframe[0]);
            sel.setSingleRange(range);
            linkElement = null;
            popover.show = false;
            var doc = iframe[0].document || iframe[0].contentWindow.document;
            doc.execCommand('unlink');
          });
        };
        scope.isButton = function(popover) {
          return popover.id.indexOf('button') !== -1;
        };
        scope.isLink = function(popover) {
          return popover.id.indexOf('link') !== -1;
        };
        scope.$on('e50Popover', function(ev, popoverElm) {
          linkElement = popoverElm;
          var id = popoverElm.attr('popover');
          angular.forEach(scope.popovers, function(popover, key) {
            popover.show = (key === id);
          });
          $timeout(function() {
            var offset = popoverElm.offset();
            offset.top = offset.top - elm.height() - 5;
            var extraWidth = 0;
            extraWidth += parseInt(popoverElm.css('padding-right'));
            extraWidth += parseInt(popoverElm.css('margin-right'));
            offset.left = Math.ceil(offset.left) + popoverElm.width() - elm.width() + extraWidth;
            elm.css(offset);
          });
        });
      }
    };

  });