```javascript
/* Captura de leads — formulário integrado ao Supabase. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://bwhvfiklrvrodadbxoly.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_R5xKqfJPBmp6PEsiRAvZ1w_IIypXVPZ';

  var ORIGIN =
    document.documentElement.getAttribute('data-lead-origin') ||
    'site_principal';

  var pendingHref = '';
  var modal = null;

  function buildModal() {
    var existingModal = document.getElementById('lead-capture-modal');

    if (existingModal) {
      modal = existingModal;
      return;
    }

    modal = document.createElement('div');
    modal.id = 'lead-capture-modal';
    modal.className = 'lead-modal';
    modal.hidden = true;

    modal.innerHTML =
      '<div class="lead-modal__backdrop" data-lead-close></div>' +
      '<section class="lead-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">' +
        '<button type="button" class="lead-modal__close" aria-label="Fechar formulário" data-lead-close>&times;</button>' +
        '<h2 id="lead-modal-title">Agendar consulta</h2>' +
        '<p>Informe seus dados para continuar pelo WhatsApp.</p>' +
        '<form id="lead-capture-form" novalidate>' +
          '<label for="lead-name">Nome completo</label>' +
          '<input id="lead-name" name="nome" type="text" autocomplete="name" maxlength="120" required>' +
          '<label for="lead-whatsapp">WhatsApp com DDD</label>' +
          '<input id="lead-whatsapp" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="(83) 99999-9999" required>' +
          '<p class="lead-modal__privacy">Usaremos esses dados apenas para retornar seu contato sobre o agendamento. Não informe sintomas ou dados de saúde neste formulário.</p>' +
          '<p class="lead-modal__error" id="lead-form-error" role="alert" hidden></p>' +
          '<button type="submit" class="lead-modal__submit">Continuar para o WhatsApp</button>' +
        '</form>' +
      '</section>';

    document.body.appendChild(modal);

    modal.querySelectorAll('[data-lead-close]').forEach(function (element) {
      element.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal && !modal.hidden) {
        closeModal();
      }
    });

    modal.querySelector('#lead-capture-form').addEventListener('submit', submitLead);
  }

  function openModal(href) {
    buildModal();

    pendingHref = href;
    modal.hidden = false;

    document.body.classList.add('lead-modal-open');

    var error = modal.querySelector('#lead-form-error');
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }

    var submitButton = modal.querySelector('.lead-modal__submit');
    submitButton.disabled = false;
    submitButton.textContent = 'Continuar para o WhatsApp';

    setTimeout(function () {
      modal.querySelector('#lead-name').focus();
    }, 0);
  }

  function closeModal() {
    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove('lead-modal-open');
  }

  function showError(message) {
    var error = modal.querySelector('#lead-form-error');
    error.textContent = message;
    error.hidden = false;
  }

  async function submitLead(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var name = form.elements.nome.value.trim();
    var whatsapp = form.elements.whatsapp.value.trim();
    var digits = whatsapp.replace(/\D/g, '');
    var submitButton = form.querySelector('.lead-modal__submit');

    if (name.length < 3) {
      showError('Digite seu nome completo para continuar.');
      form.elements.nome.focus();
      return;
    }

    if (digits.length < 10 || digits.length > 15) {
      showError('Confira o número do WhatsApp, incluindo o DDD.');
      form.elements.whatsapp.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Registrando contato...';

    modal.querySelector('#lead-form-error').hidden = true;

    try {
      var response = await fetch(
        SUPABASE_URL + '/rest/v1/rpc/registrar_lead',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY
          },
          body: JSON.stringify({
            p_nome: name,
            p_whatsapp: whatsapp,
            p_origem: ORIGIN
          })
        }
      );

      if (!response.ok) {
        throw new Error('Não foi possível registrar seu contato agora.');
      }

      var result = await response.json();

      if (!result || result.success !== true) {
        throw new Error('O cadastro não foi confirmado. Tente novamente.');
      }

      var destination = pendingHref;

      var message =
        'Olá, Dra. Larissa! Meu nome é ' +
        name +
        ' e gostaria de continuar o atendimento.';

      if (destination.indexOf('text=') === -1) {
        destination +=
          (destination.indexOf('?') >= 0 ? '&' : '?') +
          'text=' +
          encodeURIComponent(message);
      }

      closeModal();
      window.location.href = destination;

    } catch (error) {
      showError(
        (error && error.message) ||
        'Não foi possível registrar seu contato. Verifique sua conexão e tente novamente.'
      );

      submitButton.disabled = false;
      submitButton.textContent = 'Tentar novamente';
    }
  }

  function isAppointmentLink(link) {
    if (!link || !link.href) {
      return false;
    }

    // Aceita links diretos do WhatsApp.
    if (!/^https:\/\/wa\.me\//i.test(link.href)) {
      return false;
    }

    var text = (link.textContent || '').trim().toLowerCase();
    var label = (link.getAttribute('aria-label') || '').trim().toLowerCase();

    /*
     * Reconhece botões de agendamento em todas as páginas:
     * "Agendar consulta", "Agendar", "Consultar"
     * e "Agendar pelo WhatsApp".
     */
    return (
      text.includes('agendar') ||
      label.includes('agendar') ||
      text.includes('consultar') ||
      label.includes('consultar')
    );
  }

  /*
   * Listener único para os botões do site.
   * Funciona também em botões cujo texto está dentro de spans ou ícones.
   */
  document.addEventListener('click', function (event) {
    var target = event.target;

    if (!target || typeof target.closest !== 'function') {
      return;
    }

    var link = target.closest('a[href]');

    if (!link || !isAppointmentLink(link)) {
      return;
    }

    event.preventDefault();
    openModal(link.href);
  });

})();
```
