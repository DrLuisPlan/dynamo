class SasaDynamo {
  constructor(config) {
    // Instance variables (form state)
    this.webhookURL = config.webhookURL;
    this.userSessionID = config.sessionId || 'default_session';

    // Include `username` in userInfo
    this.userInfo = {
      email: config.userInfo?.email || null,
      userID: config.userInfo?.userID || null,
      brandID: config.userInfo?.brandID || null,
      brandName: config.userInfo?.brandName || null,
      username: config.userInfo?.username || null
    };

    this.loaderURL = config.loaderURL || '/path/to/your/loader.gif';
    this.loaderText = config.loaderText || 'Loading... please wait';
    this.currentStep = null;
    this.cardPayload = null;
    this.targetDivId = config.targetDivId;

    // Flags para validación (por defecto, true)
    this.generalInputRequired = true;
    this.dropDownRequired = true;
    this.editableScriptRequired = true;
    this.buttonsRequired = true; // Para los botones en general

    const container = document.getElementById(this.targetDivId);
    if (!container) {
      console.error("Container not found with id:", this.targetDivId);
      return;
    }
    this.renderInitialInteraction(container, config);
  }

  renderInitialInteraction(container, config) {
    const {
      title = '',
      description = '',
      placeholder = '',
      buttonText = '',
      showWappCTA = true
    } = config.initialQuestion;

    // Mobile & Desktop CTA blocks (WhatsApp)
    let mobileWappBlock = `
      <div class="uk-hidden@l uk-text-center uk-margin-large">
        <h1 class="uk-margin-small">MOBILE?</h1>
        <p class="uk-margin-small">IS BETTER ON WHATSAPP</p>
        <a href="https://wa.me/14753016460?text=Go%20Social" type="submit" uk-tooltip="GO TO WAPP" target="_blank">
          <img src="/images/WhatsAppButtonGreenLarge.svg">
        </a>
        <p class="uk-margin-small uk-text-small">or start here:</p>
      </div>
    `;
    let desktopWappBlock = `
      <div class="uk-visible@l uk-text-center">
        <p class="uk-margin-small uk-text-small">OR CREATE ON WHATSAPP</p>
        <a href="https://wa.me/14753016460?text=Go%20Social" type="submit" uk-tooltip="GO TO WAPP" target="_blank">
          <img src="/images/WhatsAppButtonGreenLarge.svg">
        </a>
      </div>
    `;
    if (!showWappCTA) {
      mobileWappBlock = '';
      desktopWappBlock = '';
    }

    const titleHTML = title ? `<h2 class="uk-text-center uk-margin-small">${title}</h2>` : '';
    const descriptionHTML = description ? `<p class="uk-text-center uk-margin-remove">${description}</p>` : '';
    const inputHTML = placeholder
      ? `<input type="text" class="form-control uk-form-large sasaUserInput uk-width-1-1@s uk-width-1-2@m uk-align-center" placeholder="${placeholder}">`
      : '';
    const buttonHTML = buttonText
      ? `<button class="start-button uk-button uk-button-primary uk-margin uk-width-1-1@s uk-width-1-2@m">${buttonText}</button>`
      : '';

    container.innerHTML = `
      <div id="sasaDynamoForm">
        <div>
          ${mobileWappBlock}
          ${titleHTML}
          ${descriptionHTML}
          <div class="uk-text-center uk-margin">
            <div>${inputHTML}</div>
            ${buttonHTML}
            ${desktopWappBlock}
          </div>
        </div>
      </div>
    `;

    if (buttonText) {
      const startBtn = container.querySelector('.start-button');
      if (startBtn) {
        startBtn.addEventListener('click', () => this.submitInitialData());
      }
    }
  }

  showLoader(container, loaderConfig = { url: this.loaderURL, text: this.loaderText }) {
    console.log("Showing loader with URL:", loaderConfig.url, "and text:", loaderConfig.text);
    container.innerHTML = `
      <div id="loaderContainer" class="uk-text-center uk-flex uk-flex-middle@l uk-flex-center@l">
        <div>
          <img src="${loaderConfig.url}" alt="Loading..." class="loader-gif" style="max-width: 100px;"/>
          <p class="uk-text-small">${loaderConfig.text}</p>
        </div>
      </div>
    `;
  }

  async submitInitialData() {
    const container = document.getElementById(this.targetDivId);
    const userInputElement = container.querySelector('.sasaUserInput');
    let userInput = '';

    if (userInputElement && userInputElement.placeholder.trim() !== '') {
      userInput = userInputElement.value.trim();
      if (!userInput) {
        alert("Please complete the information.");
        return;
      }
    }

    const payload = {
      sessionId: this.userSessionID,
      currentStep: this.currentStep !== null ? this.currentStep : undefined,
      requestZero: { zeroData: userInput || null },
      userInfo: {
        email: this.userInfo.email || null,
        username: this.userInfo.username || null,
        userID: this.userInfo.userID || null,
        brandID: this.userInfo.brandID || null,
        brandName: this.userInfo.brandName || null
      }
    };

    container.innerHTML = '';
    console.log("Showing loader before calling webhook");
    this.showLoader(container);

    try {
      const response = await fetch(this.webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let result = await response.json();
      console.log("Webhook response:", result);
      if (Array.isArray(result)) {
        result = result[0];
      }
      this.handleBotResponse(result);
    } catch (error) {
      console.error('Error sending data to webhook:', error);
    }
  }

  handleBotResponse(response) {
    const container = document.getElementById(this.targetDivId);
    container.innerHTML = '';

    if (response.interactiveCard) {
      this.renderInteractiveCard(response.interactiveCard);
    } else {
      console.log("No interactiveCard found in the webhook response.");
    }

    container.insertAdjacentHTML(
      'beforeend',
      `<p class="uk-text-center uk-margin-top">
         <a href="#" id="resetDynamoLink" class="uk-button uk-button-link uk-link-reset">reset | reiniciar</a>
       </p>`
    );
    document.getElementById('resetDynamoLink').addEventListener('click', (e) => {
      e.preventDefault();
      container.innerHTML = '';
      this.renderInitialInteraction(container, {
        initialQuestion: {
          title: 'TIME TO CREATE!',
          description: 'What is your content about?',
          placeholder: 'your request here',
          buttonText: 'START'
        }
      });
    });

    if (response.interactiveCard && response.interactiveCard.dropDown && response.interactiveCard.dropDown.options.length) {
      this.renderDropDown(response.interactiveCard.dropDown);
    } else {
      console.error('No drop-down options found in the response.');
    }

    if (response.progress && response.progress.currentStep !== undefined) {
      this.currentStep = response.progress.currentStep;
      console.log("Updated currentStep to:", this.currentStep);
    } else if (response.currentStep !== undefined) {
      this.currentStep = response.currentStep;
      console.log("Updated currentStep to:", this.currentStep);
    } else {
      console.log("No currentStep found in the response.");
    }

    if (response.interactiveCard && response.interactiveCard.card_payload) {
      this.cardPayload = response.interactiveCard.card_payload;
      console.log("Updated cardPayload from interactiveCard:", this.cardPayload);
    } else if (response.cardPayload) {
      this.cardPayload = response.cardPayload;
      console.log("Updated cardPayload from root response:", this.cardPayload);
    } else {
      console.log("No card_payload found in the response.");
    }

    if (response.loader) {
      this.loaderURL = response.loader.url;
      this.loaderText = response.loader.text;
    }

    if (response.progress) {
      this.showProgress(response.progress);
    }
    if (response.gamification) {
      this.showGamification(response.gamification);
    }

    if (response.userInfo) {
      if (response.userInfo.email) {
        this.userInfo.email = response.userInfo.email;
        console.log("Email updated from webhook:", this.userInfo.email);
      }
      if (response.userInfo.userID) {
        this.userInfo.userID = response.userInfo.userID;
        console.log("UserID updated from webhook:", this.userInfo.userID);
      }
      if (response.userInfo.brandID) {
        this.userInfo.brandID = response.userInfo.brandID;
        console.log("BrandID updated from webhook:", this.userInfo.brandID);
      }
      if (response.userInfo.username) {
        this.userInfo.username = response.userInfo.username;
        console.log("Username updated from webhook:", this.userInfo.username);
      }
    }

    if (!response.interactiveCard) {
      container.innerHTML = '';
    }
  }

  renderEditableScript(editableScript) {
    const container = document.getElementById(this.targetDivId);
    if (
      !editableScript ||
      (!editableScript.content?.trim() && !editableScript.input_placeholder?.trim())
    ) {
      console.log("No editable script content or placeholder found. Skipping render.");
      return;
    }

    // Determine if editable_script is required (default true)
    this.editableScriptRequired = editableScript.hasOwnProperty('required')
      ? Boolean(editableScript.required)
      : true;

    const scriptContainer = document.createElement('div');
    scriptContainer.id = 'editableScriptContainer';
    scriptContainer.classList.add('editable-script-container', 'uk-card', 'uk-card-default', 'uk-padding-small', 'uk-border-rounded');

    const scriptContent = document.createElement('p');
    scriptContent.id = 'editableScript';
    scriptContent.contentEditable = 'false';
    scriptContent.innerHTML = editableScript.content || 'Script content is missing';
    scriptContent.classList.add('another', 'another-class', 'uk-text-small');
    scriptContent.style.border = '1px solid #ccc';
    scriptContent.setAttribute('placeholder', editableScript.input_placeholder || 'You can edit this content');
    scriptContainer.appendChild(scriptContent);

    const editButton = document.createElement('button');
    editButton.textContent = 'EDIT';
    editButton.classList.add('uk-button', 'uk-button-secondary');
    scriptContainer.appendChild(editButton);

    editButton.addEventListener('click', () => {
      if (scriptContent.contentEditable === 'false' || scriptContent.contentEditable === 'inherit') {
        scriptContent.contentEditable = 'true';
        scriptContent.classList.add('uk-box-edit', 'uk-padding-small');
        scriptContent.focus();
      } else {
        scriptContent.contentEditable = 'false';
        scriptContent.classList.remove('uk-box-edit', 'uk-padding-small');
      }
    });

    container.appendChild(scriptContainer);
  }

  renderInteractiveCard(card) {
    const container = document.getElementById(this.targetDivId);
    container.innerHTML = '';

    // --- NEW FIX: disable buttonsRequired if no buttons were sent ---
    if ((!card.buttons_group || !card.buttons_group.length) && (!card.buttons || !card.buttons.length)) {
      this.buttonsRequired = false;
    } else {
      this.buttonsRequired = true;
    }

    if (card.reply && card.reply !== 'null') {
      const replyElement = document.createElement('h3');
      replyElement.classList.add('uk-text-center', 'uk-margin-small', 'uk-text-uppercase');
      replyElement.textContent = card.reply;
      container.appendChild(replyElement);
    }

    if (card.card_text && card.card_text !== 'null') {
      const cardTextElement = document.createElement('p');
      cardTextElement.classList.add('uk-text-center', 'uk-margin-small');
      cardTextElement.textContent = card.card_text;
      container.appendChild(cardTextElement);
    }

    if (card.card_media && card.card_media.url && card.card_media.url !== 'null') {
      let mediaElement;
      if (card.card_media.type === "image") {
        mediaElement = document.createElement('img');
        mediaElement.src = card.card_media.url;
        mediaElement.alt = card.card_media.altText || '';
      } else if (card.card_media.type === "video") {
        mediaElement = document.createElement('video');
        mediaElement.src = card.card_media.url;
        mediaElement.controls = true;
      } else if (card.card_media.type === "audio") {
        mediaElement = document.createElement('audio');
        mediaElement.src = card.card_media.url;
        mediaElement.controls = true;
      }
      if (mediaElement) {
        const mediaContainer = document.createElement('div');
        mediaContainer.classList.add('uk-text-center');
        mediaContainer.appendChild(mediaElement);
        container.appendChild(mediaContainer);
      }
    }

    // --- Render Input General con validación universal ---
    if (card.card_generalInput && card.card_generalInput.input_placeholder) {
      const inputType = card.card_generalInput.input_type || 'text';
      const inputDiv = document.createElement('div');
      inputDiv.classList.add('uk-text-center', 'uk-margin');
      const inputElement = document.createElement('input');
      inputElement.type = inputType;
      inputElement.id = 'generalInput';
      inputElement.placeholder = card.card_generalInput.input_placeholder;
      inputElement.classList.add('form-control', 'uk-form-large', 'uk-width-1-1');

      // Si la propiedad "required" existe y es false, no se valida; en caso contrario, se valida (true por defecto)
      this.generalInputRequired = card.card_generalInput.hasOwnProperty('required')
        ? Boolean(card.card_generalInput.required)
        : true;
      inputElement.required = this.generalInputRequired;

      const errorMessage = document.createElement('p');
      errorMessage.id = 'inputErrorMessage';
      errorMessage.classList.add('hidden', 'uk-text-center', 'uk-text-small', 'uk-text-uppercase', 'uk-margin-remove');
      errorMessage.style.color = 'red';
      errorMessage.textContent = `This must be a valid ${inputType}`;
      inputDiv.appendChild(inputElement);
      inputDiv.appendChild(errorMessage);
      container.appendChild(inputDiv);
    }

    // --- Render Editable Script con validación universal ---
    if (card.editable_script) {
      this.editableScriptRequired = card.editable_script.hasOwnProperty('required')
        ? Boolean(card.editable_script.required)
        : true;
      this.renderEditableScript(card.editable_script);
    }

    // --- Render Buttons Group (nuevo) ---
    // Si se envía el objeto "buttons_group", renderizamos cada grupo de botones con header, subtítulo y validación propia.
    if (card.buttons_group && Array.isArray(card.buttons_group) && card.buttons_group.length) {
      card.buttons_group.forEach(group => {
        // Contenedor del grupo con identificador único (button_group_payload)
        const groupContainer = document.createElement('div');
        groupContainer.classList.add('button-group-container');
        groupContainer.dataset.group = group.button_group_payload;
        // Agregamos la propiedad required (por defecto true)
        groupContainer.dataset.required = group.hasOwnProperty('required') ? Boolean(group.required) : true;

        // Header y subtítulo
        if (group.header) {
          const headerEl = document.createElement('h4');
          headerEl.textContent = group.header;
          groupContainer.appendChild(headerEl);
        }
        if (group.subtitle) {
          const subtitleEl = document.createElement('p');
          subtitleEl.textContent = group.subtitle;
          groupContainer.appendChild(subtitleEl);
        }

        // Contenedor para los botones del grupo
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add(
          'buttons-container',
          'uk-child-width-1-4@l',
          'uk-child-width-1-1@s',
          'uk-margin',
          'uk-light',
          'uk-flex',
          'uk-flex-center'
        );
        buttonsContainer.setAttribute('uk-grid', '');
        buttonsContainer.setAttribute('uk-height-match', 'target: > div > .uk-card');

        let hasOtherButton = false;
        group.buttons.forEach(button => {
          const buttonWrapperDiv = document.createElement('div');
          const buttonWrapper = document.createElement('div');
          buttonWrapper.classList.add('button-wrapper', 'uk-card');

          // Renderizar media si existe
          if (button.media && Array.isArray(button.media) && button.media.length) {
            button.media.forEach(media => {
              let mediaElement;
              if (media.type === "image" && media.url) {
                mediaElement = document.createElement('img');
                mediaElement.src = media.url;
                mediaElement.alt = media.altText || '';
              } else if (media.type === "audio" && media.url) {
                mediaElement = document.createElement('audio');
                mediaElement.src = media.url;
                mediaElement.controls = true;
              } else if (media.type === "video" && media.url) {
                mediaElement = document.createElement('video');
                mediaElement.src = media.url;
                mediaElement.controls = true;
              }
              if (mediaElement) {
                const mediaDiv = document.createElement('div');
                mediaDiv.classList.add('media-div', 'uk-margin-small', 'uk-padding');
                mediaDiv.appendChild(mediaElement);
                buttonWrapper.appendChild(mediaDiv);
              }
            });
          }

          const buttonDiv = document.createElement('div');
          buttonDiv.classList.add('button-div');
          const buttonElement = document.createElement('button');
          buttonElement.classList.add('uk-button', 'uk-button-default', 'uk-width-1-1');
          buttonElement.dataset.payload = button.buttonPayload;
          // Asignamos el grupo para identificar a qué grupo pertenece
          buttonElement.dataset.group = group.button_group_payload;
          buttonElement.textContent = button.label || 'Button';
          buttonElement.addEventListener('click', (event) => this.handleButtonClick(event));
          buttonDiv.appendChild(buttonElement);
          buttonWrapper.appendChild(buttonDiv);

          if (button.text && button.text !== 'null') {
            const explanationText = document.createElement('p');
            explanationText.classList.add('uk-text-center', 'uk-text-small', 'uk-margin-small-top');
            explanationText.textContent = button.text;
            buttonWrapper.appendChild(explanationText);
          }

          if (button.buttonPayload === 'button_other_option') {
            hasOtherButton = true;
          }

          buttonWrapperDiv.appendChild(buttonWrapper);
          buttonsContainer.appendChild(buttonWrapperDiv);
        });

        groupContainer.appendChild(buttonsContainer);

        // Renderizar input "Other" si existe
        if (hasOtherButton) {
          const otherInputDiv = document.createElement('div');
          otherInputDiv.classList.add('uk-hidden', 'uk-margin', 'uk-width-1-2@l', 'uk-text-center', 'uk-align-center');
          otherInputDiv.id = `otherInputDiv-${group.button_group_payload}`;
          const otherInputElement = document.createElement('input');
          const otherButton = group.buttons.find(btn => btn.buttonPayload === 'button_other_option');
          const inputConfig = otherButton && otherButton.input ? otherButton.input : {};
          otherInputElement.placeholder = inputConfig.placeholder || 'Add your response';
          otherInputElement.type = inputConfig.type || 'text';
          otherInputElement.classList.add('uk-input', 'uk-form', 'uk-form-large');
          otherInputElement.setAttribute('data-input-for', 'button_other_option');
          otherInputDiv.appendChild(otherInputElement);

          groupContainer.appendChild(otherInputDiv);
        }

        container.appendChild(groupContainer);
      });
    } else if (card.buttons && Array.isArray(card.buttons) && card.buttons.length) {
      // --- Lógica existente para un único set de botones ---
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add(
        'uk-child-width-1-4@l',
        'uk-child-width-1-1@s',
        'buttons-container',
        'uk-margin',
        'uk-light',
        'uk-flex',
        'uk-flex-center'
      );
      buttonsContainer.setAttribute('uk-grid', '');
      buttonsContainer.setAttribute('uk-height-match', 'target: > div > .uk-card');

      card.buttons.forEach(button => {
        const buttonWrapperDiv = document.createElement('div');
        const buttonWrapper = document.createElement('div');
        buttonWrapper.classList.add('button-wrapper', 'uk-card');

        if (button.media && Array.isArray(button.media) && button.media.length) {
          button.media.forEach(media => {
            let mediaElement;
            if (media.type === "image" && media.url) {
              mediaElement = document.createElement('img');
              mediaElement.src = media.url;
              mediaElement.alt = media.altText || '';
              mediaElement.classList.add('sasa');
            } else if (media.type === "audio" && media.url) {
              mediaElement = document.createElement('audio');
              mediaElement.src = media.url;
              mediaElement.controls = true;
            } else if (media.type === "video" && media.url) {
              mediaElement = document.createElement('video');
              mediaElement.src = media.url;
              mediaElement.controls = true;
            }
            if (mediaElement) {
              const mediaDiv = document.createElement('div');
              mediaDiv.classList.add('media-div', 'uk-margin-small', 'uk-padding', 'sasa_squarecontainer', 'field-contentsol');
              mediaDiv.appendChild(mediaElement);
              buttonWrapper.appendChild(mediaDiv);
            }
          });
        }

        const buttonDiv = document.createElement('div');
        buttonDiv.classList.add('button-div');
        const buttonElement = document.createElement('button');
        buttonElement.classList.add('uk-button', 'uk-button-default', 'uk-width-1-1');
        buttonElement.setAttribute('data-payload', button.buttonPayload);
        buttonElement.textContent = button.label || 'Button';
        buttonElement.addEventListener('click', (event) => this.handleButtonClick(event));
        buttonDiv.appendChild(buttonElement);
        buttonWrapper.appendChild(buttonDiv);

        if (button.text && button.text !== 'null') {
          const explanationText = document.createElement('p');
          explanationText.classList.add('uk-text-center', 'uk-text-small', 'uk-margin-small-top');
          explanationText.textContent = button.text;
          buttonWrapper.appendChild(explanationText);
        }

        buttonWrapperDiv.appendChild(buttonWrapper);
        buttonsContainer.appendChild(buttonWrapperDiv);
      });
      container.appendChild(buttonsContainer);
    }

    // --- Render contenedor "OTHER" para botón único (solo si no se usan grupos) ---
    let otherInputDiv = null;
    if (!card.buttons_group && card.buttons && card.buttons.some(btn => btn.buttonPayload === 'button_other_option')) {
      otherInputDiv = document.createElement('div');
      otherInputDiv.id = 'otherInputDiv';
      otherInputDiv.classList.add('uk-hidden', 'uk-margin', 'uk-width-1-2@l', 'uk-text-center', 'uk-align-center');

      const otherInputElement = document.createElement('input');
      const otherButton = card.buttons.find(btn => btn.buttonPayload === 'button_other_option');
      const inputConfig = otherButton && otherButton.input ? otherButton.input : {};
      otherInputElement.placeholder = inputConfig.placeholder || 'add your website here';
      otherInputElement.type = inputConfig.type || 'text';
      otherInputElement.classList.add('uk-input', 'uk-form', 'uk-form-large');
      otherInputElement.setAttribute('data-input-for', 'button_other_option');
      otherInputDiv.appendChild(otherInputElement);
    }

    // --- Render Submit Button y colocar otherInputDiv arriba ---
    if (card.submitButtonText && card.submitButtonText.trim() !== "") {
      const submitButtonText = card.submitButtonText;
      const submitDiv = document.createElement('div');
      submitDiv.id = 'submitDiv';
      submitDiv.classList.add('uk-text-center');

      if (otherInputDiv) {
        container.appendChild(otherInputDiv);
      }

      const submitButton = document.createElement('button');
      submitButton.classList.add('uk-width-1-1@s', 'uk-width-1-2@m', 'uk-button-primary', 'uk-button-large');
      submitButton.id = 'submitBtn';
      submitButton.textContent = submitButtonText;

      if (card.redirectURL && card.redirectURL.trim() !== "") {
        submitButton.addEventListener('click', () => {
          console.log("Redirecting to:", card.redirectURL);
          window.location.href = card.redirectURL;
        });
      } else {
        submitButton.addEventListener('click', () => this.submitCardResponse());
      }

      submitDiv.appendChild(submitButton);
      container.appendChild(submitDiv);
    } else {
      if (otherInputDiv) {
        container.appendChild(otherInputDiv);
      }
    }
  }

  renderDropDown(dropDownConfig) {
    const container = document.getElementById(this.targetDivId);
    const dropDownDiv = document.createElement('div');
    dropDownDiv.classList.add('uk-margin', 'uk-text-center', 'custom-dropdown-container');

    const selectElement = document.createElement('select');
    selectElement.id = 'dropDown';
    selectElement.classList.add('uk-select', 'uk-width-1-2@m', 'custom-dropdown-select');

    const placeholderOption = document.createElement('option');
    placeholderOption.textContent = dropDownConfig.placeholder || 'Select an option';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    selectElement.appendChild(placeholderOption);

    dropDownConfig.options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.textContent = option;
      selectElement.appendChild(optionElement);
    });

    dropDownDiv.appendChild(selectElement);

    this.dropDownRequired = dropDownConfig.hasOwnProperty('required')
      ? Boolean(dropDownConfig.required)
      : true;

    const submitButton = document.getElementById('submitDiv');
    if (submitButton) {
      container.insertBefore(dropDownDiv, submitButton);
    } else {
      console.error('Submit button is not present in the DOM.');
    }
  }

  // --- handleButtonClick: muestra u oculta el contenedor OTHER ---
  handleButtonClick(event) {
    const clickedButton = event.currentTarget;
    // Si el botón está dentro de un grupo (buttons_group)
    const groupContainer = clickedButton.closest('.button-group-container');
    if (groupContainer) {
      const groupName = clickedButton.dataset.group;
      groupContainer.querySelectorAll('.button-div button').forEach(button => {
        button.classList.remove('selected', 'uk-button-primary');
        button.classList.add('uk-button-seccondary');
      });
      clickedButton.classList.add('selected', 'uk-button-primary');
      clickedButton.classList.remove('uk-button-seccondary');

      const otherInputDiv = groupContainer.querySelector(`#otherInputDiv-${groupName}`);
      if (!otherInputDiv) return;
      if (clickedButton.dataset.payload === 'button_other_option') {
        otherInputDiv.classList.toggle('uk-hidden');
      } else {
        otherInputDiv.classList.add('uk-hidden');
      }
    } else {
      // Lógica existente para botones únicos
      const container = document.getElementById(this.targetDivId);
      container.querySelectorAll('.button-div button').forEach(button => {
        button.classList.remove('selected', 'uk-button-primary');
        button.classList.add('uk-button-seccondary');
      });
      clickedButton.classList.add('selected', 'uk-button-primary');
      clickedButton.classList.remove('uk-button-seccondary');

      const otherInputDiv = container.querySelector('#otherInputDiv');
      if (!otherInputDiv) return;
      if (clickedButton.dataset.payload === 'button_other_option') {
        otherInputDiv.classList.toggle('uk-hidden');
      } else {
        otherInputDiv.classList.add('uk-hidden');
      }
    }
  }

  async submitCardResponse() {
    let validationPassed = true;
    const container = document.getElementById(this.targetDivId);

    const generalInputElem = container.querySelector('#generalInput');
    const scriptContentElem = container.querySelector('#editableScript');
    const dropDownElem = container.querySelector('#dropDown');

    const generalInput = generalInputElem ? generalInputElem.value.trim() : '';
    const scriptContent = scriptContentElem ? scriptContentElem.textContent.trim() : '';
    const dropDownValue = dropDownElem ? dropDownElem.value : null;
    const dropDownPlaceholder = dropDownElem ? dropDownElem.options[0]?.textContent : null;

    const hasButton = container.querySelectorAll('.button-div button').length > 0;
    const hasGeneralInput = !!generalInputElem;
    const hasEditableScript = !!scriptContentElem;
    const hasDropDown = !!dropDownElem;

    // Validación de botones (para el set único) si buttonsRequired es true
    if (hasButton && this.buttonsRequired && !container.querySelector('.button-group-container')) {
      const selectedButton = container.querySelector('.button-div button.selected');
      if (!selectedButton) {
        alert('Please select an option from the buttons.');
        validationPassed = false;
      }
    }
    // Validación de generalInput
    if (hasGeneralInput && this.generalInputRequired && !generalInput) {
      alert('Please complete the general input field.');
      validationPassed = false;
    }
    // Validación de editable_script
    if (hasEditableScript && this.editableScriptRequired && !scriptContent) {
      alert('Please complete the script content.');
      validationPassed = false;
    }
    // Validación de dropDown
    if (hasDropDown && this.dropDownRequired && (!dropDownValue || dropDownValue === dropDownPlaceholder)) {
      alert('Please select a valid option from the drop-down.');
      validationPassed = false;
    }

    if (!validationPassed) return;

    // Variable para acumular respuestas de botones
    let buttonsPayload = {};

    // Primero, si se usan grupos de botones (buttons_group)
    const groupContainers = container.querySelectorAll('.button-group-container');
    if (groupContainers.length > 0) {
      groupContainers.forEach(groupContainer => {
        const groupName = groupContainer.dataset.group;
        // Obtener si el grupo es requerido (por defecto true)
        const groupRequired = groupContainer.dataset.required === "true";
        const selectedButton = groupContainer.querySelector('.button-div button.selected');
        if (groupRequired && !selectedButton) {
          alert(`Please select an option for ${groupName}.`);
          validationPassed = false;
        } else if (selectedButton) {
          if (selectedButton.dataset.payload === 'button_other_option') {
            const otherInputElem = groupContainer.querySelector(`input[data-input-for="button_other_option"]`);
            const userInput = otherInputElem ? otherInputElem.value.trim() : '';
            if (groupRequired && !userInput) {
              alert(`Please specify your response for ${groupName} when selecting OTHER.`);
              validationPassed = false;
            }
            buttonsPayload[`buttons_payload_${groupName}`] = userInput;
          } else {
            buttonsPayload[`buttons_payload_${groupName}`] = selectedButton.dataset.payload;
          }
        }
      });
    } else {
      // Lógica existente para un único set de botones
      const selectedButton = container.querySelector('.button-div button.selected');
      if (this.buttonsRequired && !selectedButton) {
        alert('Please select an option from the buttons.');
        validationPassed = false;
      }
      if (selectedButton) {
        if (selectedButton.dataset.payload === 'button_other_option') {
          const otherInputElem = container.querySelector('#otherInputDiv input[data-input-for="button_other_option"]');
          const userInput = otherInputElem ? otherInputElem.value.trim() : '';
          if (!userInput) {
            alert('Please specify your response when selecting OTHER.');
            validationPassed = false;
          }
          buttonsPayload['buttonPayload'] = userInput;
        } else {
          buttonsPayload['buttonPayload'] = selectedButton.dataset.payload;
        }
      }
    }

    if (!validationPassed) return;

    const payload = {
      sessionId: this.userSessionID,
      currentStep: this.currentStep !== null ? this.currentStep : undefined,
      userInfo: {
        email: this.userInfo?.email || null,
        username: this.userInfo?.username || null,
        userID: this.userInfo?.userID || null,
        brandID: this.userInfo?.brandID || null
      },
      ...buttonsPayload,
      userInput: null, // se puede ajustar según la lógica
      generalInput: generalInput || null,
      dropDownSelection: dropDownValue || null,
      generalInputPayload: generalInput ? 'generalInputPayload' : null,
      cardPayload: this.cardPayload,
      scriptContent: scriptContent || null,
      scriptPayload: scriptContent ? 'scriptInputPayload' : null
    };

    console.log("Payload sent:", payload);
    container.innerHTML = '';
    this.showLoader(container);

    try {
      const response = await fetch(this.webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let result = await response.json();
      console.log("Webhook response:", result);
      if (Array.isArray(result)) {
        result = result[0];
      }
      this.handleBotResponse(result);
    } catch (error) {
      console.error('Error sending data to webhook:', error);
    }
  }

  showProgress(progress) {
    const container = document.getElementById(this.targetDivId);
    if (progress.message && progress.message !== 'null') {
      const messageElement = document.createElement('p');
      messageElement.classList.add('uk-text-center', 'uk-text-small');
      messageElement.textContent = progress.message;
      container.appendChild(messageElement);
    }
    if (progress.media && progress.media.url && progress.media.url !== 'null') {
      const mediaElement = document.createElement('img');
      mediaElement.src = progress.media.url;
      mediaElement.alt = progress.media.altText || '';
      container.appendChild(mediaElement);
    }
  }

  showGamification(gamification) {
    const container = document.getElementById(this.targetDivId);
    if (gamification.rewardMessage && gamification.rewardMessage !== 'null') {
      const rewardMessageElement = document.createElement('p');
      rewardMessageElement.classList.add('uk-text-center', 'uk-text-small');
      rewardMessageElement.textContent = gamification.rewardMessage;
      container.appendChild(rewardMessageElement);
    }
    if (gamification.media && gamification.media.url && gamification.media.url !== 'null') {
      const mediaElement = document.createElement('img');
      mediaElement.src = gamification.media.url;
      mediaElement.alt = gamification.media.altText || '';
      container.appendChild(mediaElement);
    }
  }
}
