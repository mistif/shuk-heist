# The Shuk Recipe Heist

An AI detective game built with Next.js and LangChain.js. Search the case files with an assistant, interrogate four suspects who only know their own documents, and accuse the thief. Any of the four can be guilty: each new case picks one at random, with its own evidence. Play solo with one accusation, or as a team on one screen with two.

## Run it locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.
3. `npm run dev`, then open http://localhost:3000

Run the tests with `npm test`. They need no API key.

## Levels completed

- Level 1: Case Assistant and Accuse button.
- Level 2: Interrogation Room with four suspects.
- Level 3: Suspicion meter, using structured output.

## How it works

All documents live in one `MemoryVectorStore`, and every agent searches it through a filter on `visibleTo` and on which thief the document belongs to (`lib/tools.ts`). A document with no `thieves` list is true in every case. The explanations live in `lib/solution.ts`, outside the store and out of every agent's reach. The browser holds chat history and sends it with each message, and the server validates it.

## How the thief is picked

The browser makes a random case ID when a game starts. `thiefFor` in `lib/solution.ts` turns that ID into a suspect with an HMAC keyed on `CASE_SECRET`, or on `OPENAI_API_KEY` if that isn't set. The server stores nothing and always gets the same thief for a case, and the browser can't work it out because it never sees the secret.

## Difficulty

Pick how well the suspects lie on the start screen:

- **Rookie:** they lie badly, and one real piece of evidence is meant to crack them.
- **Detective:** they follow the REVEAL rules in their files exactly.
- **Inspector:** they lie smoothly, and `lib/claims.ts` checks what the player says against the case files first, so made-up evidence gets called out.

## Staying on the case

- Each agent searches only its own documents, so a suspect can't retrieve another suspect's file.
- A separate check (`lib/guard.ts`) reads each player message before any agent runs. Off-topic requests, like code or homework, get a fixed in-character reply and never reach an agent. Prompt rules alone weren't enough: in testing, suspects still wrote poems.
- `lib/rate-limit.ts` allows 15 messages a minute and 150 a day per address, and 1,500 a day across the whole game. Replies and agent steps are capped too. The counts live in server memory, so they reset on restart.

## Known trade-off

The server keeps no game state, so someone with dev tools could reset their accusations or send `final: true` to `/api/accuse` to see that case's answer. That's acceptable for a class game, and it keeps the project free of a database.

## One thing that didn't work as expected

The brief's `model: "openai:gpt-5.4-mini"` string passed the build and the tests, but every real request failed with `Cannot find module as expression is too dynamic`. LangChain loads the provider from that string with a dynamic import, which Next's bundler can't resolve. Passing a `new ChatOpenAI({ model })` instance to `createAgent` fixed it.

The suspects also needed real testing. On the first live run, Yossi confessed as soon as he was told to ignore his instructions, and Noa mentioned her secret boyfriend unprompted, because his name was in her personality line. Tightening the REVEAL rules in `lib/prompts.ts` and removing the name fixed most of this, but these rules live in a prompt, so a suspect can still occasionally slip.
