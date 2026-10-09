# Code Execution Engine Setup (Judge0 Integration)

CodeVerse requires an isolated sandbox runner to execute student code. Arbitrary student code is NEVER executed on the application server or within the database.

## Architecture

```
[Learner Monaco Editor]
         |
         | (Code submission with exercise_id)
         v
[Supabase Edge Function: /submit-code]
         |
         | 1. Authenticate user JWT
         | 2. Fetch private test cases from Postgres
         | 3. Submit code & input to Judge0 API
         v
[Judge0 Execution Engine]
         |
         | Compiles & runs code in isolated cgroup/Docker sandbox
         v
[Supabase Edge Function]
         |
         | 4. Compare outputs & determine pass/fail
         | 5. Record result in public.coding_submissions
         | 6. Award XP & update streak if passed
         v
[Learner Realtime UI]
```

## Language Runner IDs (Judge0 CE / RapidAPI)

| Language | Judge0 ID | Compiler / Runtime |
|----------|-----------|--------------------|
| C++ | 54 / 105 | GCC 9.2.0 / GCC 13 |
| Python | 71 / 100 | Python 3.8.1 / 3.11 |
| Java | 62 / 91 | OpenJDK 13.0.1 / OpenJDK 17 |
| C | 50 | GCC 9.2.0 |
| TypeScript | 74 | Node.js 18 / TS 4.9 |
| JavaScript | 63 | Node.js 18 |
| Rust | 73 | Rust 1.40+ |
| Go | 60 | Go 1.13+ |

## Execution Safety Parameters

Every execution request enforces strict resource boundaries:
- **CPU Time Limit**: 2.0 seconds
- **Wall Time Limit**: 5.0 seconds
- **Memory Limit**: 128,000 KB (128 MB)
- **Max Output Size**: 10,000 bytes
- **Network Access in Runner**: Disabled
- **File System**: Ephemeral and sandboxed
