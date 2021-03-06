angular.module('E50Editor')
  .directive('e50Image', function($timeout, E50EditorConfig) {
    var template = [
      '<div class="popovers">',
        '<div ng-repeat="img in imagePopovers" ng-show="img.show" ng-attr-class="img-popover-{{img.id}} image-edit"  ng-mouseenter="img.show=true">',
          '<a href="" ng-click="toggleInput(img)" class="edit"><i class="fa  fa-ellipsis-v"></i></a>',
          '<a href="" class="trash"><i class="fa fa-trash-o" ng-click="trash(img)"></i></a>',
          '<form ng-submit="setImageUrl(img)">',
            '<input type="text" placeholder="Enter url & hit enter or" ng-model="img.src" ng-model-options="{ debounce: 3500 }" ng-if="img.showInput" ng-change="setImageUrl(img)"/>',
            '<a href="" ng-click="openAviary(img)" class="edit-photo" ng-if="img.showInput">Edit</a>',
          '</form>',
          '<form ng-show="img.showInput">',
            '<input type="file" ng-attr-id="file-upload-{{img.id}}"/>',
          '</form>',
        '</div>',
      '</div>'
    ];
    return {
      template: template.join(''),
      link: function(scope, elm) {

        scope.aviaryOptions = scope.aviaryOptions || 'all';

        //elm.css({ position:'absolute', opacity: 0 });
        elm.css({ position:'absolute' });
        // Images
        var images = {};
        scope.imagePopovers = {};

        function imageHover(e) {
          var target = angular.element(e.target);
          var id = parseInt(target.attr(E50EditorConfig.attrs.placeholder), 10);

          angular.forEach(scope.imagePopovers, function(img, i) {
            img.show = (id == i);
          });

          var css = target.offset();
          var popoverElm = elm.find('.img-popover-' + id);
          $timeout(function() {
            css.top = css.top + 5;
            css.left = css.left + target.width() - popoverElm.width() - 5;
            elm.css(css);
            elm.animate({opacity: 1}, 200);
          });
          scope.$apply();
        }

        function hideImagePopovers(e) {
          var related = angular.element(e.toElement || e.relatedTarget);
          var isEditArea = related.hasClass('e50-image') || related.closest('.e50-image').length;
          if(isEditArea) { return true; }
          angular.forEach(scope.imagePopovers, function(img) {
            img.show = false;
            //img.showInput = false;
          });
          scope.$apply();
        }

        function handleDragOver(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        var aviaryEditor = new Aviary.Feather({
          apiKey: E50EditorConfig.aviaryKey,
          tools: scope.aviaryOptions,
          onError: function() {
            console.log(arguments);
          }
        });

        function dropHandler(e) {
          e.preventDefault();
          e.stopPropagation();

          var img = angular.element(e.target);

          var file = e.originalEvent.dataTransfer.files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var aviaryImg = new Image();
            aviaryImg.src = e.target.result;
            aviaryEditor.launch({
              image: aviaryImg,
              onSave: function(id, url) {
                scope.imageSaved(url, angular.element(aviaryImg));
                img.attr('src', url);
                img.removeAttr('height');
                img.removeAttr('width');
                scope.$emit('updateViewValue');
              }
            });
          };
          reader.readAsDataURL(file);

          return false;
        }

        scope.openAviary = function(img) {
          if(scope.isPlaceholder(img)) {
            alert("Please upload an image to edit");
            return;
          }
          var imageElm = angular.element(images[img.id]);
          var src = imageElm.attr('src');
          var isPlaceholder = scope.isPlaceholder(img);
          if(isPlaceholder) { return false; }

          var aviaryImg = new Image();
          aviaryImg.src = src;

          aviaryEditor.launch({
            image: aviaryImg,
            onSave: function(id, url) {
              scope.imageSaved(url, imageElm);
              imageElm.attr('src', url);
              scope.$emit('updateViewValue');
            }
          });
        };

        scope.isPlaceholder = function(img) {
          var elm = angular.element(images[img.id]);
          var src = elm.attr('src');
          return src.indexOf('placehold.it') !== -1;
        };

        scope.trash = function(img) {
          var elm = angular.element(images[img.id]);
          if(!scope.isPlaceholder(img)) {
            var confirm = window.confirm("Are you sure you want to delete this image?");
            if(!confirm) { return false; }
            var width = elm.attr("width") || E50EditorConfig.defaultWidth;
            var height = elm.attr('height') || E50EditorConfig.defaultHeight;
            var placeholderSrc = E50EditorConfig.placeholder.replace('WIDTH', width).replace('HEIGHT', height);
            elm.attr('src', placeholderSrc);
          } else {
            elm.remove();
          }
          img.show = false;
          scope.$emit('updateViewValue');
        };

        function getImages() {
          var placeholders = elm.parent().find('['+E50EditorConfig.attrs.placeholder+']');
          angular.forEach(placeholders, function(image, i) {
            images[i] = image;
            var imgElm = angular.element(image);
            imgElm.attr(E50EditorConfig.attrs.placeholder, i);
            var width = imgElm.attr("width") || E50EditorConfig.defaultWidth;
            var height = imgElm.attr('height') || E50EditorConfig.defaultHeight;
            var src = imgElm.attr('src');
            var isPlaceholder = true;
            if(!src) {
              var placeholderSrc = E50EditorConfig.placeholder.replace('WIDTH', width).replace('HEIGHT', height);
              imgElm.attr('src', placeholderSrc);
              imgElm.css("border", "1px solid #e7e7e7");
              isPlaceholder = true;
            } else {
              isPlaceholder = src.indexOf(E50EditorConfig.placeholder) !== -1;
            }
            scope.imagePopovers[i] = {
              id: i,
              show: false,
              src: isPlaceholder ? "" : imgElm.attr('src')
            };
          });

          // Unbind previous mouseover events
          placeholders.unbind('mouseover', imageHover);
          placeholders.unbind('mouseleave', hideImagePopovers);

          // Setup image hover
          placeholders.bind('mouseover', imageHover);
          placeholders.bind('mouseleave', hideImagePopovers);

          placeholders.unbind('dragover',handleDragOver);
          placeholders.bind('dragover',handleDragOver);

          placeholders.unbind('drop', dropHandler);
          placeholders.bind('drop', dropHandler);

          scope.$emit('updateViewValue');
        }

        scope.$watch('html', function(newV, oldV) {
          if(!newV && newV === oldV) { return; }
          getImages();
        });

        scope.$on('e50RefreshEditables', getImages);

        scope.toggleInput = function(img) {
          var imageElm = angular.element(images[img.id]);
          img.showInput = !img.showInput;
          if(img.showInput) {
            $timeout(function() {
              imageElm.focus();
              if(imageElm[0].setSelectionRange) {
                imageElm[0].setSelectionRange(0,0);
              } else {
                imageElm.val(imageElm.val());
              }
            });
          }
        };

        scope.setImageUrl = function(img) {
          var imageElm = angular.element(images[img.id]);
          var src = img.src !== "" ? img.src : E50EditorConfig.placeholder;
          imageElm.attr('src', src);
          img.showInput = false;
        };

        function fileChangeHandler(e) {
          if(!e.target.files) { return; }
          var input = angular.element(e.target);
          var id = input.attr('id').split('-').pop();
          var imageElm = angular.element(images[id]);
          var aviaryImg = new Image();
          var file = e.target.files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            aviaryImg.src = e.target.result;
            aviaryEditor.launch({
              image: aviaryImg,
              onSave: function(id, url) {
                scope.imageSaved(url, imageElm);
                input.val("");
                scope.$emit('updateViewValue');
              },
              onClose: function() {
                input.val("");
              }
            });
          };
          reader.readAsDataURL(file);
        }

        scope.$watch('imagePopovers', function(newV) {
          if(!newV) { return; }
          var inputs = elm.find('input');
          angular.forEach(inputs, function(input) {
            var inputElm = angular.element(input);
            inputElm.unbind('change', fileChangeHandler);
            inputElm.bind('change', fileChangeHandler);
          })
        }, true);
      }
    };
  });
