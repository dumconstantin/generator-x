
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
    var inc = 0;
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

            layer.css = layer.bounds;
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
    }

    this.flatLayersTree = {};
    flattenNode(this.layersTree, this.flatLayersTree);
};


Relative.prototype.createColumn = function (layer, layerIds) {
    return {
        id: getId(),
        rows: [],
        layer: layer,
        layerIds: undefined === layerIds ? [layer.id] : layerIds
    };
};

Relative.prototype.movelayers = function (layers, parent) {
    var ids;

    ids = layers.map(function (layer) {
        return layer.layerIds;
    });

    layers[0].parent.siblings = layers[0].parent.siblings.filter(function (layer) {
        return -1 === ids.indexOf(layer.id);
    });

    parent.siblings = parent.siblings.concat(layers);

};


Relative.prototype.createLayer = function (layers) {
    var newLayer;


    newLayer = new this.LayerConstructor(this.structure, {
        name: 'column-' + getId(),
        cssId: 'column-' + getId(),
        id: getId(),
        type: 'layerSection',
        bounds: getBoundries(layers)
    });
    
    layers[0].parent.siblings.push(newLayer);

    this.flatLayersTree[newLayer.id] = newLayer;

    this.movelayers(layers, newLayer);

    return newLayer;
};

Relative.prototype.createRow = function (ids) {
    var _this,
        row,
        columns,
        usedLayersIds;

    _this = this;
    row = {
        id: getId(),
        columns: [],
        layerIds: [],
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
    };

    row.columns = 
        this.createColumns(
            this.groupLayers(
                this.selectLayers(
                    this.getLayers(ids)
                )
            )
        );

    row.layerIds = row.columns.reduce(function (ids, column) {
        return ids.concat(column.layerIds);
    }, []);

    return row;
};

Relative.prototype.createColumns = function (layerGroups) {
    var _this;

    _this = this;

    return layerGroups.map(function (group) {

        if (1 < group.length) {

            return _this.createColumn(_this.createLayer(group), 
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
    var j,
        left,
        right,
        group,
        groups;

    groups = [];

    var inc = 0;

    while (0 < layers.length) {

        inc += 1;
        if (10 < inc) {
            break;
        }

        left = layers[0].css.left;
        right = layers[0].css.right;
        
        group = [layers.shift()];

        for (j = 0; j < layers.length; j += 1) {
            
            if (
                right >= layers[j].css.left && left <= layers[j].css.left ||
                right >= layers[j].css.right && left <= layers[j].css.right
            ) {

                if (right < layers[j].css.right) {
                    right = layers[j].css.right;
                }

                if (left > layers[j].css.left) {
                    left = layers[j].css.left;
                }

                group.push(layers.splice(j, 1)[0]);

                j = 0;
            }

        }

        groups.push(group);
    }

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

    var inc = 0;
    for (i = 0; i < layers.length; i += 1) {

        inc += 1;
        if (10 < inc) {
            return;
        }

        if (bottom >= layers[i].css.top && top <= layers[i].css.top) {
            
            selected.push(layers[i]);

            if (bottom < layers[i].css.bottom) {
                bottom = layers[i].css.bottom;
                i = 0;
            }
        }
    }

    console.log(selected.length);

    return selected;
};

Relative.prototype.getLayers = function (ids) {
    var _this;

    _this = this;

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
        row;

    _this = this;

    ids = column.layer.siblings.map(function (layer) {
        return layer.id;
    });

    console.log('Getting rows for ' + ids);

    var i = 0;

    while (0 < ids.length) {

        i += 1;
        if (10 < i) {
            // console.log(ids.length);
            break;
        }

        row = this.createRow(ids);

        ids = ids.filter(function (id) {
            return -1 === row.layerIds.indexOf(id);
        });

        column.rows.push(row);
    }

    column.rows.forEach(function (row) {
        row.columns.forEach(function (column) {
            _this.getRows(column);
        });
    });

    return column;
};

Relative.prototype.parseTree = function () {
    this.relativeTree = this.getRows(this.createColumn(this.layersTree));
};

Relative.prototype.getTree = function () {
    return this.relativeTree;
};

Relative.prototype.parseRows = function () {

}

Relative.prototype.refreshTree = function () {

};

Relative.prototype.parseContainers = function () {

};

Relative.prototype.parseColumns = function () {

};

Relative.prototype.showTree = function () {

};

Relative.prototype.modifyElements = function () {

}



if ('undefined' !== typeof module) {
    module.exports = Relative;
}