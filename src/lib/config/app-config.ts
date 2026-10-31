// ============================================
// Configuration pays & marque — SOURCE UNIQUE
// ============================================
// Toute valeur dépendant du pays ou de la marque (nom commercial, indicatif,
// devise, ville, fuseau, moyens de paiement) se lit ici. Les valeurs par
// défaut ci-dessous sont celles de Studia Academy (Gabon) ; chaque champ peut
// être surchargé par variable d'environnement pour une autre marque/pays.
//
// Règle : aucun autre fichier du nouveau code n'écrit "241", "FCFA",
// "Libreville" ou le nom de la marque en dur.

export interface PaymentMethodConfig {
  /** Identifiant technique stable. */
  id: string
  /** Libellé affiché. */
  label: string
  /** Numéro marchand affiché au client (null si non configuré). */
  merchantNumber: string | null
}

export interface AppConfig {
  brand: {
    name: string
  }
  country: {
    /** Code ISO 3166-1 alpha-2. */
    code: string
    /** Indicatif téléphonique international, sans « + ». */
    dialCode: string
    /** Le 0 initial des numéros locaux est-il conservé à l'international ? */
    keepsLeadingZero: boolean
    city: string
    timezone: string
    locale: string
  }
  currency: {
    /** Code ISO 4217. */
    code: string
    /** Libellé affiché après un montant. */
    label: string
  }
  payment: {
    methods: PaymentMethodConfig[]
  }
}

function env(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}

function buildConfig(): AppConfig {
  return {
    brand: {
      name: env('APP_BRAND_NAME') ?? 'Studia Academy',
    },
    country: {
      code: env('APP_COUNTRY_CODE') ?? 'GA',
      dialCode: env('APP_COUNTRY_DIAL_CODE') ?? '241',
      // Gabon : +241 07 67 01 58 — le 0 fait partie du numéro.
      keepsLeadingZero: (env('APP_COUNTRY_KEEPS_LEADING_ZERO') ?? 'true') === 'true',
      city: env('APP_COUNTRY_CITY') ?? 'Libreville',
      timezone: env('APP_TIMEZONE') ?? 'Africa/Libreville',
      locale: env('APP_LOCALE') ?? 'fr-FR',
    },
    currency: {
      code: env('APP_CURRENCY_CODE') ?? 'XAF',
      label: env('APP_CURRENCY_LABEL') ?? 'FCFA',
    },
    payment: {
      methods: [
        {
          id: 'airtel_money',
          label: 'Airtel Money',
          merchantNumber: env('NEXT_PUBLIC_AIRTEL_MONEY') ?? null,
        },
        {
          id: 'moov_money',
          label: 'Moov Money',
          merchantNumber: env('NEXT_PUBLIC_MOOV_MONEY') ?? null,
        },
      ],
    },
  }
}

/**
 * Configuration courante (relue à chaque appel : les tests peuvent
 * surcharger les variables d'environnement).
 *
 * @example
 * const { dialCode } = getAppConfig().country
 */
export function getAppConfig(): AppConfig {
  return buildConfig()
}

/**
 * Formate un montant dans la devise configurée. Un montant inconnu
 * (null/undefined) s'affiche comme inconnu, jamais comme 0.
 *
 * @example
 * formatMoney(95000) // "95 000 FCFA"
 * formatMoney(null)  // "—"
 */
export function formatMoney(amount: number | null | undefined, unknownLabel = '—'): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return unknownLabel
  const { country, currency } = getAppConfig()
  return `${amount.toLocaleString(country.locale)} ${currency.label}`
}
