

var getIncrement = (function () {
    var increments = {};

    function increment(type) {
        if (undefined === increments[type]) {
            increments[type] = 0;
        }

        increments[type] += 1;

        return increments[type];
    }

    return increment;

}());

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

/**
 * Get the highest element that can be found in the elements list.
 * @param  {array} elements The list in which the search will happen
 * @return {integer}          The index of the element in that array
 * @todo : get also the elemnt that has the largest height.
 */
function getTopElementIndex(elements) {
    var index = 0,
        top = elements[index].top;

    elements.forEach(function (element, elementIndex) {
        if (top > element.top) {
            top = element.top;
            index = elementIndex;
        }
    });

    return index;
}

/**
 * Based on the element values set composed values that will ease 
 * handling of element properties.
 * @param  {array} elements The list of elements to be augmented.
 * @return {[type]}          [description]
 */
function augmentElements(elements) {

    elements.forEach(function (element) {

        if (undefined === element.bottom) {
            element.bottom = element.top + element.height;
        }

        if (undefined === element.right) {
            element.right = element.left + element.width;
        }

        if (undefined === element.top) {
            element.top = element.bottom + element.height;
        }

        if (undefined === element.left) {
            element.left = element.right + element.width;
        }

        if (undefined === element.width) {
            element.width = element.right - element.left;
        }

        if (undefined === element.height) {
            element.height = element.bottom - element.top;
        }

        if (undefined === element.children) {
            element.children = [];
        }

    });

    return elements;
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
function detectRow(queued) {
    var elements = queued.elements,
        row,
        topIndex = getTopElementIndex(elements),
        boundaryBottom = elements[topIndex].bottom,
        boundaryTop = elements[topIndex].top,
        toProcess = [],
        selectedElements = [elements[topIndex]],
        rowElements = [topIndex],
        hasChanged;

    row = {
        relativeType: 'row',
        id: getIncrement('row'),
        rows: [],
        next: undefined,
        prev: undefined
    };

    elements.forEach(function (element, index) {
        if (index !== topIndex) {
            toProcess.push(index);
        }
    });

    do {
        
        hasChanged = false;

        toProcess.every(function (elementIndex, index) {
            var center = elements[elementIndex].top + elements[elementIndex].height / 2;

            if (boundaryBottom >= center && boundaryTop <= center) {

                if (boundaryBottom < elements[elementIndex].bottom) {
                    boundaryBottom = elements[elementIndex].bottom;            
                }

                rowElements.push(elementIndex);
                selectedElements.push(elements[elementIndex]);
                toProcess.splice(index, 1);

                hasChanged = true;

                return false;
            } else {
                return true;
            }
        });

    } while (true === hasChanged);

    setBoundries(row, selectedElements);
    row.children = selectedElements;

    selectedElements.sort(function (prev, next) {
        return prev.left - next.left;
    });

    selectedElements.forEach(function (element, index) {
        element.row = row;

        element.prev = selectedElements[index - 1];
        element.next = selectedElements[index + 1];

        if (0 < element.siblings.length) {
            element.rows = processElements(element.siblings, row);
        }
    });

    queued.elements = elements.filter(function (element, index) {
        return -1 === rowElements.indexOf(index);
    });

    return row;
}

function setBoundries(obj, elements) {
    var boundries = getBoundries(elements);

    obj.top = boundries.top;
    obj.left = boundries.left;
    obj.right = boundries.right;
    obj.bottom = boundries.bottom;
    obj.width = boundries.width;
    obj.height = boundries.height;
}

/**
 * Find elements that overlap on the vertical axis.
 * 1. For each element in the elements list DO 2 - 9 until
 * all elements have been accounded for. Ignore the composed elements 
 * which were found in the previous iteration. 
 * 2. Get the left and right boundries of the current element.
 * 3. Create a composed elements list which will store found elements.
 * 4. Remove the current element from the elements list and insert it
 * into the composed element list.
 * 5. In the remaining element list find another element that is within the 
 * left and right boundries.
 * 6. If there are more than 1 element in the composed elements list then
 * create a composed element that encapsulates the found elements.
 * 7. Restart the rows parsing for the newly created composed element.
 * 8. If there is only 1 element then add it back to the elements list.
 * 9. Go to 1. until all elements have been used.
 * 10. Return the modified elements list.
 *   
 * @param  {array} elements The elements list to search for composed elements.
 * @return {array}          The elements list with the selected elements
 *                              exchanged with composed element.
 */
function detectComposedElements(elements, parentRow) {
    var toProcess = [],
        index,
        boundries,
        hasChanged,
        composedElements = [],
        selectedElements,
        composed;

    elements.forEach(function (element, elementIndex) {
        toProcess.push(elementIndex);
    });

    while (0 < toProcess.length) {

        index = toProcess.shift();
        boundries = getBoundries([elements[index]]);
        selectedElements = [elements[index]];
        composed = {
            row: parentRow
        };

        do {

            hasChanged = false;

            toProcess.every(function (elementIndex, toProcessIndex) {
                var element = elements[elementIndex];

                if (
                    boundries.right >= element.left && boundries.left <= element.left ||
                    boundries.right >= element.right && boundries.left <= element.right
                ) {

                    if (boundries.right < element.right) {
                        boundries.right = element.right;
                    }

                    if (boundries.left > element.left) {
                        boundries.left = element.left;
                    }

                    selectedElements.push(elements[elementIndex]);

                    toProcess.splice(toProcessIndex, 1);

                    // @todo: To avoid using hasChanged we can use "path compression"
                    // in which as we go along we store the boundries of elements and
                    // a reference to that element so that we can just do a quick check
                    // and figure out what element was skipped. Also when we do the quick check
                    // we can invalidate all other elements that have already been added to the
                    // selected queue.

                    hasChanged = true;

                    return false;
                } else {
                    return true;
                }

            });

        } while (true === hasChanged);

        if (1 < selectedElements.length) {
            setBoundries(composed, selectedElements);

            composed.children = selectedElements;
            composed.relativeType = 'composed';
            composed.id = getIncrement('composed');
            composed.rows = [];

            selectedElements.forEach(function (element) {
                element.composed = composed;
            });

            composedElements.push(composed);
        }
    }

    composedElements.forEach(function (composedElement) {
        processElements(composedElement.children, composedElement);
    });

    return composedElements;
}


function detectIntersectionElements(row, elements) {

    elements.forEach(function (element, elementIndex) {
        var intersectionElement;

        if (
            row.top <= element.top && row.bottom >= element.top
        ) {
            intersectionElement = getIntersectionElement(row, elements.splice(elementIndex, 1)[0]);
            row.children.push(intersectionElement);
        }

    });

    return row;
}


/**
 * Create a composed element from a list of elements.
 * 1. Create a new element that will be the parent of the elements. 
 * 2. Set the boundries for the parent based on the extremes (top, left, right, bottom)
 * 3. Create a children property on the parent that holds the elements.
 * 4. Adjust the top, left, right, bottom for the children to be relative to the
 * parent element.
 * 4. Return the created parent element.
 * @param  {array} elements The list of elements that will become the children of a new element.
 * @return {object}         The created parent element.
 */
function getComposedElement(elements) {
    var element = getBoundries(elements);

    element.newElement = true;
    element.children = elements;
    element = augmentElements([element])[0];

    element.relativeType = 'composedElement';

    element.children.forEach(function (child, index) {

        if (undefined !== child.intersectionElement) {
 
            child.intersectionElement.top = child.top;
            child.intersectionElement.right = child.right;
            child.intersectionElement.bottom = child.top + child.intersectionElement.height;
            child.intersectionElement.left = child.left;

            element.children.splice(index, 1);
            element.children.push(child.intersectionElement);
            child = child.intersectionElement;
        }

        child.top -= element.top;
        child.left -= element.left;
        child.right -= element.left;
        child.bottom -= element.top;

        child.cssId += '-composedElement';

    });

    return element;
}

/**
 * Parse a composed element to create another rows structure
 * inside it.
 * @param  {object} element The parent element that contains the composed elements.
 * @return {array}         The list of newly formed elements that contain the composed elements.
 */
function parseComposedElement(element) {
    var row,
        boundries = getBoundries([element]),
        childrenNo = element.children.length;

    row = detectRow(boundries, element.children);
    element.children = element.children.concat(row.children);
    
    if (childrenNo !== row.children.length) {
       
       // @todo : use parse rows instead.
       // element.children = getRows(boundries, element.children);
    } else {
        // The element does not contain elements that can be 
        // added to additional rows.
    }

    return element;
}

/**
 * Create an element that is within the boundries of the row
 * and contains an element that exceeds those boundries.
 * 
 * 1. Create an intersectionElement object.
 * 2. Set the top, left and right according to the given element.
 * 3. Set the bottom boundary according to the row's bottom boundary.
 * 4. Modify the element to be relative to its new parent.
 * 5. Augment the intersectionElement with it's boundries.
 * 6. Return the intersectionElement.
 * 
 * @param  {object} row     The row object that will be used for its boundries.
 * @param  {object} element The element that will be inserted into the intersectionElement.
 * @return {object}         The newly created intersectionElement.
 * @todo : Ensure that the intersection element does not cross horizontally with other elements.
 * The intersection element should be a small element with an offset from a row.
 */
function getIntersectionElement(row, element) {
    var intersectionElement = {
        left: element.left,
        right: element.right,
        top: element.top
    };

    intersectionElement.newElement = true;
    intersectionElement.relativeType = 'intersectionElement';

    intersectionElement.bottom = row.bottom;

    element.top = 0;
    element.left = 0;
    element.right = element.width;
    element.bottom = element.height;

    intersectionElement.intersectionElement = element;

    intersectionElement = augmentElements([intersectionElement])[0];

    return intersectionElement;
}

function setRightMargin() {

}

function setTopMargin() {

}

function orderLeft() {

}

function getRows(elements, parent) {
    var rows = [],
        rowIndex = 0,
        queued = {
            elements: []
        };

    elements.forEach(function (element) {
        queued.elements.push(element);
    });

    while (0 < queued.elements.length) {
        rows[rowIndex] = detectRow(queued);
        
        if (undefined !== parent) {
            rows[rowIndex].relativeParent = parent;
            parent.rows.push(rows[rowIndex]);
        }

        // detectIntersectionElements(rows[rowIndex].children, elements);
        detectComposedElements(rows[rowIndex].children, rows[rowIndex]);

        rowIndex += 1;
    }

    rows.forEach(function (row, index) {
        row.prev = rows[index - 1];
        row.next = rows[index + 1];
    });

    return rows;
}

function updateParent() {

}

function isValidBoundries(element) {
    var combinations,
        result;

    combinations = [
        [
            ['top', 'height'],
            ['top', 'bottom'],
            ['bottom', 'height']
        ],
        [
            ['left', 'width'],
            ['left', 'right'],
            ['right', 'width']
        ]
    ];

    result = combinations.map(function (condition) {
        var valid = false;

        condition.every(function (pair) {

            if (undefined !== element[pair[0]] && undefined !== element[pair[1]]) {
                valid = true;
                return false;
            } else {
                return true;
            }
        });

        return valid;
    });

    return -1 === result.indexOf(false) ? true : false;
}

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
function getBoundries(elements) {
    var top, left, right, bottom;

    if (true === isValidBoundries(elements[0])) {

        top = elements[0].top;
        left = elements[0].left;
        right = elements[0].right;
        bottom = elements[0].bottom;

        elements.forEach(function (element) {

            if (bottom < element.bottom) {
                bottom = element.bottom;
            }

            if (right < element.right) {
                right = element.right;
            }

            if (top > element.top) {
                top = element.top;
            }

            if (left > element.left) {
                left = element.left;
            }
        });

    } else {
        throw new Error('All elements must have a valid pair of top, left, bottom, ' +
            'right, width, height for the parent container to be determinable.');
    }

    return {
        top: top,
        left: left,
        right: right,
        bottom: bottom,
        width: right - left,
        height: bottom - top
    };
}

function parseRowsTree(rows) {
    rows.forEach(function (child) {

        child = augmentElements([child])[0];

        if (0 !== child.children.length) {

            if (true !== child.newElement) {
                child.children = processElements(child.children);                    
            } else {
                parseRowsTree(child.children);
            }
        }

    });

}


function normalizeElements(elements) {

    elements.forEach(function (element) {
        element.top = element.css.top;
        element.left = element.css.left;
        element.right = element.css.right;
        element.bottom = element.css.bottom;    
    });

}

/**
 * Use a list of elements to arrange them in rows and adjust their properties
 * to be positioned relative to each other in CSS.
 * @param  {array} elements The elements that will be used for the processing.
 * @return undefined
 */
function processElements(elements, parent) {
    var boundries,
        rows;

    if (0 === elements.length) {
        return [];
    }

    normalizeElements(elements);

    augmentElements(elements);

    rows = getRows(elements, parent);

    /*
    rows.forEach(function (row) {
        parseRowsTree(row.children);
    });
    */

    // rows = parseRows(rows);

   // updateParent(parent, rows);

   return rows;
}

if ('undefined' !== typeof module) {
    module.exports = {
        process: processElements
    };
}
