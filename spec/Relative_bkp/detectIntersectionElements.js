describe('detectIntersectionElements', function () {

    it('should add to a row the intersection element that has its top within the row boundries', function () {
        var elements = createGrid(1, 4),
            element,
            row;

        elements.push({
            id: 5,
            top: 20,
            left: 120,
            width: 50,
            height: 400
        });

        elements = augmentElements(elements);
        row = detectRow(getBoundries(elements), elements);

        row = detectIntersectionElements(row, elements);

        row.children.every(function (child) {
            if (undefined !== child.intersectionElement) {
                element = child;
                return false;
            } else {
                return true;
            }
        });

        expect(element).toBeDefined();
        expect(element.height).toBe(30);
        expect(element.width).toBe(50);
        expect(element.intersectionElement.id).toBe(5);
    });

});