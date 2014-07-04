describe('detectRow', function () {

    it('should find elements that have the same top', function() {
        var elements = createGrid(1, 2),
            row;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});

        expect(row.children.length).toBe(2);
    });

    it('should find elements that have a top within the center range of elements', function () {
        var elements = createGrid(1, 2),
            row;

        elements[0].top -= elements[0].height / 2 - 1;
        elements = augmentElements(elements);

        row = detectRow({elements: elements});

        expect(row.children.length).toBe(2);
    });

    it('should find elements that have are exactly above the center range', function () {
        var elements = createGrid(1, 2),
            row;

        elements[0].top -= elements[0].height / 2;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});

        expect(row.children.length).toBe(2);
    });


    it('should not find elements that are bellow the center range', function () {
        var elements = createGrid(1, 2),
            row;

        elements[0].top -= elements[0].height / 2 + 10;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});

        expect(row.children.length).toBe(1);
    });

    it('should find elements that have a hierarchical positioning', function () {
        var elements = createGrid(1, 4),
            row;

        elements[0].top -= elements[0].height / 2;
        elements[2].top += elements[2].height / 2;
        elements[3].top += elements[3].height;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});

        expect(row.children.length).toBe(4);
    });

    it('should find elements that have a hierarchical positioning having the last element as the highest', function () {
        var elements = createGrid(1, 4),
            row;

        elements[3].top -= elements[3].height;
        elements[2].top -= elements[2].height / 2;
        elements[0].top += elements[0].height / 2;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});

        expect(row.children.length).toBe(4);
    });

    it('should not find elements that do not have a hierarchical positioning', function () {
        var elements = createGrid(1, 4),
            row;

        elements[0].top -= elements[0].height / 2;
        elements[2].top += elements[2].height / 2;
        elements[3].top += elements[3].height + 1;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});

        expect(row.children.length).toBe(3);
    });

    it('should find elements that are stacked through hierarchical positioning', function () {
        var elements = createGrid(1, 4),
            row;

        elements[0].top -= elements[0].height / 2;
        elements[2].top += elements[2].height / 2;
        elements[3].top += elements[3].height;
        elements[3].left = elements[0].left;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});

        expect(row.children.length).toBe(4);
    });

    it('should have the row boundries set', function () {
        var elements = createGrid(1, 4),
            row,
            boundries;

        elements[0].top -= elements[0].height / 2;
        elements[2].top += elements[2].height / 2;
        elements[3].top += elements[3].height;
        elements[3].left = elements[0].left;

        elements = augmentElements(elements);
        row = detectRow({elements: elements});



    });

});
