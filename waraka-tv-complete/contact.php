<?php
/**
 * WARAKA TV – Contact Page
 * File: contact.php (in website root)
 */
require_once 'includes/config.php';

$formSent = false;
$errors   = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Security check failed. Please refresh and try again.';
    } else {
        $fullName = trim(strip_tags($_POST['full_name'] ?? ''));
        $email    = trim($_POST['email']   ?? '');
        $phone    = trim($_POST['phone']   ?? '');
        $subject  = trim(strip_tags($_POST['subject']  ?? ''));
        $message  = trim(strip_tags($_POST['message']  ?? ''));

        if (empty($fullName) || strlen($fullName) < 2) $errors[] = 'Full name is required.';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email address is required.';
        if (empty($subject) || strlen($subject) < 5)    $errors[] = 'Subject must be at least 5 characters.';
        if (empty($message) || strlen($message) < 20)   $errors[] = 'Message must be at least 20 characters.';

        // Basic spam honeypot
        if (!empty($_POST['website'])) {
            // Silent fail – spam bot
            $formSent = true;
        }

        if (empty($errors) && !$formSent) {
            $db   = Database::getInstance();
            $stmt = $db->prepare("INSERT INTO contact_messages (full_name, email, phone, subject, message, ip_address)
                                  VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $fullName, $email, $phone, $subject, $message,
                $_SERVER['REMOTE_ADDR'] ?? ''
            ]);

            // Send notification email to admin
            $headers  = "From: {$fullName} <{$email}>\r\nReply-To: {$email}\r\nContent-Type: text/plain; charset=UTF-8\r\n";
            $mailBody = "New contact message from WARAKA TV website.\n\n";
            $mailBody .= "Name: {$fullName}\nEmail: {$email}\nPhone: {$phone}\n\nSubject: {$subject}\n\nMessage:\n{$message}";
            @mail(ADMIN_EMAIL, "[WARAKA TV] " . $subject, $mailBody, $headers);

            $formSent = true;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Contact Us – WARAKA TV</title>
  <meta name="description" content="Get in touch with the WARAKA TV team. Contact our newsroom, advertising desk, or technical support." />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    :root { --red:#E8001D; --dark:#111; --card:#181818; --border:#2A2A2A; --text:#E8E8E8; --muted:#888; }
    body { background:#0A0A0A; color:var(--text); font-family:'DM Sans',sans-serif; }
    .form-control-dark, .form-select-dark { background:#111; border:1px solid #2A2A2A; color:#E8E8E8; border-radius:6px; padding:12px 16px; width:100%; }
    .form-control-dark:focus, .form-select-dark:focus { background:#111; border-color:#E8001D; color:#E8E8E8; box-shadow:0 0 0 3px rgba(232,0,29,0.15); outline:none; }
    .form-control-dark::placeholder { color:#555; }
    .form-label { color:#888; font-size:0.82rem; margin-bottom:6px; }
    .btn-submit { background:#E8001D; color:#fff; border:none; padding:14px 32px; border-radius:6px; font-weight:600; font-size:0.9rem; cursor:pointer; transition:background 0.2s; }
    .btn-submit:hover { background:#B5001A; }
    .contact-info-item { display:flex; gap:14px; margin-bottom:24px; }
    .contact-icon { width:44px; height:44px; background:rgba(232,0,29,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; color:var(--red); flex-shrink:0; }
    .page-header { background:#111; border-bottom:1px solid #2A2A2A; padding:60px 0; text-align:center; }
  </style>
</head>
<body>
  <?php include 'includes/header.php'; // Reuse your main site header ?>

  <div class="page-header">
    <h1 class="font-display" style="font-family:'Playfair Display',serif;color:#fff;font-size:2.5rem;">Contact Us</h1>
    <p style="color:#888;margin-top:8px;">We'd love to hear from you. Our team is available 24/7.</p>
  </div>

  <div class="container" style="padding:70px 16px;">
    <div class="row g-5">

      <!-- Contact Form -->
      <div class="col-lg-7">
        <h2 style="font-family:'Playfair Display',serif;color:#fff;font-size:1.6rem;margin-bottom:24px;">Send Us a Message</h2>

        <?php if ($formSent): ?>
          <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#22C55E;border-radius:8px;padding:20px;text-align:center;">
            <i class="bi bi-check-circle-fill" style="font-size:2rem;"></i>
            <h4 style="margin-top:12px;">Message Received!</h4>
            <p style="color:#888;margin:8px 0 0;">Thank you for reaching out. We'll get back to you within 24–48 hours.</p>
          </div>

        <?php else: ?>
          <?php if ($errors): ?>
            <div style="background:rgba(232,0,29,0.1);border:1px solid rgba(232,0,29,0.3);color:#ff6b6b;border-radius:6px;padding:14px;margin-bottom:16px;">
              <?php foreach ($errors as $e): ?><div><i class="bi bi-exclamation-circle me-2"></i><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
            </div>
          <?php endif; ?>

          <form method="POST" action="" novalidate>
            <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>" />
            <!-- Honeypot field (hidden from real users, spam bots fill it) -->
            <input type="text" name="website" style="display:none;" tabindex="-1" autocomplete="off" />

            <div class="row g-3 mb-3">
              <div class="col-sm-6">
                <label class="form-label">Full Name *</label>
                <input type="text" name="full_name" class="form-control-dark" placeholder="Your full name"
                       value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>" required />
              </div>
              <div class="col-sm-6">
                <label class="form-label">Email Address *</label>
                <input type="email" name="email" class="form-control-dark" placeholder="your@email.com"
                       value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required />
              </div>
            </div>
            <div class="row g-3 mb-3">
              <div class="col-sm-6">
                <label class="form-label">Phone Number</label>
                <input type="tel" name="phone" class="form-control-dark" placeholder="+234 800 000 0000"
                       value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>" />
              </div>
              <div class="col-sm-6">
                <label class="form-label">Subject *</label>
                <select name="subject" class="form-control-dark form-select-dark">
                  <option value="">Select a subject...</option>
                  <option value="General Inquiry" <?= ($_POST['subject'] ?? '') === 'General Inquiry' ? 'selected' : '' ?>>General Inquiry</option>
                  <option value="News Tip" <?= ($_POST['subject'] ?? '') === 'News Tip' ? 'selected' : '' ?>>News Tip / Press Release</option>
                  <option value="Advertising" <?= ($_POST['subject'] ?? '') === 'Advertising' ? 'selected' : '' ?>>Advertising & Partnerships</option>
                  <option value="Technical Issue" <?= ($_POST['subject'] ?? '') === 'Technical Issue' ? 'selected' : '' ?>>Technical Issue</option>
                  <option value="Correction" <?= ($_POST['subject'] ?? '') === 'Correction' ? 'selected' : '' ?>>Content Correction</option>
                  <option value="Other" <?= ($_POST['subject'] ?? '') === 'Other' ? 'selected' : '' ?>>Other</option>
                </select>
              </div>
            </div>
            <div class="mb-4">
              <label class="form-label">Your Message *</label>
              <textarea name="message" class="form-control-dark" rows="6"
                        placeholder="Write your message here..."><?= htmlspecialchars($_POST['message'] ?? '') ?></textarea>
            </div>
            <button type="submit" class="btn-submit">
              <i class="bi bi-send me-2"></i>Send Message
            </button>
          </form>
        <?php endif; ?>
      </div>

      <!-- Contact Info -->
      <div class="col-lg-5">
        <div style="background:#181818;border:1px solid #2A2A2A;border-radius:10px;padding:32px;">
          <h3 style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#fff;margin-bottom:28px;">Contact Information</h3>

          <div class="contact-info-item">
            <div class="contact-icon"><i class="bi bi-geo-alt-fill"></i></div>
            <div>
              <strong style="color:#fff;display:block;margin-bottom:3px;">Address</strong>
              <span style="color:#888;font-size:0.88rem;">Plot 14, Media Centre Road, Wuse Zone 2,<br>Abuja, FCT, Nigeria</span>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon"><i class="bi bi-telephone-fill"></i></div>
            <div>
              <strong style="color:#fff;display:block;margin-bottom:3px;">Phone</strong>
              <a href="tel:+2349133106798" style="color:#888;font-size:0.88rem;text-decoration:none;">+234 913 310 6798</a>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon"><i class="bi bi-envelope-fill"></i></div>
            <div>
              <strong style="color:#fff;display:block;margin-bottom:3px;">Newsroom</strong>
              <a href="mailto:warakatv1122@gmail.com" style="color:#888;font-size:0.88rem;text-decoration:none;">waratv1122@gmail.com</a>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon"><i class="bi bi-megaphone-fill"></i></div>
            <div>
              <strong style="color:#fff;display:block;margin-bottom:3px;">Advertising</strong>
              <a href="mailto:adverts@warakatv.ng" style="color:#888;font-size:0.88rem;text-decoration:none;">adverts@warakatv.ng</a>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon"><i class="bi bi-clock-fill"></i></div>
            <div>
              <strong style="color:#fff;display:block;margin-bottom:3px;">Hours</strong>
              <span style="color:#888;font-size:0.88rem;">Newsroom: 24/7<br>Office: Mon–Fri, 8AM–6PM</span>
            </div>
          </div>

          <hr style="border-color:#2A2A2A;margin:24px 0;" />
          <strong style="color:#fff;font-size:0.85rem;display:block;margin-bottom:14px;">Follow WARAKA TV</strong>
          <div style="display:flex;gap:10px;">
            <?php foreach (['facebook','twitter-x','youtube','instagram','whatsapp','telegram'] as $sn): ?>
            <a href="#" style="width:36px;height:36px;background:#111;border:1px solid #2A2A2A;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#888;font-size:0.9rem;text-decoration:none;transition:all 0.2s;"
               onmouseover="this.style.background='#E8001D';this.style.borderColor='#E8001D';this.style.color='#fff';"
               onmouseout="this.style.background='#111';this.style.borderColor='#2A2A2A';this.style.color='#888';">
              <i class="bi bi-<?= $sn ?>"></i>
            </a>
            <?php endforeach; ?>
          </div>
        </div>
      </div>

    </div>
  </div>

  <?php include 'includes/footer.php'; ?>
</body>
</html>
