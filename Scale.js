export default class Scale {
  levels;
  #current;
  max;
  min;
  last;
  #normal;
  constructor(levels = [1, 2, 4, 10, 40], current = 0, normal = 0) {
    this.min = 0;
    this.max = levels.length - 1;
    this.levels = levels;
    this.#current = current;
    this.last = current;

    this.#normal = normal;
  }
  updateScaleLevel(level, value) {
    this.levels[level] = value;
  }
  next() {
    console.log("NEXT", this.#current);
    this.last = this.#current;
    this.#current = Math.min(this.max, this.#current + 1);
    return this.#formatCords(this.levels[this.#current]);
  }
  prev() {
    this.last = this.#current;
    this.#current = Math.max(this.min, this.#current - 1);
    return this.#formatCords(this.levels[this.#current]);
  }
  scaleDownMax() {
    this.last = this.#current;
    this.#current = this.min;
    return this.#formatCords(this.levels[this.#current]);
  }
  scaleUpMax() {
    this.last = this.#current;
    this.#current = this.max;
    return this.#formatCords(this.levels[this.#current]);
  }
  atMin() {
    return this.#current === this.min;
  }
  atMax() {
    return this.#current === this.max;
  }
  stateChanged() {
    return this.last !== this.#current;
  }
  #formatCords(scaleArr) {
    if (!Array.isArray(scaleArr)) {
      return { x: scaleArr, y: scaleArr };
    }
    return { x: scaleArr[0], y: scaleArr[1] || scaleArr[0] };
  }
  get current() {
    return this.#formatCords(this.levels[this.#current]);
  }
  set current(x) {
    this.#current = x;
  }
  get normal() {
    return this.#normal;
  }
}
