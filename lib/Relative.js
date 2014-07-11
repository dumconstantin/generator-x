(function () { 
"use strict";

if ('undefined' !== typeof require) {
    var Layer = require('./Layer.js');
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
    var inc = 100000;
    return function () {
        inc += 1;
        return inc;
    };
}());


function Relative(layersTree) {
    this.layersTree = layersTree;
    this.relativeTree = {};
    this.flatLayersTree = {};
    this.structure = layersTree.structure;

    if ('undefined' !== typeof Layer) {
        this.LayerConstructor = Layer;
    } else {
        this.LayerConstructor = function (structure, layer) {

            layer.siblings = [];

            return layer;
        };
    }

    this.flattenLayersTree();
}

Relative.prototype.flattenLayersTree = function () {

    function flattenNode(layer, tree) {
        tree[layer.id] = layer;

        layer.siblings.forEach(function (sibling) {
            flattenNode(sibling, tree);
        });

        return tree;
    }


    this.flatLayersTree = flattenNode(this.layersTree, {});
};

Relative.prototype.createColumn = function (layer, parent, layerIds) {
    var _this = this,
        column,
        selectIntersection;

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

    column.children = this.getRows(column, true);

    var ids = column.children.reduce(function (ids, row) {
        return ids.concat(row.layerGroups.reduce(function (result, group) {
            return result.concat(group.map(function (layer) {
                return layer.id;
            }));
        }, []));
    }, []);


    var sameAsParent = ids.reduce(function (value, id) {
        return value + (-1 === column.layerIds.indexOf(id) ? 0 : 1);
    }, 0);

    // console.log('Same as parent ', sameAsParent, column.layerIds.length);

    if (sameAsParent === column.layerIds.length) {
        column.children = this.getRows(column, false);
    }

    column.children.forEach(function (row) {
        row.children = _this.createColumns(row.layerGroups, column);
    });

    column.layerIds = column.layerIds.concat(column.children.reduce(function (ids, layer) {
        return ids.concat(layer.layerIds);
    }, []));

    //console.log('Created column ' + column.layer.id + ' with ' + column.rows.length + ' rows.');

    return column;
};

Relative.prototype.moveLayers = function (layers, parent) {
    var ids;


    ids = layers.map(function (layer) {
        return layer.id;
    });

    layers[0].parent.siblings = layers[0].parent.siblings.filter(function (layer) {
        return -1 === ids.indexOf(layer.id);
    });

    parent.siblings = parent.siblings.concat(layers);

    layers.forEach(function (layer, index) {
        layer.parent = parent;
        layer.prev = layers[index - 1];
        layer.next = layers[index + 1]; 
    });

};

Relative.prototype.addLayer = function (layer, parent) {

    parent.siblings.push(layer);
    this.flatLayersTree[layer.id] = layer;
    layer.parent = parent;

};

Relative.prototype.switchLayers = function (from, to) {
    var parent;

    parent = from.parent;

};


Relative.prototype.createLayer = function (layers) {
    var layer;


    layer = new this.LayerConstructor(this.structure, {
        name: 'column-' + getId(),
        cssId: 'column-' + getId(),
        id: getId(),
        type: 'layerSection',
        bounds: getBoundries(layers),
        css: getBoundries(layers)
    });

    this.addLayer(layer, layers[0].parent);
    this.moveLayers(layers, layer);

    return layer;
};

Relative.prototype.createRow = function (ids, selectIntersection) {
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
                    this.getLayers(ids),
                    selectIntersection
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
                _this.createLayer(group), parent, 
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

        //console.log(group[0].cssId, group[0].css.left, group[0].css.right, left, right);

        for (i = 0; i < layers.length; i += 1) {
            
            //console.log(layers[i].cssId, layers[i].css.left, layers[i].css.right, left, right);

            if (
                right > layers[i].css.left && left < layers[i].css.left ||
                right > layers[i].css.right && left < layers[i].css.right ||
                left > layers[i].css.left && right < layers[i].css.right
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
 * Get the boundries for the elements container based on the values of its elements.
 * Each element must have at minimum the following sets:
 * - top, left, height, width 
 * - bottom, right, height, width
 * - top, left, right, bottom
 * or a combination of the above.
 * 
 * @param  {array} elements The elements that will be compared to get the boundries.
 * @return {object}          The top, left, right, bottom, width, height coordinates for the container.
 */
function getBoundries(layers) {
 
    return layers.reduce(function (boundries, layer) {

        if (boundries.bottom < layer.css.bottom) {
            boundries.bottom = layer.css.bottom;
        }

        if (boundries.right < layer.css.right) {
            boundries.right = layer.css.right;
        }

        if (boundries.top > layer.css.top) {
            boundries.top = layer.css.top;
        }

        if (boundries.left > layer.css.left) {
            boundries.left = layer.css.left;
        }

        boundries.width = boundries.right - boundries.left;
        boundries.height = boundries.bottom - boundries.top;

        return boundries;

    }, {
        top: layers[0].css.top,
        left: layers[0].css.left,
        right: layers[0].css.right,
        bottom: layers[0].css.bottom,
        width: 0,
        height: 0
    });
}


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

Relative.prototype.selectLayers = function (layers, selectIntersection) {
    var _this,
        i,
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

    var isInRow,
        isIntersection;

    // console.log('Testing ', selected[0].cssId);

    for (i = 0; i < layers.length; i += 1) {

        isInRow = bottom > layers[i].css.top && top <= layers[i].css.top;
        isIntersection = 
                (left < layers[i].css.right && right >= layers[i].css.right) ||
                (left <= layers[i].css.left && right > layers[i].css.left) ||
                (left > layers[i].css.left && right < layers[i].css.right);

        // console.log(i, layers.length, layers[i].cssId, ' ltop ' + layers[i].css.top, 'lright' + layers[i].css.right, 'lleft' + layers[i].css.left, ' top ' + top, ' left ' + left, ' right ' + right, ' isRow: ' + isInRow, ' isIntersection: ' + isIntersection, ' selectIntersection ' + selectIntersection);
        
        if (isInRow) {
            
            if (false === selectIntersection) {
                if (true === isIntersection) {
                    continue;
                }
            }

            selected.push(layers[i]);

            if (bottom < layers[i].css.bottom) {
                bottom = layers[i].css.bottom;
            }

            if (false === selectIntersection) {

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


    // console.log(selected.map(function (layer) { return layer.cssId; })); 
    //console.log('---');
  
   // console.log('-');

    return selected;
};

Relative.prototype.getLayers = function (ids) {
    var _this;

    _this = this;

    //console.log('Getting ' + ids.length + ' layers.');
    return ids.reduce(function (result, id) {
        
        if (undefined !== _this.flatLayersTree[id]) {
            result.push(_this.flatLayersTree[id]);
        } else {
            console.error('Could not find layer with id "' + id + '".');
        }

        return result;

    }, []);
};


Relative.prototype.getRows = function (column, selectIntersection) {
    var _this,
        ids,
        row,
        rows;


    _this = this;
    rows = [];

    ids = column.layer.siblings.map(function (layer, index) {
        return layer.id;
    });

    while (0 < ids.length) {

        row = this.createRow(ids, selectIntersection);

        ids = ids.filter(function (id) {
            return -1 === row.layerIds.indexOf(id);
        });

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

Relative.prototype.parseContainers = function () {
    // Set the boundries for all containers
    // Set margins and paddings for all containers.
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

Relative.prototype.setColumnStyles = function () {

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
//            console.log(node.next.layer.cssId, node.next.layer.css.left, node.next.layer.css.right, node.next.layer.css.width);

                node.layer.css.marginRight = node.next.layer.css.left - node.layer.css.right;

               // console.log(node.next.layer.css.right, node.layer.css.right);
            } else {
                if (undefined !== parent) {
                    node.layer.css.marginRight = parent.css.right - node.layer.css.right;
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
                console.log('Bottom ' + node.layer.cssId + ' ' + bottom, parent.parent.children[parentIndex - 1].css.bottom);

                node.layer.css.marginTop = 
                    (parent.css.top - parent.parent.children[parentIndex - 1].css.bottom) + 
                    (node.layer.css.top - parent.css.top) -
                    (bottom - parent.parent.children[parentIndex - 1].css.bottom);

            } else {
                if (undefined !== parent) {
                    node.layer.css.marginTop = node.layer.css.top - parent.parent.layer.css.top;

                    console.log(node.layer.cssId, node.layer.css.marginTop);
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

Relative.prototype.setRowStyles = function () {

    this.walk(this.relativeTree, null, function (node, index, parent, parentIndex, level) {

        if ('row' === node.nodeType) {
            node.css = getBoundries(node.children.map(function (column) {
                return column.layer;
            }));

            node.css.right = parent.layer.css.right;

        } 

    });

};

Relative.prototype.orderColumns = function () {

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

Relative.prototype.showTree2 = function (node) {
    var _this = this,   
        inc = 0;

    var child = node.children[0];

    console.log(node.id, node.nodeType);
    while (undefined !== child) {
        inc += 1;
        if ('column' === child.nodeType) {
            console.log('--->' + child.layer.css.left, child.id);
        }
        child = child.next;
    }

    node.children.forEach(function (child) {
        _this.showTree2(child);
    });

};

Relative.prototype.parseTree = function () {


    this.linkRelative();

    this.setRowStyles();

    this.orderColumns();
    
    this.orderLayers();

    this.linkRelative();


//     this.showTree2(this.relativeTree);
    this.setColumnStyles();
     this.showTree();

};



if ('undefined' !== typeof module) {
    module.exports = Relative;
}

if ('undefined' !== typeof window) {
    window.Relative = Relative;
}

}());