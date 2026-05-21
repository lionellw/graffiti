<!--
  CanonicalFixture — every preset renders against this same surface stack,
  built strictly from documented Graffiti patterns so visual deltas read as
  preset choices, not markup choices.

  References:
  - src/docs/demos/Card.svelte    (.card structure)
  - src/docs/demos/Dialog.svelte  (native <dialog> + commandfor)
  - src/docs/demos/Callout.svelte (.callout variants)
  - src/routes/templates/settings/+page.svelte (.row form fields, .form-actions)
-->

<script>
  let { id } = $props();
</script>

<div class="stack" style="--gap: var(--vs-l);">
  <!-- Button variants -->
  <div class="cluster">
    <button class="primary">Primary</button>
    <button>Default</button>
    <button class="ghost">Ghost</button>
    <button class="minimal">Minimal</button>
    <button disabled>Disabled</button>
  </div>

  <!-- Card (record-like, with the canonical structure) -->
  <article class="card">
    <header>
      <h4>Launch checklist</h4>
      <span class="tag info">In review</span>
    </header>
    <div class="card-body stack">
      <p>Finalize the launch brief, confirm asset handoff, and schedule the team announcement.</p>
      <p>Next review: <strong>Thursday, 2:00 PM</strong>.</p>
    </div>
    <footer class="cluster">
      <button class="primary">Open brief</button>
      <button class="ghost">Snooze</button>
    </footer>
  </article>

  <!-- Callouts demonstrate status colors against the preset's bg -->
  <div class="callout">
    <p>A neutral note about how the preset reads on a callout surface.</p>
  </div>
  <div class="callout success">
    <p>Success callout — token <code>--success</code> on a tinted surface.</p>
  </div>

  <!-- Form using canonical .row + .form-actions -->
  <form class="stack" style="--gap: var(--vs-m);" onsubmit={(e) => e.preventDefault()}>
    <div class="row">
      <label for="cf-{id}-email">Email address</label>
      <input type="email" id="cf-{id}-email" placeholder="you@example.com" />
      <small class="text-faint">Used for account updates and receipts.</small>
    </div>

    <div class="row">
      <label for="cf-{id}-plan">Plan</label>
      <select id="cf-{id}-plan">
        <option>Free</option>
        <option>Pro</option>
        <option>Team</option>
      </select>
    </div>

    <div class="row">
      <label for="cf-{id}-invite">Invite teammate</label>
      <div class="input-group stack-mobile">
        <input type="email" id="cf-{id}-invite" placeholder="teammate@company.com" />
        <button type="button">Send invite</button>
      </div>
    </div>

    <label class="form-option-row">
      <input type="checkbox" />
      <span>Subscribe to product updates</span>
    </label>

    <div class="form-actions">
      <button class="primary" type="submit">Save changes</button>
      <button class="ghost" type="button">Cancel</button>
    </div>
  </form>

  <!-- Dialog — native, opens via commandfor (the canonical pattern). -->
  <div class="cluster">
    <button commandfor="cf-{id}-dialog" command="show-modal">Open dialog</button>
    <button commandfor="cf-{id}-confirm" command="show-modal">Open confirm</button>
  </div>

  <dialog id="cf-{id}-dialog">
    <button class="close" commandfor="cf-{id}-dialog" command="close" aria-label="Close">×</button>
    <div class="stack" style="--gap: var(--vs-m);">
      <p class="h4">A dialog in this preset</p>
      <p>Native &lt;dialog&gt; opens in the browser's top layer, so the preset's modal treatment shows here.</p>
      <div class="cluster" style="justify-content: flex-end;">
        <button commandfor="cf-{id}-dialog" command="close">Close</button>
      </div>
    </div>
  </dialog>

  <dialog id="cf-{id}-confirm">
    <button class="close" commandfor="cf-{id}-confirm" command="close" aria-label="Close">×</button>
    <div class="stack" style="--gap: var(--vs-m);">
      <p class="h4">Confirm action</p>
      <p>Are you sure you want to proceed? This cannot be undone.</p>
      <div class="cluster" style="justify-content: flex-end;">
        <button commandfor="cf-{id}-confirm" command="close">Cancel</button>
        <button class="primary" commandfor="cf-{id}-confirm" command="close">Confirm</button>
      </div>
    </div>
  </dialog>

  <!-- Prose: long-form typography surface. h1+h2+long paragraph (for ::first-letter)+blockquote. -->
  <article class="prose stack">
    <h1>The Quiet Geometry of Type</h1>
    <h2>Notes on rhythm, contrast, and the page</h2>
    <p>
      Typography is the negotiation between author and reader, mediated by every choice
      the designer makes about rhythm and contrast. A page that breathes is a page that
      has been edited — not only the words, but the spaces between them, the weight of
      the headings, and the restraint at the corners. Good type asks nothing of you and
      earns attention anyway, which is what makes it so easy to overlook and so hard to
      do well.
    </p>
    <blockquote>
      The reader will not thank you for shouting, but a whisper too soft to hear is
      worse than a shout you can ignore.
    </blockquote>
    <p>Every preset on this page is asked to render the same paragraph; what changes is the voice it speaks in.</p>
  </article>

  <!-- Tags / chips for status colors at small sizes -->
  <div class="cluster">
    <span class="tag success">Success</span>
    <span class="tag warning">Warning</span>
    <span class="tag info">Info</span>
    <span class="tag">Neutral</span>
  </div>
</div>
