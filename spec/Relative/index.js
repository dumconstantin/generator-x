describe('Relative tests', function () {
    "use strict";

    var tree;

    beforeEach(function () {
       tree = createLayer({
            top: 0,
            left: 0,
            right: 500,
            bottom: 500,
            width: 500,
            height: 500,
            background: '#222',
            children: []
        });
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
   
   it('should parse tree #1', function () {
        var result;

        addSiblings(tree, createNodes({
            rows: 2,
            cols: 3
        }));

        result = new Relative(tree);

        result.parseTree();
        
        expect(result.getTree().rows.length).toBe(2);
        expect(result.getTree().rows[0].columns.length).toBe(3); 
   });

   it('should parse tree #2', function () {
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

        showTree(tree);

        result = new Relative(tree);

        result.parseTree();
        
        console.log(result.getTree().rows[0].columns[1]);

        expect(result.getTree().rows.length).toBe(2);
   });



});