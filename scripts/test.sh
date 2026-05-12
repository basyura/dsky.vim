#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

cd "$ROOT_DIR"
vim -Nu NONE -n -es -S tests/vim/util_str_test.vim
vim -Nu NONE -n -es -S tests/vim/buffer_test.vim

cd "$ROOT_DIR/denops/dsky"
deno task test
