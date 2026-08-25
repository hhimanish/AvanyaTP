/* Client-side validation + Formspree submission via fetch(), no page reload.
   WhatsApp/Call/Email quick-action buttons are plain <a> tags elsewhere and are
   NOT gated by this script — they work even if JS fails to load. */

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

  function initForm(form) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var fields = qsa('input, textarea', form).filter(function (f) { return f.name; });

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

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      status.className = 'form-status show';
      status.textContent = '';

      var formData = new FormData(form);

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            status.className = 'form-status show success';
            status.textContent = 'Thank you — your enquiry has been sent. Our team will reach out shortly.';
            form.reset();
          } else {
            return response.json().then(function (data) {
              throw new Error((data && data.errors && data.errors.map(function (er) { return er.message; }).join(', ')) || 'Submission failed.');
            });
          }
        })
        .catch(function () {
          status.className = 'form-status show error';
          status.textContent = 'Something went wrong sending your enquiry. Please try again, or reach us directly via WhatsApp, call, or email below.';
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
