describe('getComposedElement', function () {

    var elements = [];

    beforeEach(function () {
        elements = augmentElements([{
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
        }]);
    });

    it('should get the boundries for the parent element correct', function () {
        var result = getComposedElement(elements);

        expect(result.width).toBe(260);
        expect(result.height).toBe(510);
        expect(result.left).toBe(-10);
        expect(result.right).toBe(250);
        expect(result.bottom).toBe(500);
        expect(result.top).toBe(-10);
    });

    it('should get the correct number of children', function () {
        var result = getComposedElement(elements);
        expect(result.children.length).toBe(3);
    });

    it('should set the correct positioning for the child elements', function () {
        var result = getComposedElement(elements);
    
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

    /*
    it('should move the intersection element as a direct child to the composed element and adjust its boundries', function () {
        var row,
            intersectionElement,
            result;

        row = detectRow(getBoundries(elements), elements);
        row = detectIntersectionElements(row, elements);

        getComposedElement(row.children);

        row.children.forEach(function (child) {
            if (3 === child.id) {
                intersectionElement = child;
            }
        });

        expect(intersectionElement).toBeDefined();
        expect(intersectionElement.top).toBe(60);
        expect(intersectionElement.left).toBe(110);
    });
    */

});