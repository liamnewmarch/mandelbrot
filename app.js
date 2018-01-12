/**
 * State class, will bepassed from the app and the worker thread.
 */
class State {
  /**
   * Set initial values.
   */
  constructor() {
    this.iterations = 256;
    this.height = 0;
    this.width = 0;
    this.x = 0.7237730127387282;
    this.y = 0.23171775385796425;
    this.zoom = 1;
  }
}

/**
 * Key responder class, a collection of methods for handling keyboard responses
 */
class KeyResponder {
  constructor(app) {
    this.app = app;
  }

  onKeyW() {
    this.app.state.y += 1 / this.app.state.zoom * .05;
    this.app.state.lastAction = 'up';
  }

  onKeyA() {
    this.app.state.x += 1 / this.app.state.zoom * .05;
    this.app.state.lastAction = 'left';
  }

  onKeyS() {
    this.app.state.y -= 1 / this.app.state.zoom * .05;
    this.app.state.lastAction = 'down';
  }

  onKeyD() {
    this.app.state.x -= 1 / this.app.state.zoom * .05;
    this.app.state.lastAction = 'right';
  }

  onArrowUp() {
    this.app.state.zoom *= 2;
    this.app.state.lastAction = 'in';
  }

  onArrowDown() {
    this.app.state.zoom /= 2;
    this.app.state.lastAction = 'out';
  }

  onEscape() {
    this.app.reset();
    this.app.state.lastAction = 'reset';
  }
}

/**
 * App class, responsible for canvas manipulation and worker communication.
 */
class App {
  /**
   * Get canvas context, start worker and initiate rendering.
   */
  constructor({ canvas }) {
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.keyResponder = new KeyResponder(this);
    this.worker = new Worker('worker.js');

    this._bindEvents();
    this.reset();
  }

  /**
   * Reset the state and trigger resize event.
   */
  reset() {
    this.state = new State();
    this._onResize();
  }

  /**
   * Bind relevant event listeners.
   */
  _bindEvents() {
    this._onResize = this._onResize.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onWorkerFinished = this._onWorkerFinished.bind(this);

    window.addEventListener('resize', this._onResize);
    window.addEventListener('keydown', this._onKeyDown);
    this.worker.addEventListener('message', this._onWorkerFinished);
  }

  /**
   * On window key down event, modify state based on key codes.
   */
  _onKeyDown({ code }) {
    const method = `on${code}`;
    if (this.drawing) return;
    this.drawing = true;
    if (method in this.keyResponder) {
      this.keyResponder[method](this);
      this._startWorker();
    }
  }

  /**
   * On window resize event, resize the canvas accordingly.
   */
  _onResize() {
    const { clientHeight, clientWidth } = this.canvas;
    // Clamp retina oversampling to between 1x and 2x, for performance reasons.
    const oversample = Math.min(window.devicePixelRatio || 1, 2);
    this.state.height = this.canvas.height = clientHeight * oversample;
    this.state.width = this.canvas.width = clientWidth * oversample;
    this._startWorker();
  }

  /**
   * Pass current state to the worker.
   */
  _startWorker() {
    this.canvas.dataset.action = this.state.lastAction;
    this.worker.postMessage(this.state);
  }

  /**
   * On worker post message event, write ImageData to the canvas.
   */
  _onWorkerFinished({ data }) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.putImageData(data.image, 0, 0);
    delete this.canvas.dataset.action;
    this.drawing = false;
  }
}

/**
 * Create an App instance.
 */
const app = new App({
  canvas: document.querySelector('canvas')
});

// Show touch controls if a touch enabled device.
if ('ontouchstart' in window) document.body.classList.add('touch');

// Set up touch controls.
[...document.querySelectorAll('button[data-code]')].forEach((button) => {
  button.addEventListener('click', (event) => {
    app._onKeyDown(button.dataset);
  });
});
