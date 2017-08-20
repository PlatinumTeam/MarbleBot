Full list of commands the client will send:
IDENTIFY <username ...>
RELOGIN
VERIFY <version> <password ...>
KEY <key ...>
CHAT <destination> <message ...>
LOCATION <location>
USERLIST
PONG <data ...>
PING <data ...>
SESSION <session ...>
TRACK <tracking info ...>
GUITRACK <tracking info ...>
LEVELUP <level>
TASKCOMPLETE <task name>
ACHIEVEMENT <achievement name>
MASTERY <level>
PRESTIGEUP <level>
FRIEND <username>
FRIENDDEL <username>
FRIENDLIST
BLOCK <username>
UNBLOCK <username>
ACCEPTTOS
ICESHARDACHIEVEMENT

Full list of commands the server will send:
INVALID
ACCEPTTOS
LOGGED
IDENTIFY <status>
PING <data ...>
PONG <data ...>
PINGTIME <time>
INFO <type> <data ...>
STATUS <number> <display>
COLOR <identifier> <hex>
FLAIR <icon>
CHAT <username> <display name> <destination> <access> <message ...>
NOTIFY <type> <access> <username> <display name> <message ...>
USER <type> [data ...]
FRIEND <type> [data ...]
BLOCK <type> [data ...]