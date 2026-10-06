#!/usr/bin/env node
import { resolveDbPath, openDb } from "./src/db.js"
import { createColor } from "./src/render.js"
import { ls } from "./src/ls.js"
import { cat } from "./src/cat.js"
import { log } from "./src/log.js"
import { shell } from "./src/shell.js"
import { OclsError } from "./src/db.js"

const HELP = `
ocls - list, dump and modify opencode v2 sessions

usage:
  ocls -h|--help         print this help text
  ocls ls [id...]        print session table
  ocls cat [id...]       show session conversation
  ocls log [id...]       show session history including tool calls
  ocls shell [id...]     show shell commands with their output

session table columns: id start duration turns name
`

const COMMANDS = {
  ls,
  cat,
  log,
  shell,
}

function usage() {
  return HELP.trim()
}

function main(argv) {
  const [command, ...ids] = argv

  if (!command || command === "-h" || command === "--help" || command === "help") {
    process.stdout.write(usage() + "\n")
    return 0
  }

  const handler = COMMANDS[command]
  if (!handler) {
    process.stderr.write(`unknown command "${command}"\n\n${usage()}\n`)
    return 1
  }

  const db = openDb(resolveDbPath())
  try {
    const width = process.stdout.columns || 80
    const color = createColor(
      Boolean(process.stdout.isTTY) && !process.env.NO_COLOR,
    )
    const out = handler({ db, prefixes: ids, width, color })
    if (out) process.stdout.write(out + "\n")
    return 0
  } finally {
    db.close()
  }
}

try {
  process.exitCode = main(process.argv.slice(2))
} catch (e) {
  if (e instanceof OclsError) {
    process.stderr.write(`ocls: ${e.message}\n`)
    process.exitCode = 1
  } else {
    throw e
  }
}
