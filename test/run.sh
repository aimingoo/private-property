# node library
FORCE=false;
if [[ ! -d './node_modules' ]] ||
   [[ "$1" == "-f" ]]; then
  mkdir node_modules 2>/dev/null
  FORCE=true;
fi

# install dependency
if $FORCE; then
  npm install fancy-test chai mocha --no-save

  # build prepack-core
  cd $(dirname "$0");
  if [[ ! -f "./prepack-core/prepack.min.js" ]]; then
    git clone -b proposal-private-property --recursive --depth 1 https://github.com/aimingoo/prepack-core prepack-tmp
    cd prepack-tmp 2>/dev/null
    npm install
    npm run build-repl && npm run build-bundle
    cd - 2>/dev/null
    mkdir prepack-core 2>/dev/null
    mv ./prepack-tmp/prepack.min.js ./prepack-core/
    rm -rf ./prepack-tmp
  fi
  cd - 2>/dev/null

  if [[ -f "./package-lock.json" ]]; then
    rm "./package-lock.json"
  fi
fi

# run
if [[ -d './test' ]]; then
  mocha
else
  mocha ./index.js
fi