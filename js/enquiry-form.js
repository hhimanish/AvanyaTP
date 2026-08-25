/* Client-side validation + Formspree submission via fetch(), no page reload.
   WhatsApp/Call/Email quick-action buttons are plain <a> tags elsewhere and are
   NOT gated by this script — they work even if JS fails to load.

   Phase 4 (Enquiry Engine): also assembles the enquiry payload via
   js/enquiry-engine.js (module/enquiryType/leadId/listingSnapshot/UTM),
   enforces consent with the spec's exact documented error message, shows the
   generated lead reference to the visitor on success, and — the key risk
   this phase's roadmap entry specifically calls out — never lets a failed
   submission silently disappear: if the network call itself fails, the
   visitor gets an immediate, pre-filled WhatsApp/email fallback instead of
   just an apology. */

(function () {
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[+]?[0-9\s-]{7,15}$/;

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function setFieldError(field, message) {
    var wrapper = field.closest('.form-field');
    if (!wrapper) return;
    wrapper.classList.toggle('invalid', !!message);
    var errorEl = wrapper.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message || '';
  }

  function validateField(field) {
    var value = field.value.trim();
    if (field.hasAttribute('required') && field.type !== 'checkbox' && !value) {
      setFieldError(field, 'This field is required.');
      return false;
    }
    if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      setFieldError(field, 'Please confirm your consent to be contacted.');
      return false;
    }
    if (field.type === 'email' && value && !EMAIL_RE.test(value)) {
      setFieldError(field, 'Enter a valid email address.');
      return false;
    }
    if (field.dataset.phoneCheck === 'true' && value && !PHONE_RE.test(value)) {
      setFieldError(field, 'Enter a valid phone number.');
      return false;
    }
    setFieldError(field, '');
    return true;
  }

  function collectFieldValues(form) {
    var values = {};
    qsa('input, textarea, select', form).forEach(function (f) {
      if (!f.name) return;
      values[f.name] = f.type === 'checkbox' ? f.checked : f.value;
    });
    return values;
  }

  function fallbackMessage(fields) {
    var parts = ['Hi Avanya, my enquiry form submission didn\'t go through, so I\'m reaching out directly.'];
    if (fields.name) parts.push('Name: ' + fields.name);
    if (fields.message) parts.push('Message: ' + fields.message);
    return parts.join(' ');
  }

  function showFallback(form, fields) {
    var status = form.querySelector('.form-status');
    var msg = fallbackMessage(fields);
    var waHref = 'https://wa.me/919999999999?text=' + encodeURIComponent(msg);
    var mailHref = 'mailto:enquiries@avanyatourism.example?subject=' + encodeURIComponent('Enquiry (form submission failed)') + '&body=' + encodeURIComponent(msg);
    status.className = 'form-status show error';
    status.innerHTML = 'We couldn\'t send your enquiry through the form right now — your message has NOT been lost, please reach us directly instead: ' +
      '<a href="' + waHref + '" class="btn btn-primary btn-sm" style="margin: var(--sp-2) var(--sp-2) 0 0;">Continue on WhatsApp</a>' +
      '<a href="' + mailHref + '" class="btn btn-outline btn-sm" style="margin: var(--sp-2) 0 0;">Continue by Email</a>';
  }

  function initForm(form) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var fields = qsa('input, textarea', form).filter(function (f) { return f.name && f.type !== 'hidden'; });

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allValid = fields.map(validateField).every(Boolean);
      if (!allValid) {
        status.className = 'form-status show error';
        status.textContent = 'Please fix the highlighted fields before submitting.';
        var firstInvalid = form.querySelector('.form-field.invalid input, .form-field.invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var fieldValues = collectFieldValues(form);

      /* Explicit consent enforcement via the enquiry engine, matching the
         spec's documented 422 error exactly — this is a second, deliberate
         check beyond the required-checkbox validation above, so consent is
         never bypassable by a browser that mishandles the "required"
         attribute, and so the error text a visitor sees is the one the API
         Design document actually specifies, not an ad hoc message. */
      var engine = window.AvanyaEnquiryEngine;
      var consentCheck = engine.validateConsent({ consent: fieldValues.consent === true });
      if (!consentCheck.valid) {
        status.className = 'form-status show error';
        status.textContent = consentCheck.errors[0].issue;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      status.className = 'form-status show';
      status.textContent = '';

      var propertySlug = fieldValues.propertySlug || null;
      var listingItem = propertySlug && window.AvanyaData ? window.AvanyaData.findBySlug(propertySlug) : null;

      var payload = engine.buildEnquiryPayload(fieldValues, {
        listingItem: listingItem,
        taxonomy: window.AvanyaTaxonomy,
        search: window.location.search
      });

      var formData = new FormData(form);
      formData.set('leadId', payload.leadId);
      formData.set('enquiryType', payload.enquiryType);
      if (payload.listingSnapshot) {
        formData.set('listingSnapshot', JSON.stringify(payload.listingSnapshot));
      }
      if (payload.utm_source) formData.set('utm_source', payload.utm_source);
      if (payload.utm_medium) formData.set('utm_medium', payload.utm_medium);
      if (payload.utm_campaign) formData.set('utm_campaign', payload.utm_campaign);

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            status.className = 'form-status show success';
            status.textContent = 'Thank you — your enquiry has been sent. Our team will reach out shortly. Your reference: ' + payload.leadId + ' (quote this if you follow up).';
            form.reset();
          } else {
            return response.json().then(function (data) {
              throw new Error((data && data.errors && data.errors.map(function (er) { return er.message; }).join(', ')) || 'Submission failed.');
            });
          }
        })
        .catch(function () {
          /* The key risk this phase's roadmap entry names: an async
             notification path that fails silently. Formspree's own email
             delivery is outside this site's control, but a failure of the
             submission call itself must never just apologise and stop —
             the visitor's message is still sitting in the form; give them
             an immediate way to send it anyway rather than losing the lead. */
          showFallback(form, fieldValues);
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Enquiry';
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    qsa('form.enquiry-form').forEach(initForm);
  });
})();
