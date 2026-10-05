import '@testing-library/jest-dom/vitest';
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
