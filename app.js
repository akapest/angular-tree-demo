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
      .module('demoApp', ['ui.tree', 'ui.bootstrap'])
      .controller('MainCtrl', function($scope) {

        $scope.tabsets = [{id: 'left'}, {id: 'right'}];
        
        $scope.trees =  [{
          id: '0',
          name: 'first',
          list: data
        },{
          id: '1',
          name: 'second',
          list: data.slice(0, 1)
        },{
          id: '2',
          name: 'third',
          list: data.slice(0, 2)
        }];

        $scope._leftTree = $scope._rightTree = $scope.trees[0].id;

        $scope.newSubItem = function(scope) {
          var nodeData = scope.$modelValue;
          nodeData.nodes.push({
            id: nodeData.id * 10 + nodeData.nodes.length + 1,
            title: nodeData.title + '.' + (nodeData.nodes.length + 1),
            nodes: []
          });
          $scope.redrawLines();
        };

        /**
         * Connect nodes from different tabsets
         */
        $scope.connect = function(scope){
          var $el = scope.$element;
          $el.toggleClass('selected');

          var parentId = $scope.getTabsetId($el);
          $scope[parentId] = $el.hasClass('selected') ? $el : null; // remember the selected element with respect to the tree containing the element

          var left = $scope['_left'],
              right = $scope['_right'];

          if (left && right){ // if there are selected items in both trees
            var leftTree = getTree(left),
                rightTree = getTree(right),
                leftId = id(leftTree, left),
                rightId = id(rightTree, right);

            if (!findLink(leftId, rightId)){ // and there is no link between the items
              addLink({
                first: left,
                firstId: leftId,
                second: right,
                secondId: rightId
              });
              drawLine(left, right, false); // and draw
            }
            $scope.resetConnecting(); // and clear state
          }
          return true;
        };

        /**
         * Clear the state if connection of nodes is aborted
         */
        $scope.resetConnecting = function(){
          var left = $scope['_left'];
          var right = $scope['_right'];
          left && left.toggleClass('selected');
          right && right.toggleClass('selected');
          $scope['_left'] = null;
          $scope['_right'] = null;
        };

        /**
         * Options of the tree which are via ui-tree attribute
         * @type {{dragStop: Function, removed: Function}}
         */
        $scope.treeOptions = {
          dragStop: function(){
            $scope.redrawLines();
            $scope.resetConnecting();
          },
          removed: function(scope){
            var $el = scope.$element.children('.angular-ui-tree-handle:first'),
                $tree = getTree($el);
            removeLinks(id($tree, $el));
            $scope.redrawLines();
          }
        };

        /**
         * Redraw lines after toggling visibility of child nodes
         */
        $scope.afterToggle = function(){
          $scope.redrawLines();
        };

        /**
         * Remove the lines and show only relative ones
         */
        $scope.redrawLines = function(){
          setTimeout(function(){ // async to let all the dom changes to take effect
            $('.line').remove();
            $('.circle').remove();
            var l = links.length, link;
            while (l-- > 0){
              link = links[l];
              if ($scope.shouldShowLink(link)){
                drawLine(getNode(link.firstId, 'left'), getNode(link.secondId, 'right'), true);
              }
            }
          }) 
        };

        /**
         * Find if the link nodes belong two visible trees
         */
        $scope.shouldShowLink = function(link){
          return link
              && treeVisible(link.firstId, '_left')
              && treeVisible(link.secondId, '_right');

          function treeVisible(id, tabset){
            return $scope[tabset + 'Tree'] == id.split(':')[0];
          }
        };

        /**
         * Change active tab/tree
         * @param index tab index
         * @param tabsetId
         */
        $scope.select = function(index, tabsetId) {
          $scope['_' + tabsetId + 'Tree'] = this.tree.id;
          $scope.redrawLines();
        };

        $scope.getTabsetId = function($el){
          return '_' + $el.parents('.tabset').attr('id').replace('_tabset','')
        };

        /**
         * Redraw on resize
         */
        $(window).on('resize', function(){
          $scope.redrawLines();
        });

      });

  function getTree($el){
    return $el.parents('[data-type="tree-root"]')
  }

  function id($tree, $el){
    return $tree.attr('id').replace('tree-root_','') + ':' + $el.data('id')
  }

  /**
   * Get the node corresponding to the treeId and node id
   * @param id
   * @param tabsetId
   * @returns {*|jQuery}
   */
  function getNode(id, tabsetId){
    var ids = id.split(':'),
        tree = getTreeFromId(id, tabsetId),
        node = tree.find('[data-id="'+ ids[1] +'"]')
    return node;
  }

  function getTreeFromId(id, tabsetId){
    var ids = id.split(':'),
        tree = $('#' + tabsetId + '_tabset').find('#tree-root_'+ ids[0]);
    return tree;
  }

  /**
   * Add the link between items to the cache
   * @param link link
   */
  function addLink(link){
    links.push(link);
    console.log('Connecting node [' + link.firstId + '] and ['+ link.secondId + ']');
  }

  /**
   * Find if there is a link between two items and return it
   * @param firstId
   * @param secondId
   * @returns {*} a link
   */
  function findLink(firstId, secondId){
    var l = links.length, link;
    while (l-- > 0){
      link = links[l];
      if (link && link.firstId == firstId && link.secondId == secondId){
        return link;
      }
    }
    return null;
  }

  /**
   * Removes every link that contains the element
   * @param id
   * @returns {*}
   */
  function removeLinks(id){
    var l = links.length, link;
    while (l-- > 0){
      link = links[l];
      if (link && (link.firstId == id || link.secondId == id)){
        links[l] = null;
      }
    }
  }

  /**
   * Draw a line between two elements with two dots at the ends
   * @param _1 first jqLite/jquery element
   * @param _2 second jqLite/jquery element
   * @param jq - true if elements are jquery elements and false if jqLite elements
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