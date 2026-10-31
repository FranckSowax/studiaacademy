// ============================================
// Récupération d'URL fournies par l'utilisateur, protégée contre le SSRF
// (serveur uniquement)
// ============================================

import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 5

// Plages non routables / internes (RFC 6890 et voisines).
// WHY: deux listes distinctes — BlockList applique les règles IPv6
// « ::ffff:0:0/96 » aux adresses IPv4, ce qui bloquerait tout l'IPv4.
const BLOCKED_V4 = new BlockList()
const BLOCKED_V6 = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // métadonnées cloud
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  BLOCKED_V4.addSubnet(net, prefix, 'ipv4')
}
for (const [net, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96], // IPv4 mappé : on refuse plutôt que de décoder
  ['64:ff9b::', 96], // NAT64
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7], // ULA (réseau privé Railway)
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED_V6.addSubnet(net, prefix, 'ipv6')
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeUrlError'
  }
}

/**
 * Indique si une adresse IP littérale pointe vers un réseau interne,
 * réservé ou non routable.
 *
 * @example
 * isBlockedAddress('169.254.169.254') // true
 * isBlockedAddress('8.8.8.8') // false
 */
export function isBlockedAddress(ip: string): boolean {
  const family = isIP(ip)
  if (family === 4) return BLOCKED_V4.check(ip, 'ipv4')
  if (family === 6) return BLOCKED_V6.check(ip, 'ipv6')
  return true
}

/**
 * Valide la forme d'une URL publique : http(s), ports standards,
 * sans identifiants. Ne résout pas le DNS.
 */
export function parsePublicHttpUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new UnsafeUrlError('URL invalide')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Seules les URL http(s) sont acceptées')
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('URL avec identifiants refusée')
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new UnsafeUrlError('Port non autorisé')
  }
  return url
}

async function assertResolvesPublic(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, '')
  let addresses: { address: string }[]
  try {
    addresses = await lookup(host, { all: true, verbatim: true })
  } catch {
    throw new UnsafeUrlError('Nom de domaine introuvable')
  }
  if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
    throw new UnsafeUrlError('Adresse de destination non autorisée')
  }
}

async function readLimited(res: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(res.headers.get('content-length') ?? 0)
  if (declared > maxBytes) throw new UnsafeUrlError('Contenu trop volumineux')
  if (!res.body) return new Uint8Array()

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new UnsafeUrlError('Contenu trop volumineux')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }
  return out
}

export interface SafeFetchOptions {
  headers?: Record<string, string>
  timeoutMs?: number
  maxBytes?: number
}

export interface SafeFetchResult {
  ok: boolean
  status: number
  contentType: string | null
  bytes: Uint8Array
  text(): string
}

function toResult(res: Response, bytes: Uint8Array): SafeFetchResult {
  return {
    ok: res.ok,
    status: res.status,
    contentType: res.headers.get('content-type'),
    bytes,
    text: () => new TextDecoder().decode(bytes),
  }
}

/**
 * GET d'une URL publique arbitraire (fournie par un utilisateur).
 * Refuse les adresses internes à chaque saut de redirection, impose un
 * timeout et une taille maximale de réponse.
 *
 * Limite connue : la résolution DNS est vérifiée avant la connexion ;
 * un DNS « rebinding » très court reste théoriquement possible.
 *
 * @example
 * const res = await safeFetch('https://fr.wikipedia.org/wiki/Gabon')
 * if (res.ok) console.log(res.text().length)
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const signal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  let url = parsePublicHttpUrl(rawUrl)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertResolvesPublic(url)

    // WHY: redirect 'manual' pour revalider chaque destination ;
    // sinon une page publique pourrait rediriger vers 169.254.169.254.
    const res = await fetch(url, { headers: options.headers, redirect: 'manual', signal })

    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel()
      url = parsePublicHttpUrl(new URL(location, url).toString())
      continue
    }

    return toResult(res, await readLimited(res, maxBytes))
  }
  throw new UnsafeUrlError('Trop de redirections')
}

/**
 * Vérifie qu'une URL de fichier pointe vers le Storage Supabase du projet
 * (URL signée ou publique). Les fichiers sources (PDF, docx, audio, images)
 * sont toujours uploadés là avant traitement.
 *
 * @example
 * assertProjectStorageUrl(signedUrl) // lève UnsafeUrlError si autre domaine
 */
export function assertProjectStorageUrl(raw: string): URL {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) throw new UnsafeUrlError('NEXT_PUBLIC_SUPABASE_URL non configurée')
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new UnsafeUrlError('URL de fichier invalide')
  }
  if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/storage/v1/object/')) {
    throw new UnsafeUrlError('Le fichier doit provenir du stockage Studia')
  }
  return url
}

/**
 * Télécharge un fichier du Storage Supabase du projet, avec timeout et
 * limite de taille (50 Mo par défaut).
 *
 * @example
 * const file = await fetchProjectStorageFile(signedUrl)
 */
export async function fetchProjectStorageFile(
  raw: string,
  options: Omit<SafeFetchOptions, 'headers'> = {},
): Promise<SafeFetchResult> {
  const url = assertProjectStorageUrl(raw)
  const res = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
  })
  return toResult(res, await readLimited(res, options.maxBytes ?? 50 * 1024 * 1024))
}
