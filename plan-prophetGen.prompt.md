## Plan: TypeScript Express CSV Processing API

Scaffold a new Node.js + Express + TypeScript backend from scratch, implement CSV upload and validation, execute a Python processor, persist only successful runs in a JSON file, and provide list/delete APIs with best-effort file cleanup. The design uses deterministic timestamped filenames so uploaded CSV and generated PNG assets can be managed and deleted reliably.

**Steps**
1. Phase 1 - Project scaffolding
1. Initialize a Node.js project and install dependencies for API server, upload handling, process execution, filesystem operations, and TypeScript runtime/dev workflow.
2. Create base TypeScript configuration and scripts for dev/build/start.
3. Create initial folder structure for static assets and data storage.

2. Phase 2 - Core backend architecture (*depends on Phase 1*)
1. Create Express app bootstrap with JSON middleware, static file hosting for public assets, and centralized error handling.
2. Add environment/config module for constants: upload directory, results directory, DB path, max CSV size (10 MB), and Python script path scripts/blabla.py.
3. Add startup initializer to ensure required directories/files exist: public/upload, public/results, data, and operations JSON file.

3. Phase 3 - Data model and persistence (*depends on Phase 2*)
1. Define operation record shape with fields sufficient to list and delete resources later (id, baseName, timestamp token, csv filename/path, png filenames/paths, createdAt).
2. Implement JSON DB utility with safe read/write helpers and atomic-ish write strategy (write temp then rename) to reduce corruption risk.
3. Add service methods: list successful operations, add operation, remove operation by id.

4. Phase 4 - Upload and process workflow (*depends on Phases 2 and 3*)
1. Implement multipart upload middleware with single CSV field, extension/mime checks, and hard size limit 10 MB.
2. On upload request, derive sanitized base name + timestamp token, rename/move file to public/upload as name-YYYY-MM-DD-HH-mm-ss.csv.
3. Execute Python command with child_process using the saved CSV filename argument: python scripts/blabla.py name-YYYY-MM-DD-HH-mm-ss.csv.
4. Capture command result; if process returns error, respond with failure and do not persist DB entry.
5. If process succeeds, verify existence of exactly expected PNG outputs in public/results for that token (test1-..., test2-..., test3-...).
6. If all three files exist, persist operation record and return success payload; if not, return error and optionally clean partial outputs.

5. Phase 5 - REST endpoints (*depends on Phases 3 and 4*)
1. POST endpoint for CSV upload/process.
2. GET endpoint returning all successful operations from JSON DB.
3. DELETE endpoint by operation id with best-effort removal: delete CSV and PNGs if present, always remove DB entry if operation exists, and report missing files in response metadata if desired.

6. Phase 6 - Robustness and validation (*parallel with Phase 5 finishing work*)
1. Normalize API error responses for invalid file type, oversize upload, Python runtime errors, and missing generated files.
2. Add input validation and defensive checks for malformed DB file or stale file paths.
3. Add lightweight request logging for traceability.

7. Phase 7 - Verification (*depends on all previous phases*)
1. Run TypeScript compile and lint/type checks.
2. Manually validate endpoint flows: successful upload, invalid extension, oversize file, Python error path, missing PNG path, list operations, delete operation idempotence behavior.
3. Confirm static files are accessible under public routes and DB updates match successful/failed outcomes.

**Relevant files**
- /Users/gbodacs/Documents/code/prophet_gen/package.json - scripts and dependencies.
- /Users/gbodacs/Documents/code/prophet_gen/tsconfig.json - TypeScript compiler settings.
- /Users/gbodacs/Documents/code/prophet_gen/src/server.ts - app bootstrap and server start.
- /Users/gbodacs/Documents/code/prophet_gen/src/app.ts - middleware, routes, and error handling.
- /Users/gbodacs/Documents/code/prophet_gen/src/config.ts - runtime constants and paths.
- /Users/gbodacs/Documents/code/prophet_gen/src/routes/operations.routes.ts - upload/list/delete endpoints.
- /Users/gbodacs/Documents/code/prophet_gen/src/services/processor.service.ts - file rename logic, Python execution, PNG verification.
- /Users/gbodacs/Documents/code/prophet_gen/src/services/operations.service.ts - JSON DB CRUD operations.
- /Users/gbodacs/Documents/code/prophet_gen/src/lib/jsonDb.ts - read/write helpers for operations JSON.
- /Users/gbodacs/Documents/code/prophet_gen/src/types/operation.ts - operation type definitions.
- /Users/gbodacs/Documents/code/prophet_gen/data/operations.json - persistent successful operation records.
- /Users/gbodacs/Documents/code/prophet_gen/public/upload - uploaded CSV storage.
- /Users/gbodacs/Documents/code/prophet_gen/public/results - generated PNG storage.

**Verification**
1. Compile check: npm run build.
2. Dev runtime check: npm run dev and call APIs with a REST client.
3. Success scenario: upload valid CSV, confirm Python exits cleanly, verify three PNGs exist, confirm GET includes new record.
4. Failure scenario: force Python error and verify no DB insert.
5. Delete scenario: delete existing operation, confirm DB removal and file deletion attempt; repeat delete to confirm proper not-found handling.

**Decisions**
- Python script path: scripts/blabla.py.
- Max CSV size: 10 MB.
- JSON database path: data/operations.json.
- Delete behavior: best-effort file cleanup; remove DB entry even if some files are already missing.

**Further Considerations**
1. Filename token format recommendation: use local time with seconds and hyphen separators to avoid colon issues in filenames on some platforms.
2. Use operation id as the canonical delete key; keep filename/token fields as derived metadata for filesystem cleanup.
3. Optional enhancement later: queue long-running Python jobs if processing time grows beyond typical request timeout windows.
