describe('Relative tests', function () {
    "use strict";

    var tree;

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

    });

    /*
   it('should parse tree #1', function () {
        var group,
            result,
            resultedTree;


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
        },  cell()
            .set(0, 0, {
                height: 410
            })
            .set(1, 0, undefined)
        ));

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
        },  cell()
            .set(0, 0, { height: 60 })
            .set(0, 3, { height: 95 })
            .set(1, 0, undefined)
            .set(1, 3, undefined)
            .set(2, 3, undefined)
            .set(3, 3, undefined)
            .set(4, 0, undefined)
        ));

        result = new Relative(tree);

        result.generate();

        resultedTree = result.getTree();

        console.log(resultedTree);

        expect(resultedTree.children.length).toBe(1);
        expect(resultedTree.children[0].children.length).toBe(2);
        expect(resultedTree.children[0].children[1].children.length).toBe(2);
        expect(resultedTree.children[0].children[1].children[0].children.length).toBe(1);
        expect(resultedTree.children[0].children[1].children[0].children[0].children.length).toBe(3);

        group = resultedTree.children[0].children[1].children[0].children[0].children[0].children;


        console.log(group);
        expect(group[0].children.length).toBe(2);
        expect(group[1].children.length).toBe(3);
        expect(group[2].children.length).toBe(3);
        expect(group[3].children.length).toBe(0);

        result.parseTree();


   });
*/
     it('should parse tree #2', function () {
            var group,
                result,
                resultedTree;


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
            },  cell()
                .set(0, 0, {
                    height: 410
                })
                .set(1, 0, undefined)
            ));

            addSiblings(tree.siblings[1],  createNodes({
                rows: 5,
                cols: 4,
                cell: {
                    width: 50,
                    height: 25,
                    background: '#999'
                },
                offset: {
                    top: tree.siblings[1].css.top,
                    left: tree.siblings[1].css.left
                }
            },  cell()
                .set(0, 0, { height: 60 })
                .set(0, 3, { height: 95 })
                .set(1, 0, undefined)
                .set(1, 3, undefined)
                .set(2, 3, undefined)
                .set(3, 3, undefined)
                .set(4, 0, undefined)
            ));

            result = new Relative(tree);

            result.generate();

            resultedTree = result.getTree();

            result.parseTree();

            showTree(tree);
            console.log(tree);


       });


});