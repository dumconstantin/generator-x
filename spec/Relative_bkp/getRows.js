describe('getRows', function () {

    function getStructure(rows) {
        var structure = [];

        rows.forEach(function (row, index) {
            if (0 !== row.children.length) {
                structure.push(getStructure(row.children)); 
            } else {
                structure.push(row.id);
            }
        });

        return structure;
    }

    function getElement(structure, id, level) {
        var result;

        structure.every(function (element, index) {

            if (id === element) {
                result = {
                    level: level,
                    siblings: structure.slice(0)
                };

                result.siblings.splice(index, 1);

            } else if (true === element instanceof Array) {
                level += 1;
                result = getElement(element, id, level);
            }

            if (undefined === result) {
                return true;
            } else {
                return false;
            }

        });

        return result;
    }

    it('should get the correct number of rows from an evenly organised structure', function () {
        var elements = createGrid(3, 5),
            rows = getRows(augmentElements(elements));

        expect(rows.length).toBe(3);
    });

    it('should parse correctly complex layout 1', function () {
        var elements,
            boundries,
            rows,
            composed,
            composedRowsIds = [];

        elements = [
            {
                id: 1,
                top: 0,
                left: 0,
                right: 80,
                bottom: 200
            }, {
                id: 2,
                top: 0,
                left: 100,
                right: 250,
                bottom: 40
            }, {
                id: 3,
                top: 0,
                left: 270,
                right: 320,
                bottom: 40
            }, {
                id: 4,
                top: 60,
                left: 100,
                right: 150,
                bottom: 150
            }, {
                id: 5,
                top: 60,
                left: 170,
                right: 220,
                bottom: 150
            }, {
                id: 6,
                top: 60,
                left: 240,
                right: 320,
                bottom: 150
            }, {
                id: 7,
                top: 170,
                left: 100,
                bottom: 200,
                right: 320
            }
        ];

        augmentElements(elements);

        rows = getRows(augmentElements(elements));

        expect(rows.length).toBe(1);
        expect(rows[0].children.length).toBe(7);

        rows[0].children.every(function (element) {
            if (undefined !== element.composed) {
                composed = element.composed;
                return false;
            } else {
                return true;
            }
        });

        expect(composed.children.length).toBe(6);

        composed.children.forEach(function (element) {
            if (-1 === composedRowsIds.indexOf(element.row.id)) {
                composedRowsIds.push(element.row.id);
            }
        });

        expect(composedRowsIds.length).toBe(3);

    });


      it('should parse correctly complex layout 2', function () {
        var elements,
            ids = {},
            structure,
            boundries,
            composed,
            composedRowsIds = [],
            rows;

        elements = [
            {
                id: 1,
                top: 0,
                left: 0,
                right: 80,
                bottom: 200
            }, {
                id: 2,
                top: 0,
                left: 100,
                right: 150,
                bottom: 40
            }, {
                id: 3,
                top: 0,
                left: 240,
                right: 320,
                bottom: 40
            }, {
                id: 4,
                top: 60,
                left: 100,
                right: 150,
                bottom: 150
            }, {
                id: 5,
                top: 0,
                left: 170,
                right: 220,
                bottom: 150,
                background: 'green'
            }, {
                id: 6,
                top: 60,
                left: 240,
                right: 260,
                bottom: 150
            }, {
                id: 7,
                top: 60,
                left: 270,
                right: 290,
                bottom: 150
            }, {
                id: 8,
                top: 60,
                left: 300,
                right: 320,
                bottom: 150,
                background: 'red'
            }, {
                id: 10,
                top: 170,
                left: 100,
                bottom: 200,
                right: 320,
                background: 'black'
            }
        ];

        augmentElements(elements);

        rows = getRows(augmentElements(elements));
        console.log(rows);
        expect(rows.length).toBe(1);
        expect(rows[0].children.length).toBe(9);

        rows[0].children.every(function (element) {
            if (undefined !== element.composed) {
                composed = element.composed;
                return false;
            } else {
                return true;
            }
        });

        expect(composed.children.length).toBe(8);

        composed.children.forEach(function (element) {
            if (-1 === composedRowsIds.indexOf(element.row.id)) {
                composedRowsIds.push(element.row.id);
            }
        });

        expect(composedRowsIds.length).toBe(3);


    });

});
