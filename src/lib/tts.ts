export function speak(text: string, lang?: string, voiceURI?: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  if (lang) u.lang = lang
  if (voiceURI) {
    const v = window.speechSynthesis.getVoices().find((x) => x.voiceURI === voiceURI)
    if (v) u.voice = v
  }
  window.speechSynthesis.speak(u)
}

export function voicesForLang(lang: string) {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)))
}

export const LANGS = [
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
]
