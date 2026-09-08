---
name: wsl-interop
description: |
  Use ONLY when a direct Windows .exe call from WSL FAILS or when explicitly asked about WSL-Windows interop. NEVER load proactively
  Provides a proven fallback chain, wslpath argument passing, and fix patterns.
---
# WSL -> Windows: Fallback & Troubleshooting

## Fallback Chain
When `tool.exe` fails, try in order until one works:

### 1. Rely on inherited PATH or use `where.exe` (Fastest)
WSL usually inherits the Windows PATH. If `tool.exe` fails, verify its existence using Windows native tools (DO NOT use Linux `find` on `/mnt/c` as it is extremely slow):
```bash
# Check if it's in the inherited PATH
which tool.exe 

# Or ask Windows to find it
cmd.exe /c "where tool.exe"
```

### 2. Absolute path (If known or found via where.exe)
Locate and call by full `/mnt/c/` path. Typical patterns:
```bash
/mnt/c/Windows/System32/.../tool.exe
"/mnt/c/Program Files/<Vendor>/tool.exe"
"/mnt/c/Users/$USER/AppData/Local/Programs/.../tool.exe"
```

### 3. cmd.exe wrapper
```bash
cmd.exe /c "tool.exe args"
```

### 4. pwsh.exe / powershell.exe (Final fallback)
```bash
powershell.exe -NoProfile -Command "..."
# or
pwsh.exe -NoProfile -Command "..."
```
*Note: Always use `-NoProfile` to prevent slow loading and output pollution.*

## Path Arguments to Windows Tools
When passing Linux paths to Windows tools, you MUST convert them and quote them:
```bash
WINPATH="$(wslpath -w "$WSL_PATH")"
tool.exe "$WINPATH"
```

## msys2 / MinGW Toolchains (Critical)
**Never** call msys2 `.exe` (like `gcc.exe`, `make.exe` in msys2) directly from WSL bash — they will fail with DLL errors. You must invoke them through msys2's bash:
```bash
/mnt/c/msys64/usr/bin/bash.exe -lc "gcc --version"
```
*Inside msys2 bash, use `/c/` instead of `/mnt/c/`.*

## Pitfalls to Avoid
- **Spaces in paths**: Always wrap `/mnt/c/Program Files/...` in double quotes.
- **PATH stale**: If a newly installed Windows tool isn't found, the WSL PATH might be stale. Suggest user to run `wsl.exe --shutdown` and restart.
- **Loop overhead**: If calling Windows tools in a loop, batch the work into a single `cmd.exe /c` or `pwsh.exe` script to avoid massive interop overhead.
