# Email Rendering Guide

## Overview

This guide explains, in plain English, how mailturtle takes raw Gmail email data, turns it into readable content, and shows it in the app.

It also explains MIME, because MIME is the format that tells us what each part of an email contains.

---

## What Is MIME?

**MIME** stands for **Multipurpose Internet Mail Extensions**.

MIME is the standard format email systems use to split one email into parts.

In simple terms, MIME tells an email app:

- what the part is
- how to read it
- whether it is text, HTML, an image, or a file
- how different parts belong together

Without MIME, an email would mostly just be plain text. With MIME, one email can include:

- Plain text content
- HTML content
- Inline images
- File attachments
- Multiple versions of the same message body

### What MIME Is Used For

MIME is used whenever an email needs more than a single block of plain text.

Common uses include:

- Sending both a plain-text and HTML version of the same message
- Embedding inline images inside newsletters or branded emails
- Attaching files such as PDFs, calendar invites, or spreadsheets
- Labeling content types such as `text/html`, `image/png`, or `application/pdf`
- Packaging file data so it can safely travel through email systems

In practice, MIME is how email apps know:

- which part is the readable text
- which part is HTML
- which parts are attachments
- which image belongs to which `cid:` reference inside the HTML

### How MIME Can Be Used

MIME is usually used in two ways.

#### If you are sending email

You use MIME to build richer emails. For example:

- `multipart/alternative` when you want both plain text and HTML
- `multipart/related` when HTML needs inline images
- `multipart/mixed` when you want attachments added to the message

This lets one email support different mail apps and richer formatting.

#### If you are receiving or processing email

You use MIME to unpack the email and decide what to do with each part. For example:

- render `text/html` in a UI
- fall back to `text/plain` when HTML is missing
- detect inline images by `Content-ID`
- separate downloadable attachments from message body content
- sanitize unsafe HTML before rendering it in a browser

That is the role MIME plays in this app.

### Common MIME Types In Email

Some common MIME types you will see in email processing are:

- `text/plain`
  Plain text version of the email body

- `text/html`
  Rich HTML version of the email body

- `multipart/alternative`
  A container that holds multiple versions of the same content, usually plain text and HTML

- `multipart/related`
  A container that groups HTML together with resources it depends on, such as inline images

- `multipart/mixed`
  A container used when attachments are included alongside the message body

- `image/png`, `image/jpeg`, `image/gif`
  Common image attachment types

- `application/pdf`
  A common file attachment type

### MIME Practices

When working with MIME email, these are the main good practices.

#### Prefer plain text and HTML as separate concerns

Do not assume HTML is always present or safe to render. Keep:

- a plain-text version for fallback and preview generation
- an HTML version for richer display when available

This app follows that pattern by storing both `body` and `bodyHtml`.

#### Walk the MIME tree recursively

Email bodies are often nested. Do not assume the useful content is only in the first part.

This app follows that practice in `extractEmailContent(...)` by traversing nested `parts`.

#### Decode before interpreting content

Many Gmail body parts are encoded. Decode them before trying to extract text, strip HTML, or render anything.

This app does that with `decodeBody(...)`.

#### Treat inline images differently from attachments

An inline image is part of the visible email. A regular attachment usually is not.

Good handling means:

- detect `Content-ID`
- map `cid:` references correctly
- expose inline image bytes through a safe URL if the browser needs to load them

This app rewrites inline image references to the Gmail attachments route.

#### Sanitize HTML before rendering

Email HTML should be treated as untrusted input. Even when it comes from a real mailbox, it can contain scripts, unsafe links, tracking markup, or broken HTML.

Good practice is to:

- strip risky tags
- remove inline event handlers
- block `javascript:` URLs
- avoid rendering raw HTML directly without cleanup

This app applies lightweight sanitization before rendering.

#### Keep rendering separate from extraction

Parsing MIME and rendering UI are different jobs. A clean setup is:

1. Extract and normalize message data on the server
2. Return a simplified application shape
3. Render only the normalized result on the client

That is the architecture used here.

#### Expect malformed or partial messages

Real email is messy. Some messages are missing plain text, some have broken HTML, and some are only partly usable.

A robust system should:

- tolerate missing parts
- support fallback behavior
- avoid crashing when a message is incomplete

This app handles that by building `textBody` and `htmlBody` with fallbacks.

### Why It Matters

When Gmail returns a message through its API, the body is usually not one ready-to-render string. It is a group of MIME parts.

For example, one message may contain:

```text
multipart/alternative
  text/plain
  text/html
```

Or a more complex message:

```text
multipart/related
  multipart/alternative
    text/plain
    text/html
  image/png (inline image with Content-ID)
  application/pdf (attachment)
```

That means the app cannot just read one `body` field and display it. It has to:

1. Walk the MIME structure
2. Decode the content
3. Pick the right parts
4. Rewrite inline image references
5. Sanitize the HTML
6. Render the result safely enough for the UI

---

## High-Level Flow In Our App

```text
Connected Gmail account
  -> /api/gmail/messages
  -> Gmail API returns MIME payload
  -> App extracts plain text + HTML + inline image metadata
  -> App rewrites cid: image references to attachment URLs
  -> App sanitizes HTML
  -> App returns structured email objects
  -> Provider stores body/bodyHtml in state
  -> Email detail component renders HTML or plain text
```

---

## Where The Translation Happens

### 1. Client loads Gmail messages

When a Gmail account is connected, the provider fetches messages from:

- `GET /api/gmail/messages?email=...`

This happens in `app/providers.tsx` inside `loadGmailEmails`.

The API response is mapped into the app's `Email` shape and stored in state. The important fields for rendering are:

- `body`
- `bodyHtml`
- `preview`

### 2. Gmail API data is converted into app-friendly content

The main translation logic lives in:

- `app/api/gmail/messages/route.ts`

For each Gmail message, the route calls:

- `extractEmailContent(...)`

That function walks the MIME payload and collects:

- Plain text parts into `textParts`
- HTML parts into `htmlParts`
- Inline image metadata into `inlineAttachments`

### 3. Gmail body data is base64-decoded

Gmail body parts are encoded. The route decodes them using:

- `decodeBody(...)`

This turns Gmail's encoded body data into readable text or HTML.

### 4. The route builds renderable fields

After extraction, the route creates two app-ready versions of the message:

- `textBody`
- `htmlBody`

Rules used:

- If plain text exists, it becomes `textBody`
- If HTML exists, it becomes `rawHtml`
- If plain text is missing, text can be derived from stripped HTML
- If HTML is missing, the app can still fall back to plain text rendering

### 5. Inline images are rewritten

Some emails do not use normal image URLs. Instead, HTML uses `cid:` references such as:

```html
<img src="cid:logo-image-123" />
```

That image is not directly usable in the browser. It points to another MIME part in the message.

To render it, `sanitizeEmailHtml(...)` rewrites that source into our own attachment endpoint:

```text
/api/gmail/attachments?email=...&messageId=...&attachmentId=...&mimeType=image/png
```

This is how inline email images become normal browser URLs.

### 6. HTML is sanitized

Before rendering, the HTML is cleaned by:

- `basicSanitizeHtml(...)`

It removes or neutralizes risky content such as:

- `<script>` tags
- `<iframe>` tags
- Inline event handlers like `onclick`
- `javascript:` links or sources

This is not a full security sandbox. It is a cleanup step so email HTML is safer to display.

### 7. Structured email objects are returned to the client

Each email returned from `app/api/gmail/messages/route.ts` includes fields like:

- `id`
- `from`
- `subject`
- `preview`
- `body`
- `bodyHtml`
- `date`

The client stores those and uses them for the inbox and detail views.

### 8. The UI renders HTML or plain text

The final render happens in:

- `app/components/EmailDetail.tsx`

Rendering rules:

- If `email.bodyHtml` exists, render it with `dangerouslySetInnerHTML`
- Otherwise render `email.body` as plain text

That means the HTML pipeline is:

```text
Gmail MIME HTML -> extract -> decode -> sanitize -> store as bodyHtml -> render in EmailDetail
```

And the plain text fallback is:

```text
Gmail MIME text/plain -> extract -> decode -> store as body -> render when bodyHtml is missing
```

---

## How Images Work

There are two image cases in the app.

### Inline Images

Inline images come from MIME attachment parts that usually have:

- An image MIME type such as `image/png`
- A `Content-ID` header
- An attachment ID in the Gmail payload

The message HTML references that image through `cid:...`.

The app handles this by:

1. Collecting inline image metadata during MIME traversal
2. Matching `cid:` references in HTML
3. Rewriting them to `/api/gmail/attachments`
4. Fetching the binary attachment from Gmail in `app/api/gmail/attachments/route.ts`
5. Returning it with the correct `Content-Type`

### Remote Images

Some emails use remote images directly, for example:

```html
<img src="https://example.com/banner.png" />
```

Those are not downloaded and stored by the app. If they survive sanitization, the browser loads them directly from the remote URL when the HTML is rendered.

So:

- Inline images are proxied through our attachment endpoint
- Remote images are loaded directly by the browser

---

## Why We Need Both `body` And `bodyHtml`

We store both because not every email is clean HTML.

`body` is useful when:

- The email only contains plain text
- HTML is missing
- HTML is broken or too limited to trust visually

`bodyHtml` is useful when:

- The sender formatted the email with headings, links, tables, and images
- Inline images need to appear in the message
- The visual structure matters

This dual-field approach gives the UI a graceful fallback.

---

## Raw Data vs Rendered Data

### Raw Gmail-style data

The raw Gmail payload is closer to this shape:

```text
payload
  mimeType: multipart/related
  parts:
    - text/plain
    - text/html
    - image/png with Content-ID and attachmentId
```

The body data inside those parts is often base64-encoded.

### Rendered app data

The app translates that into a simpler shape:

```text
{
  id,
  from,
  subject,
  preview,
  body,
  bodyHtml,
  date
}
```

This is the format the React UI actually works with.

---

## Key Files

- `app/providers.tsx`
  Loads Gmail messages into client state

- `app/api/gmail/messages/route.ts`
  Extracts MIME parts, decodes content, sanitizes HTML, rewrites inline images

- `app/api/gmail/attachments/route.ts`
  Fetches Gmail attachment bytes for inline images

- `app/components/EmailDetail.tsx`
  Renders the final HTML or plain text body

---

## Summary

mailturtle does not render the raw Gmail payload directly.

It first translates MIME data into app-friendly fields by:

1. Traversing MIME parts
2. Decoding body data
3. Extracting text and HTML
4. Rewriting inline image references
5. Sanitizing HTML
6. Returning `body` and `bodyHtml`
7. Rendering the best available version in the UI

MIME is the reason this translation layer exists. Gmail messages come in structured parts, not as ready-to-show page content. The app turns those parts into something React can display.