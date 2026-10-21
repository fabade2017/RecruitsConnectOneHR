#!/bin/bash
# Verify the live deployment: frontend on Qservers/cPanel, API on Render.
# Run from the repo root: ./scripts/check-deploy.sh
#
#   ./scripts/check-deploy.sh                     # test through public DNS
#   ./scripts/check-deploy.sh --ip 198.51.100.10  # test straight at the cPanel
#                                                 # server, DNS bypassed
#                                                 # (use while the registrar
#                                                 #  hold is still on)
#   ./scripts/check-deploy.sh --port 3000 --no-dns --no-tls
#                                                 # test the local static preview
set -uo pipefail

HOST=${HOST:-www.rconehr.com}
APEX=${APEX:-rconehr.com}
MAIL_HOST=${MAIL_HOST:-mail.rconehr.com}
SCHEME=${SCHEME:-https}
API=${API:-https://recruits-connect-one-hr-api.onrender.com/v1}
CPANEL_IP=""
PORT=""
CHECK_DNS=1
CHECK_TLS=1
STATIC=0

while [ $# -gt 0 ]; do
  case "$1" in
    --ip) CPANEL_IP=${2:-}; shift 2 ;;
    --port) PORT=${2:-}; shift 2 ;;
    --no-dns) CHECK_DNS=0; shift ;;
    --no-tls) CHECK_TLS=0; shift ;;
    --static) STATIC=1; shift ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

case "$PORT" in
  "") ;;
  :*) ;;
  *) PORT=":$PORT" ;;
esac

BASE="$SCHEME://$HOST$PORT"
if [ -n "$CPANEL_IP" ]; then
  CURL=(curl -sS --max-time 25 --resolve "$HOST:443:$CPANEL_IP" --resolve "$APEX:443:$CPANEL_IP")
else
  CURL=(curl -sS --max-time 25)
fi

PASSED=0
FAILED=0
ok()    { printf '  \033[32mok  \033[0m %s\n' "$1"; PASSED=$((PASSED+1)); }
bad()   { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAILED=$((FAILED+1)); }
warn()  { printf '  \033[33mwarn\033[0m %s\n' "$1"; }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

status() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$1" 2>/dev/null; }
body()   { "${CURL[@]}" "$1" 2>/dev/null; }

# ---------------------------------------------------------------- DNS
head_ "DNS"
if [ "$CHECK_DNS" -eq 0 ]; then
  warn "skipped"
elif [ -n "$CPANEL_IP" ]; then
  warn "skipped (testing against $CPANEL_IP directly)"
else
  for d in "$APEX" "$HOST" "$MAIL_HOST"; do
    ip=$(dig +short "$d" A @1.1.1.1 2>/dev/null | tail -1)
    if [ -z "$ip" ]; then
      bad "$d does not resolve"
    elif [ "$ip" = "127.0.0.1" ]; then
      bad "$d -> 127.0.0.1  (registrar hold still on: verify the Gransy registrant email)"
    else
      ok "$d -> $ip"
    fi
  done
fi

# ---------------------------------------------------------------- TLS
head_ "TLS"
if [ "$CHECK_TLS" -eq 0 ]; then
  warn "skipped"
else
  if [ -n "$CPANEL_IP" ]; then
    tls_target=$CPANEL_IP
  else
    tls_target=$HOST
  fi
  cert=$(echo | openssl s_client -connect "$tls_target:443" -servername "$HOST" 2>/dev/null \
          | openssl x509 2>/dev/null)
  if [ -z "$cert" ]; then
    bad "no certificate for $HOST on $tls_target:443"
  else
    ok "certificate presented"
    echo "$cert" | openssl x509 -noout -subject -issuer -enddate -ext subjectAltName 2>/dev/null | sed 's/^/       /'
    if echo "$cert" | openssl x509 -noout -ext subjectAltName 2>/dev/null | grep -qiE "DNS:.*($APEX|$HOST)"; then
      ok "certificate covers $APEX / $HOST"
    else
      bad "certificate does not cover $APEX / $HOST"
    fi
    if echo "$cert" | openssl x509 -checkend 604800 -noout >/dev/null 2>&1; then
      ok "certificate valid for more than 7 days"
    else
      bad "certificate expires within 7 days (or is already expired)"
    fi
  fi
fi

# ---------------------------------------------------------------- pages
head_ "Pages"
for p in "/" "/about/" "/contact/" "/industries/" "/industries/hospitals/" \
         "/login/" "/employee-login/" "/register/" "/onboard/" "/face-enroll/"; do
  code=$(status "$BASE$p")
  if [ "$code" = "200" ]; then ok "$p -> 200"; else bad "$p -> ${code:-no response}"; fi
done

code=$(status "$BASE/face-enroll/test-employee-id/")
if [ "$code" = "200" ]; then
  ok "/face-enroll/<id>/ -> 200 (.htaccess rewrite to the placeholder)"
else
  bad "/face-enroll/<id>/ -> ${code:-no response} (.htaccess rewrite missing?)"
fi

code=$(status "$BASE/this-page-does-not-exist-xyz/")
if [ "$code" = "404" ]; then ok "unknown path -> 404"; else bad "unknown path -> ${code:-no response} (expected 404)"; fi

# ---------------------------------------------------------------- relay
head_ "Mail relay"
if [ "$STATIC" -eq 1 ]; then
  warn "static host — PHP and the Apache dotfile rules are not exercised"
fi
code=$(status "$BASE/mail-relay.php")
relay=$(body "$BASE/mail-relay.php")
if echo "$relay" | grep -q '<?php'; then
  if [ "$STATIC" -eq 1 ]; then
    warn "/mail-relay.php served as source (expected on a host without PHP)"
  else
    bad "/mail-relay.php is served as source (PHP not executing) — check that the file is in public_html"
  fi
elif [ "$code" = "405" ] || [ "$code" = "200" ]; then
  ok "/mail-relay.php -> $code, PHP executed (not source)"
else
  bad "/mail-relay.php -> ${code:-no response}"
fi

code=$(status "$BASE/.htaccess")
if [ "$code" = "403" ] || [ "$code" = "404" ]; then
  ok "/.htaccess -> $code (not downloadable)"
elif [ "$STATIC" -eq 1 ]; then
  warn "/.htaccess -> $code (static host, no Apache dotfile rule)"
else
  bad "/.htaccess -> ${code:-no response} (should be blocked)"
fi

code=$(status "$BASE/.relay-secret")
if [ "$code" = "403" ] || [ "$code" = "404" ]; then
  ok "/.relay-secret -> $code (not downloadable)"
elif [ "$STATIC" -eq 1 ]; then
  warn "/.relay-secret -> $code (static host, no Apache dotfile rule)"
else
  bad "/.relay-secret -> ${code:-no response} (SECRET LEAKED — move it above public_html)"
fi

code=$("${CURL[@]}" -o /dev/null -w '%{http_code}' -X POST "$BASE/mail-relay.php" \
         -H 'Content-Type: application/json' -d '{"to":"probe@example.com"}' 2>/dev/null)
case "$code" in
  401) ok "relay secret is configured (unauthenticated POST -> 401)" ;;
  500) warn "relay secret NOT configured: create .relay-secret above public_html (see DEPLOY.md)" ;;
  *)   warn "relay POST without a secret -> $code" ;;
esac

# ---------------------------------------------------------------- api
head_ "API (Render)"
code=$(status "$API/health")
if [ "$code" = "200" ]; then ok "$API/health -> 200"; else bad "$API/health -> ${code:-no response}"; fi

# ---------------------------------------------------------------- summary
printf '\n\033[1m%s\033[0m\n' "----------------------------------------"
printf 'passed: %s   failed: %s\n' "$PASSED" "$FAILED"
if [ "$FAILED" -gt 0 ]; then
  printf '\033[31mdeployment is NOT ready\033[0m\n'
  exit 1
fi
printf '\033[32mdeployment looks good\033[0m\n'
