(function () { 
"use strict";

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
    this.structure = {};

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

Relative.prototype.createColumn = function (layer, layerIds) {
    var column;


    column = {
        id: getId(),
        children: [],
        layer: layer,
        layerIds: undefined === layerIds ? [layer.id] : layerIds,
        nodeType: 'column'
    };

    column.children = this.getRows(column);

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

};

Relative.prototype.addLayer = function (layer, parent) {

    parent.siblings.push(layer);
    this.flatLayersTree[layer.id] = layer;
    layer.parent = parent;

};


Relative.prototype.createLayer = function (layers) {
    var layer;


    layer = new this.LayerConstructor(this.structure, {
        name: 'column-' + getId(),
        cssId: 'column-' + getId(),
        id: getId(),
        type: 'layerSection',
        css: getBoundries(layers)
    });
    
    this.addLayer(layer, layers[0].parent);
    this.moveLayers(layers, layer);

    return layer;
};

Relative.prototype.createRow = function (ids) {
    var row;


    row = {
        id: getId(),
        children: [],
        layerIds: [],
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        nodeType: 'row'
    };

    row.children = 
        this.createColumns(
            this.groupLayers(
                this.selectLayers(
                    this.getLayers(ids)
                )
            )
        );

    row.layerIds = row.children.reduce(function (ids, column) {
        return ids.concat(column.layerIds);
    }, []);

    return row;
};

Relative.prototype.createColumns = function (layerGroups) {
    var _this;

    _this = this;

    return layerGroups.map(function (group) {

        if (1 < group.length) {

            return _this.createColumn(
                _this.createLayer(group), 
                group.map(function (layer) {
                    return layer.id;
                })
            );

        } else {

            return _this.createColumn(group[0]);

        }

    });
};


Relative.prototype.groupLayers = function (layers) {
    var i,
        left,
        right,
        group,
        groups;


    groups = [];
    //console.log('Grouping ' + layers.length + ' layers.');

    while (0 < layers.length) {

        group = [layers.shift()];

        left = group[0].css.left;
        right = group[0].css.right;
        
        for (i = 0; i < layers.length; i += 1) {
            
            if (
                right >= layers[i].css.left && left <= layers[i].css.left ||
                right >= layers[i].css.right && left <= layers[i].css.right
            ) {

                if (right < layers[i].css.right) {
                    right = layers[i].css.right;
                }

                if (left > layers[i].css.left) {
                    left = layers[i].css.left;
                }

                group.push(layers.splice(i, 1)[0]);

                i = 0;
            }

        }

        groups.push(group);
    }

    //console.log('Found groups: ' + groups.length);

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

        return boundries;

    }, {
        top: layers[0].css.top,
        left: layers[0].css.left,
        right: layers[0].css.right,
        bottom: layers[0].css.bottom
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
Relative.prototype.selectLayers = function (layers) {
    var _this,
        i,
        selected,
        bottom,
        top,
        firstIndex;

    _this = this;
    selected = [];

    // Find the top most layer that will be used for reference.
    firstIndex = layers.reduce(function (selectedIndex, layer, index) {
        return layers[selectedIndex].css.top < layer.css.top ? selectedIndex : index;
    }, 0);

    bottom = layers[firstIndex].css.bottom;
    top = layers[firstIndex].css.top;

    //console.log('Selecting layers from a ' + layers.length + ' layer set.');

    for (i = 0; i < layers.length; i += 1) {

        if (bottom >= layers[i].css.top && top <= layers[i].css.top) {
            
            selected.push(layers[i]);

            if (bottom < layers[i].css.bottom) {
                bottom = layers[i].css.bottom;
                i = 0;
            }
        }
    }

    //console.log('Selected layers: ' + selected.length);

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


Relative.prototype.getRows = function (column) {
    var _this,
        ids,
        row,
        rows;


    _this = this;
    rows = [];

    ids = column.layer.siblings.map(function (layer) {
        return layer.id;
    });

    while (0 < ids.length) {

        row = this.createRow(ids);

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

    function walk(node, level, parent, index) {
        level += 1;

        if (null !== preOrderCallback && undefined !== preOrderCallback) {
            preOrderCallback(node, index, parent, level);
        }
        
        node.children.forEach(function (child, index) {
            walk(child, level, node, index);
        });

        if (null !== inOrderCallback && undefined !== inOrderCallback) {
            inOrderCallback(node, index, parent, level);
        }

    }

    walk(node, 0, undefined, 0);

};

Relative.prototype.linkRelative = function () {

    this.walk(this.relativeTree, function (node, index, parent, level) {

        if(undefined !== parent) {
            node.parent = parent;
            node.prev = parent.children[index - 1];
            node.next = parent.children[index + 1];
        }

    });

};

Relative.prototype.setColumnStyles = function () {

    this.walk(this.relativeTree, null, function (node, index, parent, level) {

        if ('column' === node.nodeType) {
            
            node.layer.css.position = 'relative';
            node.layer.css.top = 'auto';
            node.layer.css.left = 'auto';
            node.layer.css.display = 'inline-block';
            node.layer.css.verticalAlign = 'top';

            if (undefined !== node.layer.parent) {
                node.layer.parent.css.fontSize = '0';
            }


            // Adjust for padding.

            if (undefined !== node.next) {
                node.layer.css.marginRight = node.next.layer.css.left - node.layer.css.right;
            } else {

            }
        } 

    });

};

Relative.prototype.setRowStyles = function () {

    this.walk(this.relativeTree, null, function (node, index, parent, level) {

        if ('row' === node.nodeType) {

        } 

    });

};

Relative.prototype.orderColumns = function () {

    this.walk(this.relativeTree, function (node, index, parent, level) {

        if ('row' === node.nodeType) {

            console.log(node);

            node.children.sort(function (prev, next) {
                return next.layer.css.left - prev.layer.css.left;
            });

        } 

    });

};

Relative.prototype.orderLayers = function () {

    this.walk(this.relativeTree, function (node, index, parent, level) {

        if ('row' === node.nodeType) {

            console.log(node);

            node.children.sort(function (prev, next) {
                return next.layer.css.left - prev.layer.css.left;
            });

        } 

    });

};

Relative.prototype.showTree = function () {

    this.walk(this.relativeTree, function (node, index, parent, level) {
        var str = '';

        while (0 < level) {
            str += '   ';
            level -= 1;
        }

        str += node.nodeType + ' - ' + node.id;
        console.log(str);

    });

};

Relative.prototype.parseTree = function () {

    this.orderColumns();
    
    this.orderLayers();

    this.linkRelative();

    this.setRowStyles();

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