describe('getTopElementIndex', function () {

    it('should find the highest element if the element is first', function () {
        var elements = [{ top: -10 }, { top: 5 }];

        expect(getTopElementIndex(elements)).toBe(0);
    });


    it('should find the highest element if the element is last', function () {
        var elements = [{ top: 100 }, { top: 5 }];

        expect(getTopElementIndex(elements)).toBe(1);
    });


    it('should find the first element in a list with equal elements', function () {
        var elements = [{ top: 100 }, { top: 10 }, { top: 10 }];

        expect(getTopElementIndex(elements)).toBe(1);
    });

});