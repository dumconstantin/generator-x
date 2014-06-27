describe('getRows', function () {

    it('should get the correct number of rows from an evenly organised structure', function () {
        var elements = createGrid(2, 3),
            boundries = getBoundries(elements),
            rows = getRows(boundries, augmentElements(elements));

        expect(rows.length).toBe(2);
    });

    it('should get the correct number of rows from a complex layout organised structure', function () {
        var elements,
            boundries,
            rows;

        elements = [
            {
                top: 0,
                left: 0,
                right: 80,
                bottom: 200
            },
            {
                top: 0,
                left: 100,
                right: 250,
                bottom: 40
            },
            {
                top: 0,
                left: 270,
                right: 320,
                bottom: 40
            },
            {
                top: 60,
                left: 100,
                right: 150,
                bottom: 150
            }, {
                top: 60,
                left: 170,
                right: 220,
                bottom: 150
            }, {
                top: 60,
                left: 240,
                right: 320,
                bottom: 150
            }, {
                top: 170,
                left: 100,
                bottom: 200,
                right: 320
            }
        ];

        augmentElements(elements);

        boundries = getBoundries(elements);

        rows = getRows(boundries, augmentElements(elements));

        console.log(rows);
    });

});
