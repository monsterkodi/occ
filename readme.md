# occ

list, dump and delete opencode v2 sessions

    occ ls [id...]        print session table
    occ cat [id...]       show session conversation
    occ log [id...]       show session history including tool calls
    occ shell [id...]     show shell commands with their output
    occ del id [id...]    delete sessions, asks for confirmation

session table columns: id datetime minutes turns title

## Example

![example](img/example.png)

## Install

    git clone https://github.com:monsterkodi/occ.git
