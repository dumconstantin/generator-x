(function () { 
"use strict";

if ('undefined' !== typeof require) {
    var utils = require('./Utils.js'),
        Layer = require('./Layer.js');
}

var _ = require('underscore');

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

Relative.prototype.createHierarchy = function (column) {

    var grid = {
        vertical: [],
        horizontal: []
    };

    var gridTypes = {
        vertical: ['left', 'right'],
        horizontal: ['top', 'bottom']
    };

    var layers = column.layer.siblings.reduce(function (aggregator, layer) {
        aggregator[layer.id] = layer;
        return aggregator;
    }, {});

    Object.prototype.log = function (logType, separator) {

        if (undefined === separator) {
            separator = '';
        }

        switch (logType) {

            case 'groups':

                Object.keys(this).forEach(function (groupType) {
                    console.log('[' + groupType + ']');
                    groups[groupType].forEach(function (group) {
                        group.log('group');
                    });
                });

            break;

            case 'group':
                console.log(separator, JSON.stringify(this.layers.map(function (layerId) {
                    return layers[layerId].name; 
                })));
            break;

            case 'line':
                console.log(separator, this.type, this.orientation, this.value);
            break;

            case 'lineGroups':
                '--'.log();
                this.forEach(function (line) {
                    line.log('line');
                });
                '++'.log();
            break;

            case 'lines':

                this.forEach(function (line) {
                    line.log('lineGroups');
                });

            break;

            case 'layers':
                console.log(separator, JSON.stringify(this.map(function (layerId) {
                    return layers[layerId].name;
                })));

            break;
            case 'list':
                this.sort(function (left, right) {
                    return right.layers.length - left.layers.length;
                });
                console.log(separator, this.map(function (group) {
                    return JSON.stringify(group.layers.map(function (layerId) {
                        return layers[layerId].name;
                    }));
                }));
            break;
            case 'sections':
                console.log(separator, this.map(function (section) {
                    return JSON.stringify(section.group.layers.map(function (layerId){
                        return layers[layerId].name;
                    }))
                }));    
            break;

            case 'intersections':
                
                this.sort(function (left, right) {
                    return right[0].layers.length - left[0].layers.length;
                });

                '---'.log();
                this.forEach(function (intersection) {
                    intersection[0].log('group');
                    intersection[1].log('group');
                    intersection[2].log('layers');
                });
                '---'.log();
            break;

            case 'hierarchy':

                this.forEach(function (group) {
                    group.log('child', '--');
                });

            break;

            case 'child':

                this.log('group', separator);
                this.children.forEach(function (child) {
                    child.log('child', separator + '----');
                });

            break;

            default:
                console.log(separator, this);
            break;
        }

    };

    // CREATE GRID
    column.layer.siblings.forEach(function (layer) {

        Object.keys(gridTypes).forEach(function (direction) {
            var segment = [];

            gridTypes[direction].forEach(function (pos, index, types) {
                var line = grid[direction].reduce(function (aggregator, line) {
                    return line.value === layer.css[pos] ? line : aggregator;
                }, undefined);

                if (undefined === line) {
                    line = {
                        value: layer.css[pos],
                        layers: [],
                        intersects: [],
                        segments: [],
                        prev: {},
                        next: {},
                        type: direction,
                        orientation: pos
                    };
                    grid[direction].push(line);
                }

                line.layers.push(layer.id);

                if (undefined === layer[direction]) {
                    layer[direction] = {};
                }
                
                layer[direction][pos] = line;

                if ('vertical' === direction) {
                    line.segments.push([layer.css.top, layer.css.bottom]);
                } else {
                    line.segments.push([layer.css.left, layer.css.right]);
                }

            });

        });

    });

    Object.keys(gridTypes).forEach(function (direction) {
        grid[direction].sort(function (left, right) {
            return left.value - right.value;
        });

        grid[direction].forEach(function (line) {
            line.segments.sort(function (left, right) {
                return left[0] - right[0];
            });
        });
    });
    // END CREATE GRID


    // CREATE INTERSECTIONS
    Object.keys(gridTypes).forEach(function (direction) {
        grid[direction].forEach(function (dirLine) {
            var opposite = 'vertical' === direction ? 'horizontal' : 'vertical';

            grid[opposite].forEach(function (line) {

                line.segments.forEach(function (segment) {
                    if (dirLine.value > segment[0] && dirLine.value < segment[1]) {
                        dirLine.intersects.push(line);
                    }
                });

            });

            dirLine.intersects.push(grid[opposite][0]);
            dirLine.intersects.push(grid[opposite][grid[opposite].length - 1]);

            dirLine.intersects.sort(function (left, right) {
                return left.value - right.value;
            });

        });
    });
    // END CREATE INTERSECTIONS

    var newGroupId = (function () {
        var id = 0;
        return function () {
            id += 1;
            return id;
        }
    }());

    function newGroup(area) {
        var group = {};

        group.id = newGroupId();
        group.origin = area[0];
        group.area = area;
        group.layers = [];
        group.children = [];

        Object.keys(layers).forEach(function (layerId) {
            var layer = layers[layerId];

            if (layer.css.top >= group.area[1] && layer.css.left >= group.area[2] &&
                layer.css.bottom <= group.area[3] && layer.css.right <= group.area[4]) {
                group.layers.push(layer.id);
            }
        });

        return group;
    }

    function nextLine(intersection, direction) {
        var origin,
            lines,
            element,
            current;

        if ('up' === direction || 'down' === direction) {
            origin = 0;
        } else {
            origin = 1;
        }

        current = 0 === origin ? 1 : 0;
        lines = intersection[current].intersects;

        if ('left' === direction || 'up' === direction) {
            lines = lines.slice().reverse();
        }

        lines.every(function (line) {

            if (
                (('left' === direction || 'up' === direction) && intersection[origin].value > line.value) ||
                (('right' === direction || 'down' === direction) && intersection[origin].value < line.value)
            ) {
                intersection[origin] = line;
                return false;
            } else {
                return true;
            }
        });

        // TODO: Will there be a case where two layers have the same left and are one above the other so that
        // they both comply with the horizontal intersection?

        intersection[origin].layers.forEach(function (layerId) {
            var layer = layers[layerId];

            if (
                ('vertical' === intersection[origin].type && intersection[current].value > layer.css.top 
                    && intersection[current].value < layer.css.bottom)
                || ('horizontal' === intersection[origin].type && intersection[current].value > layer.css.left
                    && intersection[current].value < layer.css.right) 
            ) {
                element = layerId;
            }

        });

        intersection[2] = element;

        return intersection;
    }

    function getArea(path, layer) {
        var area;

        area = path.reduce(function (aggregator, line) {

            if (layer.css.bottom <= line[0].value && (undefined === aggregator.bottom || aggregator.bottom > line[0].value)) {
                aggregator.bottom = line[0].value;
            }

            if (layer.css.right <= line[1].value && layer.css.bottom >= line[0].value && 
                (undefined === aggregator.right || aggregator.right > line[1].value)) {
                aggregator.right = line[1].value;
            }

            if (layer.css.left >= line[1].value && layer.css.bottom >= line[0].value 
                && (undefined === aggregator.left || aggregator.left < line[1].value)) {
                aggregator.left = line[1].value;
            }

            return aggregator;
        }, {
            left: undefined,
            right: undefined,
            top: layer.css.top,
            bottom: undefined
        });

        return [layer.id, area.top, area.left, area.bottom, area.right];
    }

    Object.keys(layers).forEach(function (layerId) {

        var layer = layers[layerId];
        var paths = {
            horizontal: [],
            vertical: []
        };

        [
            ['top', 'left'],
            ['top', 'right'],
            ['bottom', 'left'],
            ['bottom', 'right']
        ].forEach(function (coords) {
            var path,
                intersection,
                finished,
                direction,
                oppositeDirection,
                goal,
                directionOverwrite;

            path = [];
            finished = false;
            directionOverwrite = [];
            
            intersection = [layer.horizontal[coords[0]], layer.vertical[coords[1]], layer.id];
            oppositeDirection = 'left' === intersection[1].orientation ? 'right' : 'left';
            goal = oppositeDirection;

            if ('top' === coords[0]) {
                directionOverwrite.push('down');
            }

            directionOverwrite.push(oppositeDirection);
            path.push(intersection.slice());
            
            do {

                direction = 0 < directionOverwrite.length ? directionOverwrite.shift() : 'up';
                intersection = nextLine(intersection.slice(), direction);

                if (
                    ('left' === coords[1] && layer.vertical.right.value <= intersection[1].value)
                    || ('right' === coords[1] && layer.vertical.left.value >= intersection[1].value)
                ) {
                    goal = 'up';
                }

                // Finish conditions
                if (layer.horizontal.top.value >= intersection[0].value) {
                    finished = true;
                    intersection[0] = layer.horizontal.top;
                    path.push(intersection.slice());
                } else {
                    path.push(intersection.slice());
                    // Solve colision
                    if (
                        'up' !== goal 
                        && undefined !== intersection[2] 
                        && intersection[0].value !== layers[intersection[2]].horizontal.top.value
                    ) {
                        intersection[0] = layers[intersection[2]].horizontal.top;
                        directionOverwrite.push(oppositeDirection);
                        path.push(intersection.slice());
                    }

                    if (
                        'up' === goal 
                        && undefined !== intersection[2] 
                        && intersection[1].value !== layers[intersection[2]].vertical[coords[1]].value
                    ) {
                        intersection[1] = layers[intersection[2]].vertical[coords[1]];
                        path.push(intersection.slice());
                    }

                }

            } while (false === finished);

            path.forEach(function (intersection) {
            //    [intersection[0].value, intersection[1].value].log();
            });

            if ('top' === coords[0]) {
                paths.vertical.push(path);
            } else {
                paths.horizontal.push(path);
            }

        });


        var areas = {
            vertical: [],
            horizontal: []
        };

        var groups = {
            vertical: [],
            horizontal: []
        };


        Object.keys(areas).forEach(function (areaType) {
            paths[areaType].forEach(function (path) {
                var area = getArea(path, layer);
                areas[areaType].push(area);
                
            });

        });

        // Join areas to form a broader one.

        ['vertical', 'horizontal'].forEach(function (direction) {
            var leftArea = areas[direction][areas[direction].length - 2];
            var rightArea = areas[direction][areas[direction].length - 1];

            areas[direction].push([
                layer.id,
                leftArea[1],
                leftArea[2] < rightArea[2] ? leftArea[2] : rightArea[2],
                leftArea[3] < rightArea[3] ? leftArea[3] : rightArea[3],
                leftArea[4] > rightArea[4] ? leftArea[4] : rightArea[4],
            ]);
        });
            
        console.log(areas);

    });

    // groups.log('groups');

    return;


    grid.vertical.forEach(function (vertical) {

        vertical.layers.forEach(function (layerId) {



            /*
            console.log(layer.name, 'Went through ', lines.map(function (line) {
                return [line.type, line.value];
            })); */

            groups.push(newGroup(area));

            if (undefined === composed[layerId]) {
                composed[layerId] = area;
            } else {
                groups.push(newGroup([
                    layerId,
                    composed[layerId][1] < area[1] ? composed[layerId][1] : area[1],
                    composed[layerId][2] < area[2] ? composed[layerId][2] : area[2],
                    composed[layerId][3] > area[3] ? composed[layerId][3] : area[3],
                    composed[layerId][4] > area[4] ? composed[layerId][4] : area[4]
                ]));
            }

        });

    });



    // Some layers do not select themselves but are required to establish a good hierarchy.
    var missingIds = Object.keys(layers).map(function (layerId) {
        return parseInt(layerId);
    });

    groups.forEach(function (group) {
        var index;

        if (1 === group.layers.length) {
            index = missingIds.indexOf(group.layers[0]);

            if (-1 !== index) {
                missingIds.splice(index, 1);
            }
        }

    });

    missingIds.forEach(function (layerId) {
        groups.push(newGroup([
            layerId,
            layers[layerId].css.top,
            layers[layerId].css.left,
            layers[layerId].css.bottom,
            layers[layerId].css.right,        
        ]));
    });


    function removeGroups(groups, ids) {
        ids.forEach(function (groupId) {

            groups.every(function (group, index) {

                if (groupId === group.id) {

                    groups.splice(index, 1);

                    return false;
                } else {
                    return true;
                }

            });

        });
    }

    function removeContaining(groups, containing) {
        var count = Object.keys(containing).length,
            toRemove = [];

        groups.forEach(function (group) {
            if (count === group.layers.length) {
                toRemove.push(group.id);
            }
        });

        removeGroups(groups, toRemove);
    }
    

    function removeDuplicates(groups) {
        var toRemove = [];
                
        groups.forEach(function (group) {

            groups.forEach(function (group2, index) {
                var same = 0;

                if (group.id !== group2.id && group.layers.length === group2.layers.length && true !== group2.original) {
                    group2.layers.forEach(function (layerId) {
                        if (-1 !== group.layers.indexOf(layerId)) {
                            same += 1;
                        }
                    });

                    if (group.layers.length === same) {
                        toRemove.push(group2.id);
                        group.original = true;
                    }
                }

            });

        });

        removeGroups(groups, toRemove);

    }

    removeContaining(groups, layers);
    removeDuplicates(groups);

    function findIntersections(groups) {
        return groups.reduce(function (aggregator, group, index) {

                groups.forEach(function (group2) {
                    var intersected;

                    if (group.id !== group2.id) {
                        intersected = _.intersection(group.layers, group2.layers);

                        if (intersected.length !== group2.layers.length && intersected.length !== group.layers.length && 0 < intersected.length) {
                            aggregator.push([group, group2, intersected.map(function (layerId) {
                                return parseInt(layerId);
                            })]);
                        }
                    }

                });

            return aggregator;
        }, []);
    }

    function solveIntersections(intersections) {
        intersections.forEach(function (intersection) {
            var toReduce,
                reduceIndex,
                from,
                temp,
                area = [],
                determinedArea,
                extractedLayers = [];

            if (intersection[0].area[2] < intersection[1].area[2]) {
                reduceIndex = 1;
            } else if (intersection[0].area[2] > intersection[1].area[2]) {
                reduceIndex = 0;
            } else {

                if (intersection[0].area[1] < intersection[1].area[1]) {
                    reduceIndex = 0;
                } else if (intersection[0].area[1] > intersection[1].area[1]) {
                    reduceIndex = 1;
                } else {
                    'Also the top is equal! How can this be?'.log();
                }
            }

            from = 0 === reduceIndex ? intersection[1] : intersection[0];
            toReduce = intersection[reduceIndex];

            intersection[2].forEach(function (layerId) {
                var index = toReduce.layers.indexOf(layerId);

                if (-1 !== index) {
                    extractedLayers.push(toReduce.layers.splice(index, 1));
                }
            });

            if (0 < extractedLayers.length) {
                
                extractedLayers = extractedLayers.map(function (layerId) {
                    return parseInt(layerId);
                });

                determinedArea = extractedLayers.reduce(function (aggregator, layerId) {

                    if (aggregator.top > layers[layerId].css.top) {
                        aggregator.top = layers[layerId].css.top;
                    }
                    if (aggregator.left > layers[layerId].css.left) {
                        aggregator.left = layers[layerId].css.left;
                    }
                    if (aggregator.bottom < layers[layerId].css.bottom) {
                        aggregator.bottom = layers[layerId].css.bottom;
                    }
                    if (aggregator.right < layers[layerId].css.right) {
                        aggregator.right = layers[layerId].css.right;
                    }

                    return aggregator;
                }, {
                    top: layers[extractedLayers[0]].css.top,
                    left: layers[extractedLayers[0]].css.left,
                    bottom: layers[extractedLayers[0]].css.bottom,
                    right: layers[extractedLayers[0]].css.right,
                });

                groups.push(newGroup([
                    extractedLayers[0],
                    determinedArea.top,
                    determinedArea.left,
                    determinedArea.bottom,
                    determinedArea.right
                ]));

            }

        }); 
    }

    var intersections;

    do {
        intersections = findIntersections(groups);
        solveIntersections(intersections);
        removeDuplicates(groups);
    } while (0 < intersections.length);
    

    removeDuplicates(groups);

    groups.log('list');
    // Create the hierarchy
    var toRemove = [];

    groups.forEach(function (group, index) {
        var parent;

        groups.forEach(function (group2) {
            var intersection = _.intersection(group.layers, group2.layers);

            if (group.id !== group2.id && intersection.length === group.layers.length && group.layers.length < group2.layers.length) {

                if (undefined === parent || parent.layers.length > group2.layers.length) {
                    parent = group2;
                }

            }

        });

        if (undefined !== parent) {
            parent.children.push(group);
            toRemove.push(group.id);
        } else {
            // group.log('group', 'doesnt have a parent:');
        }

    });

    toRemove.forEach(function (groupId) {

        groups.every(function (group, index) {
            if (group.id === groupId) {
                groups.splice(index, 1);

                return false;
            } else {
                return true;
            }
        });

    });

    return groups;
};

Relative.prototype.getNewRows = function(groups) {

};


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

    var groups = this.createHierarchy(column);    

    // pentru structura de randuri se gaseste cel mai de sus element si apoi se gasesc
    // elementele care au un top mai mare sau egal cu bottom-ul sau.
    // Cele care nu se incadreaza in asta sunt pe acelasi rand!

    // Create the wrapper layers.

    function createWrappers(groups) {

        groups.forEach(function (group) {

            if (0 < group.children.length) {
                createWrappers(group.children);
            }

        });

    }

    createWrappers(groups);

    groups.log('hierarchy');

    var rows = this.getNewRows(groups);

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
            // this.groupLayers(
                this.selectLayers(
                    this.structure.getLayers(ids),
                    isIgnoreIntersection
                )
            // );

    /*
    row.layerGroups.sort(function (left, right) {
        return left.css.left < right.css.left;
    });
    */

    /*
    row.layerIds = row.layerGroups.reduce(function (ids, group) {
        return ids.concat(group.map(function (layer) {
            return layer.id;
        }));
    }, []); */
    
    row.layerIds = row.layerGroups.map(function (layer) {
        return layer.id;
    });

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

        //console.log(i, layers.length, layers[i].cssId, ' ltop ' + layers[i].css.top, 'lright' + layers[i].css.right, 'lleft' + layers[i].css.left, ' top ' + top, ' left ' + left, ' right ' + right, ' isRow: ' + isInRow, ' isIntersection: ' + isIntersection, ' isIgnoreIntersection ' + isIgnoreIntersection, isInRow);
        
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


    // console.log(selected.map(function (layer) { return layer.cssId; }));
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

    var names = [];

    ids = column.layer.siblings.map(function (layer, index) {
        names.push(layer.id + ' ' + layer.name);
        return layer.id;
    });

    // console.log('Searching in ', names);
    while (0 < ids.length) {

        row = this.createRow(ids, isIgnoreIntersection);

        ids = ids.filter(function (id) {
            return -1 === row.layerIds.indexOf(id);
        });

        // console.log('The following ids remain: ', ids);

        rows.push(row);
    }

    return rows;
};

Relative.prototype.removeGroups = function () {
    var _this = this;

    function remove(node) {

        if (0 < node.siblings.length) {
            node.siblings.forEach(function (sibling) {
                remove(sibling);
            });
        }

        if ('layerSection' === node.type) {
            _this.structure.moveLayers(node.siblings, _this.structure.parent);
        }

    }

    function prune(node) {

        node.siblings.slice().forEach(function (sibling) {
            prune(sibling);
        });

        if (undefined !== node.parent && true) {

            var index = node.parent.siblings.reduce(function (aggregator, element, index) {
                if (node.id === element.id) {
                    aggregator = index;
                }
                return aggregator;
            }, 0);

            if ('layerSection' === node.type && 0 === node.siblings.length) {
                node.parent.siblings.splice(index, 1);
            }

        }


    }

    remove(this.structure.parent);


    prune(this.structure.parent);

};


Relative.prototype.generate = function () {

    this.removeGroups();

    // this.structure.show();

    this.refreshParentBoundries(false);

    this.moveLayers();

    this.refreshParentBoundries(false);

    this.moveTextLayers();

    this.refreshParentBoundries();

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

            if (true === node.layer.ignore) {
                return;
            }

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
                var ignoredTop = 0;
                var tempIgnored = 0;

                while (undefined !== parent.parent.children[searchIndex]) {
                    
                    tempIgnored = 0
                    parent.parent.children[searchIndex].children.forEach(function (searchColumn) {
                        var searchBottom = searchColumn.layer.css.bottom,
                            searchIgnored;

                        if (undefined !== searchColumn.layer.css.marginTop) {
                            //searchBottom += searchColumn.layer.css.marginTop;
                        }

                        if (bottom < searchBottom) {
                            bottom = searchBottom;
                        }

                        if (true === searchColumn.layer.ignore) {
                            searchIgnored = searchColumn.layer.css.height + (searchColumn.layer.css.top - parent.parent.parent.css.top);
                        }

                        if (tempIgnored < searchIgnored) {
                            tempIgnored = searchIgnored;
                        }


                        // Find absolute positioned layers that were ignored in the relative process.
                        // 
                    });

                    ignoredTop += tempIgnored;

                    searchIndex -= 1;
                }
                // console.log('Bottom ' + node.layer.cssId + ' ' + bottom, parent.parent.children[parentIndex - 1].css.bottom);

                var parentTop = parent.css.top - parent.parent.children[parentIndex - 1].css.bottom;
                var childTop = node.layer.css.top - parent.css.top;
                var childBottom = bottom - parent.parent.children[parentIndex - 1].css.bottom;

                node.layer.css.marginTop = (parentTop + childTop + ignoredTop) - childBottom;

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

function isContained(container, innerTest) {
    if (
        container.index < innerTest.index &&
        (container.css.top <= innerTest.css.top
            && container.css.left <= innerTest.css.left
            && container.css.right >= innerTest.css.right
            && container.css.bottom >= innerTest.css.bottom)
        ) {
        return true;
    } else {
        return false;
    }
};

// TODO: when a background layer has opacity set and it has children
// make the transparency on the background property not on the layer itself.
function isInner(container, innerTest) {

    if (
        container.index < innerTest.index &&
        ((container.css.top <= innerTest.css.top
            && container.css.left <= innerTest.css.left
            && container.css.right >= innerTest.css.right
            && container.css.bottom >= innerTest.css.bottom) ||
        (container.css.left > innerTest.css.left
            && container.css.right < innerTest.css.right 
            && container.css.top <= innerTest.css.top 
            && container.css.bottom >= innerTest.css.bottom) ||
        (container.css.top > innerTest.css.top 
            && container.css.bottom < innerTest.css.bottom
            && container.css.left < innerTest.css.left
            && container.css.right > innerTest.css.right))
        ) {
        return true;
    } else {
        return false;
    }
}

function isOuter(container, outerTest) {
    if (
        container.css.top > outerTest.css.top
            || container.css.left > outerTest.css.left
            || container.css.right < outerTest.css.right
            || container.css.bottom < outerTest.css.bottom
        ) {
        return true;
    } else {
        return false;
    }
}

function isOverlay(container, overlayTest) {

    if (container.css.top < overlayTest.css.bottom
        && container.css.bottom > overlayTest.css.top
        && container.css.left < overlayTest.css.right
        && container.css.right > overlayTest.css.left
        ) {
        return true;
    } else {
        return false;
    }
}


function findElements(parent, layer, isPosition) {
    var elements = [];


    function findPosition(node) {

        node.siblings.forEach(function (sibling) {

            if (layer.id === sibling.id) {
                return;
            }

            if (isPosition(layer, sibling)) {
                if (isChildOf(layer, sibling)) {
                    findPosition(sibling);
                } else {
                    elements.push(sibling);
                }
            } else {
                findPosition(sibling);
            }
        });

    }

    findPosition(parent);

    // console.log(layer.id, elements.map(function (element) { return element.id }));

    return elements;
}

function isChildOf(layer, parent) {

    if (undefined === layer.parent) {
        return false;
    }

    if (layer.parent.id === parent.id) {
        return true;
    } else {
        return isChildOf(layer.parent, parent);
    }

};


/**
 * After all (sibling) layers have real boundries, parent containers can
 * refresh their own boundries.
 *
 * The recalculation is done bottom up to ensure that changes from the lowest
 * hierarchical container influence the top most container.
 *
 * Each container searches for the lowest top, left and the highest right, bottom
 * among all sibling values. Once the extreme are found, these become the boundries
 * for the container.
 *
 * The calculated boundries do not take into consideration FX as these will be
 * CSS styles that will not influence the positioning of elements.
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Relative.prototype.refreshParentBoundries = function (withText) {

    if (undefined === withText) {
        withText = true;
    }

    // Recursive function.
    function refreshParentBoundries(section) {
        var topMost,
            bottomMost,
            leftMost,
            rightMost;

        section.siblings.forEach(function (sibling, index) {
            if ('layerSection' === sibling.type && 0 !== sibling.siblings.length) {
                refreshParentBoundries(sibling);
            }

            if (false === withText && 'textLayer' === sibling.type) {
                return;
            }

            if (undefined === topMost) {
                topMost = sibling.css.top;
            }

            if (undefined === bottomMost) {
                bottomMost = sibling.css.bottom;
            }

            if (undefined === leftMost) {
                leftMost = sibling.css.left;
            }

            if (undefined === rightMost) {
                rightMost = sibling.css.right;
            }


            if (topMost > sibling.css.top) {
                topMost = sibling.css.top
            }

            if (leftMost > sibling.css.left) {
                leftMost = sibling.css.left;
            }

            if (bottomMost < sibling.css.bottom) {
                bottomMost = sibling.css.bottom
            }

            if (rightMost < sibling.css.right) {
                rightMost = sibling.css.right;
            }

        });

        section.css.top = undefined !== topMost ? topMost : section.css.top;
        section.css.left = undefined !== leftMost ? leftMost : section.css.left;
        section.css.bottom = undefined !== bottomMost ? bottomMost : section.css.bottom;
        section.css.right = undefined !== rightMost ? rightMost : section.css.right;

        section.css.width = section.css.right - section.css.left;
        section.css.height = section.css.bottom - section.css.top;         
    }

    this.structure.parent.siblings.forEach(function (layer) {

        if ('layerSection' === layer.type && 0 !== layer.siblings.length) {
            refreshParentBoundries(layer);
        }

    });


    return this;
};

function getIntersected(layer, list) {
    var result = [];

    result = list.reduce(function (aggregator, element) {
        /*console.log('left:', layer.css.left, element.css.left, 
            'right:', layer.css.right, element.css.right, 
            'top:', layer.css.top, element.css.top, 
            'bottom:', layer.css.bottom, element.css.bottom); */

        if (
            (layer.css.left < element.css.right && layer.css.left >= element.css.left ||
                layer.css.right > element.css.left && layer.css.right <= element.css.right ||
                layer.css.left <= element.css.left && layer.css.right >= element.css.right)
            &&
            (layer.css.top < element.css.bottom && layer.css.top >= element.css.top ||
                layer.css.bottom > element.css.top && layer.css.bottom <= element.css.bottom ||
                layer.css.top <= element.css.top && layer.css.bottom >= element.css.bottom)
        ) {
            aggregator.push(element);
        } else {

        }

        return aggregator;

    }, []);

    return result;
}

// Redo the hierachies based on the actual location of elements
// and not on the PSD order (Just as a Developer would do)

// The slice is create a copy to ensure that the moving
// of layers will not affect the loop.
Relative.prototype.moveLayers = function moveLayers() {
    var moved = {},
        _this;

    _this = this;

    function move(layers) {

        layers.slice().forEach(function (layer) {
            var innerElements,
                outerElements;

            if ('textLayer' === layer.type) {
                return;
            }

            innerElements = findElements(_this.structure.parent, layer, isInner);

            innerElements = innerElements.filter(function (element) {
                var parent,
                    levelMoved = 0,
                    levelToMove = 0;

                if (undefined !== moved[element.id]) {
                    
                    if (isChildOf(layer, moved[element.id])) {
                        moved[element.id] = layer;
                        return true;
                    } else {
                        return false;
                    }
                    
                } else {
                    moved[element.id] = layer;
                    return true;
                }

            });

            innerElements = innerElements.filter(function (element) {
                if ('textLayer' === element.type) {
                    return false;
                } else {
                    return true;
                }
            });

            if ('div' !== layer.tag && 0 < innerElements.length) {
                if ('img' === layer.tag) {
                    layer.css.background.fileSrc = layer.fileSrc;
                }
                layer.tag = 'div';
            }

            innerElements.forEach(function (element) {
                var removeIndex;

                // Search for the element index.
                element.parent.siblings.every(function (sibling, index) {
                    if (sibling.id === element.id) {
                        removeIndex = index;
                        return false;
                    } else {
                        return true;
                    }
                });

                element.parent.siblings.splice(removeIndex, 1);

                layer.siblings.push(element);

            });
            
            _this.structure.linkLayers();
            
            move(layer.siblings);
        });
    }

    move(this.structure.parent.siblings);
};

Relative.prototype.moveTextLayers = function () {
    var _this = this;

    function getTextLayers(nodes) {
        var textLayers = [];

        nodes.forEach(function (node) {
            if ('textLayer' === node.type) {
                textLayers.push(node);
            }
            
            if (0 < node.siblings.length) {
                textLayers = textLayers.concat(getTextLayers(node.siblings));
            }

        });

        return textLayers;
    }

    function findParent(layer, node) {
        var found;

        function find(layer, node) {

            if (layer.index > node.index) {

                if (isContained(node, layer)) {
                    
                    if (undefined === found) {
                        found = node;
                    } else if (found.index < node.index) {
                        found = node;
                    }

                }

            }

            node.siblings.forEach(function (sibling) {
                find(layer, sibling);
            });

        }

        find(layer, node);

        return found;
    }

    var textLayers = getTextLayers(this.structure.parent.siblings);

    textLayers.forEach(function (layer) {

        var parent = findParent(layer, _this.structure.parent);

        if (undefined === parent) {
            parent = _this.structure.parent;
        }

        _this.structure.moveLayers([layer], parent);

        var intersected = getIntersected(layer, 
            layer.parent.siblings.reduce(function (aggregator, sibling) {
            if (layer.id !== sibling.id) {
                aggregator.push(sibling);
            }
            return aggregator;
        }, []));

        if (2 <= intersected.length) {

            var newParent = _this.structure.createLayer(intersected);
            // newParent.ignore = true;

        }

    });

};

Relative.prototype.customOrder = function () {
    var _this = this,
        moveAfter = [];

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {

        if ('column' === node.nodeType) {

            // Detect which layer is a text layer
            // Detect if it is intersected with another layer
            // Swap the order of those nodes

            var text = node.children.reduce(function (aggregator, child) {
                
                if (1 === child.children.length && 'textLayer' === child.children[0].layer.type) {
                    aggregator.push(child);
                }

                return aggregator;
            }, []);

            text.forEach(function (textRow) {
                var nextRow = textRow,
                    lastRow;

                do {
                    lastRow = nextRow;
                    nextRow = nextRow.next;
                } while (undefined !== nextRow && 1 === getIntersected(textRow, [nextRow]).length);

                if (textRow.id !== lastRow.id) {
                    moveAfter.push([textRow, lastRow]);
                }

            });

        }

    });

    moveAfter.forEach(function (toMove) {
        var indexLeft,
            indexRight;

        indexLeft = _this.getNodeIndex(toMove[0]);

        if (-1 === indexLeft) {
            console.error('Index for element was not found in parent', toMove[0]);
            return;
        }

        toMove[0].parent.children.splice(indexLeft, 1);

        indexRight = _this.getNodeIndex(toMove[1]);

        toMove[0].parent.children.splice(indexRight + 1, 0, toMove[0]);

    });

};

Relative.prototype.getNodeIndex = function (element) {
    return element.parent.children.reduce(function (aggregator, child, index) {
        if (element.id === child.id) {
            aggregator = index;
        }
        return aggregator;
    }, -1);
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

Relative.prototype.removeExtraParents = function () {

    return;

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {

        if ('column' === node.nodeType) {
            
        }

    });

};

Relative.prototype.forceColumns = function () { 

    this.walk(this.relativeTree, function (node, index, parent, parentIndex, level) {

        if ('column' === node.nodeType) {
            


        }

    });

};

Relative.prototype.parseTree = function () {

    ///this.forceColumns();

    this.showTree();

    this.setRowBoundries();

    this.linkRelative();

    this.orderNodes();

    this.linkRelative();

    this.customOrder();

    this.linkRelative();

    this.removeExtraParents();

    this.linkRelative();

    this.orderLayers();

    this.setPadding();

    this.setStyles();

    this.setZIndex();

    this.structure.linkLayers();



};



if ('undefined' !== typeof module) {
    module.exports = Relative;
}

if ('undefined' !== typeof window) {
    window.Relative = Relative;
}

}());