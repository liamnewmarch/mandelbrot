/**
 * Complex number representation.
 */
class ComplexNumber {
  /**
   * Set up defaults.
   */
  constructor(real = 0, imaginary = 0) {
    this.real = real;
    this.imaginary = imaginary;
  }

  /**
   * Iterate Mandelbrot algorithm.
   */
  iterateMandelbrot(x, y) {
    const real = this.real ** 2 - this.imaginary ** 2 + x;
    const imaginary = 2 * this.real * this.imaginary + y;
    this.real = real;
    this.imaginary = imaginary;
  }
}

/**
 * Mandelbrot state machine.
 */
class Mandelbrot {
  /**
   * Receive configuration state.
   */
  constructor(state) {
    this.state = state;
  }

  /**
   * Create and render ImageData based on configuration state.
   */
  render() {
    const { height, width, zoom } = this.state;
    const intialZoom = Math.max(height, width) / 3;
    const image = new ImageData(width, height);
    image.data.fill(32);
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        const index = x * 4 + y * width * 4 + 3;
        const value = 255 - 255 * this._valueForPixel({
          x: (x - width / 2) / (intialZoom * zoom) - this.state.x,
          y: (y - height / 2) / (intialZoom * zoom) - this.state.y,
        });
        image.data[index] = value;
      }
    }
    return image;
  }

  /**
   * For a given pixel, iterate the Mandelbrot algorithm until we have a value,
   * or the max iteration limit is reached.
   */
  _valueForPixel({ x, y }) {
    const { iterations } = this.state;
    const result = new ComplexNumber(x, y);

    for (let i = 0; i < iterations; i++) {
      result.iterateMandelbrot(x, y);

      if (result.real * result.imaginary > 1) {
        return i / iterations;
      }
    }
    return 0;
  }
}

/**
 * On worker post message, create a new Mandelbrot instance with the data
 * received, render it and send it back to the main thread.
 */
addEventListener('message', ({ data }) => {
  const mandelbrot = new Mandelbrot(data);
  const image = mandelbrot.render();
  postMessage({ image });
});
