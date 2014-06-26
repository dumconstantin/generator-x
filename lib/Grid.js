
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
        element.bottom = element.top + element.height;
        element.right = element.left + element.width;
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
        changed;

    do {

        if (boundryBottom < elements[index].bottom) {
            boundryBottom = elements[index].bottom;            
        }

        row.push(elements.splice(index, 1));
        
        changed = false;

        elements.every(function (element, elementIndex) {
            var center = element.top + element.height / 2;

            if (boundryBottom >= center && boundryTop <= center) {
                index = elementIndex;
                changed = true;
                return false;
            } else {
                return true;
            }
        });

    } while (true === changed);

    return row;
}

function detectComposedElements(elements) {
    var composed = [];

    return composed;
}

function detectIntersectionElements(row, elements) {
    var intersected = [];

    return intersected;
}

function getComposedElement() {

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

/**
 * Get the boundries for the elements container
 * @param  {array} elements The elements that will be compared to get the boundries.
 * @return {object}          The top, left, right, bottom coordinates for the container.
 */
function getBoundries(elements) {
    var right = 0,
        bottom = 0;

    elements.forEach(function (element) {
        if (bottom < element.bottom) {
            bottom = element.bottom;
        }

        if (right < element.right) {
            right = element.right;
        }
    });

    return {
        top: 0,
        left: 0,
        right: right,
        bottom: bottom
    }
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


