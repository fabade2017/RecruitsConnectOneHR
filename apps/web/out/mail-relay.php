<?php
/**
 * RecruitConnect OneHR — mail relay
 * ----------------------------------------------------------------------------
 * Deployed automatically with the static site (apps/web/public/mail-relay.php
 * is copied into out/ at build time), i.e. live at:
 *     https://www.rconehr.com/mail-relay.php
 *
 * It lets the API (hosted on Render, where the app's SMTP is unavailable) send
 * email over HTTPS using your own cPanel mail server. No third-party service.
 *
 * SETUP (do this once)
 *   1. Create the secret (from your laptop):
 *        openssl rand -hex 32
 *   2. On Render (API service → Environment) set BOTH:
 *        MAIL_RELAY_URL    = https://www.rconehr.com/mail-relay.php
 *        MAIL_RELAY_SECRET = <the value from step 1>
 *      Redeploy the API.
 *   3. Create the secret file OUTSIDE the web root (preferred), i.e. one level
 *      above public_html (File Manager → Home, Show Dotfiles → New File
 *      `.relay-secret`). Next to this file also works — .htaccess blocks it —
 *      but outside the web root is safer. chmod 640.
 *      If you prefer, paste the secret into RELAY_SECRET below instead —
 *      but then re-apply it after every site re-upload.
 *   4. Test: POST /v1/admin/email/test {"to":"you@yourdomain.com"}
 *
 * Secret resolution order: .relay-secret file → RELAY_SECRET constant.
 * ---------------------------------------------------------------------------- */

const RELAY_SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';
const FROM_EMAIL   = 'supports@rconehr.com';
const FROM_NAME    = 'RecruitConnect OneHR';
// ----------------------------------------------------------------------------

header('Content-Type: application/json');

function fail($code, $msg) {
  http_response_code($code);
  echo json_encode(['success' => false, 'error' => $msg]);
  exit;
}

function relay_secret(): string {
  $candidates = [
    dirname(__DIR__) . '/.relay-secret', // outside the web root (preferred)
    __DIR__ . '/.relay-secret',          // next to this file (blocked by .htaccess)
  ];
  foreach ($candidates as $file) {
    if (is_readable($file)) {
      $v = trim((string)file_get_contents($file));
      if ($v !== '') return $v;
    }
  }
  return RELAY_SECRET;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  fail(405, 'POST only');
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) fail(400, 'invalid JSON');

// Shared secret — sent as X-Relay-Secret header (fallback: Bearer token).
$secret = $_SERVER['HTTP_X_RELAY_SECRET'] ?? '';
if ($secret === '' && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
  if (preg_match('/Bearer\s+(.+)/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) $secret = trim($m[1]);
}
$expected = relay_secret();
if ($expected === 'CHANGE_ME_TO_A_LONG_RANDOM_STRING') {
  fail(500, 'relay secret not configured — create .relay-secret next to this file (see header comment)');
}
if (!hash_equals($expected, (string)$secret)) {
  fail(401, 'unauthorized');
}

$to      = trim($data['to'] ?? '');
$subject = trim($data['subject'] ?? '');
$html    = (string)($data['html'] ?? '');
$text    = trim((string)($data['text'] ?? '')) ?: trim(strip_tags($html));
$from    = trim($data['from'] ?? FROM_EMAIL);
$fromName = trim($data['fromName'] ?? FROM_NAME);

if (!filter_var($to, FILTER_VALIDATE_EMAIL)) fail(400, 'invalid recipient');
if ($subject === '' || $html === '') fail(400, 'subject and html are required');

// ASCII-safe RFC 2047 encoded-word (no mbstring dependency).
function mime_encode_header(string $s): string {
  if ($s !== '' && preg_match('/^[\x20-\x7E]*$/', $s)) return $s;
  return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

// Never let the relay send from someone else's domain.
if (!preg_match('/@rconehr\.com$/i', $from)) $from = FROM_EMAIL;

try {
  // Strip CR/LF from header fields to prevent header injection.
  $subject  = str_replace(["\r", "\n"], '', $subject);
  $fromName = str_replace(["\r", "\n"], '', $fromName);

  $boundary = '=_relay_' . bin2hex(random_bytes(10));
  $headers = [
    'Date: ' . date('r'),
    'From: ' . (mime_encode_header($fromName) !== '' ? mime_encode_header($fromName) . ' ' : '') . '<' . $from . '>',
    'To: <' . $to . '>',
    'Subject: ' . mime_encode_header($subject),
    'Message-ID: <relay-' . bin2hex(random_bytes(8)) . '@' . (preg_match('/@([\w.-]+)$/', $from, $m) ? $m[1] : 'rconehr.com') . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    'Reply-To: ' . $from,
    'X-Mailer: OneHR-MailRelay',
  ];

  $body  = "--$boundary\r\n";
  $body .= "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$text\r\n";
  $body .= "--$boundary\r\n";
  $body .= "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$html\r\n";
  $body .= "--$boundary--";

  // Dot-stuffing per RFC 5321 (body lines starting with '.').
  $mime = implode("\r\n", $headers) . "\r\n\r\n" . preg_replace('/^\./m', '..', $body);
  $sent = false;
  $errors = [];

  // 1) Local SMTP (cPanel Exim on this same host). Works even when mail() is
  //    disabled by the host, and keeps delivery on your own mail server.
  foreach ([['127.0.0.1', 25], ['localhost', 25]] as [$host, $port]) {
    $errno = 0; $errstr = '';
    $fp = @fsockopen($host, $port, $errno, $errstr, 10);
    if (!$fp) { $errors[] = "connect $host:$port failed ($errstr)"; continue; }
    stream_set_timeout($fp, 20);
    $read = function () use ($fp) {
      $out = '';
      while (($line = fgets($fp, 2048)) !== false) {
        $out .= $line;
        if (strlen($line) < 4 || $line[3] === ' ') break;
      }
      return $out;
    };
    $cmd = function (string $c) use ($fp, $read) {
      fwrite($fp, $c . "\r\n");
      return $read();
    };

    $banner = $read();
    if (strpos($banner, '220') !== 0) { $errors[] = 'bad SMTP banner: ' . trim($banner); fclose($fp); continue; }
    $cmd('EHLO localhost');
    $r = $cmd('MAIL FROM:<' . $from . '>');
    if (strpos($r, '250') !== 0) { $errors[] = 'MAIL FROM: ' . trim($r); $cmd('QUIT'); fclose($fp); continue; }
    $r = $cmd('RCPT TO:<' . $to . '>');
    if (strpos($r, '250') !== 0 && strpos($r, '251') !== 0) { $errors[] = 'RCPT TO: ' . trim($r); $cmd('QUIT'); fclose($fp); continue; }
    $r = $cmd('DATA');
    if (strpos($r, '354') !== 0) { $errors[] = 'DATA: ' . trim($r); $cmd('QUIT'); fclose($fp); continue; }
    fwrite($fp, $mime . "\r\n.\r\n");
    $r = $read();
    $cmd('QUIT');
    fclose($fp);
    if (strpos($r, '250') === 0) { $sent = true; break; }
    $errors[] = 'message rejected: ' . trim($r);
  }

  // 2) Fallback: PHP mail() when the host allows it.
  if (!$sent && function_exists('mail')) {
    $ok = @mail($to, $subject, $body, implode("\r\n", $headers), '-f' . $from);
    if ($ok) {
      $sent = true;
    } else {
      $errors[] = 'PHP mail() rejected the message';
    }
  }

  if (!$sent) {
    fail(502, 'mail delivery failed: ' . implode(' | ', $errors));
  }

  echo json_encode(['success' => true, 'messageId' => 'relay-' . uniqid()]);
} catch (Throwable $e) {
  fail(500, 'relay internal error: ' . $e->getMessage());
}
