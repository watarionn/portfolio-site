# Original Tool Migration Notes

## Original behavior retained

The original tool:

1. loaded a target-name list
2. fetched the bucket root folder list once
3. matched folders using a numeric-prefix + target-name pattern
4. listed files for matched folders in parallel
5. extracted YYYYMMDD from file names
6. sorted by that date and selected the latest N entries
7. wrote a TSV report

Phase 1 retains this operational model.

## Deliberately removed from the public design

The original package contained environment-specific defaults and real operational input/output data.

Those values are not copied into this project.

- no real bucket name
- no real S3 Browser account name
- no real target list
- no historical result TSV
- no AWS credentials

Only neutral example values are included.

## Behavioral changes

- invalid YYYYMMDD tokens are skipped in favor of the next valid date token
- duplicate targets are deduplicated and recorded in the JSON summary
- missing folders and empty folders become explicit result rows
- provider failures become explicit result rows
- provider process timeout is enforced
- both TSV and JSON are produced
- strict mode can fail scheduled/monthly operations when audit problems exist
