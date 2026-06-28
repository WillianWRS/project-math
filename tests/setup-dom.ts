// Registra os matchers do jest-dom no expect do Vitest.
// É seguro em ambiente node (os matchers só tocam o DOM quando chamados em testes jsdom).
import '@testing-library/jest-dom/vitest'
