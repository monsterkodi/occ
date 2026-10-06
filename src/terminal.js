import { openSync, readSync, closeSync } from "node:fs"

function readLineFromTty() {
  const fd = openSync("/dev/tty", "r")
  const buffer = Buffer.alloc(1024)
  let line = ""
  try {
    while (true) {
      const read = readSync(fd, buffer, 0, buffer.length, null)
      if (read === 0) break
      line += buffer.toString("utf8", 0, read)
      if (line.includes("\n")) break
    }
  } finally {
    closeSync(fd)
  }
  return line.split("\n")[0] ?? ""
}

export function createTerminal(out = process.stdout, interactive = Boolean(process.stdin.isTTY)) {
  return {
    interactive,
    write: (text) => out.write(text),
    readAnswer: () => readLineFromTty(),
  }
}
