# occ

Opencode sessions as plain text: list, dump and delete them. No dependencies;
reads the opencode database directly with `node:sqlite`.

    occ ls [id...]        session table
    occ cat [id...]       the conversation
    occ log [id...]       the conversation plus tool calls
    occ shell [id...]     just the shell calls and their output
    occ del id [id...]    delete, after a confirmation

## The table
    
     eea7f5  10-07 11:19      44     5  Conny - hypr
     eea4f7        12:20      52     5  Conny - hyprsession

`id` is the session id without its `ses_` prefix, `last` is when the session
last said something, `duration` is minutes since creation, `turns` counts user
messages that carry text. A row repeating the previous date blanks it, so the
hour stays in its column. No header: a header is one more line to scroll past.

## Finding sessions

An argument is tried as a session id prefix first, then as a fragment of the
title, so

    occ ls conny

prints every Conny session. Terms match case insensitively, mix freely, and a
session matched twice is listed once. A term matching nothing is an error, and
`occ del` refuses anything shorter than three characters, because one letter
matches a quarter of the history.

## Deleting

`del` is the only command that writes. It names the sessions it is about to
delete, needs a terminal to answer `ARE YOU SURE? (yN)` on, and opens the
database with foreign keys on so messages, pending state and instruction
entries cascade.

## Install

    git clone https://github.com:monsterkodi/occ.git
