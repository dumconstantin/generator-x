describe('isValidBoundries', function () {

    it('should validate an element with top, left, width, height', function () {
        var element = {
            top: 100,
            left: 100,
            width: 200,
            height: 200
        };

        expect(isValidBoundries(element)).toBe(true);
    });

    it('should validate an element with bottom, right, width, height', function () {
        var element = {
            bottom: 200,
            right: 200,
            width: 200,
            height: 200
        };

        expect(isValidBoundries(element)).toBe(true);
    });

    it('should validate an element with top, right, bottom, left', function () {
        var element = {
            top: 100,
            left: 100,
            bottom: 200,
            right: 200
        };

        expect(isValidBoundries(element)).toBe(true);
    });

    it('should not validate an element with without a vertical conditional', function () {
        var element = {
            top: 100,
            left: 100,
            right: 200
        };

        expect(isValidBoundries(element)).toBe(false);
    });

    it('should not validate an element with without a horizontal conditional', function () {
        var element = {
            top: 100,
            height: 500,
            right: 200
        };

        expect(isValidBoundries(element)).toBe(false);
    });

});