const HOME_SUFFIXES = [
  "/.local/bin/expert",
  "/.local/bin/start_expert",
  "/bin/expert",
  "/bin/start_expert",
];

const SYSTEM_PATHS = [
  "/opt/homebrew/bin/expert",
  "/opt/homebrew/bin/start_expert",
  "/usr/local/bin/expert",
  "/usr/local/bin/start_expert",
];

const MANAGED_SUBDIR = ".local/share/nova-elixir-ls";

function home(): string | null {
  return nova.environment["HOME"] || null;
}

export function managedExpertPath(): string | null {
  const h = home();
  return h ? nova.path.join(h, MANAGED_SUBDIR, "expert") : null;
}

// Older versions installed inside Nova's container. Keep finding that binary
// so users who upgraded don't get prompted to reinstall.
function legacyManagedExpertPath(): string {
  return nova.path.join(nova.extension.globalStoragePath, "expert");
}

function isExecutable(path: string | null): boolean {
  if (!path) return false;
  try {
    return nova.fs.access(path, nova.fs.F_OK | nova.fs.X_OK);
  } catch {
    return false;
  }
}

export function findExpertBinary(configuredPath: string): string | null {
  const trimmed = (configuredPath || "").trim();
  if (trimmed) {
    return isExecutable(trimmed) ? trimmed : null;
  }

  const candidates: (string | null)[] = [managedExpertPath(), legacyManagedExpertPath()];

  const h = home();
  if (h) {
    for (const suffix of HOME_SUFFIXES) {
      candidates.push(h + suffix);
    }
  }
  candidates.push(...SYSTEM_PATHS);

  for (const candidate of candidates) {
    if (isExecutable(candidate)) return candidate;
  }
  return null;
}

function detectArchAsset(): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = new Process("/usr/bin/uname", { args: ["-m"], stdio: "pipe" });
    let out = "";
    proc.onStdout((line) => (out += line));
    proc.onDidExit((status) => {
      if (status !== 0) {
        reject(new Error(`uname -m exited with status ${status}`));
        return;
      }
      const arch = out.trim();
      if (arch === "arm64" || arch === "aarch64") {
        resolve("expert_darwin_arm64");
      } else if (arch === "x86_64") {
        resolve("expert_darwin_amd64");
      } else {
        reject(new Error(`Unsupported architecture: ${arch}`));
      }
    });
    proc.start();
  });
}

function runShell(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = new Process(command, { args, stdio: "pipe" });
    let stderr = "";
    proc.onStderr((line) => (stderr += line));
    proc.onDidExit((status) => {
      if (status === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with status ${status}: ${stderr.trim()}`));
      }
    });
    proc.start();
  });
}

// xattr fails when the attribute isn't present; that's fine and we ignore it.
function tryStripQuarantine(path: string): Promise<void> {
  return new Promise((resolve) => {
    const proc = new Process("/usr/bin/xattr", {
      args: ["-d", "com.apple.quarantine", path],
      stdio: "pipe",
    });
    proc.onDidExit(() => resolve());
    proc.start();
  });
}

export async function installExpert(): Promise<string> {
  const destPath = managedExpertPath();
  if (!destPath) {
    throw new Error("Could not determine home directory for Expert install location.");
  }
  const destDir = nova.path.dirname(destPath);
  const asset = await detectArchAsset();
  const url = `https://github.com/expert-lsp/expert/releases/latest/download/${asset}`;

  await runShell("/bin/mkdir", ["-p", destDir]);
  await runShell("/usr/bin/curl", ["-fSL", "--retry", "2", "-o", destPath, url]);
  await runShell("/bin/chmod", ["+x", destPath]);
  await tryStripQuarantine(destPath);

  return destPath;
}
