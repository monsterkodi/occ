# occ

list, dump and delete opencode v2 sessions

    occ ls [sess...]        print session table
    occ cat [sess...]       show session conversation
    occ log [sess...]       show session history including tool calls
    occ shell [sess...]     show shell commands with their output
    occ resume sess         resume a session in opencode
    occ del sess [sess...]  delete sessions, asks for confirmation

session table columns: id datetime minutes turns title

## Example

![example](img/example.png)

## Install

    git clone https://github.com:monsterkodi/occ.git
