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

                leftMargin = 60;
            }

            topMargin = 20;
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

    });


});
