describe('Grid', function() {

    function createGrid(rows, cols) {
        var elements = [],
            cellWidth = 50,
            cellHeight = 50,
            leftMargin = 0,
            topMargin = 0,
            top, 
            left;

        for (i = 0; i < rows; i += 1) {

            leftMargin = 0;

            for (j = 0; j < cols; j += 1) {
                top = i * cellHeight + i * topMargin,
                left = j * cellWidth + j * leftMargin,

                elements.push({
                    top: top,
                    left: left,
                    width: cellWidth,
                    height: cellHeight
                });

                leftMargin = 50;
            }

            topMargin = 10;
        }

        return elements;
    }

    function showGrid(elements) {
        var parent = document.createElement('div'),
            styles = {
                position: 'relative',
                left: '10px',
                top: '10px',
                background: '#444',
                width: '500px',
                height: '500px'
            };

        Object.keys(styles).forEach(function (propName) {
            parent.style[propName] = styles[propName];
        });

        elements.forEach(function (element) {
            var elem = document.createElement('div');

            Object.keys(element).forEach(function (prop) {
                elem.style[prop] = element[prop] + 'px';
            });

            elem.style.position = 'absolute';
            elem.style.background = '#660099';

            parent.appendChild(elem);
        });

        document.querySelector('body').appendChild(parent);
    }

    describe('augmentElements', function () {

        it('should set the bottom property according to the top and height', function () {
            var elements = [{ top: 0, height: 100 }];
            expect(augmentElements(elements)[0].bottom).toBe(100);
        })


        it('should set the right property according to the left and width', function () {
            var elements = [{ left: 0, width: 100 }];
            expect(augmentElements(elements)[0].right).toBe(100);
        })

    });

    describe('getTopElementIndex', function () {

        it('should find the highest element if the element is first', function () {
            var elements = [{ top: -10 }, { top: 5 }];

            expect(getTopElementIndex(elements)).toBe(0);
        });


        it('should find the highest element if the element is last', function () {
            var elements = [{ top: 100 }, { top: 5 }];

            expect(getTopElementIndex(elements)).toBe(1);
        });


        it('should find the first element in a list with equal elements', function () {
            var elements = [{ top: 100 }, { top: 10 }, { top: 10 }];

            expect(getTopElementIndex(elements)).toBe(1);
        });

    });


    describe('row detection', function () {

        it('should find elements that have the same top', function() {
            var elements = createGrid(1, 2),
                row = detectRow(augmentElements(elements));

            expect(row.length).toBe(2);
        });

        it('should find elements that have a top within the center range of elements', function () {
            var elements = createGrid(1, 2),
                row;

            elements[0].top -= elements[0].height / 2 - 1;

            row = detectRow(augmentElements(elements));

            expect(row.length).toBe(2);
        });

        it('should find elements that have are exactly above the center range', function () {
            var elements = createGrid(1, 2),
                row;

            elements[0].top -= elements[0].height / 2;

            row = detectRow(augmentElements(elements));

            expect(row.length).toBe(2);
        });


        it('should not find elements that are bellow the center range', function () {
            var elements = createGrid(1, 2),
                row;

            elements[0].top -= elements[0].height / 2 + 10;

            row = detectRow(augmentElements(elements));

            expect(row.length).toBe(1);
        });

        it('should find elements that have a hierarchical positioning', function () {
            var elements = createGrid(1, 4),
                row;

            elements[0].top -= elements[0].height / 2;
            elements[2].top += elements[2].height / 2;
            elements[3].top += elements[3].height;

            row = detectRow(augmentElements(elements));

            expect(row.length).toBe(4);
        });

        it('should find elements that have a hierarchical positioning having the last element as the highest', function () {
            var elements = createGrid(1, 4),
                row;

            elements[3].top -= elements[3].height;
            elements[2].top -= elements[2].height / 2;
            elements[0].top += elements[0].height / 2;

            row = detectRow(augmentElements(elements));

            expect(row.length).toBe(4);
        });

        it('should not find elements that do not have a hierarchical positioning', function () {
            var elements = createGrid(1, 4),
                row;

            elements[0].top -= elements[0].height / 2;
            elements[2].top += elements[2].height / 2;
            elements[3].top += elements[3].height + 1;

            row = detectRow(augmentElements(elements));

            expect(row.length).toBe(3);
        });

        it('should find elements that are stacked through hierarchical positioning', function () {
            var elements = createGrid(1, 4),
                row;

            elements[0].top -= elements[0].height / 2;
            elements[2].top += elements[2].height / 2;
            elements[3].top += elements[3].height;
            elements[3].left = elements[0].left;

            row = detectRow(augmentElements(elements));

            expect(row.length).toBe(4);
        });


    });


    describe('isValidBoundries', function () {

        it('should validate an element with top, left, width, height', function () {
            var element = {
                top: 100,
                left: 100,
                width: 200,
                height: 200
            };

            expect(isValidBoundries(element)).toBe(true);
        });

        it('should validate an element with bottom, right, width, height', function () {
            var element = {
                bottom: 200,
                right: 200,
                width: 200,
                height: 200
            };

            expect(isValidBoundries(element)).toBe(true);
        });

        it('should validate an element with top, right, bottom, left', function () {
            var element = {
                top: 100,
                left: 100,
                bottom: 200,
                right: 200
            };

            expect(isValidBoundries(element)).toBe(true);
        });

        it('should not validate an element with without a vertical conditional', function () {
            var element = {
                top: 100,
                left: 100,
                right: 200
            };

            expect(isValidBoundries(element)).toBe(false);
        });

        it('should not validate an element with without a horizontal conditional', function () {
            var element = {
                top: 100,
                height: 500,
                right: 200
            };

            expect(isValidBoundries(element)).toBe(false);
        });

    });


    describe('getBoundries', function () {

        it('should find the boundries based on top, left, right, bottom', function() {
            var elements = [{
                    top: 100,
                    left: 100,
                    right: 200,
                    bottom: 400
                }, {
                    top: 50,
                    left: 50,
                    right: 150,
                    bottom: 500

                }],
                boundries = getBoundries(augmentElements(elements));

            expect(boundries.left).toBe(50);
            expect(boundries.right).toBe(200);
            expect(boundries.top).toBe(50);
            expect(boundries.bottom).toBe(500);
            expect(boundries.width).toBe(150);
            expect(boundries.height).toBe(450);
        });
        
    });

    describe('getComposedElement', function () {

        var elements = [];

        beforeEach(function () {
            elements = [{
                id: 1,
                top: -10,
                left: -10,
                right: 100,
                bottom: 100
            }, {
                id: 2,
                top: 0,
                left: 0,
                right: 50,
                bottom: 50
            }, {
                id: 3,
                top: 50,
                left: 100,
                right: 250,
                bottom: 500
            }];
        });

        it('should get the boundries for the parent element correct', function () {
            var result = getComposedElement(augmentElements(elements));

            expect(result.width).toBe(260);
            expect(result.height).toBe(510);
            expect(result.left).toBe(-10);
            expect(result.right).toBe(250);
            expect(result.bottom).toBe(500);
            expect(result.top).toBe(-10);
        });

        it('should get the correct number of children', function () {
            var result = getComposedElement(augmentElements(elements));
            expect(result.children.length).toBe(3);
        });

        it('should set the correct positioning for the child elements', function () {
            var result = getComposedElement(augmentElements(elements));
        
            result.children.forEach(function (child) {
                var initial;

                switch (child.id) {
                    case 1: 
                        expect(child.top).toBe(0);
                        expect(child.left).toBe(0);
                        expect(child.right).toBe(110);
                        expect(child.bottom).toBe(110);
                        break;
                    case 2:
                        expect(child.top).toBe(10);
                        expect(child.left).toBe(10);
                        expect(child.right).toBe(60);
                        expect(child.bottom).toBe(60);
                        break;

                    case 3:
                        expect(child.top).toBe(60);
                        expect(child.left).toBe(110);
                        expect(child.right).toBe(260);
                        expect(child.bottom).toBe(510);
                        break;
                }
            });

        });

    });


    describe('detectComposedElements', function () {


        it('should group the first 3 elements as a composed element', function () {
            var elements = createGrid(1, 4),
                result;

            elements[1].left -= elements[1].left / 2 + 1;
            elements[2].left -= elements[2].left / 2 + 2;

            result = detectComposedElements(augmentElements(elements));

            expect(result.length).toBe(2);
        });

    
        it('should group the last 3 elements as a composed element', function () {
            var elements = createGrid(1, 4),
                result;

            elements[1].left += elements[1].width * 2 + 2;
            elements[2].left += elements[2].width + 2;

            result = detectComposedElements(augmentElements(elements));

            expect(result.length).toBe(2);
        }); 

        it('should not find any composed elements', function () {
            var elements = createGrid(1, 4),
                result;

            elements[1].left -= elements[1].left / 2 - 1;
            elements[2].left -= elements[2].left / 2 - 2;

            result = detectComposedElements(augmentElements(elements));

            expect(result.length).toBe(4);
        });

        it('should group the elements of a composed element as children', function () {
            var elements = createGrid(1, 5),
                children,
                result;

            elements[2].left -= elements[2].left / 3;
            elements[3].left -= elements[3].left / 2;

            result = detectComposedElements(augmentElements(elements));

            result.every(function (element) {
                if (undefined !== element.children) {
                    children = element.children;
                    return false;
                } else {
                    return true;
                }
            });

            expect(children.length).toBe(3);
        });

    });
     
});
