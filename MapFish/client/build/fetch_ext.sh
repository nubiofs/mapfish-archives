#!/bin/sh
#
# This script is used to fetch the Ext library into MapFish/client/mfbase/ext
# Ext sources are then commited to svn, so this script is only needed when updating ext.

EXT_VER=ext-2.0-beta1
EXT_URL=http://extjs.com/deploy/$EXT_VER.zip

set -e

rm -rf ${EXT_VER}* >/dev/null 2>&1 || :

wget $EXT_URL

unzip $EXT_VER.zip

# XXX use svn remove instead?
rm -rf ../mfbase/ext
mkdir ../mfbase/ext

# XXX is enough to copy?
cp -r $EXT_VER/ext-* ../mfbase/ext
cp -r $EXT_VER/resources/ ../mfbase/ext
cp -r $EXT_VER/adapter/ ../mfbase/ext

rm -rf ${EXT_VER}* >/dev/null 2>&1 || :
