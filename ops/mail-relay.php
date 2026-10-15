<?php
/**
 * RecruitConnect OneHR — mail relay
 * ----------------------------------------------------------------------------
 * Upload this file to your cPanel web root, e.g. as:
 *     https://www.rconehr.com/mail-relay.php
 *
 * It lets the API (hosted on Render, where outbound SMTP is blocked) send email
 * over HTTPS using your own cPanel mail server. No third-party service needed.
 *
 * SETUP
 *   1. Change RELAY_SECRET below to a long random string.
 *   2. Set the SAME value on Render as MAIL_RELAY_SECRET, and set
 *        MAIL_RELAY_URL = https://www.rconehr.com/mail-relay.php
 *      (optionally EMAIL_PROVIDER = relay)
 *   3. Redeploy the API, then test with POST /v1/admin/email/test {"to":"..."}
 */

// ---- Configuration ---------------------------------------------------------
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
if (!hash_equals(RELAY_SECRET, (string)$secret)) {
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

// Never let the relay send from someone else's domain.
if (!preg_match('/@rconehr\.com$/i', $from)) $from = FROM_EMAIL;

$boundary = '=_relay_' . bin2hex(random_bytes(10));
$headers = [
  'MIME-Version: 1.0',
  'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
  'From: ' . mb_encode_mimeheader($fromName, 'UTF-8') . ' <' . $from . '>',
  'Reply-To: ' . $from,
  'X-Mailer: OneHR-MailRelay',
];

$body  = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$text\r\n";
$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$html\r\n";
$body .= "--$boundary--";

// Envelope sender helps SPF alignment on the cPanel mail server.
$ok = @mail($to, $subject, $body, implode("\r\n", $headers), '-f' . $from);

if (!$ok) {
  fail(502, 'local mailer rejected the message');
}

echo json_encode(['success' => true, 'messageId' => 'relay-' . uniqid()]);
