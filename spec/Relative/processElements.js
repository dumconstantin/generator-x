describe('processElements', function () {

    it('should process the first level of elements', function () {
        var elements = createGrid(1, 4);

        elements[0].children = createGrid(1, 4);

        elements[0].children[1].children = createGrid(1, 4);
        console.log(processElements(elements));
    });

});