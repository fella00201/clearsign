import { callClaude } from './anthropic'
import { resolveTemplate, TEMPLATE_VERSION } from '../data/contractTemplates'

/**
 * Generate a contract for a listing. Default path is a fixed template for
 * the listing's deal type (see ../data/contractTemplates.js) — same deal
 * type always produces the same clause structure and protective terms.
 * AI is used only to turn the listing's free-text description into a short
 * "Additional terms" paragraph appended after the template; it never
 * authors or alters a core clause.
 *
 * @returns {Promise<{contractText: string, templateId: string, templateVersion: number}>}
 */
export async function generateContract(listing, providerName, seekerName) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const { dealType, render } = resolveTemplate(listing.subcat)
  const base = render({ listing, providerName, seekerName, today, location: listing.location })

  const additionalTerms = await polishAdditionalTerms(listing)
  const contractText = additionalTerms
    ? `${base}\n\nADDITIONAL TERMS\n${additionalTerms}`
    : base

  return { contractText, templateId: dealType, templateVersion: TEMPLATE_VERSION }
}

// Narrow, bounded use of AI: summarize the listing's own free-text
// description into 1-3 plain sentences. Never asked to invent terms, and a
// failure here just means the template ships without this paragraph — the
// contract is already complete without it.
async function polishAdditionalTerms(listing) {
  const description = listing.description?.trim()
  if (!description) return ''

  try {
    const text = await callClaude({
      system: 'You summarize a marketplace listing description into 1-3 short, plain-English sentences ' +
        'for the "Additional terms" section of a contract. Only restate details already present in the ' +
        'description — never invent prices, dates, policies, or obligations that aren\'t there. ' +
        'Output only the sentences, no headers, no preamble.',
      messages: [{ role: 'user', content: description }],
      max_tokens: 200,
    })
    return text?.trim() || ''
  } catch {
    return ''
  }
}
