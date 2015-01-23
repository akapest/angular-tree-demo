/**
 */
(function () {
  'use strict';

  // test data
  var data = [
    {
      "id": 1,
      "title": "node1",
      "nodes": [
        {
          "id": 11,
          "title": "node1.1",
          "nodes": [
            {
              "id": 111,
              "title": "node1.1.1",
              "nodes": []
            }
          ]
        },
        {
          "id": 12,
          "title": "node1.2",
          "nodes": []
        }
      ]
    },
    {
      "id": 2,
      "title": "node2",
      "nodes": [
        {
          "id": 21,
          "title": "node2.1",
          "nodes": []
        },
        {
          "id": 22,
          "title": "node2.2",
          "nodes": []
        }
      ]
    },
    {
      "id": 3,
      "title": "node3",
      "nodes": [
        {
          "id": 31,
          "title": "node3.1",
          "nodes": []
        }
      ]
    },
    {
      "id": 4,
      "title": "node4",
      "nodes": [
        {
          "id": 41,
          "title": "node4.1",
          "nodes": []
        }
      ]
    }
  ];

  var links = []; // links cache

  angular
      .module('demoApp', ['ui.tree'])
      .controller('TwoTreesCtrl', function($scope) {
        // the controller manages the creation of links

        $scope.list = data; // assign data into the scope

        $scope.newSubItem = function(scope) {
          var nodeData = scope.$modelValue;
          nodeData.nodes.push({
            id: nodeData.id * 10 + nodeData.nodes.length + 1,
            title: nodeData.title + '.' + (nodeData.nodes.length + 1),
            nodes: []
          });
          redrawLines();
        };

        $scope.connect = function(scope){
          var $el = scope.$element;
          $el.toggleClass('selected');

          var parentId = $el.parents('.tree').data('id'); // parentId is an id of a tree, I use 'left' and 'right' in this demo
          $scope[parentId] = $el.hasClass('selected') ? $el : null; // remember the selected element with respect to the tree containing the element

          var left = $scope['left'];
          var right = $scope['right'];
          if (left && right){ // if there are selected items in both trees
            if (!findLink(left, right)){ // and there is no link between the items
              addLink(left, right); // then create it
              drawLine(left, right); // and draw
            }
            $scope.resetConnecting(); // and clear state
          }
          return true;
        };

        $scope.resetConnecting = function(){
          var left = $scope['left'];
          var right = $scope['right'];
          left && left.toggleClass('selected');
          right && right.toggleClass('selected');
          $scope['left'] = null;
          $scope['right'] = null;
        };

        // this is set via ui-tree attribute
        $scope.treeOptions = {
          dragStop: function(){
            redrawLines();
            $scope.resetConnecting();
          },
          removed: function(scope){
            removeLinks(scope.$element.children('.angular-ui-tree-handle:first'));
            redrawLines();
          }
        };

        $scope.afterToggle = function(){
          redrawLines();
        }

      });

  /**
   * Redraw on resize
   */
  $(window).on('resize', function(){
     redrawLines();
  });

  function redrawLines(){
    setTimeout(function(){ // async to let all the dom changes to take effect
      $('.line').remove();
      $('.circle').remove();
      var l = links.length, link;
      while (l-- > 0){
        link = links[l];
        link && drawLine(getNode(link.firstId, 'left'), getNode(link.secondId, 'right'), true);
      }
    })
  }

  /**
   * Get the node corresponding to the treeId and node id
   * @param id
   * @param treeId
   * @returns {*|jQuery}
   */
  function getNode(id, treeId){
    return $('.tree[data-id="' + treeId + '"]').find('.angular-ui-tree-handle[data-id="' + id + '"]');
  }

  /**
   * Add the link between items to the cache
   * @param first item
   * @param second item
   */
  function addLink(first, second){
    links.push({
      first: first,
      firstId: first.data('id'),
      second: second,
      secondId: second.data('id')
    });
//    alert('Connecting id1: ' + first.data('id') + ' and id2: ' + second.data('id'));
  }

  /**
   * Find if there is a link between two items and return it
   * @param first item
   * @param second item
   * @returns {*} a link
   */
  function findLink(first, second){
    var l = links.length, link;
    while (l-- > 0){
      link = links[l];
      if (link && link.first.data('id') == first.data('id') && link.second.data('id') == second.data('id')){
        return link;
      }
    }
    return null;
  }

  /**
   * Removes every link that contains the element
   * @param element
   * @returns {*}
   */
  function removeLinks(element){
    var l = links.length, link;
    while (l-- > 0){
      link = links[l];
      if (link && (link.first.data('id') == element.data('id') || link.second.data('id') == element.data('id'))){
        links[l] = null;
      }
    }
  }

  /**
   * Draw a line between two elements with two dots at the ends
   * @param _1 first jqLite/jquery element
   * @param _2 second jqLite/jquery element
   * @param jq - true if elements are jquery elements
   */
  function drawLine(_1, _2, jq){
    var el1 = getElement(_1, jq),
        el2 = getElement(_2, jq),
        x1 = el1.offset().left + el1.width() + 20 + 1, // + left padding + border width
        x2 = el2.offset().left,
        y1 = el1.offset().top + 20, // top padding + half of the height
        y2 = el2.offset().top + 20;

    var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    var angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var transform = 'rotate('+angle+'deg)';

    var line = $('<div>')
        .appendTo('body')
        .addClass('line')
        .offset({left: x1, top: y1})
        .css({
          'position': 'absolute',
          'transform': transform
        })
        .width(length);

    drawCircle(x1, y1);
    drawCircle(x2, y2);
  }

  /**
   * Converts first argument from jqLite array to jquery array and return it
   * or the first visible parent if the tree branch (containing the element) is collapsed
   *
   * @param _el the element
   * @param jq flag indicating that the element in jquery array (or in jqLite otherwise)
   * @returns {*}
   */
  function getElement(_el, jq){
    var el = jq ? _el : $(_el[0]); // convert jqLite elements to jquery elements
    var collapsedParent = el.parents('[collapsed="true"]:last');
    return collapsedParent.length ? collapsedParent.children('div:first') : el;
  }

  function drawCircle(left, top){
    var radius = 4;
    var circle = $('<div>')
        .appendTo('body')
        .addClass('circle')
        .css({
          position: 'absolute',
          "border-radius": radius + 'px',
          width: radius * 2,
          height: radius * 2
        })
        .offset({left: left - radius, top: top - radius });
  }

}());