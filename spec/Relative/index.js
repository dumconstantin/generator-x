describe('Relative tests', function () {
    "use strict";

    var tree,
        cell;

    beforeEach(function () {
       tree = createLayer({
            top: 0,
            left: 0,
            right: 700,
            bottom: 700,
            width: 700,
            height: 700,
            background: '#222',
            children: []
        });

       cell = new CellModifier();
    });

    /*
    addSiblings(tree.siblings[1], createNodes({
        rows: 2,
        cols: 3,
        cell: {
            width: 10,
            height: 50,
            top: 10,
            left: 10,
            background: '#888'
        },
        offset: {
            top: 20,
            left: 20 
        }
    }));
    */

    /*
   it('should parse tree #1', function () {
        var result;

        addSiblings(tree, createNodes({
            rows: 2,
            cols: 3,
            cell: {
                width: 100,
                height: 100,
                background: '#444'
            }
        }));

        addSiblings(tree.siblings[1], createNodes({
            rows: 2,
            cols: 3,
            cell: {
                width: 20,
                height: 20,
                background: 'red'
            }
        }));

        result = new Relative(tree);

        result.parseTree();

        expect(result.getTree().rows.length).toBe(2);
        expect(result.getTree().rows[0].columns.length).toBe(3);
        expect(result.getTree().rows.length).toBe(2);
   });
   */

   it('should parse tree #2', function () {
        var result;

       ;

        addSiblings(tree, createNodes({
            rows: 2,
            cols: 2,
            cell: {
                width: 250,
                height: 200,
                background: '#444'
            },
            offset: {
                top: 10,
                left: 10
            }
        },  cell
            .set(0, 0, {
                height: 410
            })
            .set(1, 0, undefined)
            .get()
        ));

        cell.reset();

        addSiblings(tree.siblings[1],  createNodes({
            rows: 5,
            cols: 4,
            cell: {
                width: 50,
                height: 25,
                background: '#999'
            },
            offset: {
                top: 10,
                left: 10
            }
        },  cell
            .set(0, 0, { height: 60 })
            .set(0, 3, { height: 95 })
            .set(1, 0, undefined)
            .set(1, 3, undefined)
            .set(2, 3, undefined)
            .set(3, 3, undefined)
            .set(4, 0, undefined)
            .get()
        ));



        result = new Relative(tree);

        result.parseTree();

        console.log(result.getTree());
   });



});