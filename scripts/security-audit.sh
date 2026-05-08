#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

failures=0
OPENAI_SECRET_NAME="OPENAI_""API_KEY"

EXCLUDES=(
  --exclude-dir=.git
  --exclude-dir=node_modules
  --exclude-dir=dist
  --exclude-dir=build
  --exclude-dir=.expo
  --exclude-dir=server/node_modules
  --exclude-dir=server/dist
  --exclude=package-lock.json
)

MOBILE_PATHS=(
  App.js
  app.config.js
  app.json
  babel.config.js
  index.js
  metro.config.js
  src
)

report_failure() {
  local title="$1"
  local files="$2"

  if [[ -n "$files" ]]; then
    failures=$((failures + 1))
    printf "\n[FAIL] %s\n" "$title"
    printf "%s\n" "$files" | sed "s#^#  - #"
  fi
}

scan_paths() {
  local pattern="$1"
  shift

  grep -RIlE "${EXCLUDES[@]}" "$pattern" "$@" 2>/dev/null || true
}

scan_repo() {
  local pattern="$1"

  grep -RIlE "${EXCLUDES[@]}" "$pattern" . 2>/dev/null || true
}

report_failure \
  "GROQ_API_KEY referenced in mobile app files" \
  "$(scan_paths "GROQ_API_KEY" "${MOBILE_PATHS[@]}")"

report_failure \
  "OpenAI API key referenced in repository files" \
  "$(scan_repo "$OPENAI_SECRET_NAME")"

report_failure \
  "FIREBASE_PRIVATE_KEY referenced in mobile app files" \
  "$(scan_paths "FIREBASE_PRIVATE_KEY" "${MOBILE_PATHS[@]}")"

report_failure \
  "Hardcoded OpenAI-style sk- key found" \
  "$(scan_repo "sk-[A-Za-z0-9_-]{20,}")"

report_failure \
  "Authorization header appears to be logged" \
  "$(scan_repo "console\\.(log|info|warn|error).*([Aa]uthorization)|([Aa]uthorization).*console\\.(log|info|warn|error)")"

report_failure \
  "Resume text appears to be logged" \
  "$(scan_repo "console\\.(log|info|warn|error).*(resumeText|resume text|resume_text)")"

report_failure \
  "User answer text appears to be logged" \
  "$(scan_repo "console\\.(log|info|warn|error).*(userAnswer|interviewAnswer|answerText|answer text)")"

report_failure \
  "Firebase rules contain public read/write access" \
  "$(grep -IlE "allow[[:space:]]+read,[[:space:]]*write:[[:space:]]*if[[:space:]]+true" ./*.rules 2>/dev/null || true)"

if [[ "$failures" -gt 0 ]]; then
  printf "\nSecurity audit failed with %s issue group(s).\n" "$failures"
  exit 1
fi

printf "Security audit passed.\n"
