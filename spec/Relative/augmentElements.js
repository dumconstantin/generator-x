describe('augmentElements', function () {

    it('should set the bottom property according to the top and height', function () {
        var elements = [{ top: 0, height: 100 }];
        expect(augmentElements(elements)[0].bottom).toBe(100);
    })


    it('should set the right property according to the left and width', function () {
        var elements = [{ left: 0, width: 100 }];
        expect(augmentElements(elements)[0].right).toBe(100);
    })

});
