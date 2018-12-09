export function generateDownloadMessage(...args: string[]): string {
  let ans = "HibikiDownloadBot v1.0.0"; // Header
  for (const str of arguments) {
    ans += `\n${str}`;
  }
  return ans;
}
