# occ

Opencode sessions as plain text: list, dump and delete them. No dependencies;
reads the opencode database directly with `node:sqlite`.

    occ ls [id...]        session table
    occ cat [id...]       the conversation
    occ log [id...]       the conversation plus tool calls
    occ shell [id...]     just the shell calls and their output
    occ del id [id...]    delete, after a confirmation

## Example

![example](img/example.png)

## Deleting

`del` is the only command that writes. It names the sessions it is about to
delete, needs a terminal to answer `ARE YOU SURE? (yN)` on.

## Install

    git clone https://github.com:monsterkodi/occ.git
