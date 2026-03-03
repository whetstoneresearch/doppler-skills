const minimumVersion = [1, 3, 8] as const;
const currentVersion = Bun.version;

function parseVersion(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isAtLeast(
  current: [number, number, number],
  minimum: readonly [number, number, number],
): boolean {
  for (let i = 0; i < 3; i++) {
    if (current[i] > minimum[i]) {
      return true;
    }

    if (current[i] < minimum[i]) {
      return false;
    }
  }

  return true;
}

const parsedCurrent = parseVersion(currentVersion);
const minimumLabel = minimumVersion.join(".");

if (!parsedCurrent) {
  console.error(`Unable to parse Bun version string: ${currentVersion}`);
  process.exit(1);
}

if (!isAtLeast(parsedCurrent, minimumVersion)) {
  console.error(`Expected Bun >= ${minimumLabel} but found ${currentVersion}.`);
  process.exit(1);
}

console.log(`Using Bun ${currentVersion} (minimum ${minimumLabel}).`);
