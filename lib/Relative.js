
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
function detectRow(boundries, elements) {
    var row,
        rowElements = [],
        index = getTopElementIndex(elements),
        boundaryBottom = elements[index].bottom,
        boundaryTop = elements[index].top,
        hasChanged;

    rowElements.push(elements.splice(index, 1)[0]);

    do {
        
        hasChanged = false;

        elements.every(function (element, elementIndex) {
            var center = element.top + element.height / 2;

            if (boundaryBottom >= center && boundaryTop <= center) {

                if (boundaryBottom < elements[elementIndex].bottom) {
                    boundaryBottom = elements[elementIndex].bottom;            
                }

                rowElements.push(elements.splice(elementIndex, 1)[0]);
                hasChanged = true;

                return false;
            } else {
                return true;
            }
        });

    } while (true === hasChanged);

    // Process the children elements of the row elements.
    rowElements.forEach(function (element) {
        
        element.cssId += '-rowElement';
        if (0 !== element.children.length) {
            element.children = processElements(element.children);
        }
        
    });

    row = getBoundries(rowElements);

    row.top = boundries.top + row.top;
    row.left = boundries.left + row.left; 
    row.bottom = row.top + row.height;
    row.right = row.left + row.width;

    row = augmentElements([row])[0];

    row.newElement = true;
    row.relativeType = 'rowElement';

    row.children = rowElements;

    return row;
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
function detectComposedElements(elements) {
    var composed = [];

    elements.forEach(function (element, elementIndex) {
        element.composedTest = false;
    });

    function nextComposedFind(elements) {
        var index;

        elements.every(function (element, elementIndex) {
            if (false === element.composedTest) {
                index = elementIndex;
                return false;
            } else {
                return true;
            }
        });

        if (undefined !== index) {
            elements[index].composedTest = true;
            setComposed(index, elements);
            nextComposedFind(elements);   
        } else {
            // Exit the recurrence.
        }
    }

    function setComposed(originIndex, elements) {
        var hasChanged,
            boundaryLeft = elements[originIndex].left,
            boundaryRight = elements[originIndex].right,
            composedElement,
            composedElements = [elements.splice(originIndex, 1)[0]];

        do {

            hasChanged = false;

            elements.every(function (element, elementIndex) {

                if (
                    boundaryRight >= element.left && boundaryLeft <= element.left ||
                    boundaryRight >= element.right && boundaryLeft <= element.right
                ) {

                    if (boundaryRight < element.right) {
                        boundaryRight = element.right;
                    }

                    if (boundaryLeft > element.left) {
                        boundaryLeft = element.left;
                    }

                    composedElements.push(elements.splice(elementIndex, 1)[0]);
                    hasChanged = true;

                    return false;
                } else {
                    return true;
                }

            });

        } while (true === hasChanged);

        if (1 !== composedElements.length) {
            composedElement = getComposedElement(composedElements);
            parseComposedElement(composedElement);
            elements.push(composedElement);
        } else {
            elements.push(composedElements[0]);
        }
    }

    function removeComposedProperties(elements) {
        elements.forEach(function (element) {
            delete element.composedTest;
            if (undefined !== element.children) {
                removeComposedProperties(element.children);
            }
        });
    }

    nextComposedFind(elements);
    removeComposedProperties(elements);

    return elements;
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
       element.children = getRows(boundries, element.children);
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

function getRows(boundries, elements) {
    var rows = [],
        rowIndex = 0;

    while (0 !== elements.length) {
        rows[rowIndex] = detectRow(boundries, elements);

        detectIntersectionElements(rows[rowIndex].children, elements);
        detectComposedElements(rows[rowIndex].children);
        
        if (1 === rows[rowIndex].children.length) {
            rows[rowIndex] = rows[rowIndex].children[0];
            rows[rowIndex].cssId += '-onlyChild';
        }

        rowIndex += 1;
    }

    return rows;
}

function parseRows() {

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


/**
 * Use a list of elements to arrange them in rows and adjust their properties
 * to be positioned relative to each other in CSS.
 * @param  {array} elements The elements that will be used for the processing.
 * @return undefined
 */
function processElements(elements) {
    var boundries,
        rows;

    if (0 === elements.length) {
        return [];
    }

    augmentElements(elements);

    boundries = getBoundries(elements);

    boundries.top = 0;
    boundries.left = 0;
    boundries.bottom = boundries.height;
    boundries.width = boundries.width;

    rows = getRows(boundries, elements);

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
    module.exports = processElements;
}
