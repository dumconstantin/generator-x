
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
function detectRow(elements) {
    var row = [],
        index = getTopElementIndex(elements),
        boundryBottom = elements[index].bottom,
        boundryTop = elements[index].top,
        hasChanged;

    row.push(elements.splice(index, 1)[0]);

    do {
        
        hasChanged = false;

        elements.every(function (element, elementIndex) {
            var center = element.top + element.height / 2;

            if (boundryBottom >= center && boundryTop <= center) {

                if (boundryBottom < elements[elementIndex].bottom) {
                    boundryBottom = elements[elementIndex].bottom;            
                }

                row.push(elements.splice(elementIndex, 1)[0]);
                hasChanged = true;

                return false;
            } else {
                return true;
            }
        });

    } while (true === hasChanged);


    return row;
}
/**
 * Find elements that overlap on the vertical axis in the interval given
 * by the left and right of the first element. When  
 * @param  {[type]} elements [description]
 * @return {[type]}          [description]
 */
function detectComposedElements(elements) {
    var composed = [];


    elements.forEach(function (originElement, originIndex) {
        var hasChanged,
            boundryLeft = originElement.left,
            boundryRight = originElement.right,
            composedElements = [elements.splice(originIndex, 1)[0]];

        do {

            hasChanged = false;

            elements.every(function (element, elementIndex) {

                if (
                    boundryRight >= element.left && boundryLeft <= element.left ||
                    boundryRight >= element.right && boundryLeft <= element.right
                ) {

                    if (boundryRight < element.right) {
                        boundryRight = element.right;
                    }

                    if (boundryLeft > element.left) {
                        boundryLeft = element.left;
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
            elements.push(getComposedElement(composedElements));
        } else {
            elements.push(composedElements[0]);
        }

    });

    return elements;
}

function detectIntersectionElements(row, elements) {
    var intersected = [];

    return intersected;
}

function getComposedElement(elements) {
    var element = getBoundries(elements);

    element.children = elements;

    element.children.forEach(function (child) {

        child.top -= element.top;
        child.left -= element.left;
        child.right -= element.left;
        child.bottom -= element.top;

    });

    return element;
}

function getIntersectionElement() {

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
        rows[rowIndex] = detectRow(elements);

        rows[rowIndex].concat(
            detectIntersectionElements(rows[rowIndex], elements)
        );

        rows[rowIndex].concat(
            detectComposedElements(rows[rowIndex])
        );

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

/**
 * Use a list of elements to arrange them in rows and adjust their properties
 * to be positioned relative to each other in CSS.
 * @param  {array} elements The elements that will be used for the processing.
 * @return undefined
 */
function processElements(parent, elements) {

    var boundries = getBoundries(elements);

    var rows = getRows(boundries, elements);
    
    rows = parseRows(rows);

    updateParent(parent, rows);

}


