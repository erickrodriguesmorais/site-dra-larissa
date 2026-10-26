/* Captura de leads — formulário com modalidade de consulta. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://bwhvfiklrvrodadbxoly.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_R5xKqfJPBmp6PEsiRAvZ1w_IIypXVPZ';
  var ORIGIN = document.documentElement.getAttribute('data-lead-origin') || 'site_principal';
  var pendingHref = '';
  var modal;

  function buildModal() {
    if (document.getElementById('lead-capture-modal')) {
      modal = document.getElementById('lead-capture-modal');
      return;
    }

    modal = document.createElement('div');
    modal.id = 'lead-capture-modal';
    modal.className = 'lead-modal';
    modal.hidden = true;

    modal.innerHTML = `
      <div class="lead-modal__backdrop" data-lead-close></div>

      <section class="lead-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title">

        <button
          type="button"
          class="lead-modal__close"
          aria-label="Fechar formulário"
          data-lead-close>&times;</button>

        <h2 id="lead-modal-title">Agendar consulta</h2>
        <p>Informe seus dados para continuar pelo WhatsApp.</p>

        <form id="lead-capture-form" novalidate>
          <label for="lead-name">Nome completo</label>
          <input
            id="lead-name"
            name="nome"
            type="text"
            autocomplete="name"
            maxlength="120"
            required>

          <label for="lead-whatsapp">WhatsApp com DDD</label>
          <input
            id="lead-whatsapp"
            name="whatsapp"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            maxlength="20"
            placeholder="(83) 99999-9999"
            required>

          <fieldset class="lead-modality">
            <legend>Qual modalidade de consulta deseja?</legend>

            <label class="lead-modality__option">
              <input
                type="radio"
                name="modalidade"
                value="Presencial"
                required>
              <span>Presencial</span>
            </label>

            <label class="lead-modality__option">
              <input
                type="radio"
                name="modalidade"
                value="Telemedicina"
                required>
              <span>Telemedicina</span>
            </label>

            <label class="lead-modality__option">
              <input
                type="radio"
                name="modalidade"
                value="Domiciliar"
                required>
              <span>Domiciliar</span>
            </label>
          </fieldset>

          <p class="lead-modal__privacy">
            Usaremos esses dados apenas para retornar seu contato sobre o agendamento.
            Não informe sintomas ou dados de saúde neste formulário.
          </p>

          <p
            class="lead-modal__error"
            id="lead-form-error"
            role="alert"
            hidden></p>

          <button type="submit" class="lead-modal__submit">
            Continuar para o WhatsApp
          </button>
        </form>
      </section>
    `;

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

    modal.querySelector('#lead-form-error').hidden = true;

    var submit = modal.querySelector('.lead-modal__submit');
    submit.disabled = false;
    submit.textContent = 'Continuar para o WhatsApp';

    setTimeout(function () {
      modal.querySelector('#lead-name').focus();
    }, 0);
  }

  function closeModal() {
    if (!modal) return;

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
    var modalityInput = form.querySelector('input[name="modalidade"]:checked');
    var modality = modalityInput ? modalityInput.value : '';
    var submit = form.querySelector('.lead-modal__submit');

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

    if (!['Presencial', 'Telemedicina', 'Domiciliar'].includes(modality)) {
      showError('Selecione a modalidade de consulta desejada.');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Registrando contato...';
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
            p_origem: ORIGIN,
            p_modalidade: modality
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

      var destination = new URL(pendingHref);

      var message =
        'Olá, Dra. Larissa! Meu nome é ' + name +
        ' e gostaria de informações sobre uma consulta ' +
        modality.toLowerCase() + '.';

      destination.searchParams.set('text', message);

      closeModal();
      window.location.href = destination.toString();

    } catch (error) {
      showError(
        (error && error.message) ||
        'Não foi possível registrar seu contato. Verifique sua conexão e tente novamente.'
      );

      submit.disabled = false;
      submit.textContent = 'Tentar novamente';
    }
  }

  function isAppointmentLink(link) {
    if (!link || !link.href || !/^https:\/\/wa\.me\//i.test(link.href)) {
      return false;
    }

    var text = (link.textContent || '').trim().toLowerCase();
    var label = (link.getAttribute('aria-label') || '').trim().toLowerCase();

    return (
      text.includes('agendar consulta') ||
      label.includes('agendar consulta') ||
      text.includes('agendar um atendimento') ||
      text.includes('agendar uma consulta')
    );
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');

    if (!link || !isAppointmentLink(link)) {
      return;
    }

    event.preventDefault();
    openModal(link.href);
  });

})();
