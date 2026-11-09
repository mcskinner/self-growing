# Label-guidance replication: readable label, settled caret failure

Fresh original-base application `8b01b6b4858d981efe82abf09a0dc7c2ed4551d0`, local/unpushed with its full patch retained. This was the second of up to three additional applications authorized by the owner. The same description as reader-04 was supplied (SHA-256 `06f125519f09d08535a8070353d6e2ab8be3bbed7a059679a729caf99dd441d2`), with original reference/evidence, unchanged skill/tooling, configured model, ordinary target context, and normal safety brief. No preceding results/code, repair hints, or coordinator verifier supplied.

## Results

Existing record/evaluate passed: check, test (55 Python/21 Node), build. The applier's own mocked idle/busy browser tests passed at wide/narrow widths and now assert actual label text geometry inside a content-sized/nonwrapping control. Manual screenshot/code inspection confirms that the previous label-overflow defect is absent in the wide independent fixture. No backend, renderer, access-policy, native-picker, or navigation changes; no trial integration into the workshop.

The byte-identical independent verifier initially timed out locating the quote action because its caption is “Add quote to draft”, not either of the two captions hardcoded in the verifier. The adaptation does not prescribe a caption; this is a selector mismatch, not a product defect. Original failed output is preserved. A separate local verifier copy adds that caption to precisely three locator regexes; no assertions, fixtures, timing, or target code changed. The exact delta is verifier-caption-only.patch, with original/translated hashes in input-manifest.json.

The caption-translated verifier found the action, selected via a real pointer gesture, and successfully appended the correct attributed passage without sending. It then timed out waiting for composer focus with both selection endpoints at the final draft length. Therefore independent full acceptance failed on a real settled-caret requirement; later functional scenarios and the narrow independent pass were not completed or claimed. The original action label and screenshot remain local under `.local/adaptation-runs/quote-to-chat-verification-05/`.

Source review corroborates the risk: the composer assigns value/focus/selection synchronously while its reader caller subsequently clears the document selection. The applier's browser test checks activeElement and text append, not the settled selection endpoints or continued typing. This mirrors the earlier reader-02 caret failure; no code repair is performed here.

## Next bounded intervention

Preserve this failure. For the third and final authorized new application, add a portable acceptance sentence requiring focus with a collapsed caret at the updated draft's end after rendering, plus continued typing there. Do not prescribe React lifecycle mechanics, expose prior repair code, or add CSS instructions. Keep the existing label requirement, original reference, skill/tooling, baseline, and model. Maintain the same acceptance assertions; caption translation is a disclosed locator adaptation, not a weakening of acceptance or a third application.

## Limits

This run supports the label-verification direction but is not a fully accepted replication of reader-04. The first new pass alone did not establish reliability. Own fixtures used programmatic selection; independent execution added real pointer selection but stopped at the caret check. APIs/chat/SSE/picker results were mocked, not live provider/OS chooser/touch/accessibility/cross-browser or owner acceptance. These same-base stochastic runs do not isolate causality or prove either added sentence universally necessary. Raw sessions/screenshots remain local; the running owner-reviewed feature is unchanged.
