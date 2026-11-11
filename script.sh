git filter-branch --env-filter '
ANCIEN_EMAIL="61797847+DanameKOLANI@users.noreply.github.com"
VOTRE_NOM="b-kolani"
VOTRE_EMAIL="biman.kolani97@gmail.com"

if [ "$GIT_COMMITTER_EMAIL" = "$ANCIEN_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$VOTRE_NOM"
    export GIT_COMMITTER_EMAIL="$VOTRE_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$ANCIEN_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$VOTRE_NOM"
    export GIT_AUTHOR_EMAIL="$VOTRE_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
