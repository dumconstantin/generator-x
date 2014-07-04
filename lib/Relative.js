
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

Array.prototype.diff = function(a) {
    return this.filter(function(i) {
        return a.indexOf(i) < 0;
    });
};

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

    this.flattenLayersTree();
}

Relative.prototype.flattenLayersTree = function () {

    function flattenNode(layer, tree) {

        tree[layer.layerId] = layer;

        layer.siblings.forEach(function (sibling) {
            flattenNode(sibling, tree);
        });
    }

    this.flatLayersTree = {};
    flattenNode(this.layersTree, this.flatLayersTree);
};


Relative.prototype.createContainer = function (layer) {
    return {
        id: getId(),
        rows: [],
        container: true,
        reference: layer
    };
};

Relative.prototype.movelayers = function (layers, parent) {
    var ids;

    ids = layers.map(function (layer) {
        return layer.layerIds;
    });

    layers[0].parent.siblings = layers[0].parent.siblings.filter(function (layer) {
        return -1 === ids.indexOf(layer.layerId);
    });

    parent.siblings.concat(layers);

};


Relative.prototype.createColumn = function (layers) {
    var newColumn;


    newColumn = new Layer(layers[0].structure, {
        name: 'column-' + getId(),
        cssId: 'column-' + getId(),
        type: 'layerSection',
        bounds: getBoundries(layers)
    }, false);
    
    layers[0].parent.siblings.push(newColumn);

    this.flatLayersTree[newColumn.layerId] = newColumn;

    this.movelayers(layers, newColumn);

    return newColumn;
};

Relative.prototype.createRow = function (ids) {
    var _this = this,
        columnList,
        columns,
        usedLayersIds;

    columnList = this.getColumns(ids);
    columnList = this.mergeColumns(columnList);

    columns = [];
    usedLayersIds = [];

    columnList.forEach(function (column) {

        if (1 < column.length) {
            columns.push(_this.createColumn(column));
            
            usedLayersIds.concat(column.map(function (layer) {
                return layer.layerId;
            }));

        } else {
            columns.push(column[0]); 
        }

    });

    usedLayersIds = usedLayersIds.concat(columns.map(function (layer) {
        return layer.layerId;
    }));

    return {
        id: getId(),
        columns: columns,
        layerIds: usedLayersIds,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
    };
};


Relative.prototype.mergeColumns = function (columns) {
    var i, 
        j,
        left,
        right,
        column,
        mergedColumns;


    mergedColumns = [];

    while (0 < columns.length) {
        column = [columns.splice(0, 1)][0];

        left = column[0].css.left;
        right = column[0].css.right;

        for (j = 0; j < columns.length; j += 1) {

            if (
                right >= columns[j].left && left <= columns[j].left ||
                right >= columns[j].right && left <= columns[j].right
            ) {

                if (right < columns[j].right) {
                    right = columns[j].right;
                }

                if (left > columns[j].left) {
                    left = columns[j].left;
                }

                column.push(columns.splice(j, 1));
                j = 0;
            }

        }

        mergedColumns.push(column);
    }

    return mergedColumns;
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
Relative.prototype.getColumns = function (ids) {
    var i,
        center,
        layers, 
        columns,
        bottom,
        top,
        firstIndex;


    layers = this.getLayers(ids);
    columns = [];

    // Find the top most layer that will be used for reference.
    firstIndex = layers.reduce(function (selectedIndex, layer, index) {
        return layers[selectedIndex].css.top < layer.css.top ? selectedIndex : index;
    }, 0);
    bottom = layers[firstIndex].css.bottom;
    top = layers[firstIndex].css.top;

    for (i = 0; i < layers.length; i += 1) {
        center = layers[i].css.top + layers[i].css.height / 2;

        if (bottom >= center && top <= center) {

            if (bottom < layers[i].css.bottom) {
                bottom = layers[i].css.bottom;
                i = 0;
            }

            columns.push(layers[i]);
        }
    }

    return columns;
};

Relative.prototype.getLayers = function (ids) {
    var _this = this;

    return ids.reduce(function (result, id) {
        
        if (undefined !== _this.flatLayersTree[id]) {
            result.push(_this.flatLayersTree[id]);
        } else {
            console.error('Could not find layer with id "' + id + '".');
        }

        return result;

    }, []);
};

Relative.prototype.getRows = function (layer, parent) {
    var ids,
        row;

    ids = layer.siblings.map(function (sibling) {
        return sibling.layerId;
    });

    while (0 < ids.length) {

        row = this.createRow(ids);

        ids = ids.diff(row.layerIds);

        parent.rows.push(row);
    }

    return parent;
};

Relative.prototype.parseTree = function () {
    this.relativeTree = this.getRows(this.layersTree, this.createContainer(this.layersTree));
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