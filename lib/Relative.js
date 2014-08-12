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


    console.log(column.layer.siblings.length);

    var verticals = [],
        horizontals = [];


    var vertical = {
        next: {},
        prev: {},
        value: 0,
        layers: [],
        intersects: []
    };

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
                        type: direction
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

    // CREATE groups

    function nextLine(vOrigin, hOrigin, line, layer, hDirection, vDirection, lastLine) {
        var nextLine;

        line.intersects.every(function (testLine, index, lines) {

            if ('vertical' === line.type) {

                if ('down' === vDirection) {

                    if (layer.css.bottom <= testLine.value) {
                        nextLine = testLine;
                    }

                } else {

                    if (lastLine.value <= testLine.value) {
                        nextLine = lines[index - 1];

                        if (hOrigin.value > nextLine.value) {
                            nextLine = hOrigin;
                        }
                    }

                }

            } else {

                if (vOrigin.value === layer.css.left) {

                    if ('left' === hDirection) {
                        
                        if (lastLine.value <= testLine.value) {
                            nextLine = lines[index - 1];

                            if (vOrigin.value > nextLine.value) {
                                nextLine = vOrigin;
                            }

                        }

                    } else {

                        if (lastLine.value < testLine.value) {
                            nextLine = testLine;
                        }

                    }

                } else {

                    if ('right' === hDirection) {

                        if (lastLine.value < testLine.value) {
                            nextLine = testLine;

                            if (vOrigin.value < nextLine.value) {
                                nextLine = vOrigin;
                            }

                        }

                    } else {

                        if (lastLine.value <= testLine.value) {
                            nextLine = lines[index - 1];
                        }

                    }

                }

            }

            if (undefined !== nextLine) {
                return false;
            } else {
                return true;
            }

        });

        return nextLine;

    }

    var vertical = grid.vertical[1];

    var areas = [];

    grid.vertical.forEach(function (vertical) {

        vertical.layers.forEach(function (layerId) {
            var layer = layers[layerId],
                current = vertical,
                hDirection = vertical.value === layer.css.left ? 'right' : 'left',
                opposite = 'left' === hDirection ? 'right' : 'left',
                vDirection = 'down',
                vOrigin = current,
                hOrigin = layer.horizontal.top,
                lines = [],
                top,
                left,
                right,
                bottom,
                area;

            do {
                // console.log(current.value, current.type, hDirection, vDirection);
                
                lines.push(current);
                current = nextLine(vOrigin, hOrigin, current, layer, hDirection, vDirection, lines[lines.length - 2]);

                vDirection = 'up';

                if (3 <= lines.length) {
                    hDirection = opposite;
                }

            } while (current !== vertical && undefined !== current);



            /*
            console.log(layer.name, 'Went through ', lines.map(function (line) {
                return [line.type, line.value];
            })); */

            top = hOrigin.value;
            bottom = lines[1].value;

            if (vOrigin.value === layer.css.right) {
                
                right = vOrigin.value;

                if (lines[lines.length - 2].value !== layer.css.left || 
                    (grid.vertical[0].value === lines[lines.length - 2].value)
                ) {
                    left = lines[lines.length - 2].value;
                } else {
                    left = lines[lines.length - 4].value;
                }

            } else {

                left = vOrigin.value;

                if (lines[lines.length - 2].value !== layer.css.right ||
                    (grid.vertical[grid.vertical.length - 1].value === lines[lines.length - 2].value)
                ) {
                    right = lines[lines.length - 2].value;
                } else {
                    right = lines[lines.length - 4].value;
                }

            }

            area = [layerId, top, left, bottom, right];

            areas.push(area);

            /*
            layerId = layer.name;

            if (undefined === areas[layerId]) {
                areas[layerId] = [top, left, bottom, right];
            } else {

                if (areas[layerId][1] > left) {
                    areas[layerId][1] = left;
                }

                if (areas[layerId[3]] < right) {
                    areas[layerId][3] = right;
                }

            } */
            // console.log(layer.name, area);

        });

    });
    
    
    var newAreas = []; 

    areas.forEach(function (area) {

        areas.forEach(function (area2) {
            var newArea = [];

            if (area[0] === area2[0] && area[2] !== area2[2]) {

                newArea.push(area[0]);

                newArea.push(area[1] < area2[1] ? area[1] : area2[1]);
                newArea.push(area[2] < area2[2] ? area[2] : area2[2]);
                newArea.push(area[3] > area2[3] ? area[3] : area2[3]);
                newArea.push(area[4] > area2[4] ? area[4] : area2[4]);

                newAreas.push(newArea);
            }

        });

    });

    areas = areas.concat(newAreas);

    var groups = [];
    areas.forEach(function (area) {
        var group = {},
            duplicate = false;

        group.origin = layers[area[0]].id;
        group.area = area;
        group.layers = [];

        Object.keys(layers).forEach(function (layerId) {
            var layer = layers[layerId];

            // console.log(layer.name, layers[area[0]].name, area[2], layer.css.left); //, layer.css.left, layer.css.bottom, layer.css.right);

            if (layer.css.top >= area[1] && layer.css.left >= area[2] &&
                layer.css.bottom <= area[3] && layer.css.right <= area[4]) {
                group.layers.push(layer.id);
            }
        });

        groups.every(function (groupTest) {
            var intersected = _.intersection(groupTest.layers, group.layers);

            if (group.layers.length === intersected.length && groupTest.layers.length === intersected.length) {

                if (group.area[2] < groupTest.area[2]) {
                    groupTest.area[2] = group.area[2];
                }

                if (group.area[4] > groupTest.area[4]) {
                    groupTest.area[4] = group.area[4];
                }

                duplicate = true;
                return false;
            } else {
                return true;
            }
        });

        if (false === duplicate) {
            groups.push(group);
        }
       
    });

    // Find groups that have intersections and decide in which group to keep the elements.

    Object.prototype.log = function (logType, separator) {

        if (undefined !== separator) {
            console.log(separator);
        }

        switch (logType) {
            case undefined:
                console.log(this);
            break;

            case 'group':
                console.log(JSON.stringify(this.layers.map(function (layerId) {
                    return layers[layerId].name; 
                })));
            break;

            case 'layers':
                console.log(JSON.stringify(this.map(function (layerId) {
                    return layers[layerId].name;
                })));

            break;
            case 'list':
                console.log(this.map(function (group) {
                    return JSON.stringify(group.layers.map(function (layerId) {
                        return layers[layerId].name;
                    }));
                }));
            break;
        }

    };

    function createHierarchy(groups, ids) {
        var sections = [],
            largest,
            exactMatch,
            candidates,
            remaining;

        var largest = groups.reduce(function (aggregator, group) {

            if (aggregator.area[2] >= group.area[2] && aggregator.area[1] >= group.area[1] && aggregator.layers.length < group.layers.length) {
                aggregator = group;
            }

            return aggregator;
        });

        ids.log('layers', 'ids:');

        groups.log('list', 'from list: ');
        largest.log('group', 'largest group: ');

        sections.push({
            group: largest,
            children: []
        });

        remaining = _.difference(ids, largest.layers);

        remaining.log('layers', 'remaining: ');

        candidates = groups.reduce(function (aggregator, group) {
            var intersected = _.intersection(remaining, group.layers);
            if (group.origin !== largest.origin && 0 < intersected.length) {
                aggregator.push(group);

                if (remaining.length === intersected.length && group.layers.length === intersected.length && undefined === exactMatch) {
                    exactMatch = group;
                }
            }

            return aggregator;
        }, []);

        if (undefined !== exactMatch) {

            sections.push({
                group: exactMatch,
                children: []
            });

        } else {

            console.log(candidates);
            candidates.log('list', 'candidates: ');
            // We need to combine groups.

        }

        sections.forEach(function (section) {

            sections.forEach(function (section2) {
                var intersection = _.intersection(section.group.layers, section2.group.layers);

                if (intersection.length !== section.group.layers.length) {
                    section2.group.layers = _.difference(section2.group.layers, intersection);
                }

            });

        });


        sections.forEach(function (section) {
            var selected = [];

            if (1 === section.group.layers.length) {
                return;
            }

            groups.forEach(function (group) {
                var intersected = _.intersection(section.group.layers, group.layers);

                if (group.layers.length === intersected.length && section.group.origin !== group.origin) {
                    selected.push(group);
                }

            });

            section.children = createHierarchy(selected, section.group.layers);
  
        });

        return sections;
    }

    groups.sort(function (left, right) {
        return right.layers.length - left.layers.length;
    });
    
    var ids = Object.keys(layers).map(function (layerId) {
        return parseInt(layerId);
    });

    var hierarchy = createHierarchy(groups, ids);

    function logHierarchy(hierachy, depth) {
        var lines = '',
            i;

        if (undefined === depth) {
            depth = 0;
        }

        for (i = 0; i < depth; i += 1) {
            lines += '-';
        }

        if ('' !== lines) {
            lines += '>';
        }

        hierachy.forEach(function (section) {

            console.log(lines, JSON.stringify(section.group.layers.map(function (layerId) {
                return layers[layerId].name;
            })));

            if (0 < section.children.length) {
                logHierarchy(section.children, depth + 1);
            }


        });

    }

    logHierarchy(hierarchy);

    return;


    /*
    var removeOrigin = [];
    groups.forEach(function (group) {

        groups.forEach(function (group2, index) {
            var intersected;

            if (group.origin !== group2.origin) {

                intersected = _.intersection(group.layers, group2.layers);

                if (0 < intersected.length) {

                    console.log(layers[group.origin].name, layers[group2.origin].name, group.area[1], group2.area[1]);


                }

            }


        });

    });
    */





//    console.log(orderedGroups);


    // console.log(orderedGroups);
    // console.log(selectedGroups);
    /*

    var group = orderedGroups.shift();
    var ids = Object.keys(layers).map(function (layerId) {
        return parseInt(layerId);
    });



    hierarchy.push({
        group: group,
        children: []
    });

    console.log(ids);
    console.log(group.layers);
    group.layers.forEach(function (layerId) {

        ids.splice(ids.indexOf(layerId), 1);

    });
    console.log(ids);

    var otherGroup = orderedGroups.reduce(function (aggregator, group) {
        var match = 0,
            unmatch = 0,
            isValid = false;

        group.layers.forEach(function (layerId) {
            console.log(ids, layerId);
            if (-1 !== ids.indexOf(layerId)) {
                match += 1;
            } else {
                unmatch += 1;
            }
        });

        console.log(match);
        if (aggregator.matched < match) {
            isValid = true;
        } else if (aggregator.matched === match) {

            if (-1 === aggregator.unmatched || aggregator.unmatched > unmatch) {
                isValid = true;
            }

        }

        if (isValid) {
            aggregator.unmatched = unmatch;
            aggregator.matched = match;
            aggregator.group = group;  
        }

        return aggregator;
    }, {
        matched: 0,
        unmatched: -1,
        group: {}
    });

    console.log(otherGroup);


    // 1. Find the group with the largest number of elements.
    // 2. Decide what are the elements left in the main group.
    // 3. Find next largest group that has only the elements that are left in the main group
    // 4. Repeat until all elements from the main group are used up.
    



    // Pasul 1. selecteaza cele mai mari multimi care adunate contin toate elementele
    // Pasul 2. pentru fiecare multime gaseste cele mai mari multimi care adunate contin toate elementele
    



    /*
    // Watch out for last and first!
    vertical.layers.forEach(function (layerId) {

        var line, layer, direction, area;

        layer = layers[layerId];
        direction = vertical.value === layer.css.left ? 1 : -1;
        area = [layer.css.top];

        var nextVLine;


        var nextHLine;

        nextVLine.intersects.every(function (hLine, index) {
            if (hLine.value > line.value) {
                nextHLine = nextVLine.intersects[index - 1];
                return false;
            } else {
                return true;
            }
        });

        if (layer.horizontal.top.value > nextHLine.value) {
            nextHLine = layer.horizontal.top;
        }

        console.log('Found ', 'v ' + vertical.value, 'h ' + line.value, 'v ' + nextVLine.value, 'h ' + nextHLine.value, 'for', layer.name, direction);

    });

    */

    
    

    // Left and right groups will form union.

//    console.log(JSON.stringify(grid, null, ' '));


    /*
    vertical.layers.forEach(function (layer) {
        var direction,
            hIndex,
            vIndex,
            intersected;

        for (hIndex = 0; hIndex < vertical.intersects.length; hIndex += 1) {
            if (layer.css.bottom < vertical.intersects[hIndex].value) {
                break;
            }
        }

        for (vIndex = 0; vIndex < vertical.intersects[hIndex].intersects.length; vIndex += 1) {
            if (vertical.value === vertical.intersects[hIndex].intersects[vIndex].value) {
                break;
            }
        }

        direction = vertical.value === layer.css.left ? -1 : 1;
        intersected = verticals[vIndex + direction];

        console.log(intersected);

    });
    */

    /*
    var store = {
            vertical: {},
            horizontal: {}
        },
        vertical = {},
        horizontal = {},
        v = [],
        h = [];


    var vIntersections = {};

    v.forEach(function (vVal) {
        var intersections = [];

        if (undefined === vIntersections[vVal]) {
            vIntersections[vVal] = [];
        }

        h.forEach(function (hVal) {

            horizontal[hVal].forEach(function (pair) {
                
                if (vVal > pair[0] && vVal < pair[1]) {
                    intersections.push(hVal);
                }

            });
        });

        store.vertical[vVal].forEach(function (layer) {
            var top, i, bottom;

            for (i = 0; i < intersections.length; i += 1) {
                if (layer.css.top > intersections[i]) {

                    if (undefined === top) {
                        top = intersections[i];
                    } else if (top < intersections[i]) {
                        top = intersections[i];
                    }

                }
            }

            for (i = 0; i < intersections.length; i += 1) {
                if (layer.css.bottom < intersections[i]) {

                    if (undefined === bottom) {
                        bottom = intersections[i];
                    } else if (bottom > intersections[i]) {
                        bottom = intersections[i];
                    }

                }
            }

            vIntersections[vVal].push([layer.name, top, bottom]);
        });

    });

    var hIntersections = {};

    h.forEach(function (hVal) {
        var intersections = [];

        if (undefined === hIntersections[hVal]) {
            hIntersections[hVal] = [];
        }

        v.forEach(function (vVal) {

            vertical[vVal].forEach(function (pair) {
                
                if (hVal > pair[0] && hVal < pair[1]) {
                    intersections.push(vVal);
                }

            });
        });

        store.horizontal[hVal].forEach(function (layer) {
            var left, i, right;

            for (i = 0; i < intersections.length; i += 1) {
                if (layer.css.left > intersections[i]) {

                    if (undefined === left) {
                        left = intersections[i];
                    } else if (left < intersections[i]) {
                        left = intersections[i];
                    }

                }
            }

            for (i = 0; i < intersections.length; i += 1) {
                if (layer.css.right < intersections[i]) {

                    if (undefined === right) {
                        right = intersections[i];
                    } else if (right > intersections[i]) {
                        right = intersections[i];
                    }

                }
            }

            hIntersections[hVal].push([layer.name, left, right]);
        });

    });

    console.log(hIntersections);
    console.log('---');
    console.log(vIntersections);

    return;
    var minV = vertical[0],
        maxV = vertical[vertical.length - 1],
        minH = horizontal[0],
        maxH = horizontal[horizontal.length - 1];



    var i, left, right;

    for (i = 0; i < vertical.length; i += 1) {

        left = vertical[i];
        right = vertical[i + 1];
        console.log(left, right);

        store.vertical[left].forEach(function (layer) {
            console.log(layer.css.left, layer.css.right);
            if (
                left <= layer.css.left && right > layer.css.left ||
                left < layer.css.right && right >= layer.css.right
            ) {
                console.log('intersection!');
            } else {

                console.log('no intersection');
            }
        });

    }

    console.log(horizontal, vertical);

/*
    if (0 < column.layer.siblings.length) {
        column.children = this.getRows(column, false);
    }
*/
    /*
    if (undefined !== parent) {

        var childGroups = column.children.reduce(function (aggregator, row) {

            aggregator.push(row.layerGroups.reduce(function (result, group) {
                return result.concat(group.map(function (layer) {
                    return layer.id;
                }));
            }, []));

            return aggregator;

        }, []);

        var parentGroups = parent.children.reduce(function (aggregator, row) {

            aggregator.push(row.layerGroups.reduce(function (result, group) {
                return result.concat(group.map(function (layer) {
                    return layer.id;
                }));
            }, []));

            return aggregator;

        }, []);


        if (parentGroups.length === childGroups.length) {
            column.children = this.getRows(column, true);
        }
        
        // console.log('The ' + column.id + ' column has the following children: ', childGroups, parentGroups);
    } */

    /**
     * firstBoundry - Marginea dreapta maxima a primului element.
     * secondBoundry - Marginea stanga minima a elementului urmator la dreapta.
     * thirdBoundry - Marginea dreapta maxima a elementului urmator la stanga. Daca randul are un singur 
     *     element se foloseste marginea setata din crearea de coloane. Daca nu este setat nimic atunci thirdBoundry este 0.
     *
     * Un rand poate sa apartina de o coloana daca:
     * 1. Primul element sau urmatoarele elemente la dreapta din rand au marginea dreapta mai mica sau egala cu secondBoundry.
     * 2. Primul element din rand are marginea stanga mai mare sau egala cu thirdBoundry.
     * 3. In cazul in care a fost selectat un singur element iar elementul urmator la dreapta are marginea la stanga mai mica sau egala cu firstBoundry.
     *
     * Pasii algoritmului:
     * 1. Se foloseste o lista formata din randuri sortate in functie de marginea de sus a randului. Randurile au elemente sortate in functie de marginea stanga.
     * 1. Cauta primul rand al carui element are cea mai mica margine stanga. 
     * 2. Stocheaza index-ul randului, seteaza secondBoundry daca se poate, seteaza thirdBoundry daca se poate, seteaza firstBoundry.
     * 3. Seteaza directia de mers in sus. 
     * 4. Mergi la urmatorul rand in directia setata.
     * 5. Selecteaza primul element.
     * 6. Daca marginea stanga a elementului este mai mare sau egala cu thirdBoundry atunci:
     * 7. Daca marginea dreapta a elementului este mai mica sau egala cu secondBoundry atunci stocheaza elementul.
     * 8. Daca elementul a fost stocat atunci selecteaza urmatorul element la dreapta si mergi la 7.
     * 9. Daca a fost stocat un singur element si daca elementul la dreapta exista si daca are marginea stanga mai mare sau egala cu firstBoundry
     *     SAU DACA au fost stocate mai multe elemente si 
     *     ATUNCI selecteaza index-ul randului si seteaza thirdBoundry, secondBoundry si firstBoundry in functie de elementele gasite.
     * 10. Daca exista urmatorul rand in functie de directie atunci mergi la 4.
     * 11. Daca nu exista urmatorul rand si directia este in sus atunci schimba directia in jos si mergi la 4.
     * 12. Daca nu exista urmatorul rand si directia este in jos atunci termina.
     * 13. Daca a fost selectat cel putin un index atunci creeaza o coloana cu structura de index de rand si elementele selectate din acele randuri.
     * 14. Pentru fiecare index gasit sterge elemente selectate din acel rand si seteaza pe acel rand marginea maxima dreapta a elementelor sterse.
     * 15. Mergi la 1.
     * 16. Daca nu a fost selectat niciun index atunci termina.
     * 17. Pentru elementele nou create (coloanele) aplica algoritmul de detectie de randuri pentru a le organiza in noi randuri.
     * 18. Done.
     */

     /*
    function findLeftMostRow(rows) {
        var left,
            rowIndex;

        rows.forEach(function (row, index) {

            if (undefined !== row.layerGroups[0]) {

                if (undefined === left || left > row.layerGroups[0].css.left) {
                    left = row.layerGroups[0].css.left;
                    rowIndex = index;
                }

            }

        });

        return rowIndex;
    }

    function generateColumns(rows) {



    }

    var rows = column.children.map(function (row) {
        return row.layerGroups;
    });

    generateColumns(rows);

//    generateColumns(column.children[0].css);



    console.log('------');

    */
    return;

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