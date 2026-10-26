```javascript
/* Captura de leads — com seleção da modalidade de consulta. */
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

      <section
        class="lead-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
      >
        <button
          type="button"
          class="lead-modal__close"
          aria-label="Fechar formulário"
          data-lead-close
        >&times;</button>

        <h2 id="lead-modal-title">Agendar consulta</h2>

        <p>Informe seus dados e escolha a modalidade de atendimento.</p>

        <form id="lead-capture-form" novalidate>
          <label for="lead-name">Nome completo</label>
          <input
            id="lead-name"
            name="nome"
            type="text"
            autocomplete="name"
            maxlength="120"
            required
          >

          <label for="lead-whatsapp">WhatsApp com DDD</label>
          <input
            id="lead-whatsapp"
            name="whatsapp"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            maxlength="20"
            placeholder="(83) 99999-9999"
            required
          >

          <fieldset class="lead-modality">
            <legend>Qual modalidade de consulta deseja?</legend>

            <label class="lead-modality__option">
              <input
                type="radio"
                name="modalidade"
                value="Presencial"
                required
              >
              <span>Presencial</span>
            </label>

            <label class="lead-modality__option">
              <input
                type="radio"
                name="modalidade"
                value="Telemedicina"
                required
              >
              <span>Telemedicina</span>
            </label>

            <label class="lead-modality__option">
              <input
                type="radio"
                name="modalidade"
                value="Domiciliar"
                required
              >
              <span>Domiciliar</span>
            </label>
          </fieldset>

          <p class="lead-modal__privacy">
            Usaremos esses dados para retornar seu contato sobre o agendamento.
            Não informe sintomas ou dados de saúde neste formulário.
          </p>

          <p
            class="lead-modal__error"
            id="lead-form-error"
            role="alert"
            hidden
          ></p>

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

    modal.querySelector('#lead-capture-form').addEventListener(
      'submit',
      submitLead
    );

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal && !modal.hidden) {
        closeModal();
      }
    });
  }

  function openModal(href) {
    buildModal();

    pendingHref = href;
    modal.hidden = false;
    document.body.classList.add('lead-modal-open');

    modal.querySelector('#lead-form-error').hidden = true;

    var submitButton = modal.querySelector('.lead-modal__submit');
    submitButton.disabled = false;
    submitButton.textContent = 'Continuar para o WhatsApp';

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
    var modalityInput = form.querySelector(
      'input[name="modalidade"]:checked'
    );
    var modality = modalityInput ? modalityInput
