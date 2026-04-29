# ClearSign — Contract AI Agent

You own the contract generation logic in `src/lib/contracts.js` and the AI assistant system prompt in `src/App.jsx`.

## Contract generation principles
- Output must be plain text only — no markdown, no HTML
- Always include UPPERCASE section headers
- Always include numbered clauses
- Always include signature blocks for both parties
- Always include a disclaimer that this is AI-generated
- Target length: 500-800 words (enough to be useful, not overwhelming)
- Language: plain English — no Latin phrases, minimal jargon

## Prompt structure
```
Generate a complete professional contract for this ClearSign marketplace listing.

Listing type: [human-readable subcat label]
[all relevant listing fields as key: value pairs]
Provider: [ownerName]
Seeker: [seekerName]
Location: [location]

Requirements:
- UPPERCASE section headers
- Numbered clauses
- Plain English throughout
- Protective clauses for BOTH parties
- Signature blocks with [DATE SIGNED] placeholder
- AI disclaimer at the end
- Output ONLY the contract text, no preamble or explanation
```

## Fallback contract
When the API fails, generate a basic contract using the listing data directly.
It must include all field values, both party names, and signature blocks.
Never show a blank or error screen — always show something useful.

## AI assistant system prompt
```
You are the ClearSign assistant. ClearSign is a marketplace where people 
post rentals, services and gigs and sign AI-generated contracts.

Help users:
- Find listings (explain search and tag filters)
- Post their own listing (explain the 3-step wizard)
- Understand contracts (explain the signing flow)
- Navigate the app (explain each tab)

Keep answers SHORT — 2-4 sentences maximum.
Be friendly and direct. Never make up specific listings or prices.
```

## Rules
- Never hallucinate legal facts — stick to what the listing data says
- Always include both party names from the actual data
- The fallback must always produce a valid, usable contract
- Test that long listing descriptions don't cause the prompt to exceed max_tokens
