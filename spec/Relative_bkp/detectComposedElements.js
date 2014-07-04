
describe('detectComposedElements', function () {


    it('should group the first 3 elements as a composed element', function () {
        var elements = createGrid(1, 4),
            result;

        elements[1].left -= elements[1].left / 2 + 1;
        elements[2].left -= elements[2].left / 2 + 2;

        result = detectComposedElements(augmentElements(elements));

        expect(result[0].children.length).toBe(3);
    });


    it('should group the last 3 elements as a composed element', function () {
        var elements = createGrid(1, 4),
            result;

        elements[1].left += elements[1].width * 2 + 2;
        elements[2].left += elements[2].width + 2;

        result = detectComposedElements(augmentElements(elements));

        expect(result[0].children.length).toBe(3);
    }); 

    it('should not find any composed elements', function () {
        var elements = createGrid(1, 4),
            result;

        elements[1].left -= elements[1].left / 2 - 1;
        elements[2].left -= elements[2].left / 2 - 2;

        result = detectComposedElements(augmentElements(elements));

        expect(result.length).toBe(0);
    });

    it('should group the elements of a composed element as children', function () {
        var elements = createGrid(1, 5),
            children,
            result;

        elements[2].left -= elements[2].left / 3;
        elements[3].left -= elements[3].left / 2;

        result = detectComposedElements(augmentElements(elements));

        result.every(function (element) {
            if (0 !== element.children.length) {
                children = element.children;
                return false;
            } else {
                return true;
            }
        });

        expect(children.length).toBe(3);
    });

    /*
    it('should add the elements contained by intersection elements to the children list of the composed element', function () {
        var elements = createGrid(1, 4),
            element,
            result,
            row;

        elements[1].left -= elements[1].left / 2 + 1;

        elements[2].top -= 10;

        elements.push({
            top: 20,
            left: 220,
            width: 50,
            height: 100
        });

        elements = augmentElements(elements);
        row = detectRow(getBoundries(elements), elements);

        row = detectIntersectionElements(row, elements);
        row.children = detectComposedElements(row.children);

        expect(row.children.length).toBe(3);

    }); */

});