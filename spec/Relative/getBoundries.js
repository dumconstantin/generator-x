describe('getBoundries', function () {

    it('should find the boundries based on top, left, right, bottom', function() {
        var elements = [{
                top: 100,
                left: 100,
                right: 200,
                bottom: 400
            }, {
                top: 50,
                left: 50,
                right: 150,
                bottom: 500

            }],
            boundries = getBoundries(augmentElements(elements));

        expect(boundries.left).toBe(50);
        expect(boundries.right).toBe(200);
        expect(boundries.top).toBe(50);
        expect(boundries.bottom).toBe(500);
        expect(boundries.width).toBe(150);
        expect(boundries.height).toBe(450);
    });
    
});