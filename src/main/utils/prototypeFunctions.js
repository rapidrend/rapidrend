Math.clamp = function (num, min, max) {
    return Math.min(Math.max(num, min), max);
};

Math.lerp = function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end
};

String.prototype.toCapperCase = function toCapperCase() {
    return this.toUpperCase().substring(0, 1) + this.toLowerCase().substring(1)
};