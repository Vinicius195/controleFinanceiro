// Importa os matchers personalizados do jest-dom
import '@testing-library/jest-dom';

// Mock do ResizeObserver para componentes Radix UI/Shadcn
const ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

window.ResizeObserver = ResizeObserver;

// Mock para as funções de captura de ponteiro
if (typeof window.Element.prototype.hasPointerCapture !== 'function') {
  window.Element.prototype.hasPointerCapture = jest.fn();
}
if (typeof window.Element.prototype.releasePointerCapture !== 'function') {
  window.Element.prototype.releasePointerCapture = jest.fn();
}

// Mock para scrollIntoView
if (typeof window.HTMLElement.prototype.scrollIntoView !== 'function') {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
}
