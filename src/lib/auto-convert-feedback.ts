import type { AutoConvertInvalidReason } from './input-auto-convert'

const INVALID_REASON_ORDER: AutoConvertInvalidReason[] = [
  'numbersOnlyDual',
  'textArabicOnlyDual',
  'textEnglishOnlyDual',
  'emailEnglishOnlyDual',
  'emailInvalidFormatDual',
  'urlEnglishOnlyDual',
  'urlInvalidFormatDual',
]

function isAutoConvertInvalidReason(value: string): value is AutoConvertInvalidReason {
  return (INVALID_REASON_ORDER as string[]).includes(value)
}

type InvalidFieldElement = HTMLInputElement | HTMLTextAreaElement

export function collectAutoConvertInvalidIssues(root: ParentNode | null): {
  reasons: AutoConvertInvalidReason[]
  firstInvalidField: InvalidFieldElement | null
} {
  if (!root) {
    return { reasons: [], firstInvalidField: null }
  }

  const invalidFields = Array.from(
    root.querySelectorAll<InvalidFieldElement>('[data-auto-convert-invalid="true"]'),
  )

  const seen = new Set<AutoConvertInvalidReason>()
  for (const field of invalidFields) {
    const reason = field.dataset.autoConvertInvalidReason
    if (reason && isAutoConvertInvalidReason(reason)) {
      seen.add(reason)
    }
  }

  return {
    reasons: INVALID_REASON_ORDER.filter((reason) => seen.has(reason)),
    firstInvalidField: invalidFields[0] ?? null,
  }
}

export function formatAutoConvertIssueList(
  reasons: AutoConvertInvalidReason[],
  resolveMessage: (reason: AutoConvertInvalidReason) => string,
) {
  return reasons.map(resolveMessage).filter((message) => message.trim().length > 0)
}
