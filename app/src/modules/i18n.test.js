// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { resolveLang, t, setLang, getActiveLang } from './i18n'
import { STRINGS } from '../data/strings'

function storageWith(key, value) {
  return {
    getItem: (k) => (k === key ? value : null),
    setItem: () => {},
  }
}

const emptyStorage = { getItem: () => null, setItem: () => {} }

describe('resolveLang', () => {
  it('reads a supported lang from the query string', () => {
    expect(resolveLang('?lang=vi', emptyStorage, 'en-US')).toBe('vi')
  })

  it('reads a supported lang alongside other params', () => {
    expect(resolveLang('?lang=zh&teach=1', emptyStorage, 'en-US')).toBe('zh')
  })

  it('falls through an unrecognised lang value', () => {
    expect(resolveLang('?lang=fr', emptyStorage, 'en-US')).toBe('en')
  })

  it('rejects zh-cn — only exact "zh" is accepted', () => {
    expect(resolveLang('?lang=zh-cn', emptyStorage, 'en-US')).toBe('en')
  })

  it('falls back to storage when no query lang is present', () => {
    expect(resolveLang('', storageWith('dppa-lang', 'vi'), 'en-US')).toBe('vi')
  })

  it('prefers the URL over storage', () => {
    expect(resolveLang('?lang=en', storageWith('dppa-lang', 'vi'), 'vi-VN')).toBe('en')
  })

  it('falls back to navigator language when nothing else matches', () => {
    expect(resolveLang('', emptyStorage, 'vi-VN')).toBe('vi')
  })

  it('matches zh navigator variants', () => {
    expect(resolveLang('', emptyStorage, 'zh-Hans-CN')).toBe('zh')
  })

  it('defaults to en when nothing resolves', () => {
    expect(resolveLang('', emptyStorage, undefined)).toBe('en')
  })
})

describe('t', () => {
  it('falls back to English when the active-language value is UNTRANSLATED', () => {
    setLang('vi')
    expect(STRINGS.vi.header_title).toBe('UNTRANSLATED')
    expect(t('header_title')).toBe(STRINGS.en.header_title)
    setLang('en')
  })

  it('returns a real translation when one exists', () => {
    setLang('vi')
    expect(t('tour_step_scenario_title')).toBe(STRINGS.vi.tour_step_scenario_title)
    setLang('en')
  })

  it('returns the key itself and warns once for a missing key', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setLang('en')
    expect(t('no_such_key_anywhere')).toBe('no_such_key_anywhere')
    t('no_such_key_anywhere')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
  })
})

describe('getActiveLang / setLang', () => {
  it('reports the language set by setLang', () => {
    setLang('zh')
    expect(getActiveLang()).toBe('zh')
    setLang('en')
  })

  it('normalizes an unsupported value to en', () => {
    setLang('fr')
    expect(getActiveLang()).toBe('en')
  })
})

describe('key-set parity', () => {
  it('has identical key sets across en, vi, zh', () => {
    const en = Object.keys(STRINGS.en).sort()
    const vi = Object.keys(STRINGS.vi).sort()
    const zh = Object.keys(STRINGS.zh).sort()
    expect(vi).toEqual(en)
    expect(zh).toEqual(en)
  })

  it('has no UNTRANSLATED placeholders in English', () => {
    const untranslated = Object.entries(STRINGS.en).filter(([, v]) => v === 'UNTRANSLATED')
    expect(untranslated).toEqual([])
  })
})
