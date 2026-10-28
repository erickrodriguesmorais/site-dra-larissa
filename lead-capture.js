/* Captura de leads — formulário de agendamento */
(function () {
  'use strict';

var SUPABASE_URL = 'https://bwhvfiklrvrodadbxoly.supabase.co';
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_R5xKqfJPBmp6PEsiRAvZ1w_IIypXVPZ';

var params = new URLSearchParams(window.location.search);
var requestedOrigin = params.get('origem');
var pageOrigin = document.documentElement.getAttribute('data-lead-origin');

var ORIGIN = requestedOrigin === 'google_perfil'
? 'google_perfil'
: (pageOrigin || 'site_principal');

var pendingHref = '';
var modal;

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

    modal.innerHTML = `
      <div class="lead-modal__backdrop" data-lead-close></div>

      <section class="lead-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title">

        <button type="button"
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

          <div class="lead-modality">
            <label for="lead-modality-select">
              Qual modalidade de consulta deseja?
            </label>

            <select
              id="lead-modality-select"
              name="modalidade"
              required>

              <option value="" selected disabled>
                Selecione a modalidade
              </option>

              <option value="Presencial">Presencial</option>
              <option value="Telemedicina">Telemedicina</option>
              <option value="Domiciliar">Domiciliar</option>
            </select>
          </div>

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

    modal
      .querySelector('#lead-capture-form')
      .addEventListener('submit', submitLead);
  }

  function openModal(href) {
    buildModal();

    pendingHref = href;
    modal.hidden = false;

    document.body.classList.add('lead-modal-open');

    var error = modal.querySelector('#lead-form-error');
    var submit = modal.querySelector('.lead-modal__submit');

    error.hidden = true;
    submit.disabled = false;
    submit.textContent = 'Continuar para o WhatsApp';

    window.setTimeout(function () {
      var nameInput = modal.querySelector('#lead-name');

      if (nameInput) {
        nameInput.focus();
      }
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
    var modality = form.elements.modalidade.value;
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

    if (
      !['Presencial', 'Telemedicina', 'Domiciliar'].includes(modality)
    ) {
      showError('Selecione a modalidade da consulta.');
      form.elements.modalidade.focus();
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
        throw new Error(
          'Não foi possível registrar seu contato agora. Tente novamente.'
        );
      }

      var result = await response.json();

      if (!result || result.success !== true) {
        throw new Error(
          'O cadastro não foi confirmado. Tente novamente.'
        );
      }

var message =
  'Olá, Dra. Larissa! Meu nome é ' +
  name +
  ' e gostaria de agendar uma consulta na modalidade ' +
  modality +
  '.';

var destination = new URL(pendingHref);

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
    if (
      !link ||
      !link.href ||
      !/^https:\/\/wa\.me\//i.test(link.href)
    ) {
      return false;
    }

    var text = (link.textContent || '').trim().toLowerCase();

    var label = (
      link.getAttribute('aria-label') || ''
    ).trim().toLowerCase();

    return (
      text.includes('agendar consulta') ||
      label.includes('agendar consulta') ||
      text.includes('agendar um atendimento') ||
      text.includes('agendar uma consulta')
    );
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest &&
      event.target.closest('a[href]');

    if (!link || !isAppointmentLink(link)) {
      return;
    }

    event.preventDefault();

    openModal(link.href);
  });

    // Abre automaticamente o formulário quando o acesso vier do Google.
  if (
    new URLSearchParams(window.location.search)
      .get('abrir_formulario') === '1'
  ) {
    document.addEventListener('DOMContentLoaded', function () {
      openModal('https://wa.me/5583998023806');
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal && !modal.hidden) {
      closeModal();
    }
  });

})();
