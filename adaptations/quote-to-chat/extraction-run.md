# Initial quote-to-chat extraction

Protocol: [implementation-derived transfer](../../experiments/quote-to-chat-transfer/protocol.md), committed as `58bae20` before extraction. Source feature development itself preceded this protocol.

- Source: detached `e97bfc6edca92b8786ef3108f8c019d0f4b5048e`.
- Reference base: `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`.
- Fresh Pi CLI session, configured `openai-codex/gpt-6.1-sol`, existing login; exit 0.
- Invocation: `pi --mode json --print --approve --model "$PI_MODEL" --skill <workshop>/.pi/skills/adapt/SKILL.md --session-dir <local-run>/session @<local-run>/prompt.md`.
- Input: captured metadata/patch, source checkout, and a reviewed intent summary. No private transcript, past applications, or coordinator acceptance script supplied.
- Output: `adaptation.md` and `evidence.md`, unedited by the coordinator before application. Source checkout remained clean; no runtime/tooling changes.
- Frozen description SHA-256: `58a3223c9a6e193139464ab849d24620c47f92040c9c42955edd9290766fa2d5`.
- Raw prompt/events/stderr and isolated session retained locally under `.local/adaptation-runs/quote-to-chat-distillation/`, not published wholesale.

## Supplied intent and boundaries

Extract the useful quote-to-chat workflow for a recipient that already has a reader and chat: explicitly bring selected document text and its path into an existing draft without sending. The owner retained path-plus-quote rather than richer locators or a renderer migration. The captured diff also includes navigation/drawer work, which must not become adaptation requirements. Keep intent, necessary boundaries, and observable success minimal; put source-specific details and uncertainty in evidence.

## Pre-application observations

The distiller explicitly separated docs-only access policy and drawer navigation from quoting. It left citation syntax, UI placement, numeric draft limit, component architecture, and renderer to the recipient. Independent acceptance will still check the reviewed experience, including a nearby discoverable action and readable narrow-screen layout. No instruction amendment or reference cleanup was made to anticipate a mismatch; the first application will test this frozen description with its allowed mixed reference evidence.

This extraction inspects source behavior and test definitions; it does not establish successful transfer or live-provider acceptance.
