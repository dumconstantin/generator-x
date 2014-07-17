(function () { 
"use strict";

if ('undefined' !== typeof require) {
    var utils = require('./Utils.js'),
        Layer = require('./Layer.js');
}

/**
 * Debug function that takes a number of arguments and prints them
 * in an elementValue vs elementValue vs elementValue string
 * @return {undefined}
 */
function log() {
    var string = '';

    [].slice.apply(arguments).forEach(function (arg, index, args) {
        string += arg;

        if (args.length - 1 !== index) {
            string += ' vs ';
        }
    });

    console.log(string);
}

var getId = (function () {
    var inc = 0;
    return function () {
        inc += 1;
        return inc;
    };
}());

function Relative(layersTree) {
    this.layersTree = layersTree;
    this.relativeTree = {};
    this.structure = layersTree.structure;

    if ('undefined' !== typeof Layer) {
        this.LayerConstructor = Layer;
    } else {
        this.LayerConstructor = function (structure, layer) {

            layer.siblings = [];

            return layer;
        };
    }

}

Relative.prototype.createColumn = function (layer, parent, layerIds) {
    var _this = this,
        childrenIds,
        column;
        

    column = {
        id: getId(),
        children: [],
        layer: layer,
        layerIds: undefined === layerIds ? [layer.id] : layerIds,
        nodeType: 'column'
    };

    layer.attributes = {
        id: layer.id,
        parentid: column.id
    };

    column.children = this.getRows(column, false);

    childrenIds = column.children.reduce(function (ids, row) {
        return ids.concat(row.layerGroups.reduce(function (result, group) {
            return result.concat(group.map(function (layer) {
                return layer.id;
            }));
        }, []));
    }, []);

    // console.log('The ' + column.id + ' column has the following children: ', childrenIds);

    var sameAsParent = childrenIds.reduce(function (value, id) {
        return value + (-1 === column.layerIds.indexOf(id) ? 0 : 1);
    }, 0);

    //console.log('Same as parent ', sameAsParent, column.layerIds.length);

    if (sameAsParent === column.layerIds.length) {
        column.children = this.getRows(column, true);
    }

    column.children.forEach(function (row) {
        //console.log('Creating row's children from: ', row.layerGroups.length);
        row.children = _this.createColumns(row.layerGroups, column);
    });

    column.layerIds = column.layerIds.concat(column.children.reduce(function (ids, layer) {
        return ids.concat(layer.layerIds);
    }, []));

    //console.log('Created column ' + column.layer.id + ' with ' + column.rows.length + ' rows.');

    return column;
};

Relative.prototype.createRow = function (ids, isIgnoreIntersection) {
    var row;


    row = {
        id: getId(),
        children: [],
        layerIds: [],
        css: {},
        nodeType: 'row'
    };

    row.layerGroups = 
            this.groupLayers(
                this.selectLayers(
                    this.structure.getLayers(ids),
                    isIgnoreIntersection
                )
            );


    row.layerIds = row.layerGroups.reduce(function (ids, group) {
        return ids.concat(group.map(function (layer) {
            return layer.id;
        }));
    }, []);

    return row;
};

Relative.prototype.createColumns = function (layerGroups, parent) {
    var _this;

    _this = this;

    return layerGroups.map(function (group) {

        if (1 < group.length) {
            return _this.createColumn(
                _this.structure.createLayer(group), parent, 
                group.map(function (layer) {
                    return layer.id;
                })
            );

        } else {

            return _this.createColumn(group[0], parent);

        }

    });
};


Relative.prototype.groupLayers = function (layers) {
    var i,
        top,
        bottom,
        left,
        right,
        group,
        groups;

    groups = [];
    // console.log('Grouping ' + layers.length + ' layers.');

    while (0 < layers.length) {
    
        group = [layers.shift()];

        left = group[0].css.left;
        right = group[0].css.right;
        top = group[0].css.top;
        bottom = group[0].css.bottom;

        //console.log('initial ', group[0].cssId, 'left:' + group[0].css.left, 'right:' + group[0].css.right);

        for (i = 0; i < layers.length; i += 1) {
            
            //console.log(layers[i].cssId, 'left:' + layers[i].css.left, 'right:' + layers[i].css.right);

            if (
                (right > layers[i].css.left && left < layers[i].css.left) ||
                (right > layers[i].css.right && left < layers[i].css.right) ||
                (left >= layers[i].css.left && right <= layers[i].css.right)
            ) {

                if (right < layers[i].css.right) {
                    right = layers[i].css.right;
                }

                if (left > layers[i].css.left) {
                    left = layers[i].css.left;
                }

                group.push(layers.splice(i, 1)[0]);

                i = -1;
            }

        }

        /*
        console.log(group.map(function (layer) {
            return layer.cssId;
        }));
        */
       
        groups.push(group);
    }


    /*
    console.log('Selected ', groups.reduce(function (ids, group) {
        return ids.concat(group.map(function (layer) {
            return layer.cssId;
        }));
    }, []));
    */
   
    return groups;
};

/**
 * Get a list of random elements and detect the first row.
 * 1. Find the topmost element from the list.
 * 2. Set the top and bottom boundries according to the chosen element.
 * 3. Find the next element that has the center inside the interval given by
 * the top and bottom values.
 * 4. Update the bottom value with the found's element bottom value.
 * 5. Remove the found element from the element list and insert it into the row list.
 * 6. Repeat from 3.
 * 7. Return the row list. 
 * @param  {array} elements A list with random positioned elements.
 * @return {array}          A list with the elements contained by a row.
 */

Relative.prototype.selectLayers = function (layers, isIgnoreIntersection) {
    var _this,
        i,
        isInRow,
        isIntersection,
        selected,
        bottom,
        top,
        left,
        right;


    _this = this;
    selected = [];

    //console.log(layers.map(function (layer) { return layer.cssId; })); 

    // Find the top most layer that will be used for reference.
    i = layers.reduce(function (selectedIndex, layer, index) {
        return layers[selectedIndex].css.top < layer.css.top ? selectedIndex : index;
    }, 0);

    bottom = layers[i].css.bottom;
    top = layers[i].css.top;
    left = layers[i].css.left;
    right = layers[i].css.right;

    if (0 < layers.length) {
        selected.push(layers.splice(i, 1)[0]);
    }

    //console.log('Testing ', selected[0].cssId);

    for (i = 0; i < layers.length; i += 1) {

        isInRow = bottom > layers[i].css.top && top <= layers[i].css.top;
        isIntersection = 
                (left < layers[i].css.right && right >= layers[i].css.right) ||
                (left <= layers[i].css.left && right > layers[i].css.left) ||
                (left > layers[i].css.left && right < layers[i].css.right);

        //console.log(i, layers.length, layers[i].cssId, ' ltop ' + layers[i].css.top, 'lright' + layers[i].css.right, 'lleft' + layers[i].css.left, ' top ' + top, ' left ' + left, ' right ' + right, ' isRow: ' + isInRow, ' isIntersection: ' + isIntersection, ' isIgnoreIntersection ' + isIgnoreIntersection);
        
        if (isInRow) {
            
            if (isIgnoreIntersection && isIntersection) {
                continue;
            }

            selected.push(layers[i]);

            if (bottom < layers[i].css.bottom) {
                bottom = layers[i].css.bottom;
            }

            if (isIgnoreIntersection) {

                if (left > layers[i].css.left) {
                    left = layers[i].css.left;
                }

                if (right < layers[i].css.right) {
                    right = layers[i].css.right;
                }

            }

            layers.splice(i, 1);
            i = -1;
        }
    }


    //console.log(selected.map(function (layer) { return layer.cssId; }));
    //console.log('-');

    return selected;
};

Relative.prototype.getRows = function (column, isIgnoreIntersection) {
    var _this,
        ids,
        row,
        rows;


    _this = this;
    rows = [];

    ids = column.layer.siblings.map(function (layer, index) {
        return layer.id;
    });

    // console.log('Searching in ', ids);
    while (0 < ids.length) {

        row = this.createRow(ids, isIgnoreIntersection);

        ids = ids.filter(function (id) {
            return -1 === row.layerIds.indexOf(id);
        });

        //console.log('The following ids remain: ', ids);

        rows.push(row);
    }

    return rows;
};


Relative.prototype.generate = function () {
    this.relativeTree = this.createColumn(this.layersTree);
};

Relative.prototype.getTree = function () {
    return this.relativeTree;
};

Relative.prototype.walk = function (node, preOrderCallback, inOrderCallback) {

    function walk(node, level, parent, index, parentIndex) {
        level += 1;

        if (null !== preOrderCallback && undefined !== preOrderCallback) {
            preOrderCallback(node, index, parent, parentIndex, level);
        }
        
        node.children.forEach(function (child, childIndex) {
            walk(child, level, node, childIndex, index);
        });

        if (null !== inOrderCallback && undefined !== inOrderCallback) {
            inOrderCallback(node, index, parent, parentIndex, level);
        }

    }

    walk(node, 0, undefined, 0, 0);

};

Relative.prototype.linkRelative = function () {

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {

        if(undefined !== parent) {
            node.parent = parent;
            node.prev = parent.children[index - 1];
            node.next = parent.children[index + 1];
        }

    });

};

Relative.prototype.setStyles = function () {

    this.walk(this.relativeTree, null, function (node, index, parent, parentIndex, level) {

        if ('column' === node.nodeType) {

            if (undefined !== node.layer.parent) {
                node.layer.parent.css.fontSize = '0';
            }

            if (undefined !== parent && undefined !== parent.prev) {
                // console.log(parent.prev.css);
            }

            // Adjust for padding.

            // Set margin right
            if (undefined !== node.next) {

                node.layer.css.marginRight = node.next.layer.css.left - node.layer.css.right;

               // console.log(node.next.layer.css.right, node.layer.css.right);
            } else {
                if (undefined !== parent) {
                    node.layer.css.marginRight = parent.css.right - node.layer.css.right;
                    // console.log();
                }
            }

            // TODO: Remove border and paddings.
            if (undefined !== parent) {
                if (true === parent.parent.layer.css.border.active) {
                    node.layer.css.marginRight -= parent.parent.layer.css.border.size;
                }
            }


            // Set margin left
            if (undefined === node.prev) {
                if (undefined !== parent) {
                    node.layer.css.marginLeft = node.layer.css.left - parent.parent.layer.css.left;
                }
            }


            if (undefined !== parent && undefined !== parent.parent && undefined !== parent.parent.children[parentIndex - 1]) {


                // Find the bottom of the topest layer.

                var searchIndex = parentIndex - 1;
                var bottom = 0;

                while (undefined !== parent.parent.children[searchIndex]) {

                    parent.parent.children[searchIndex].children.forEach(function (searchColumn) {
                        var searchBottom = searchColumn.layer.css.bottom;



                        if (undefined !== searchColumn.layer.css.marginTop) {
                            //searchBottom += searchColumn.layer.css.marginTop;
                        }

                        if (bottom < searchBottom) {
                            bottom = searchBottom;
                        }
                        //console.log(searchColumn.layer.cssId, searchBottom, bottom);
                    });

                    searchIndex -= 1;
                }
                // console.log('Bottom ' + node.layer.cssId + ' ' + bottom, parent.parent.children[parentIndex - 1].css.bottom);

                node.layer.css.marginTop = 
                    (parent.css.top - parent.parent.children[parentIndex - 1].css.bottom) + 
                    (node.layer.css.top - parent.css.top) -
                    (bottom - parent.parent.children[parentIndex - 1].css.bottom);

            } else {
                if (undefined !== parent) {
                    node.layer.css.marginTop = node.layer.css.top - parent.parent.layer.css.top;

                    // console.log(node.layer.cssId, node.layer.css.marginTop);
                }
            }

            if (undefined !== parent) {
                
                if (true === parent.parent.layer.css.border.active) {
                    node.layer.css.marginTop -= parent.parent.layer.css.border.size;
                }

                if (0 === parentIndex && undefined !== parent.parent.layer.css.paddingTop) {
                    node.layer.css.marginTop -= parent.parent.layer.css.paddingTop;
                }

                if (0 === index && undefined !== parent.parent.layer.css.paddingLeft) {
                    node.layer.css.marginLeft -= parent.parent.layer.css.paddingLeft;
                }

                if (parent.children.length - 1 === index && undefined !== parent.parent.layer.css.paddingRight) {
                    node.layer.css.marginRight -= parent.parent.layer.css.paddingRight;
                }
            }

            node.layer.css.position = 'relative';
            node.layer.css.top = 'auto';
            node.layer.css.left = 'auto';
            // node.layer.css.bottom = 'auto';
            node.layer.css.right = 'auto';
            node.layer.css.display = 'inline-block';
            node.layer.css.verticalAlign = 'top';
        } 

    });

};

Relative.prototype.setRowBoundries = function () {

    this.walk(this.relativeTree, null, function (node, index, parent, parentIndex, level) {

        if ('row' === node.nodeType) {
            node.css = getBoundries(node.children.map(function (column) {
                return column.layer;
            }));

            node.css.right = parent.layer.css.right;

        } 

    });

};

Relative.prototype.orderNodes = function () {

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {

        if ('row' === node.nodeType) {

            node.children.sort(function (prev, next) {
                return prev.layer.css.left - next.layer.css.left;
            });

        } 

        if ('column' === node.nodeType) {

            node.children.sort(function (prev, next) {
                return prev.css.top - next.css.top;
            });

        }

    });

};


Relative.prototype.setPadding = function () {

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {
        var innerBoundries,
            textChildren;

        if ('column' === node.nodeType) {

            if (undefined !== parent && 0 < node.children.length) {

                textChildren = false;

                innerBoundries = getBoundries(node.children.reduce(function (result, row) {
                    return result.concat(row.children.map(function (col) {

                        if ('span' === col.layer.tag) {
                            textChildren = true;
                        }

                        return col.layer;
                    }));
                }, []));

                if (true === textChildren) {
                    return;
                }

                // Normalise innerBoundries so that it does not exceed the layer itself.
                
                if (node.layer.css.left > innerBoundries.left) {
                    innerBoundries.left = node.layer.css.left;
                }

                if (node.layer.css.right < innerBoundries.right) {
                    innerBoundries.right = node.layer.css.right;
                }

                if (node.layer.css.top > innerBoundries.top) {
                    innerBoundries.top = node.layer.css.top;
                }

                if (node.layer.css.bottom < innerBoundries.bottom) {
                    innerBoundries.bottom = node.layer.css.bottom;
                }

                node.layer.css.paddingTop = innerBoundries.top - node.layer.css.top;
                node.layer.css.paddingLeft = innerBoundries.left - node.layer.css.left;
                node.layer.css.paddingRight = node.layer.css.right - innerBoundries.right;
                node.layer.css.paddingBottom = node.layer.css.bottom - innerBoundries.bottom;

                node.layer.css.width -= node.layer.css.paddingLeft + node.layer.css.paddingRight;
                node.layer.css.height -= node.layer.css.paddingTop + node.layer.css.paddingBottom;

            }

        }

    });

};


/**
 * ordinea din html respecta doua principii:
 * - cat de apropiat este elementul fata de marginea de sus a site-ului
 * - cat de sus este zIndex-ul elementului.
 */

Relative.prototype.setZIndex = function () {
    var zIndex,
        parentIndex;

    return;

    zIndex = 1000000;

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {

        if ('column' === node.nodeType) {

            node.layer.css.zIndex = zIndex;
            zIndex -= 1;

        }

    });

};

Relative.prototype.orderLayers = function () {

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {
        var copy,
            lastIndex;


        if ('column' === node.nodeType) {

            copy = node.layer.siblings.slice();
            lastIndex = 0;

            node.children.forEach(function (row) {
                
                row.children.forEach(function (column, columnIndex) {

                    copy.every(function (layer, index) {

                        if (column.layer.id === layer.id) {
                            
                            node.layer.siblings[columnIndex + lastIndex] = copy[index];

                            return false;
                        } else {
                            return true;
                        }

                    });

                });

                lastIndex += row.children.length;

            });

        } 

    });

};

Relative.prototype.showTree = function () {

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {
        var str = '';

        while (0 < level) {
            str += '   ';
            level -= 1;
        }

        str += node.nodeType + ' - ' + node.id;

        if ('column' === node.nodeType) {
            str += ' - ' + node.layer.cssId;
        }

        console.log(str);

    });

};

Relative.prototype.parseTree = function () {

    this.orderNodes();
    
    this.orderLayers();

    this.linkRelative();
    
    this.setRowBoundries();

    this.setPadding();

    this.setStyles();

    this.setZIndex();

};



if ('undefined' !== typeof module) {
    module.exports = Relative;
}

if ('undefined' !== typeof window) {
    window.Relative = Relative;
}

}());