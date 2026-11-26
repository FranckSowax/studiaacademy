import { describe, expect, it } from 'vitest'
import { resoudreVideoIntro } from './intro-video'

describe('resoudreVideoIntro', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10s', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://vimeo.com/123456789', 'https://player.vimeo.com/video/123456789'],
    ['https://player.vimeo.com/video/123456789?h=abc', 'https://player.vimeo.com/video/123456789'],
  ])('reconnaît le lecteur intégré %s', (entree, attendu) => {
    expect(resoudreVideoIntro(entree)).toEqual({ kind: 'embed', src: attendu })
  })

  it('accepte un fichier vidéo direct en https', () => {
    expect(resoudreVideoIntro('  https://cdn.example.com/videos/intro.MP4?v=2 ')).toEqual({
      kind: 'fichier',
      src: 'https://cdn.example.com/videos/intro.MP4?v=2',
    })
    expect(resoudreVideoIntro('https://cdn.example.com/intro.webm')?.kind).toBe('fichier')
  })

  it.each([
    ['vide', ''],
    ['nul', null],
    ['texte libre', 'ma vidéo'],
    ['http non chiffré', 'http://cdn.example.com/intro.mp4'],
    ['schéma javascript', 'javascript:alert(1)//.mp4'],
    ['schéma data', 'data:video/mp4;base64,AAAA'],
    ['page tierce quelconque', 'https://example.com/page'],
    ['extension dans la requête seulement', 'https://example.com/page?f=intro.mp4'],
    ['YouTube sans identifiant', 'https://www.youtube.com/watch'],
    ['chaîne YouTube', 'https://www.youtube.com/@studia'],
    ['identifiant YouTube piégé', 'https://youtu.be/abc"onload=x'],
    ['faux domaine YouTube', 'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'],
    ['Vimeo sans identifiant numérique', 'https://vimeo.com/channels/staffpicks'],
    ['adresse trop longue', `https://cdn.example.com/${'a'.repeat(1000)}.mp4`],
  ])('refuse : %s', (_cas, entree) => {
    expect(resoudreVideoIntro(entree)).toBeNull()
  })
})
