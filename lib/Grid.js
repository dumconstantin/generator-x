


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


