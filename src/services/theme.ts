import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'estante-viva-theme'

const prefersDark = (): boolean =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

const readStored = (): Theme | null => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

const getInitialTheme = (): Theme => readStored() ?? (prefersDark() ? 'dark' : 'light')

// Reflect the theme onto the document: toggle the `.dark` class (which flips the
// design tokens in style.css), update the native color-scheme and the browser
// chrome color. The inline boot script in index.html applies the same class
// before first paint, so this just keeps everything in sync afterwards.
const apply = (value: Theme): void => {
  const root = document.documentElement
  root.classList.toggle('dark', value === 'dark')
  root.style.colorScheme = value
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', value === 'dark' ? '#000000' : '#ffffff')
}

const theme = ref<Theme>(getInitialTheme())
apply(theme.value)

// Follow the OS preference until the user makes an explicit choice.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (readStored()) return
  theme.value = e.matches ? 'dark' : 'light'
  apply(theme.value)
})

export const useTheme = () => {
  const setTheme = (value: Theme): void => {
    theme.value = value
    localStorage.setItem(STORAGE_KEY, value)
    apply(value)
  }

  const toggleTheme = (): void => setTheme(theme.value === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggleTheme }
}
