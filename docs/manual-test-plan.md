# XVII Stage 12 Manual Test Plan

## Cache

After upload, open:

`http://www.footballxvii.com/?v=12`

Use a hard refresh if needed.

## New career contract

1. Start a new career.
2. Confirm the manager career area shows a manager contract card.
3. Confirm the card shows salary, personal wealth, career earnings and owner buy-in target.
4. Confirm the transaction log includes a manager contract note.

## End-of-season pay review

1. Finish a season.
2. Confirm the end-of-season summary includes `Manager pay review`.
3. Confirm it shows salary, bonus, total paid and personal wealth.
4. Confirm personal wealth is not added to club transfer budget.
5. Start the next season and confirm personal wealth carries over.

## Performance bonus checks

1. Overperform expectation and confirm a bonus appears.
2. Finish below expectation and confirm salary still pays but bonus may be zero.
3. Try a promotion or title season if possible and confirm a special bonus line appears.

## Job moves

1. Accept a job if offered.
2. Confirm a new contract is created for the new club.
3. Confirm salary/wealth display continues after the move.

## Regression checks

1. Formation Creator still appears and works.
2. Post-match reports still use story language.
3. XI still clears after manual fixtures.
4. Play Fixture remains disabled until a complete XI is picked.
